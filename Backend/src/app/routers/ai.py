import os
import json
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Any

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)


class AiGenerateRequest(BaseModel):
    prompt: str


SYSTEM_PROMPT = """
You are a form generation assistant. Your goal is to generate a list of form blocks in JSON format based on a user prompt.
The output MUST be a valid JSON object with a "blocks" key containing an array of objects.
Each block object must follow this schema:
{
  "id": "q_<random_5_chars>",
  "type": "short_text" | "long_text" | "checkbox" | "multiple_choice" | "dropdown" | "date_picker" | "rating" | "h1" | "h2" | "paragraph",
  "label": "The question or text",
  "config": {
    "required": boolean,
    "placeholder": "optional placeholder",
    "options": [{"label": "Option 1", "value": "opt1"}] (only for checkbox, multiple_choice, dropdown)
  }
}

Respond ONLY with the JSON. Do not include markdown formatting or explanations.
"""


@router.post("/generate")
async def generate_form_structure(payload: AiGenerateRequest):
    if not api_key:
        # Fallback for demo if no API key
        return {
            "blocks": [
                {"id": "q_demo1", "type": "h1", "label": "Demo Quiz", "config": {}},
                {
                    "id": "q_demo2",
                    "type": "short_text",
                    "label": "What is your name?",
                    "config": {"required": True},
                },
            ]
        }

    try:
        model = genai.GenerativeModel("gemini-3.0-flash-preview")
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nUser Request: {payload.prompt}"
        )

        # Clean response text if it has markdown
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        return json.loads(text)
    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
