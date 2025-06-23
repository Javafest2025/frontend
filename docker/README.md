# Scholar AI Frontend - Docker Setup

This directory contains the Docker configuration for the Scholar AI Frontend application.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Files

- `Dockerfile` - Multi-stage Docker build configuration for the Next.js application
- `docker-compose.yml` - Docker Compose configuration for easy container management
- `README.md` - This documentation file

## Quick Start

### Using the Management Scripts

For **Windows** users:
```bash
# Build and start the application
docker.bat up

# Or build and start separately
docker.bat build
docker.bat start
```

For **Linux/Mac** users:
```bash
# Make the script executable (first time only)
chmod +x docker.sh

# Build and start the application
./docker.sh up

# Or build and start separately
./docker.sh build
./docker.sh start
```

### Using Docker Compose Directly

```bash
# Build the image
docker-compose -f docker/docker-compose.yml build

# Start the application
docker-compose -f docker/docker-compose.yml up -d

# Stop the application
docker-compose -f docker/docker-compose.yml down
```

## Management Script Commands

Both `docker.sh` (Linux/Mac) and `docker.bat` (Windows) support the following commands:

| Command | Description |
|---------|-------------|
| `build` | Build the Docker image |
| `start` | Start the application |
| `stop` | Stop the application |
| `restart` | Restart the application |
| `up` | Build and start the application |
| `logs` | Show application logs |
| `status` | Show container status |
| `clean` | Remove containers and images |
| `help` | Show help message |

## Application Access

Once started, the application will be available at:
- **URL**: http://localhost:3000
- **Port**: 3000

## Docker Image Details

The Dockerfile uses a multi-stage build process:

1. **Dependencies Stage**: Installs Node.js dependencies
2. **Builder Stage**: Builds the Next.js application
3. **Runner Stage**: Creates the final production image

### Features:
- Based on Node.js 18 Alpine Linux (lightweight)
- Multi-stage build for optimized image size
- Non-root user for security
- Standalone output for better performance
- Optimized for production deployment

## Environment Variables

The following environment variables are set in the container:

- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Docker is not running
   ```
   **Solution**: Start Docker Desktop

2. **Port already in use**
   ```
   Error: Port 3000 is already in use
   ```
   **Solution**: Stop other applications using port 3000 or modify the port in `docker-compose.yml`

3. **Build fails**
   ```
   Error: Failed to build Docker image
   ```
   **Solution**: Check Docker logs and ensure all dependencies are properly installed

### Viewing Logs

To view application logs:
```bash
# Windows
docker.bat logs

# Linux/Mac
./docker.sh logs

# Or directly with Docker Compose
docker-compose -f docker/docker-compose.yml logs -f scholar-ai-frontend
```

### Cleaning Up

To remove all containers and images:
```bash
# Windows
docker.bat clean

# Linux/Mac
./docker.sh clean
```

## Development vs Production

This Docker setup is optimized for production deployment. For development, you may want to:

1. Use volume mounts for hot reloading
2. Install development dependencies
3. Use development environment variables

## Network Configuration

The application runs on a custom Docker network (`scholar-ai-network`) which allows for easy integration with other services like databases or APIs.

## Security Considerations

- The application runs as a non-root user (`nextjs`)
- Only necessary files are copied to the final image
- Telemetry is disabled for privacy
- The container exposes only the required port (3000) 