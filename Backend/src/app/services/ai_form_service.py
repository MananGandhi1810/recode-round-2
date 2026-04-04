import json
import uuid
import re
from typing import List, Dict, Any
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.form import FormBlock, FormBlockConfig, FormBlockOptions


class AIFormService:
    @staticmethod
    async def generate_blocks(prompt: str) -> List[FormBlock]:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set")

        client = genai.Client(api_key=settings.gemini_api_key)

        system_instruction = """
        You are an expert form building AI. Your job is to convert the user's description into a structured JSON array of form blocks.

        Rules for blocks:
        - Must return STRICTLY valid JSON ONLY. No markdown wrapping like ```json.
        - The root object must be a dictionary with a single key "blocks", which is an array of block objects.
        - Supported block types: "h1", "h2", "paragraph", "short_text", "long_text", "date_picker", "rating", "file_upload", "multiple_choice", "checkbox", "dropdown"
        - Each block must have an "id" starting with "block_" and a random number
        - Each block has a "type"
        - Each block has a "label" (the question or text content)
        - Each block has a "config" object with properties from the schema.
          - "required" (boolean)
          - "placeholder" (string)
          - "helperText" (string)
          - For types multiple_choice, checkbox, dropdown, include "options" array with objects {"label": "...", "value": "..."}
          - For number, optionally "min" and "max"
          - For text types, optionally "validationType" e.g. "email", "url", "number", also "minLength" and "maxLength".
          - "logic": an array of condition objects if the question should only show based on a previous answer. E.g. {"fieldId": "block_...", "condition": "equals", "value": "..."}
        
        Example JSON output:
        {
  _id: '062a957a-7683-46d6-8999-7d8e0dc879a7',
  organization_id: '923d1a92-c3f4-4b28-a7a5-f82d618559d6',
  name: 'Test',
  slug: 'test-e1b7da',
  description: 'test',
  is_published: true,
  schema_snapshot: {
    blocks: [
      {
        id: '0079c295-8801-4235-819a-45c96d514db4',
        type: 'short_text',
        label: 'What is your name?',
        config: {
          required: false
        }
      },
      {
        id: '82a5dd91-ff2f-423a-b2b0-94cd0dbd1329',
        type: 'rating',
        label: 'How much would you rate NMIMS MPSTME',
        config: {
          required: false
        }
      },
      {
        id: 'c945193c-747d-40ad-a649-822958b3e1d2',
        type: 'short_text',
        label: 'Feedback',
        config: {
          required: false
        }
      }
    ]
  },
  theme: 'minimal',
  is_quiz: false,
  created_at: ISODate('2026-04-04T04:51:24.426Z'),
  updated_at: ISODate('2026-04-04T06:04:00.900Z'),
  expires_at: null,
  redirect_url: null
}
        """

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            ),
        )

        try:
            content = response.text
            # Try to strip markdown if present, sometimes the model ignores instructions
            if content.startswith("```"):
                content = re.sub(
                    r"^```[a-z]*\n?(.*?)\n?```$", r"\1", content, flags=re.DOTALL
                )
            parsed = json.loads(content)
            blocks_data = parsed.get("blocks", [])

            blocks = []
            for b_data in blocks_data:
                # Provide defaults and parse to FormBlock
                # Validate using Pydantic
                if "config" not in b_data:
                    b_data["config"] = {}
                block = FormBlock(**b_data)
                blocks.append(block)

            return blocks
        except Exception as e:
            print(f"Error parsing AI response: {e}\nResponse: {response.text}")
            raise ValueError("Failed to parse AI response into valid form blocks")
