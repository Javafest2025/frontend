import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "./auth";

export interface AdminUserCount {
    count: number;  // Regular users count (for main display)
    totalUsers?: number;
    regularUsers?: number;
    adminUsers?: number;
}

export interface SystemMetrics {
    performance: {
        totalRequests: number;
        requestChange: number;
        avgResponseTime: number;
        responseTimeChange: number;
        errorRate: number;
        errorRateChange: number;
        networkIn: number;
        networkInChange: number;
        networkOut: number;
        networkOutChange: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
    };
}

export interface ServiceHealth {
    status: string;
    components?: {
        [key: string]: {
            status: string;
            details?: any;
        };
    };
}

export interface AdminMetrics {
    userCount: AdminUserCount;
    systemMetrics: SystemMetrics;
    serviceHealth: {
        userService: ServiceHealth | null;
        projectService: ServiceHealth | null;
    };
}

// Get total user count from admin endpoint
export const getAdminUserCount = async (): Promise<AdminUserCount> => {
    const url = getMicroserviceUrl("user-service", "/api/admin/users/count");
    console.log("Fetching user count from:", url);
    
    const response = await authenticatedFetch(url, {
        method: "GET",
        credentials: 'include',
    });

    console.log("User count response status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("User count API error:", response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch user count: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User count response data:", data);
    
    // Check if status is successful (200-299 range)
    if (data.status < 200 || data.status >= 300) {
        throw new Error(data.message || "Failed to get user count");
    }

    console.log("Returning user count:", data.data);
    return data.data;
};

// Get system metrics from admin endpoint
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
    const url = getMicroserviceUrl("user-service", "/api/admin/metrics/system");
    
    const response = await authenticatedFetch(url, {
        method: "GET",
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch system metrics: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if status is successful (200-299 range)
    if (data.status < 200 || data.status >= 300) {
        throw new Error(data.message || "Failed to get system metrics");
    }

    return data.data;
};

// Check service health
export const getServiceHealth = async (serviceName: string): Promise<ServiceHealth | null> => {
    try {
        const url = getMicroserviceUrl(serviceName, "/actuator/health");
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            return {
                status: "DOWN",
                components: {
                    error: {
                        status: "DOWN",
                        details: {
                            message: `HTTP ${response.status}: ${response.statusText}`
                        }
                    }
                }
            };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error checking ${serviceName} health:`, error);
        return {
            status: "DOWN",
            components: {
                error: {
                    status: "DOWN",
                    details: {
                        message: error instanceof Error ? error.message : "Unknown error"
                    }
                }
            }
        };
    }
};

// Get all admin metrics in one call
export const getAdminMetrics = async (): Promise<AdminMetrics> => {
    try {
        const [userCount, systemMetrics, userServiceHealth, projectServiceHealth] = await Promise.all([
            getAdminUserCount().catch((error) => {
                console.error("Failed to fetch user count:", error);
                return { count: 0 };
            }),
            getSystemMetrics().catch((error) => {
                console.error("Failed to fetch system metrics:", error);
                return {
                    performance: {
                        totalRequests: 0,
                        requestChange: 0,
                        avgResponseTime: 0,
                        responseTimeChange: 0,
                        errorRate: 0,
                        errorRateChange: 0,
                        networkIn: 0,
                        networkInChange: 0,
                        networkOut: 0,
                        networkOutChange: 0,
                    },
                    resources: {
                        cpuUsage: 0,
                        memoryUsage: 0,
                        diskUsage: 0,
                    }
                };
            }),
            getServiceHealth("user-service"),
            getServiceHealth("project-service"),
        ]);

        return {
            userCount,
            systemMetrics,
            serviceHealth: {
                userService: userServiceHealth,
                projectService: projectServiceHealth,
            },
        };
    } catch (error) {
        console.error("Error fetching admin metrics:", error);
        throw error;
    }
};