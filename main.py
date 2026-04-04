import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv(override=True)

app = FastAPI()

origins = ["http://127.0.0.1:8080/", "https://logos-bible-study.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_client = OpenAI(
    base_url=os.getenv("BASE_URL"),
    api_key=os.getenv("AI_API_KEY"),
)


class BibleVerse(BaseModel):
    reference: str = Field(..., max_length=200)
    text: str = Field(..., max_length=5000)


def get_prompt(reference: str, text: str) -> str:
    return f"""
    ROLE: You are an expert theological scholar specializing in historical-critical analysis, ancient languages, and biblical theology.

    TASK: Analyze the bible verse provided below. Provide a COMPREHENSIVE and DETAILED response.

    OUTPUT FORMAT:
    You must return a valid, parseable JSON object.
    Do not include markdown formatting (e.g., no ```json or ```).
    Do not include any introductory or concluding text.

    The JSON object must strictly follow this structure:
    {{
      "historicalContext": "A comprehensive and detailed paragraph (at least 4-5 sentences) exploring the cultural, historical, and situational background of the verse.",
      "linguisticLens": "A detailed analysis of multiple key original words (Hebrew/Greek). Explain their nuance, root meaning, and significance in this context. Include pronunciation.",
      "crossReferences": [
        {{
          "verse": "Book Chapter:Verse",
          "explanation": "A detailed explanation of the theological or thematic connection."
        }},
        {{
          "verse": "Book Chapter:Verse",
          "explanation": "A detailed explanation of the theological or thematic connection."
        }}
      ]
    }}

    LINGUISTIC GUIDELINES (STRICT):
      - FORMAT: "Transliteration (Hebrew/Greek Script) [pronunciation] - definition/nuance".
      - EXAMPLE: "Elohim (אֱלֹהִים) [el-o-heem] - God, focusing on His power and creativity."
      - Do NOT include labels like "[Hebrew]" or "[Transliteration]" inside the JSON values.

    VERSE TO ANALYZE:
    {reference}: "{text}"
    """


@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Logos Bible Study API is awake!"}


@app.post("/generate_theology")
async def generate_theology(request: BibleVerse):
    try:
        prompt = get_prompt(request.reference, request.text)
        response = ai_client.chat.completions.create(
            model=str(os.getenv("AI_MODEL")),
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content
        if content is None:
            raise HTTPException(status_code=500, detail="No content returned from AI")
        return json.loads(content)
    except Exception as e:
        print(f"Error generating theology: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
