'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    Server, 
    Database, 
    Globe, 
    Activity, 
    Clock, 
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { ServiceHealth } from '@/lib/api/admin/service-health';

interface ServiceGridProps {
    services: ServiceHealth[];
    onServiceClick?: (service: ServiceHealth) => void;
}

const serviceTypeIcons = {
    microservice: Server,
    database: Database,
    infrastructure: Activity,
    gateway: Globe,
    frontend: Zap
};

const statusColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    degraded: 'text-yellow-500'
};

const statusIcons = {
    up: CheckCircle,
    down: XCircle,
    degraded: AlertTriangle
};

export function ServiceGrid({ services, onServiceClick }: ServiceGridProps) {
    const groupedServices = services.reduce((acc, service) => {
        if (!acc[service.type]) {
            acc[service.type] = [];
        }
        acc[service.type].push(service);
        return acc;
    }, {} as Record<string, ServiceHealth[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedServices).map(([type, serviceList]) => (
                <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                        {serviceTypeIcons[type as keyof typeof serviceTypeIcons] && 
                         React.createElement(serviceTypeIcons[type as keyof typeof serviceTypeIcons], { 
                             className: "w-5 h-5" 
                         })
                        }
                        {type.replace('-', ' ')} Services
                        <Badge variant="secondary">{serviceList.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {serviceList.map((service) => (
                            <ServiceCard
                                key={service.name}
                                service={service}
                                onClick={() => onServiceClick?.(service)}
                            />
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

interface ServiceCardProps {
    service: ServiceHealth;
    onClick?: () => void;
}

function ServiceCard({ service, onClick }: ServiceCardProps) {
    const StatusIcon = statusIcons[service.status];
    const TypeIcon = serviceTypeIcons[service.type];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`cursor-pointer ${onClick ? 'hover:shadow-md' : ''}`}
                        onClick={onClick}
                    >
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                                        <CardTitle className="text-sm font-medium truncate">
                                            {service.displayName}
                                        </CardTitle>
                                    </div>
                                    <StatusIcon className={`w-4 h-4 ${statusColors[service.status]}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Port:</span>
                                        <span className="font-mono">{service.port}</span>
                                    </div>
                                    {service.responseTime && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Response:</span>
                                            <span className="font-mono">{service.responseTime}ms</span>
                                        </div>
                                    )}
                                    {service.uptime && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Uptime:</span>
                                            <span className="font-mono">{service.uptime}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge 
                                            variant={service.status === 'up' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}
                                            className="text-xs"
                                        >
                                            {service.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-semibold">{service.displayName}</p>
                        <p className="text-sm">URL: {service.url}</p>
                        {service.version && <p className="text-sm">Version: {service.version}</p>}
                        {service.dependencies && (
                            <p className="text-sm">
                                Dependencies: {service.dependencies.join(', ')}
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}