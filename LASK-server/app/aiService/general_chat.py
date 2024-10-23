from typing import List
from app.aiService.hybrid_search import load_text_context, perform_hybrid_search, generate_groq_response
from app.models.models import Message


# Define a maximum token limit (e.g., 2048 for context)
MAX_CONTEXT_LENGTH = 8000  # Adjust this limit based on your model's constraints


def reformulate_question_with_chat_history(question: str, chat_history: List[Message]) -> str:
    """
    Reformulate the user's question based on the chat history.
    This generates a standalone question that takes chat history into account.
    """
    if not chat_history:
        return question

    # Convert chat history to a readable format
    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in chat_history])

    reformulation_prompt_template = f"""
        You are an AI assistant that reformulates questions based on chat history.
        Given the chat history below, generate a standalone question that includes context from the history.
        Chat history:
        {history_text}
        Original question: {question}
        Only Give the reformulated Question with relevant chat history.
        Reformulated question: 
    """

    # Generate the reformulated question
    reformulated_question = generate_groq_response(reformulation_prompt_template)
    return reformulated_question.strip() if reformulated_question else question


def truncate_context(context):
    """Truncate the provided context to fit within the MAX_CONTEXT_LENGTH token limit."""
    # Approximate tokens as 1 token ≈ 4 characters
    max_char_length = MAX_CONTEXT_LENGTH * 4
    
    # Truncate the context if it exceeds the max character length
    if len(context) > max_char_length:
        context = context[:max_char_length]
    
    return context


def generate_general_chat_response(question: str, directory: str, chat_history: List[Message],text_context_path, curr_file_context) -> str:
    """
    Generate a general chat response by first reformulating the question
    based on chat history, then using the hybrid search context to generate the final answer.
    """

    context = perform_hybrid_search(question, directory, top_k=3)
    print("length of context:", len(context))
    if len(context)>MAX_CONTEXT_LENGTH:
        context = truncate_context(context)
    
    print("context: ",context)
    print("length of context:", len(context))
    
    text_context = load_text_context(text_context_path)
    print("text_context: ",text_context)
    
    context = truncate_context(context)

    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in chat_history])

   
    
    prompt_template= f"""
      Consider yourself a highly skilled programming expert with a deep understanding of various programming languages and paradigms.
      Your current task is to provide the most efficient and elegant code solution possible for the given user query.
      Leverage any provided context code if relevant, or seamlessly craft new code when necessary.

      ###User_Query: \n

      ```

      {question}

      ```
      ###Current_File_Content starts\n
      
      ```
      
      {curr_file_context}
      
      
      ```
      ###Current_File_Content ends


      ###Remote_Code starts: \n

      ```

      {text_context}

      ```

      ###Remote_Code ends
      
      Instructions:
      1. Carefully understand the programming, explaination task described in the ###User_Query.
      2. Thoroughly assess the ###Current_file_Content, Context Code. Determine if it contains functions, structures, or logic that directly align with the ###User_Query.
      3. If the ###Remote_Code contains a function or class that already implements the desired functionality, your task is to use that function or class directly in your generated code.
         Do not create new implementations unless necessary.
      4. If the ###Current_file_Content, ###Remote_Code, has helpful parts that you can modify for the task, adapt and use those parts in your solution.
      5. If the ###Current_file_Content, ###Remote_Code, is irrelevant or insufficient, generate a new, complete code solution from scratch that fulfills the User Query.
      6. The User Query maybe related to the ###Current_file_Content, ###Remote_Code, or both, analyse which one to use to answer the User Query.
      7. If the user is not asking for code, answer the user query.
    
    """
    return generate_groq_response(prompt_template)
    

def summarise_context(context):
    """Summarize the provided context using the Groq API."""
    # Define the prompt template to instruct the model to summarize
    prompt_template = f"You are given code and document context, summarise it in meaningful manner \n\n{context}"
    
    # Use the existing Groq response generation function
    summary = generate_groq_response(prompt_template)
    
    return summary