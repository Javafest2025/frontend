import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Server, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ServiceHealth } from "@/lib/api/user-service/admin";

interface ServiceHealthCardProps {
    serviceName: string;
    health: ServiceHealth | null;
    isLoading: boolean;
    lastChecked?: Date;
}

export function ServiceHealthCard({ serviceName, health, isLoading, lastChecked }: ServiceHealthCardProps) {
    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'UP':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
            case 'DOWN':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'UP':
                return <CheckCircle className="w-4 h-4" />;
            case 'DOWN':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatServiceName = (name: string) => {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-border transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    {formatServiceName(serviceName)}
                </CardTitle>
                {!isLoading && health && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Badge variant="outline" className={getStatusColor(health.status)}>
                            <span className="flex items-center gap-1">
                                {getStatusIcon(health.status)}
                                {health.status.toUpperCase()}
                            </span>
                        </Badge>
                    </motion.div>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                ) : health ? (
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-semibold text-foreground"
                        >
                            {health.status === 'UP' ? 'Operational' : 'Service Issue'}
                        </motion.div>
                        {lastChecked && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-xs text-muted-foreground"
                            >
                                Last checked: {lastChecked.toLocaleTimeString()}
                            </motion.p>
                        )}
                        {health.components && Object.keys(health.components).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs text-muted-foreground"
                            >
                                {Object.keys(health.components).length} component(s) monitored
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Unable to reach service
                    </div>
                )}
            </CardContent>
        </Card>
    );
}