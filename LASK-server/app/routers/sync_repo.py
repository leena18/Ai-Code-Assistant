from fastapi import FastAPI, WebSocket, APIRouter, Query
import os
import json

router = APIRouter()

# WebSocket connection to receive updates
@router.websocket("/ws/sync-repo")
async def websocket_endpoint(websocket: WebSocket, userId: str = Query(...), projectId: str = Query(...), projectName: str = Query(...)):
    await websocket.accept()
    print(f"Received userId: {userId}, projectId: {projectId}, projectName: {projectName}")

    # Construct the project path on the server
    project_path = f"./project_contexts/{projectId}/{userId}/{projectName}"
    print(f"Project path: {project_path}")
    
    if not os.path.exists(project_path):
        print(f"Error: Project path {project_path} does not exist.")
        await websocket.close()
        return

    print(f"Connected for project {projectName} with userId {userId} and projectId {projectId}")
    
    try:
        while True:
            data = await websocket.receive_text()
            file_update = json.loads(data)
            
            event = file_update['event']
            file_path = file_update['filePath']
            file_content = file_update.get('fileContent', '')
            timestamp = file_update['timestamp']
            
            # Construct full file path on the server
            server_file_path = os.path.join(project_path, file_path)  # Use the received filePath directly
            
            # Handle the file update
            if event == 'add' or event == 'change':
                # Write or update the file content
                os.makedirs(os.path.dirname(server_file_path), exist_ok=True)
                with open(server_file_path, 'w') as f:
                    f.write(file_content)
                print(f"File {event}d: {server_file_path} at {timestamp}")
                
            elif event == 'unlink':
                # Remove the file from the server
                if os.path.exists(server_file_path):
                    os.remove(server_file_path)
                    print(f"File deleted: {server_file_path} at {timestamp}")
                else:
                    print(f"File not found for deletion: {server_file_path}")

    except Exception as e:
        print(f"Connection error: {e}")
    finally:
        await websocket.close()

app = FastAPI()

# Include the router in the main FastAPI app
app.include_router(router)
