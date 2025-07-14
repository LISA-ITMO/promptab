# ========================
# Build stage
# ========================
FROM python:3.11-slim AS builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
	build-essential \
	libpq-dev \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# Create virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip wheel setuptools \
	&& pip install --no-cache-dir -r requirements.txt

# Download spaCy language models
RUN python -m spacy download ru_core_news_sm \
	&& python -m spacy download en_core_web_sm

# ========================
# Production stage
# ========================
FROM python:3.11-slim AS production

# Metadata
LABEL maintainer="promptab@example.com"
LABEL version="1.0.0"
LABEL description="PrompTab Backend API - Production optimized"

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
	libpq5 \
	curl \
	&& rm -rf /var/lib/apt/lists/* \
	&& apt-get clean

# Create user for security
RUN groupadd --gid 1000 appuser \
	&& useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Create application directories
RUN mkdir -p /app/logs /app/data \
	&& chown -R appuser:appuser /app

# Switch to application user
USER appuser
WORKDIR /app

# Copy virtual environment from build stage
COPY --from=builder --chown=appuser:appuser /opt/venv /opt/venv

# Add virtual environment to PATH
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application code
COPY --chown=appuser:appuser . .

# Create logs directory
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
	CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker"]
