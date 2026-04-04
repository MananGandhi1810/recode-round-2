from app.services.websocket_manager import manager
import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from app.services.form_service import FormService
from app.schemas.form import FormResponse
from app.core.mongodb import get_mongo_db
from app.services.email_service import send_otp_email
import resend
from app.core.config import settings
import boto3
from botocore.config import Config

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
    blocks = {b["id"]: b["label"] for b in form.schema_snapshot.get("blocks", [])}
    html_content = "<h2>Your Form Submission</h2><ul>"
    for block_id, answer in sub.get("answers", {}).items():
        label = blocks.get(block_id, "Unknown Question")
        ans_str = ", ".join(answer) if isinstance(answer, list) else str(answer)
        html_content += f"<li><strong>{label}</strong>: {ans_str}</li>"
    html_content += "</ul>"

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
        endpoint_url="http://rustfs:9002",
        aws_access_key_id="rustfsadmin",
        aws_secret_access_key="rustfsadmin",
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )


@router.post("/{form_id}/upload")
async def upload_file(form_id: str, file: UploadFile = File(...)):
    s3_client = get_s3_client()
    try:
        s3_client.head_bucket(Bucket="formbar")
    except Exception as e:
        s3_client.create_bucket(Bucket="formbar")

    file_key = f"{form_id}/{uuid.uuid4()}-{file.filename}"
    s3_client.upload_fileobj(file.file, "formbar", file_key)
    # The public URL on port 9001 (s3 browser/API proxy if rustfs serves GETs)
    # Or just returning the presigned url
    url = s3_client.generate_presigned_url(
        "get_object", Params={"Bucket": "formbar", "Key": file_key}, ExpiresIn=3600
    )
    # Rewrite rustfs to localhost since browser fetches it directly
    url = url.replace("http://rustfs:9002", "http://localhost:9002")
    return {"url": url}
