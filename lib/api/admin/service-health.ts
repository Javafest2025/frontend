export interface ServiceHealth {
    name: string;
    displayName: string;
    status: 'up' | 'down' | 'degraded';
    url: string;
    port: number;
    responseTime?: number;
    uptime?: string;
    version?: string;
    type: 'microservice' | 'database' | 'infrastructure' | 'gateway' | 'frontend';
    dependencies?: string[];
    healthEndpoint?: string;
}

// Environment-based service URL configuration
const getServiceBaseUrl = (): string => {
    const env = process.env.NEXT_PUBLIC_ENV || "dev";

    switch (env.toLowerCase()) {
        case "docker":
            return process.env.NEXT_PUBLIC_DOCKER_BACKEND_URL || "http://scholar-api-gateway:8989";
        case "prod":
            return process.env.NEXT_PUBLIC_API_BASE_URL || "http://70.153.18.56:8989";
        case "dev":
        default:
            return "http://localhost";
    }
};

// Helper function to get service URL based on environment
const getServiceUrl = (port: number, path: string = ""): string => {
    const env = process.env.NEXT_PUBLIC_ENV || "dev";

    if (env.toLowerCase() === "docker") {
        // For Docker, use service names instead of localhost
        const serviceMap: { [key: number]: string } = {
            8761: "scholar-service-registry",
            8989: "scholar-api-gateway",
            8081: "scholar-user-service",
            8082: "scholar-notification-service",
            8083: "scholar-project-service",
            8001: "scholar-paper-search",
            8002: "scholar-extractor",
            8003: "scholar-gap-analyzer",
            3000: "scholar-frontend",
            8070: "pdf_extractor_grobid"
        };
        const serviceName = serviceMap[port] || `service-${port}`;
        return `http://${serviceName}:${port}${path}`;
    } else if (env.toLowerCase() === "prod") {
        // For production, use the production IP
        return `http://70.153.18.56:${port}${path}`;
    } else {
        // For dev, use localhost
        return `http://localhost:${port}${path}`;
    }
};

export interface SystemStats {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIn: number;
    networkOut: number;
}

export interface ServiceLogs {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    service: string;
    message: string;
    details?: any;
}

// Mock service health data
export function getAllServices(): ServiceHealth[] {
    return [
        // Core Application Services
        {
            name: 'service-registry',
            displayName: 'Service Registry',
            status: 'up',
            url: getServiceUrl(8761),
            port: 8761,
            responseTime: 45,
            uptime: '5h 23m',
            version: '2024.1.0',
            type: 'infrastructure',
            healthEndpoint: '/actuator/health'
        },
        {
            name: 'api-gateway',
            displayName: 'API Gateway',
            status: 'up',
            url: getServiceUrl(8989),
            port: 8989,
            responseTime: 67,
            uptime: '5h 22m',
            version: '2024.1.0',
            type: 'gateway',
            dependencies: ['service-registry'],
            healthEndpoint: '/actuator/health'
        },
        {
            name: 'user-service',
            displayName: 'User Service',
            status: 'up',
            url: getServiceUrl(8081),
            port: 8081,
            responseTime: 89,
            uptime: '4h 58m',
            version: '2024.1.0',
            type: 'microservice',
            dependencies: ['user-db', 'user-redis'],
            healthEndpoint: '/actuator/health'
        },
        {
            name: 'project-service',
            displayName: 'Project Service',
            status: 'up',
            url: getServiceUrl(8083),
            port: 8083,
            responseTime: 76,
            uptime: '4h 56m',
            version: '2024.1.0',
            type: 'microservice',
            dependencies: ['project-db'],
            healthEndpoint: '/actuator/health'
        },
        {
            name: 'notification-service',
            displayName: 'Notification Service',
            status: 'up',
            url: getServiceUrl(8082),
            port: 8082,
            responseTime: 54,
            uptime: '4h 57m',
            version: '2024.1.0',
            type: 'microservice',
            dependencies: ['notification-db', 'user-rabbitmq'],
            healthEndpoint: '/actuator/health'
        },
        {
            name: 'paper-search',
            displayName: 'Paper Search Service',
            status: 'up',
            url: getServiceUrl(8001),
            port: 8001,
            responseTime: 123,
            uptime: '3h 45m',
            version: '1.2.0',
            type: 'microservice',
            healthEndpoint: '/health'
        },
        {
            name: 'extractor',
            displayName: 'PDF Extractor Service',
            status: 'up',
            url: getServiceUrl(8002),
            port: 8002,
            responseTime: 156,
            uptime: '3h 44m',
            version: '1.2.0',
            type: 'microservice',
            dependencies: ['grobid'],
            healthEndpoint: '/health'
        },
        {
            name: 'gap-analyzer',
            displayName: 'Gap Analyzer Service',
            status: 'up',
            url: getServiceUrl(8003),
            port: 8003,
            responseTime: 189,
            uptime: '3h 43m',
            version: '1.2.0',
            type: 'microservice',
            dependencies: ['project-db', 'user-rabbitmq', 'grobid'],
            healthEndpoint: '/health'
        },
        {
            name: 'frontend',
            displayName: 'Frontend Application',
            status: 'up',
            url: getServiceUrl(3000),
            port: 3000,
            responseTime: 25,
            uptime: '1h 12m',
            version: '0.1.0',
            type: 'frontend'
        },

        // Infrastructure Services
        {
            name: 'grobid',
            displayName: 'GROBID PDF Processor',
            status: 'up',
            url: getServiceUrl(8070),
            port: 8070,
            responseTime: 234,
            uptime: '5h 23m',
            version: '0.8.0',
            type: 'infrastructure'
        },
        {
            name: 'user-db',
            displayName: 'User Database',
            status: 'up',
            url: getServiceUrl(5433),
            port: 5433,
            responseTime: 8,
            uptime: '5h 23m',
            version: 'PostgreSQL 17',
            type: 'database'
        },
        {
            name: 'project-db',
            displayName: 'Project Database',
            status: 'up',
            url: getServiceUrl(5435),
            port: 5435,
            responseTime: 6,
            uptime: '5h 23m',
            version: 'PostgreSQL 17',
            type: 'database'
        },
        {
            name: 'notification-db',
            displayName: 'Notification Database',
            status: 'up',
            url: getServiceUrl(5434),
            port: 5434,
            responseTime: 7,
            uptime: '5h 23m',
            version: 'PostgreSQL 17',
            type: 'database'
        },
        {
            name: 'user-redis',
            displayName: 'Redis Cache',
            status: 'up',
            url: getServiceUrl(6379),
            port: 6379,
            responseTime: 3,
            uptime: '5h 23m',
            version: 'Redis 8.0.1',
            type: 'database'
        },
        {
            name: 'user-rabbitmq',
            displayName: 'RabbitMQ Broker',
            status: 'up',
            url: getServiceUrl(5672),
            port: 5672,
            responseTime: 15,
            uptime: '5h 23m',
            version: 'RabbitMQ 4.1.0',
            type: 'infrastructure'
        }
    ];
}

// Mock system statistics
export function getSystemStats(): SystemStats {
    return {
        totalRequests: Math.floor(Math.random() * 100000) + 50000,
        avgResponseTime: Math.floor(Math.random() * 50) + 45,
        errorRate: Math.random() * 2,
        cpuUsage: Math.random() * 30 + 20,
        memoryUsage: Math.random() * 40 + 30,
        diskUsage: Math.random() * 20 + 60,
        networkIn: Math.random() * 1000 + 500,
        networkOut: Math.random() * 800 + 400
    };
}

// Mock service logs
export function getServiceLogs(limit: number = 50): ServiceLogs[] {
    const services = ['user-service', 'project-service', 'api-gateway', 'frontend', 'paper-search'];
    const levels: ServiceLogs['level'][] = ['info', 'warn', 'error', 'debug'];
    const messages = [
        'Service started successfully',
        'Database connection established',
        'Processing user request',
        'Cache miss for key: user_session_',
        'API endpoint called: /api/users',
        'Authentication successful',
        'File upload completed',
        'Background job scheduled',
        'Health check passed',
        'Configuration reloaded',
        'Request completed in 45ms',
        'Connection pool size adjusted',
        'Memory usage: 67%',
        'Scheduled maintenance completed'
    ];

    const logs: ServiceLogs[] = [];
    const now = new Date();

    for (let i = 0; i < limit; i++) {
        const timestamp = new Date(now.getTime() - (i * 30000 * Math.random()));
        const service = services[Math.floor(Math.random() * services.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];

        logs.push({
            timestamp,
            level,
            service,
            message: `${message}${level === 'error' ? ' - Error code: 500' : ''}`,
            details: level === 'error' ? { errorCode: 500, stack: 'Error stack trace...' } : undefined
        });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Check service health (mock implementation)
export async function checkServiceHealth(service: ServiceHealth): Promise<ServiceHealth> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    // 95% chance service is up, 5% chance it's down or degraded
    const random = Math.random();
    let status: ServiceHealth['status'] = 'up';

    if (random < 0.02) {
        status = 'down';
    } else if (random < 0.05) {
        status = 'degraded';
    }

    return {
        ...service,
        status,
        responseTime: status === 'down' ? undefined : Math.floor(Math.random() * 200) + 20
    };
}