# Use Python base image
FROM python:3.11-slim

# Clone sqlmap
WORKDIR /opt/sqlmap
COPY . .

# Expose sqlmap API port
EXPOSE 8775

# Default command to start sqlmap API server
CMD ["python3", "sqlmapapi.py", "-s", "-H", "0.0.0.0", "-p", "8775"]
