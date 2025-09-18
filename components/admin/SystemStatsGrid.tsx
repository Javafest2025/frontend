'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    Activity, 
    Cpu, 
    HardDrive, 
    MemoryStick, 
    Network, 
    Timer,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { SystemMetrics } from '@/lib/api/user-service/admin';

interface SystemStatsGridProps {
    stats: SystemMetrics;
}

export function SystemStatsGrid({ stats }: SystemStatsGridProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toFixed(0);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(1)} GB/s`;
        }
        return `${bytes.toFixed(0)} MB/s`;
    };

    const getProgressColor = (value: number, warning = 70, critical = 90): string => {
        if (value >= critical) return 'bg-red-500';
        if (value >= warning) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const statsCards = [
        {
            title: 'Total Requests',
            value: formatNumber(stats.performance.totalRequests),
            icon: Activity,
            trend: `${stats.performance.requestChange >= 0 ? '+' : ''}${stats.performance.requestChange.toFixed(1)}%`,
            color: 'text-blue-500'
        },
        {
            title: 'Avg Response Time',
            value: `${stats.performance.avgResponseTime}ms`,
            icon: Timer,
            trend: `${stats.performance.responseTimeChange >= 0 ? '+' : ''}${stats.performance.responseTimeChange.toFixed(1)}%`,
            color: stats.performance.responseTimeChange <= 0 ? 'text-green-500' : 'text-red-500'
        },
        {
            title: 'Error Rate',
            value: `${stats.performance.errorRate.toFixed(2)}%`,
            icon: AlertCircle,
            trend: `${stats.performance.errorRateChange >= 0 ? '+' : ''}${stats.performance.errorRateChange.toFixed(1)}%`,
            color: stats.performance.errorRate > 1 ? 'text-red-500' : 'text-green-500'
        },
        {
            title: 'Network In',
            value: `${stats.performance.networkIn.toFixed(1)} GB/s`,
            icon: Network,
            trend: `${stats.performance.networkInChange >= 0 ? '+' : ''}${stats.performance.networkInChange.toFixed(1)}%`,
            color: 'text-purple-500'
        },
        {
            title: 'Network Out',
            value: `${stats.performance.networkOut.toFixed(0)} MB/s`,
            icon: Network,
            trend: `${stats.performance.networkOutChange >= 0 ? '+' : ''}${stats.performance.networkOutChange.toFixed(1)}%`,
            color: 'text-orange-500'
        }
    ];

    const resourceCards = [
        {
            title: 'CPU Usage',
            value: stats.resources.cpuUsage,
            max: 100,
            unit: '%',
            icon: Cpu,
            color: getProgressColor(stats.resources.cpuUsage)
        },
        {
            title: 'Memory Usage',
            value: stats.resources.memoryUsage,
            max: 100,
            unit: '%',
            icon: MemoryStick,
            color: getProgressColor(stats.resources.memoryUsage)
        },
        {
            title: 'Disk Usage',
            value: stats.resources.diskUsage,
            max: 100,
            unit: '%',
            icon: HardDrive,
            color: getProgressColor(stats.resources.diskUsage, 80, 95)
        }
    ];

    return (
        <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statsCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        <CardTitle className="text-sm font-medium">
                                            {stat.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>{stat.trend}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Resource Usage */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Resource Usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {resourceCards.map((resource, index) => (
                        <motion.div
                            key={resource.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <resource.icon className="w-4 h-4 text-muted-foreground" />
                                            <CardTitle className="text-sm font-medium">
                                                {resource.title}
                                            </CardTitle>
                                        </div>
                                        <span className="text-sm font-mono">
                                            {resource.value.toFixed(1)}{resource.unit}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        <Progress 
                                            value={resource.value} 
                                            className="h-2"
                                            color={resource.color}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0{resource.unit}</span>
                                            <span>{resource.max}{resource.unit}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}