import torch
from transformers import GemmaTokenizer, AutoModelForCausalLM

import os
from dotenv import load_dotenv

load_dotenv()

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

# Define a prompt
prompt = "Write a Python function to calculate the factorial of a number."

# Call the generate_code method and print the output
generated_code = code_gen.generate_code(prompt)
print("Generated Code:\n", generated_code)