# BeautyCita RASA Deployment Container
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 rasa && chown -R rasa:rasa /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy language model
RUN python -m spacy download es_core_news_sm

# Copy application code
COPY . .

# Set proper permissions
RUN chown -R rasa:rasa /app

# Switch to non-root user
USER rasa

# Expose ports
EXPOSE 5005 5055

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5005/health || exit 1

# Default command
CMD ["python", "-m", "rasa", "run", "--enable-api", "--cors", "*", "--port", "5005"]