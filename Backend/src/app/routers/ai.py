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

Block Schema:
{
  "id": "q_<random_5_chars>",
  "type": "short_text" | "long_text" | "checkbox" | "multiple_choice" | "dropdown" | "date_picker" | "rating" | "h1" | "h2" | "paragraph" | "upi_payment",
  "label": "The question or text",
  "config": {
    "required": boolean,
    "placeholder": "optional placeholder",
    "options": [{"label": "Option 1", "value": "opt1"}],
    "logic": [
      {
        "id": "uuid",
        "action": "show" | "hide",
        "conditionMatch": "all" | "any",
        "conditions": [{"blockId": "target_id", "operator": "equals" | "not_equals" | "contains" | "is_empty" | "is_not_empty" | "greater_than" | "less_than", "value": "match_val"}]
      }
    ],
    "points": number,
    "timerSeconds": number | null,
    "correctAnswer": "string",
    "upiId": "string",
    "upiAmount": "string"
  }
}

Special Features:
1. Logic: Use "logic" to show/hide blocks based on previous answers.
2. Quizzes: Set "points", "timerSeconds", and "correctAnswer" for quiz blocks.
3. References: You can use {{block_id}} in labels or descriptions to reference previous answers.
4. Block IDs: Ensure IDs are unique and short (q_abc12).

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
        model = genai.GenerativeModel("gemini-3-flash-preview")
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
