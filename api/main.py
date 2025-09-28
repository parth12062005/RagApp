import os
import boto3
import httpx
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Load environment variables
load_dotenv()

# --- Configuration ---
S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")
MODAL_UPLOAD_URL = os.getenv("MODAL_UPLOAD_URL")
MODAL_CHAT_URL = os.getenv("MODAL_CHAT_URL")
MODAL_API_TOKEN = os.getenv("MODAL_API_TOKEN") # <-- New: Load the token

# Initialize FastAPI app and S3 client
app = FastAPI()
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request body validation
class ChatRequest(BaseModel):
    session_id: str
    message: str # The frontend sends a single 'message'

# --- API Endpoints ---

@app.post("/api/upload")
async def upload_file_and_create_session(file: UploadFile = File(...)):
    # ... (imports and other setup remain the same)
    S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")
    S3_REGION = os.getenv("AWS_S3_REGION")

    file_key = f"uploads/{uuid.uuid4()}-{file.filename}"

    try:
        # This part remains the same: upload the file to S3
        s3_client.upload_fileobj(file.file, S3_BUCKET, file_key)

        # --- MODIFIED: Construct a simple public URL instead of a pre-signed one ---
        public_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file_key}"

        # --- The rest of the logic to contact Modal ---
        headers = {"Authorization": f"Bearer {MODAL_API_TOKEN}"}
        payload = {"document_url": public_url} # Send the simple public URL

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(MODAL_UPLOAD_URL, json=payload, headers=headers)
            response.raise_for_status()

            modal_data = response.json()
            session_id = modal_data.get("session_id")

            if not session_id:
                logging.error("Modal did not return a session_id")
                raise HTTPException(status_code=500, detail="Modal did not return a session_id")
            
            logging.info(f"File upload successful - Session ID: {session_id}, Filename: {file.filename}")
            return {"session_id": session_id, "filename": file.filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.post("/api/chat")
async def chat_with_rag(request: ChatRequest):
    try:
        # --- MODIFIED: Added Authorization Header and changed payload structure ---
        headers = {"Authorization": f"Bearer {MODAL_API_TOKEN}"}
        
        # The frontend sends a single 'message', but your Modal endpoint
        # expects a list in a 'questions' field. We'll format it here.
        payload = {
            "session_id": request.session_id,
            "questions": [request.message] 
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(MODAL_CHAT_URL, json=payload, headers=headers)
            response.raise_for_status()
            
            response_data = response.json()
            logging.info(f"Chat response received for session {request.session_id}")
            logging.info(f"Response data: {response_data}")
            
            return response_data
            
    except Exception as e:
        error_msg = f"An error occurred with Modal: {str(e)}"
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
