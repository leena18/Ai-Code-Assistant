import streamlit as st
import boto3
import json
from botocore.exceptions import ClientError

from dotenv import load_dotenv

load_dotenv()

# Initialize the Bedrock client
client = boto3.client("bedrock-runtime", region_name="us-west-2")

# Model ID for Meta Llama 3 70b Instruct
model_id = "meta.llama3-70b-instruct-v1:0"

# Function to send the prompt to the model
def invoke_llama(prompt):
    formatted_prompt = f"""
    <|begin_of_text|><|start_header_id|>user<|end_header_id|>
    {prompt}
    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
    """
    
    native_request = {
        "prompt": formatted_prompt,
        "max_gen_len": 512,
        "temperature": 0.5,
    }

    try:
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps(native_request)
        )
        # Decode the response body
        model_response = json.loads(response["body"].read())
        return model_response.get("generation", "No response from model.")
    
    except (ClientError, Exception) as e:
        return f"Error invoking model: {str(e)}"

# Streamlit app layout
st.title("Meta Llama 3 Chat Interface")

# Create a simple text input box for the user prompt
user_input = st.text_input("Enter your message:")

if user_input:
    with st.spinner("Sending your message to Meta Llama 3..."):
        response = invoke_llama(user_input)
        st.success("Response received!")

        # Display the response in the chat box
        st.markdown(f"**Meta Llama 3's response:**\n\n{response}")

# Sidebar info about the app
st.sidebar.title("Meta Llama 3")
st.sidebar.markdown(
    """
    This interface allows you to communicate with Meta Llama 3 (70b Instruct) using the AWS Bedrock service.
    """
)
