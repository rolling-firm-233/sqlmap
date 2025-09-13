# SQLMap BullMQ Proxy

A NestJS-based BullMQ proxy that accepts scan tasks and calls the SQLMap API for vulnerability scanning.

## Features

- **BullMQ Integration**: Queue-based task processing with Redis
- **SQLMap API Integration**: Direct communication with SQLMap REST API
- **Task Management**: Create, monitor, and manage scan tasks
- **Progress Tracking**: Real-time scan progress monitoring
- **Error Handling**: Comprehensive error handling and logging
- **RESTful API**: Clean REST API for task management

## Prerequisites

- Node.js (v18 or higher)
- Redis server
- SQLMap with REST API enabled

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Server Configuration
PORT=3000
CORS_ORIGIN=*

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SQLMap API Configuration
SQLMAP_API_URL=http://localhost:8775
```

3. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Start a Scan
```http
POST /scan/start
Content-Type: application/json

{
  "target": "http://example.com/page.php?id=1",
  "method": "GET",
  "data": "param=value",
  "cookie": "session=abc123",
  "userAgent": "Mozilla/5.0...",
  "headers": ["X-Custom: value"],
  "proxy": "http://proxy:8080",
  "delay": "1",
  "timeout": "30",
  "retries": "3"
}
```

### Get Scan Status
```http
GET /scan/status/{jobId}
```

### Get Scan Result
```http
GET /scan/result/{jobId}
```

### Cancel Scan
```http
POST /scan/cancel/{jobId}
```

### Queue Statistics
```http
GET /scan/queue/stats
```

### List Queue Jobs
```http
GET /scan/queue/jobs?status=active&limit=10
```

## Scan Task Options

The scan task supports all major SQLMap options:

- `target`: Target URL to scan
- `method`: HTTP method (GET, POST, etc.)
- `data`: POST data
- `cookie`: Cookie string
- `userAgent`: User agent string
- `referer`: Referer header
- `headers`: Array of custom headers
- `proxy`: Proxy URL
- `proxyCred`: Proxy credentials
- `delay`: Delay between requests
- `timeout`: Request timeout
- `retries`: Number of retries
- `customOptions`: Additional SQLMap options

## Architecture

```
Client Request → NestJS Controller → BullMQ Queue → Scan Processor → SQLMap API
                     ↓
                Redis (Queue Storage)
```

## Error Handling

The system includes comprehensive error handling:

- **Task Creation Errors**: Failed SQLMap task creation
- **Option Setting Errors**: Invalid scan options
- **Scan Execution Errors**: Scan failures and timeouts
- **Queue Errors**: Redis connection issues
- **Cleanup Errors**: Task cleanup failures

## Monitoring

- Real-time progress tracking
- Detailed logging with Winston
- Queue statistics and job monitoring
- Scan result aggregation

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Docker Support

The application can be containerized with Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## License

This project is part of the SQLMap ecosystem and follows the same licensing terms.