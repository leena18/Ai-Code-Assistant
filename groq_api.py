from fastapi import FastAPI, Request
from groq import Groq
from starlette.responses import HTMLResponse
import os
from dotenv import load_dotenv

load_dotenv()
app= FastAPI()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

@app.post("/")
async def index(request: Request):
    if not GROQ_API_KEY:
        return HTMLResponse(
            """
            <p>API key not found. Please set the 'GROQ_API_KEY' environment variable.</p>
            """
        )

    client = Groq(api_key=GROQ_API_KEY)

    data = await request.json()
    instruction = data.get("instruction")

    def generate_code(instruction):
        completion = client.chat.completions.create(
            model="gemma-7b-it",
            messages=[
                {"role": "user", "content": instruction}
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            # Set stream to False
            stream=False,
            stop=None,
        )
        generated_code = ""
        for chunk in completion:
            generated_code += str(chunk) or ""
        return generated_code

    return {"user_input": instruction, "generated_code": generate_code(instruction)}