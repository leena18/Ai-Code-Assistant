from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Define a request model for the POST request
class CodePrompt(BaseModel):
    prompt: str

# Code generation class using Groq API
class CodeGen:
    def __init__(self):
        self.api_url = os.getenv("GROQ_API_URL")  # Groq API URL from environment variable
        self.api_key = os.getenv("GROQ_API_KEY")  # Groq API Key from environment variable

    def generate_code(self, prompt):
        # Send request to Groq API
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "prompt": prompt,
            "max_new_tokens": 100  # Example parameter; adjust based on Groq API spec
        }
        try:
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()  # Raise an error for bad responses
            generated_code = response.json().get("generated_code")  # Adjust based on API response format
            return generated_code
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=str(e))

# Create an instance of the CodeGen class
code_gen = CodeGen()

# POST endpoint to receive prompt and return generated code
@app.post("/generate-code/")
async def generate_code_endpoint(code_prompt: CodePrompt):
    try:
        # Get the prompt from request body
        prompt = code_prompt.prompt
        
        # Call the CodeGen class to generate code using Groq API
        generated_code = code_gen.generate_code(prompt)
        
        # Return the generated code
        return {"generated_code": generated_code}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the FastAPI application
# Use the following command to run: `uvicorn filename:app --reload`
