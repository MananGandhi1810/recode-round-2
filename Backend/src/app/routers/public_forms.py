from app.services.websocket_manager import manager
import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from app.services.form_service import FormService
from app.schemas.form import FormResponse
from app.core.mongodb import get_mongo_db
from app.services.email_service import send_otp_email
from app.core.email_templates import get_submission_template
import resend
from app.core.config import settings
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

router = APIRouter()


class FormSubmission(BaseModel):
    answers: dict[str, str | list[str]]


@router.get("/by-slug/{slug}", response_model=FormResponse)
async def get_public_form_by_slug(slug: str):
    db = get_mongo_db()
    doc = await db.forms.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Form not found")
    form = FormService._map_doc_to_response(doc)
    if not form.is_published:
        raise HTTPException(status_code=403, detail="Form is not published")
    if form.expires_at and form.expires_at.replace(tzinfo=None) < datetime.datetime.now(
        datetime.UTC
    ).replace(tzinfo=None):
        raise HTTPException(status_code=410, detail="Form Closed")
    return form


@router.get("/{form_id}", response_model=FormResponse)
async def get_public_form(form_id: str):
    form = await FormService.get_form(form_id=form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if not form.is_published:
        raise HTTPException(status_code=403, detail="Form is not published")
    if form.expires_at and form.expires_at.replace(tzinfo=None) < datetime.datetime.now(
        datetime.UTC
    ).replace(tzinfo=None):
        raise HTTPException(status_code=410, detail="Form Closed")
    return form


@router.post("/{form_id}/submit")
async def submit_form(form_id: str, payload: FormSubmission):
    form = await FormService.get_form(form_id=form_id)
    if not form or not form.is_published:
        raise HTTPException(404, "Form not found or unpublished")

    blocks = form.schema_snapshot.get("blocks", []) if form.schema_snapshot else []
    for block in blocks:
        b_id = block.get("id")
        config = block.get("config", {})
        answer = payload.answers.get(b_id)

        if config.get("required") and not answer:
            if not config.get("logic"):
                raise HTTPException(400, detail={"block_id": b_id, "message": f"Field '{block.get('label', b_id)}' is required"})

        if answer and isinstance(answer, str):
            min_len = config.get("minLength")
            max_len = config.get("maxLength")
            if min_len is not None and len(answer) < min_len:
                raise HTTPException(400, detail={"block_id": b_id, "message": f"Minimum {min_len} characters required for '{block.get('label', b_id)}'"})
            if max_len is not None and len(answer) > max_len:
                raise HTTPException(400, detail={"block_id": b_id, "message": f"Maximum {max_len} characters allowed for '{block.get('label', b_id)}'"})

    db = get_mongo_db()
    sub_id = str(uuid.uuid4())
    doc = {
        "_id": sub_id,
        "form_id": form_id,
        "organization_id": str(form.organization_id),
        "answers": payload.answers,
        "submitted_at": datetime.datetime.now(datetime.UTC),
    }
    score = 0
    if form.is_quiz:
        for block in form.schema_snapshot.get("blocks", []):
            ans = payload.answers.get(block["id"])
            if not ans:
                continue
            corr = block.get("config", {}).get("correctAnswer")
            if not corr:
                continue
            pts = block.get("config", {}).get("points", 0) or 0
            if isinstance(corr, list) and isinstance(ans, list):
                if set(corr) == set(ans):
                    score += pts
            elif str(corr).lower() == str(ans).lower():
                score += pts

    doc["score"] = score
    await db.submissions.insert_one(doc)

    # Broadcast to leaderboard
    await manager.broadcast_to_form(
        form_id,
        {
            "type": "SCORE_UPDATE",
            "submission": {
                "id": sub_id,
                "score": score,
                "answers": payload.answers,
                "submitted_at": doc["submitted_at"].isoformat(),
            },
        },
    )

    return {"id": sub_id, "message": "Success"}


class EmailCopyRequest(BaseModel):
    email: EmailStr


@router.post("/{form_id}/submissions/{submission_id}/email")
async def email_submission_copy(
    form_id: str, submission_id: str, payload: EmailCopyRequest
):
    form = await FormService.get_form(form_id=form_id)
    if not form:
        raise HTTPException(404, "Form not found")

    db = get_mongo_db()
    sub = await db.submissions.find_one({"_id": submission_id})
    if not sub:
        raise HTTPException(404, "Submission not found")

    # Map answers to labels
    blocks_list = form.schema_snapshot.get("blocks", [])
    blocks_map = {b["id"]: b["label"] for b in blocks_list}
    file_block_ids = {b["id"] for b in blocks_list if b.get("type") == "file_upload"}

    answers_data = []
    processed_answers = sub.get("answers", {})

    for block_id, answer in processed_answers.items():
        if block_id.endswith("_filename"):
            continue

        label = blocks_map.get(block_id, "Unknown Question")
        ans_str = ", ".join(answer) if isinstance(answer, list) else str(answer)

        is_file = block_id in file_block_ids
        filename = (
            processed_answers.get(f"{block_id}_filename", "File") if is_file else None
        )

        answers_data.append(
            {"label": label, "value": ans_str, "is_file": is_file, "filename": filename}
        )

    html_content = get_submission_template(form.name, answers_data)

    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send(
            {
                "from": f"{settings.resend_sender_name} <{settings.resend_sender_email}>",
                "to": [payload.email],
                "subject": f"Your response to {form.name}",
                "html": html_content,
            }
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(500, "Failed to send email")

    return {"message": "Email sent"}


# We defer bucket creation to first use to avoid sync blocking the startup
def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url="http://rustfs:9000",
        aws_access_key_id="rustfsadmin",
        aws_secret_access_key="rustfsadmin",
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )


@router.get("/file/{form_id}/{file_name}")
async def redirect_to_file(form_id: str, file_name: str):
    s3_client = get_s3_client()
    file_key = f"{form_id}/{file_name}"

    # Check if exists
    try:
        s3_client.head_object(Bucket="formbar", Key=file_key)
    except:
        raise HTTPException(404, "File not found")

    # Generate a fresh presigned URL for the actual download
    # Use the signing client logic to ensure signature matches public access
    signing_client = boto3.client(
        "s3",
        endpoint_url="http://localhost:9002",
        aws_access_key_id="rustfsadmin",
        aws_secret_access_key="rustfsadmin",
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )

    url = signing_client.generate_presigned_url(
        "get_object", Params={"Bucket": "formbar", "Key": file_key}, ExpiresIn=3600
    )
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url=url)


@router.post("/{form_id}/upload")
async def upload_file(form_id: str, file: UploadFile = File(...)):
    s3_client = get_s3_client()
    try:
        s3_client.head_bucket(Bucket="formbar")
    except Exception:
        try:
            s3_client.create_bucket(Bucket="formbar")
        except Exception as e:
            print(f"Failed to create bucket: {e}")

    # Create a unique but readable file name
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}-{file.filename}"
    file_key = f"{form_id}/{safe_filename}"

    import io

    file_content = await file.read()
    file_obj = io.BytesIO(file_content)

    s3_client.upload_fileobj(file_obj, "formbar", file_key)

    # Return a clean internal redirection URL and the original filename
    API_BASE_URL = (
        settings.api_v1_str
        if hasattr(settings, "api_v1_str")
        else "http://localhost:8000"
    )
    # For the frontend, we just need the path to our redirector
    short_url = f"{API_BASE_URL}/f/file/{form_id}/{safe_filename}"

    return {"url": short_url, "filename": file.filename}
