from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import zipfile
import shutil
from fastapi import APIRouter

router = APIRouter()

@router.post("/initialize-project/")
async def initialize_project(
    project_id: str = Form(...),
    user_id: str = Form(...),
    project_path: str = Form(...),
    zip_file: UploadFile = File(...)
):
    # Define the path where the project will be stored
    
    project_dir = f"./project_contexts/{project_id}/{user_id}/{zip_file.filename}"
    os.makedirs(project_dir, exist_ok=True)

    # Save the uploaded ZIP file
    zip_file_path = os.path.join(project_dir, zip_file.filename)
    with open(zip_file_path, "wb") as buffer:
        shutil.copyfileobj(zip_file.file, buffer)

    # Extract the ZIP file
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(project_dir)

    # Optionally, delete the ZIP file after extraction
    os.remove(zip_file_path)

    # Start monitoring code files (can be implemented with chokidar on the frontend)
    await start_monitoring_code_files(project_dir)


    return {"message": "Project initialized successfully", "project_path": project_dir}



async def start_monitoring_code_files(project_dir):
    # Here you can implement the logic to monitor the directory for code file changes.
    # You may pass this directory to the chokidar watcher in your frontend or any other monitoring solution.
    print(f"Monitoring code files in: {project_dir}")
    # Additional logic for monitoring code files can be added here.