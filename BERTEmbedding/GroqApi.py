from fastapi import FastAPI, Request
from groq import Groq
from starlette.responses import HTMLResponse
import os

app = FastAPI()

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

    # Define the prompt template to give only the code, with a stop sequence
    prompt_template = f"""
    You are an AI assistant. Generate only the code based on the following instruction. 
    Do not include any explanations, comments, or extra text. Return only the code and nothing else.

    Instruction: {instruction}

    Code:
        
        
    Your code is given above
    """

    def generate_code(instruction):
        completion = client.chat.completions.create(
            model="gemma-7b-it",
            messages=[
                {"role": "user", "content": prompt_template}
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=["Your code is given above", "Explanation", "Comment"],  # Stop sequence to ensure only code is returned
        )
        generated_code = ""
        for chunk in completion:
            generated_code += str(chunk) or ""
        return generated_code

    return {"user_input": instruction, "generated_code": generate_code(instruction)}
