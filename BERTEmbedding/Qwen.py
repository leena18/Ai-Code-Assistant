import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM

# Load the Qwen model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-Coder-1.5B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Coder-1.5B")

# Streamlit app layout
st.title("Chat with Qwen AI Model")

# Initialize chat history in session state
if 'chat_history' not in st.session_state:
    st.session_state['chat_history'] = []

# Function to generate a response from the Qwen model
def generate_response(user_input):
    prompt_template = f"You are an AI assistant expert at coding. Answer the following question concisely:\n\n{user_input}\n\nAnswer:"
    inputs = tokenizer(prompt_template, return_tensors="pt")
    outputs = model.generate(**inputs, max_length=150, temperature=0.7)
    generated_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_response.strip()

# Chat input form
with st.form("chat_form"):
    user_question = st.text_area("Ask a question:")
    submit_button = st.form_submit_button("Send")

    if submit_button and user_question:
        # Store user question and model response in chat history
        response = generate_response(user_question)
        st.session_state['chat_history'].append({"question": user_question, "answer": response})

# Display chat history
if st.session_state['chat_history']:
    for chat in st.session_state['chat_history']:
        st.write(f"**You:** {chat['question']}")
        st.write(f"**Qwen AI:** {chat['answer']}")
