// Environment-based API configuration
export const getApiBaseUrl = (): string => {
    const env =
        typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENV
            ? process.env.NEXT_PUBLIC_ENV
            : "dev";

    console.log("Current environment:", env);
    console.log("Available env vars:", {
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        ENV: process.env.ENV,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_DOCKER_BACKEND_URL: process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL,
    });

    switch (env.toLowerCase()) {
        case "docker":
            return process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL || "http://docker-core-app-1:8080";
        case "prod":
            return process.env.NEXT_PUBLIC_API_BASE_URL || "http://4.247.29.26:8080";
        case "dev":
        default:
            return process.env.NEXT_PUBLIC_DEV_API_URL || "http://localhost:8080";
    }
};


// Helper function to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${endpoint}`;
}; 