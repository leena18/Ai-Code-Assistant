import os
import shutil
import zipfile
from bson import ObjectId
from fastapi import APIRouter, Form, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from app.mongo_db.database import db

router = APIRouter()

# MongoDB collection for storing project details
project_collection = db["projects"]
@router.post("/initialize-project/")
async def initialize_project(
    project_id: str = Form(...),
    user_id: str = Form(...),
    project_path: str = Form(...),
    zip_file: UploadFile = File(...),
):
    # Define the path where the project will be stored
    project_dir = f"./project_contexts/{project_id}/{user_id}/{zip_file.filename}"

    # Check if the project already exists in MongoDB
    try:
        existing_project = await project_collection.find_one({"project_id": project_id})

        if existing_project:
            # Check if the user already exists in the project
            user_exists = any(user["user_id"] == user_id for user in existing_project["users"])

            if user_exists:
                # If the user exists, skip the upload and return a message
                print("user exist")
                return {"message": "Project already exists for this user", "project_path": project_dir}
    except PyMongoError as e:
        return {"error": f"Failed to check project details: {e}"}

    # If the project does not exist for the user, proceed with the upload
    os.makedirs(project_dir, exist_ok=True)

    # Save the uploaded ZIP file
    zip_file_path = os.path.join(project_dir, zip_file.filename)
    with open(zip_file_path, "wb") as buffer:
        shutil.copyfileobj(zip_file.file, buffer)

    # Extract the ZIP file
    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
        zip_ref.extractall(project_dir)

    # Optionally, delete the ZIP file after extraction
    os.remove(zip_file_path)

    # Start monitoring code files (can be implemented with chokidar on the frontend)
    await start_monitoring_code_files(project_dir)

    # Save project details to MongoDB with user_id and project_dir
    try:
        if existing_project:
            # If the user does not exist, add a new user object to the 'users' array
            await project_collection.update_one(
                {"project_id": project_id},
                {"$push": {"users": {"user_id": user_id, "user_project_path": project_dir}}}
            )
        else:
            # If project does not exist, insert a new document
            project_data = {
                "project_id": project_id,
                "users": [{"user_id": user_id, "user_project_path": project_dir}],
                "project_path": project_path,
            }
            await project_collection.insert_one(project_data)

    except PyMongoError as e:
        return {"error": f"Failed to save project details: {e}"}

    return {"message": "Project initialized successfully", "project_path": project_dir}


@router.get("/projects/")
async def get_all_projects():
    try:
        # Retrieve all project documents from MongoDB
        projects = await project_collection.find().to_list(None)

        # Convert ObjectId to string for JSON serialization
        projects_serialized = convert_object_id(projects)

        # Return the list of serialized projects
        return {"projects": projects_serialized}

    except PyMongoError as e:
        return {"error": f"Failed to retrieve projects: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}
    
    
def convert_object_id(document):
    if isinstance(document, dict):
        # Recursively convert ObjectId in the dictionary
        return {key: str(value) if isinstance(value, ObjectId) else value for key, value in document.items()}
    elif isinstance(document, list):
        # Recursively convert ObjectId in the list
        return [convert_object_id(item) for item in document]
    else:
        return document


async def start_monitoring_code_files(project_dir):
    # Here you can implement the logic to monitor the directory for code file changes.
    # You may pass this directory to the chokidar watcher in your frontend or any other monitoring solution.
    print(f"Monitoring code files in: {project_dir}")
    # Additional logic for monitoring code files can be added here.