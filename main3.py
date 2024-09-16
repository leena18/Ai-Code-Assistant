import torch
from transformers import GemmaTokenizer, AutoModelForCausalLM
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Define a request model for the POST request
class CodePrompt(BaseModel):
    prompt: str

# Code generation class
class CodeGen:
    def __init__(self):
        self.model_id = "google/codegemma-2b"
        self.tokenizer = GemmaTokenizer.from_pretrained(self.model_id)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_id, torch_dtype=torch.float32)

    def generate_code(self, prompt):
        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(**inputs, max_new_tokens=100)
        generated_code = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return generated_code

# Create an instance of the CodeGen class
code_gen = CodeGen()

# POST endpoint to receive prompt and return generated code
@app.post("/generate-code/")
async def generate_code_endpoint(code_prompt: CodePrompt):
    try:
        # Get the prompt from request body
        prompt = code_prompt.prompt
        
        # Call the CodeGen class to generate code
        generated_code = code_gen.generate_code(prompt)
        
        # Return the generated code
        return {"generated_code": generated_code}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the FastAPI application
# Use the following command to run: `uvicorn filename:app --reload`
