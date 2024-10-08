from fastapi import APIRouter, HTTPException, UploadFile, File
from app.repository_processing import process_repository
import os
import shutil
from typing import List

router = APIRouter()

# Temporary storage path for uploaded files
TEMP_DIR = "./temp_repository/"

@router.post("/process_repository")
async def api_process_repository(files: List[UploadFile] = File(...)):
    # Create a temporary directory to store the uploaded files
    # if not os.path.exists(TEMP_DIR):
    #     os.makedirs(TEMP_DIR)

    # Save uploaded files to the temporary directory
    for file in files:
        file_path = os.path.join(TEMP_DIR, file.filename)
        print(f"Saving file to: {file_path}")
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

    # Process the uploaded files (using the path of the temp directory)
    try:
        process_repository(TEMP_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing repository: {str(e)}")

    # Clean up temporary files after processing
    shutil.rmtree(TEMP_DIR)

    return {"message": f"Repository processed successfully."}
