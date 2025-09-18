'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
    Settings, 
    RefreshCw, 
    Shield, 
    AlertTriangle, 
    Power,
    Wrench,
    Database,
    Server,
    Play,
    Square,
    RotateCcw
} from 'lucide-react';
import { ServiceHealth } from '@/lib/api/admin/service-health';
import { useToast } from '@/hooks/use-toast';

interface AdminControlsProps {
    services: ServiceHealth[];
    onServiceAction?: (service: ServiceHealth, action: string) => void;
}

export function AdminControls({ services, onServiceAction }: AdminControlsProps) {
    const { toast } = useToast();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoScaling, setAutoScaling] = useState(true);
    const [isPerformingAction, setIsPerformingAction] = useState<string | null>(null);

    const handleServiceAction = async (service: ServiceHealth, action: string) => {
        setIsPerformingAction(`${service.name}-${action}`);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            toast({
                title: `${action} ${service.displayName}`,
                description: `Successfully ${action.toLowerCase()}ed ${service.displayName}`,
            });
            
            onServiceAction?.(service, action);
        } catch (error) {
            toast({
                title: "Action Failed",
                description: `Failed to ${action.toLowerCase()} ${service.displayName}`,
                variant: "destructive"
            });
        } finally {
            setIsPerformingAction(null);
        }
    };

    const handleMaintenanceMode = (enabled: boolean) => {
        setMaintenanceMode(enabled);
        toast({
            title: enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
            description: enabled 
                ? "System is now in maintenance mode. New requests will be blocked."
                : "System is back online. Normal operations resumed.",
            variant: enabled ? "destructive" : "default"
        });
    };

    const handleGlobalAction = async (action: string) => {
        setIsPerformingAction(action);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            toast({
                title: `${action} Complete`,
                description: `Successfully performed ${action.toLowerCase()} on all services`,
            });
        } catch (error) {
            toast({
                title: "Action Failed",
                description: `Failed to perform ${action.toLowerCase()}`,
                variant: "destructive"
            });
        } finally {
            setIsPerformingAction(null);
        }
    };

    const coreServices = services.filter(s => s.type === 'microservice' || s.type === 'gateway');
    const infrastructureServices = services.filter(s => s.type === 'infrastructure' || s.type === 'database');

    return (
        <div className="space-y-6">
            {/* System Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        System Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Global Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium">Maintenance Mode</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Block new requests and display maintenance message
                                </p>
                            </div>
                            <Switch
                                checked={maintenanceMode}
                                onCheckedChange={handleMaintenanceMode}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">Auto Scaling</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Automatically scale services based on load
                                </p>
                            </div>
                            <Switch
                                checked={autoScaling}
                                onCheckedChange={setAutoScaling}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Global Actions */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Global Actions</h4>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGlobalAction('Restart All')}
                                disabled={isPerformingAction === 'Restart All'}
                            >
                                {isPerformingAction === 'Restart All' ? (
                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                )}
                                Restart All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGlobalAction('Health Check')}
                                disabled={isPerformingAction === 'Health Check'}
                            >
                                {isPerformingAction === 'Health Check' ? (
                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Shield className="w-4 h-4 mr-1" />
                                )}
                                Health Check
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGlobalAction('Clear Caches')}
                                disabled={isPerformingAction === 'Clear Caches'}
                            >
                                {isPerformingAction === 'Clear Caches' ? (
                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Database className="w-4 h-4 mr-1" />
                                )}
                                Clear Caches
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Service Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Service Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Core Services */}
                    <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            Core Services
                        </h4>
                        <div className="space-y-3">
                            {coreServices.map((service) => (
                                <ServiceControlRow
                                    key={service.name}
                                    service={service}
                                    onAction={handleServiceAction}
                                    isPerformingAction={isPerformingAction}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Infrastructure Services */}
                    <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Infrastructure Services
                        </h4>
                        <div className="space-y-3">
                            {infrastructureServices.map((service) => (
                                <ServiceControlRow
                                    key={service.name}
                                    service={service}
                                    onAction={handleServiceAction}
                                    isPerformingAction={isPerformingAction}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface ServiceControlRowProps {
    service: ServiceHealth;
    onAction: (service: ServiceHealth, action: string) => void;
    isPerformingAction: string | null;
}

function ServiceControlRow({ service, onAction, isPerformingAction }: ServiceControlRowProps) {
    const getActionId = (action: string) => `${service.name}-${action}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-lg border"
        >
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                    service.status === 'up' ? 'bg-green-500' : 
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                    <div className="font-medium">{service.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                        {service.url} • {service.version}
                    </div>
                </div>
                <Badge variant={service.status === 'up' ? 'default' : 'destructive'}>
                    {service.status.toUpperCase()}
                </Badge>
            </div>
            
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction(service, 'Start')}
                    disabled={service.status === 'up' || isPerformingAction === getActionId('Start')}
                >
                    {isPerformingAction === getActionId('Start') ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <Play className="w-3 h-3" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction(service, 'Stop')}
                    disabled={service.status === 'down' || isPerformingAction === getActionId('Stop')}
                >
                    {isPerformingAction === getActionId('Stop') ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <Square className="w-3 h-3" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction(service, 'Restart')}
                    disabled={isPerformingAction === getActionId('Restart')}
                >
                    {isPerformingAction === getActionId('Restart') ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <RotateCcw className="w-3 h-3" />
                    )}
                </Button>
            </div>
        </motion.div>
    );
}