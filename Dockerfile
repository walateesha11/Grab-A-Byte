# ══════════════════════════════════════════════════════════════════════════════
# GrabAByte — Flask Backend Dockerfile
# Multi-stage build: builder installs deps, final image is lean & secure.
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools needed to compile any C extensions (e.g. bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first so Docker can cache this layer
# and skip re-installing packages when only application code changes.
COPY requirements.txt .

# Install all Python dependencies into an isolated prefix so we can
# copy just the installed packages into the final image.
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: production image ─────────────────────────────────────────────────
FROM python:3.11-slim AS final

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Copy installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY app.py          ./app.py
COPY database/       ./database/

# Switch to the non-root user
USER appuser

# Railway injects PORT at runtime; default to 5000 for local runs
ENV PORT=5000 \
    FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 5000

# ── Health check ──────────────────────────────────────────────────────────────
# Railway uses this to determine when the container is ready.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" \
    || exit 1

# ── Start command ─────────────────────────────────────────────────────────────
# Gunicorn is the production WSGI server.
#   --workers 2        : 2 worker processes (suitable for Railway's starter plan)
#   --threads 4        : 4 threads per worker for I/O-bound Flask handlers
#   --timeout 120      : Allow up to 2 min for slow DB queries on cold start
#   --bind 0.0.0.0:$PORT : Bind to all interfaces on the Railway-assigned port
#   --access-logfile - : Stream access logs to stdout (visible in Railway logs)
#   --error-logfile -  : Stream error logs to stdout
CMD gunicorn \
        --workers 2 \
        --threads 4 \
        --timeout 120 \
        --bind "0.0.0.0:${PORT}" \
        --access-logfile - \
        --error-logfile - \
        app:app
