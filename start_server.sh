#!/bin/bash

# Activate virtual environment
source /home/ubuntu/RagApp/venv/bin/activate

# Start Gunicorn (FastAPI) in background
/home/ubuntu/RagApp/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker api.main:app \
    --bind 0.0.0.0:8000 \
    --access-logfile /home/ubuntu/RagApp/logs/access.log \
    --error-logfile /home/ubuntu/RagApp/logs/error.log &

# Start ngrok tunnel
ngrok http 8000 --log=stdout
