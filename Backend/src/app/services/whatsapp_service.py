import json
import httpx
import base64
from typing import List, Dict, Any
from app.core.redis import redis_client
from app.services.form_service import FormService
from app.schemas.form import FormBlock, FormResponse, FormSchema, FormBlockConfig
from app.schemas.form import FieldResponse, FormSubmission
from app.core.config import settings  # Import settings

# --- Configuration ---
WHATSAPP_API_URL = settings.whatsapp_api_url
WHATSAPP_BASIC_AUTH = settings.whatsapp_basic_auth

# --- Session Management ---


def get_session(phone_number: str) -> dict | None:
    session_data = redis_client.get(f"whatsapp:session:{phone_number}")
    if session_data:
        return json.loads(session_data)
    return None


def set_session(phone_number: str, session_data: dict):
    # Session expires after 1 hour (3600 seconds)
    redis_client.set(
        f"whatsapp:session:{phone_number}", json.dumps(session_data), ex=3600
    )


def clear_session(phone_number: str):
    redis_client.delete(f"whatsapp:session:{phone_number}")


# --- WhatsApp API Communication ---


async def send_whatsapp_message(phone_number: str, message: str):
    headers = {}
    if WHATSAPP_BASIC_AUTH:
        encoded_auth = base64.b64encode(WHATSAPP_BASIC_AUTH.encode()).decode()
        headers["Authorization"] = f"Basic {encoded_auth}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{WHATSAPP_API_URL}/send/message",
                headers=headers,
                data={"phone": phone_number, "message": message},
            )
            response.raise_for_status()
            print(f"WhatsApp message sent to {phone_number}: {message}")
        except httpx.HTTPStatusError as e:
            print(
                f"Error sending WhatsApp message to {phone_number}: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            print(
                f"Network error sending WhatsApp message to {phone_number}: {e}")


# --- Form Logic ---


async def start_form_session(form_id: str, phone_numbers: List[str]):
    form = await FormService.get_form(form_id)
    if not form:
        print(f"Form with ID {form_id} not found.")
        return

    # Ensure schema_snapshot is a dictionary and contains 'blocks'
    form_schema_dict = form.schema_snapshot
    if not isinstance(form_schema_dict, dict) or "blocks" not in form_schema_dict:
        print(f"Form {form_id} has an invalid schema_snapshot.")
        return

    questions = form_schema_dict.get("blocks", [])
    if not questions:
        print(f"Form {form_id} has no questions.")
        return

    for number in phone_numbers:
        # Normalize phone number to WhatsApp JID format if necessary (e.g., add @s.whatsapp.net)
        # The go-whatsapp-web-multidevice expects just the number for msisdn, but webhook sends JID
        # For consistency, we'll store and use the number part.
        normalized_number = number.split("@")[0] if "@" in number else number

        session = {
            "form_id": str(form.id),
            "form_slug": form.slug,
            "organization_id": str(form.organization_id),
            "organization_slug": form.name.lower().replace(" ", "-"),
            "current_question_index": 0,
            "answers": {},
            "questions": questions,
            "form_name": form.name,
        }
        set_session(normalized_number, session)
        await send_question(normalized_number, session)


async def send_question(phone_number: str, session: dict):
    question_index = session["current_question_index"]
    questions = session["questions"]

    if question_index >= len(questions):
        await submit_form(phone_number, session)
        return

    question_data: Dict[str, Any] = questions[question_index]
    question = FormBlock(**question_data)  # Validate with Pydantic model

    message = ""
    if question_index == 0:
        message += f"This is an automated form: *{session['form_name']}*\n"
        message += f"You can either reply to this message or click the link below to fill the form on a web page.\n"
        message += f"Link: {settings.frontend_url}/{session['organization_slug']}/{session['form_slug']}\n\n"

    message += f"Question {question_index + 1}/{len(questions)}:\n"
    message += f"*{question.label}*"

    if question.config.helperText:
        message += f"\n_{question.config.helperText}_"

    # Add options for select/radio/checkbox
    if question.type in ["select", "radio", "checkbox"] and question.config.options:
        message += "\n\nPlease reply with the number corresponding to your choice:"
        for i, option in enumerate(question.config.options):
            message += f"\n{i+1}. {option.label}"
    elif question.type == "text" and question.config.placeholder:
        message += f"\n(e.g., {question.config.placeholder})"

    await send_whatsapp_message(phone_number, message)


async def handle_whatsapp_message(body: dict):
    event = body.get("event")
    device_id = body.get("device_id")
    payload = body.get("payload", {})
    print(payload)

    # Extract sender's phone number and message text
    sender_jid = payload.get("from")  # e.g., 628123456789@s.whatsapp.net
    message_text = payload.get("body")

    if not sender_jid or not message_text:
        print(
            f"Received webhook with missing sender or message body: {json.dumps(body)}"
        )
        return

    # Normalize phone number to just the number part for session lookup
    phone_number = "+" + sender_jid.split("@")[0]

    session = get_session(phone_number)
    if not session:
        print(f"No active session for {phone_number}. Ignoring message.")
        # Optionally, send a message like "I don't understand. Please start a form."
        return

    question_index = session["current_question_index"]
    questions_data: List[Dict[str, Any]] = session["questions"]

    if question_index >= len(questions_data):
        # Should not happen if submit_form clears session correctly, but as a safeguard
        print(f"Session for {phone_number} is out of bounds. Submitting form.")
        await submit_form(phone_number, session)
        return

    current_question = FormBlock(**questions_data[question_index])

    # --- Answer Validation ---
    is_valid, error_message, processed_answer = validate_answer(
        message_text, current_question
    )

    if is_valid:
        session["answers"][current_question.id] = processed_answer
        session["current_question_index"] += 1
        set_session(phone_number, session)
        await send_question(phone_number, session)
    else:
        await send_whatsapp_message(
            phone_number, f"Invalid input: {error_message}. Please try again."
        )
        await send_question(phone_number, session)  # Re-send the question


def validate_answer(answer_text: str, question: FormBlock) -> (bool, str, Any):
    config = question.config
    processed_answer = answer_text

    # Required check
    if config.required and not answer_text:
        return False, "This field is required.", None

    # Type-specific validation
    if question.type == "text":
        if config.minLength is not None and len(answer_text) < config.minLength:
            return (
                False,
                f"Answer must be at least {config.minLength} characters long.",
                None,
            )
        if config.maxLength is not None and len(answer_text) > config.maxLength:
            return (
                False,
                f"Answer must be at most {config.maxLength} characters long.",
                None,
            )
        # Basic email/URL validation (can be expanded with regex)
        if config.validationType == "email" and "@" not in answer_text:
            return False, "Please enter a valid email address.", None
        if config.validationType == "url" and not (
            answer_text.startswith("http://") or answer_text.startswith("https://")
        ):
            return (
                False,
                "Please enter a valid URL (starting with http:// or https://).",
                None,
            )

    elif question.type == "number":
        try:
            num_answer = float(answer_text)
            if config.min is not None and num_answer < config.min:
                return False, f"Number must be at least {config.min}.", None
            if config.max is not None and num_answer > config.max:
                return False, f"Number must be at most {config.max}.", None
            processed_answer = num_answer
        except ValueError:
            return False, "Please enter a valid number.", None

    elif question.type in ["select", "radio", "checkbox"]:
        if not config.options:
            return False, "No options defined for this question.", None

        # User replies with 1-based index
        try:
            selected_indices = [int(idx.strip()) - 1 for idx in answer_text.split(",")]
        except ValueError:
            return (
                False,
                "Please reply with the number(s) corresponding to your choice(s), separated by commas.",
                None,
            )

        valid_options = []
        for idx in selected_indices:
            if 0 <= idx < len(config.options):
                valid_options.append(config.options[idx].value)
            else:
                return (
                    False,
                    "Invalid option selected. Please choose from the available numbers.",
                    None,
                )

        if question.type == "radio" and len(valid_options) > 1:
            return False, "Please select only one option.", None

        processed_answer = (
            valid_options if question.type == "checkbox" else valid_options[0]
        )

    # TODO: Add validation for other types like 'date', 'file', 'upi'

    return True, "", processed_answer


async def submit_form(phone_number: str, session: dict):
    form_id = session["form_id"]
    organization_id = session["organization_id"]
    collected_answers = session["answers"]
    print(collected_answers)
    form_name = session["form_name"]

    # Convert collected answers into the FormSubmission schema
    field_responses: List[FieldResponse] = []
    for question_id, answer_value in collected_answers.items():
        field_responses.append(FieldResponse(block_id=question_id, value=answer_value))

    form_submission = FormSubmission(
        form_id=form_id,
        organization_id=organization_id,
        responses=field_responses,
        submitted_by_whatsapp=True,
        whatsapp_phone_number=phone_number,
    )

    try:
        await FormService.submit_form_response(form_submission)
        clear_session(phone_number)
        await send_whatsapp_message(
            phone_number,
            f"Thank you for completing the form '{form_name}'! Your responses have been submitted.",
        )
    except Exception as e:
        print(f"Error submitting form for {phone_number}: {e}")
        await send_whatsapp_message(
            phone_number,
            "There was an error submitting your form. Please try again later.",
        )
