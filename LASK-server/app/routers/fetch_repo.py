from fastapi import FastAPI, HTTPException
from app.models.models import RepoRequest, FilePaths
from app.github_fetch.github_fetch import fetch_github_repo_structure, load_json_from_file
from app.github_fetch.fetch_code_from_filepath import fetch_code_from_paths, save_code_to_file
from app.github_fetch.gitlab_fetch import fetch_gitlab_repo_structure
from fastapi import APIRouter


router = APIRouter()
allowed_extensions = [".java", ".xml",".php",".js",".py",".info.yml",".yml",".css",".js",".po",".sql","composer.json","package.json",".html.twig",".install",".module",".ts",".test",".schema.yml"]



@router.post("/fetch_repo_structure/")
async def fetch_repo_structure_endpoint(repo_request: RepoRequest):
    try:
        if "gitlab.valuebound.net" in repo_request.repo_url:
            repo_structure = fetch_gitlab_repo_structure(
                repo_request.repo_url,
                repo_request.access_token,
                allowed_extensions,
                repo_request.user_id,
                repo_request.project_id
            )
            return {"repository_structure": repo_structure}
        
        repo_structure = fetch_github_repo_structure(
            repo_request.repo_url,
            repo_request.access_token,
            allowed_extensions,
            repo_request.user_id,
            repo_request.project_id
        )
        return {"repository_structure": repo_structure}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.post("/fetch-code/")
async def get_code_from_paths(file_paths: FilePaths):
    try:
        # Fetch code based on the paths in the request
        userid = file_paths.user_id
        projectid = file_paths.project_id
        ref_repo_name = file_paths.ref_repo_name
        json_path = f"./project_contexts/{projectid}/{userid}/{ref_repo_name}.json"
        print(json_path)
        json_file = load_json_from_file(json_path)
        code_context = fetch_code_from_paths(json_file, file_paths.paths)
        
        save_code_to_file(code_context, project_id=projectid, user_id=userid)
        
        return {"code": code_context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
