FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create __init__.py files
RUN touch app/__init__.py app/api/__init__.py app/api/routes/__init__.py \
         app/models/__init__.py app/services/__init__.py app/utils/__init__.py \
         app/core/__init__.py

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
