// Environment-based AI API configuration for gap analysis service
export const getAiApiBaseUrl = (): string => {
    const env =
        typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENV
            ? process.env.NEXT_PUBLIC_ENV
            : "dev";

    console.log("Current AI API environment:", env);
    console.log("Available AI API env vars:", {
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        ENV: process.env.ENV,
        NEXT_PUBLIC_AI_API_BASE_URL: process.env.NEXT_PUBLIC_AI_API_BASE_URL,
        NEXT_PUBLIC_DOCKER_AI_BACKEND_URL: process.env.NEXT_PUBLIC_DOCKER_AI_BACKEND_URL,
    });

    switch (env.toLowerCase()) {
        case "docker":
            return process.env.NEXT_PUBLIC_DOCKER_AI_BACKEND_URL || "http://docker-websearch-app-1:8000";
        case "prod":
            return process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://4.247.29.26:8000";
        case "dev":
        default:
            return process.env.NEXT_PUBLIC_DEV_AI_API_URL || "http://localhost:8000";
    }
};

// Helper function to construct full AI API URLs
export const getAiApiUrl = (endpoint: string): string => {
    const baseUrl = getAiApiBaseUrl();
    return `${baseUrl}${endpoint}`;
}; 