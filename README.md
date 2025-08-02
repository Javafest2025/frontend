# Scholar AI Frontend

A modern React/Next.js frontend application for Scholar AI.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd Frontend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Configure your environment variables in `.env.local`:
   - `NEXT_PUBLIC_DEV_API_URL` - Development API URL
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth client ID
   - B2 storage credentials (for PDF uploads)

3. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Scripts

The project includes a comprehensive Docker management script:

```bash
# Build and start the application
./scripts/docker.sh up

# View logs
./scripts/docker.sh logs

# Stop the application
./scripts/docker.sh stop

# Restart the application
./scripts/docker.sh restart

# Clean up containers and images
./scripts/docker.sh clean
```

### Manual Docker Commands

```bash
# Build the image
docker compose -f docker/docker-compose.yml build

# Start the application
docker compose -f docker/docker-compose.yml up -d

# Stop the application
docker compose -f docker/docker-compose.yml down
```

## Testing

### Run All Tests
```bash
./scripts/run_tests.sh
```

### Run Specific Test Types
```bash
# Unit tests only
./scripts/run_tests.sh unit

# End-to-end tests only
./scripts/run_tests.sh e2e

# E2E tests with UI
./scripts/run_tests.sh ui
```

### Manual Test Commands
```bash
# Unit tests
npx jest --config tests/jest.config.ts

# E2E tests
npx playwright test --config tests/e2e/playwright.config.ts
```

## Environment Configuration

The application supports multiple environments:
- `dev` - Development environment
- `prod` - Production environment  
- `docker` - Docker containerized environment

Set `NEXT_PUBLIC_ENV` and `ENV` in your `.env.local` file to match your deployment environment.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and API clients
- `/tests` - Unit and E2E tests
- `/docker` - Docker configuration files
- `/scripts` - Build and deployment scripts 