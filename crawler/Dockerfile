FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if needed for browser automation)
# RUN apt-get update && apt-get install -y \
#     chromium \
#     chromium-driver \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy crawler code
COPY . .

# Set entry point
CMD ["python", "main.py"]

