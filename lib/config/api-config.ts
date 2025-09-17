// Environment-based API configuration for microservices architecture
export const getApiBaseUrl = (): string => {
    const env = process.env.NEXT_PUBLIC_ENV || "dev";

    console.log("Current environment:", env);
    console.log("Available env vars:", {
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_DOCKER_BACKEND_URL: process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL,
    });

    switch (env.toLowerCase()) {
        case "docker":
            return process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL || "http://scholar-api-gateway:8989";
        case "prod":
            return process.env.NEXT_PUBLIC_API_BASE_URL || "http://70.153.18.56:8989";
        case "dev":
        default:
            return process.env.NEXT_PUBLIC_DEV_API_URL || "http://localhost:8989";
    }
};

// Helper function to construct full API URLs for microservices
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${endpoint}`;
};

// Helper function to construct microservice-specific URLs
export const getMicroserviceUrl = (serviceName: string, endpoint: string): string => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/${serviceName}${endpoint}`;
}; 