from datetime import datetime
import json
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from app.embeddingService.embedding_processor import save_embeddings
from app.aiService.hybrid_search import generate_code_response, generate_comments_for_code, generate_code_fix_response, generate_code_auto_fix_response, generate_code_response_alternatives
from app.aiService.general_chat import generate_general_chat_response
from app.models.models import QuestionRequest, CommentRequest, FixCodeRequest, Message, ChatHistory
from app.mongo_db.crud import save_chat_history , load_chat_history
import markdown
import re
import os

router = APIRouter()


@router.post("/generate-code/")
def ask_question(request: QuestionRequest):
    try:
        print(request.question,request.project_id)
        print("curr file context:", request.curr_file_context)
        project_folder_path = f"./project_contexts/{request.project_id}/{request.user_id}/"
    
        context_folder_path = f"./project_contexts/{request.project_id}/{request.user_id}/"

        text_context_path = os.path.join(context_folder_path, "text_context.txt")

        # Create the directories if they don't exist
        os.makedirs(context_folder_path, exist_ok=True)
        curr_file_context = request.curr_file_context
        answer = generate_code_response(request.question, project_folder_path, text_context_path, curr_file_context)

        answer = remove_language_markers(answer)
        
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/generate-code-alternatives/")
def ask_question(request: QuestionRequest):
    try:
        print(request.question, request.project_name)
        project_folder_path = f"./saved_embeddings/{request.project_name}/"
        answer = generate_code_response_alternatives(request.question, project_folder_path)

        # Regular expression to extract code snippets
        code_snippets = re.findall(r'```.*?\n(.*?)```', answer, re.DOTALL)
        
        # Create a dictionary to store the code snippets
        code_dict = {f"Code {i + 1}": code.strip() for i, code in enumerate(code_snippets)}

        # Return the structured response
        return {"code_snippets": code_dict}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-comments/")
def generate_comments(request: CommentRequest):  # Use the model as the request parameter
    """API endpoint to generate comments for the provided code."""
    try:
        comments = generate_comments_for_code(request.code)  # Access the code from the request model
        return {"comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/fix-code-instuction/")
def fix_code(request: FixCodeRequest):
    """API endpoint to fix faulty code based on project context."""
    try:
        project_folder_path = f"./saved_embeddings/{request.project_name}/"
        fixed_code = generate_code_fix_response(request.instruction, request.faulty_code, project_folder_path)
        return {"fixed_code": fixed_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/general-chat/")
def general_chat(request: QuestionRequest):
    """
    API endpoint to handle general chat about the project using the AI model.
    """
    print("curr_file_context:", request.curr_file_context)
    try:
        curr_file_context = request.curr_file_context
        project_folder_path = f"./project_contexts/{request.project_id}/{request.user_id}/"
        # Generate the general chat response using hybrid search and Groq API
        context_folder_path = f"./project_contexts/{request.project_id}/{request.user_id}/"
        text_context_path = os.path.join(context_folder_path, "text_context.txt")
        # Create the directories if they don't exist
        os.makedirs(context_folder_path, exist_ok=True)
        
        response = generate_general_chat_response(request.question, project_folder_path,[],text_context_path, curr_file_context)
        # response  = markdown.markdown(response)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fix-code-auto/")
def fix_code_auto(request: FixCodeRequest):
    """API endpoint to automatically fix faulty code based on project context, without user instructions."""
    try:
        project_folder_path = f"./saved_embeddings/{request.project_name}/"
        fixed_code = generate_code_auto_fix_response(request.faulty_code, project_folder_path)
        return {"fixed_code": fixed_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
    

@router.websocket("/ws/general-chat/")
async def websocket_general_chat(websocket: WebSocket):
    """
    WebSocket API to handle general chat about the project using the AI model.
    """
    await websocket.accept()  # Accept the WebSocket connection

    try:
        # Expect the first message to include session_id and project_name
        initial_data = await websocket.receive_json()
        session_id = initial_data.get("session_id")
        project_name = initial_data.get("project_name")

        if not session_id or not project_name:
            await websocket.send_json({"error": "Missing session_id or project_name"})
            await websocket.close()
            return

        # Load existing chat history or create a new one
        chat_history = await load_chat_history(session_id)
        if not chat_history:
            chat_history = ChatHistory(session_id=session_id, project_name=project_name)
        else:
            # Update project_name if necessary
            chat_history.project_name = project_name

        while True:
            # Receive the JSON data (with question)
            data = await websocket.receive_json()
            question = data.get("question")

            if not question:
                await websocket.send_json({"error": "Missing question"})
                continue

            project_folder_path = f"./saved_embeddings/{project_name}/"

            # Add the user's question to the chat history
            chat_history.history.append(Message(role="user", content=question))

            # Generate the AI response using the chat history as context
            response = generate_general_chat_response(question, project_folder_path, chat_history.history)
            print("response generated:")
            response = markdown.markdown(response)
            # Add the AI response to the chat history
            chat_history.history.append(Message(role="assistant", content=response))

            # Update the updated_at timestamp
            chat_history.updated_at = datetime.utcnow()

            # Save updated chat history
            await save_chat_history(chat_history)

            print("response:", response)
            # Send the response back to the client
            await websocket.send_json({"response": response})

    except WebSocketDisconnect:
        print(f"Client with session_id {session_id} disconnected")

    except Exception as e:
        await websocket.send_json({"error": str(e)})


@router.websocket("/ws/generate-code/")
async def websocket_generate_code(websocket: WebSocket):
    """
    WebSocket endpoint to generate code based on a question.
    """
    await websocket.accept()  # Accept the WebSocket connection
    try:
        while True:
            # Receive data from client
            request_data = await websocket.receive_text()

            # Assuming the request data is a JSON string, convert it into a Python dictionary
            request = json.loads(request_data)
            
            # Extract project_name and question from the request
            project_folder_path = f"./saved_embeddings/{request['project_name']}/"
            question = request['question']
            
            # Generate the code response using your custom logic
            answer = generate_code_response(question, project_folder_path)
            
            # Send the response back to the client
            await websocket.send_text(json.dumps({"answer": answer}))
    
    except WebSocketDisconnect:
        print("Client disconnected")
    
    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
        raise HTTPException(status_code=500, detail=str(e))


def remove_language_markers(code: str) -> str:
    # Split the code by lines and filter out lines that contain only the language marker
    return re.sub(r'```.*?\n|^\s*```$', '', code, flags=re.MULTILINE)



# frontend guide
# inital data
# {
#     "session_id": "unique_session_id",
#     "project_name": "your_project_name"
# } initial connection message

# data
# {
#     "question": "Your question here"
# } subsequent questions 

