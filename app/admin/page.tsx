'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Database, Shield, Activity, Server, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { ServiceHealthCard } from '@/components/admin/ServiceHealthCard';
import { ServiceGrid } from '@/components/admin/ServiceGrid';
import { SystemStatsGrid } from '@/components/admin/SystemStatsGrid';
import { ServiceLogsViewer } from '@/components/admin/ServiceLogsViewer';
import { AdminControls } from '@/components/admin/AdminControls';
import { getAdminMetrics, type AdminMetrics, type SystemMetrics } from '@/lib/api/user-service/admin';
import { 
    getAllServices, 
    checkServiceHealth,
    type ServiceHealth, 
    type ServiceLogs 
} from '@/lib/api/admin/service-health';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading, clearAuth } = useAuth();
    const { toast } = useToast();
    
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Check admin access
    useEffect(() => {
        console.log('Admin page useEffect triggered');
        console.log('authLoading:', authLoading);
        console.log('isAuthenticated:', isAuthenticated);
        console.log('user:', user);
        console.log('user roles:', user?.roles);
        
        // Don't redirect while auth is still loading
        if (authLoading) {
            console.log('Auth still loading, waiting...');
            return;
        }
        
        if (!isAuthenticated) {
            console.log('User not authenticated, redirecting to login');
            router.replace('/login');
            return;
        }

        const userRole = user?.roles?.[0];
        console.log('User role:', userRole);
        
        if (userRole !== 'ADMIN') {
            console.log('User is not admin, showing access denied');
            toast({
                title: "Access Denied",
                description: "You don't have permission to access the admin dashboard.",
                variant: "destructive",
            });
            router.replace('/interface/home');
            return;
        }
        
        console.log('Admin access granted');
    }, [authLoading, isAuthenticated, user, router, toast]);

    const fetchMetrics = useCallback(async (showToast = false) => {
        try {
            setIsRefreshing(true);
            
            // Fetch metrics and services in parallel
            const [metricsResponse, servicesData] = await Promise.all([
                getAdminMetrics(),
                Promise.all(getAllServices().map(service => checkServiceHealth(service)))
            ]);
            
            setMetrics(metricsResponse);
            setServices(servicesData);
            setLastUpdated(new Date());
            
            if (showToast) {
                toast({
                    title: "Dashboard Updated",
                    description: "All metrics have been refreshed.",
                    variant: "success",
                });
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            toast({
                title: "Update Failed",
                description: "Failed to fetch latest data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [toast]);

    const handleServiceAction = async (service: ServiceHealth, action: string) => {
        console.log(`Performing ${action} on ${service.displayName}`);
        // Refresh data after action
        await fetchMetrics();
    };

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchMetrics(true);
        setIsRefreshing(false);
    }, [fetchMetrics]);

    const toggleAutoRefresh = useCallback(() => {
        setAutoRefresh(prev => !prev);
    }, []);

    const handleLogout = useCallback(() => {
        clearAuth();
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
            variant: "default",
        });
        router.replace('/login');
    }, [clearAuth, toast, router]);

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await fetchMetrics();
            setIsLoading(false);
        };

        if (isAuthenticated && user?.roles?.[0] === 'ADMIN') {
            loadInitialData();
        }
    }, [isAuthenticated, user, fetchMetrics]);

    // Auto-refresh interval
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchMetrics();
        }, 15000); // 15 seconds for more data

        return () => clearInterval(interval);
    }, [autoRefresh, fetchMetrics]);

    // Show loading while auth is loading
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <h1 className="text-xl font-medium text-foreground">Loading...</h1>
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Render access denied if not admin
    if (!isAuthenticated || user?.roles?.[0] !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <AdminHeader
                    lastUpdated={lastUpdated || undefined}
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    autoRefresh={autoRefresh}
                    onToggleAutoRefresh={toggleAutoRefresh}
                    onLogout={handleLogout}
                />

                {/* Enhanced Dashboard with Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="services" className="flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            Services
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Logs
                        </TabsTrigger>
                        <TabsTrigger value="controls" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Controls
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* KPI Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-6"
                        >
                            <AdminKPICard
                                title="Total Users"
                                value={metrics?.userCount?.count || 0}
                                isLoading={isLoading}
                                icon={<Users className="w-5 h-5" />}
                                description="Registered users in the system"
                            />
                            
                            <AdminKPICard
                                title="Active Services"
                                value={services.filter(s => s.status === 'up').length}
                                isLoading={isLoading}
                                icon={<Server className="w-5 h-5" />}
                                description="Services currently operational"
                            />
                            
                            <AdminKPICard
                                title="System Health"
                                value={services.length > 0 ? Math.round((services.filter(s => s.status === 'up').length / services.length) * 100) : 0}
                                isLoading={isLoading}
                                icon={<Shield className="w-5 h-5" />}
                                description="Overall system health percentage"
                            />

                            <AdminKPICard
                                title="Total Requests"
                                value="NaN"
                                isLoading={isLoading}
                                icon={<Activity className="w-5 h-5" />}
                                description="Total API requests processed"
                            />
                        </motion.div>

                        {/* Quick Service Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Service Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <ServiceHealthCard
                                    serviceName="user-service"
                                    health={metrics?.serviceHealth?.userService || null}
                                    isLoading={isLoading}
                                    lastChecked={lastUpdated || undefined}
                                />
                                
                                <ServiceHealthCard
                                    serviceName="project-service"
                                    health={metrics?.serviceHealth?.projectService || null}
                                    isLoading={isLoading}
                                    lastChecked={lastUpdated || undefined}
                                />
                                
                                <ServiceHealthCard
                                    serviceName="api-gateway"
                                    health={{ status: services.find(s => s.name === 'api-gateway')?.status === 'up' ? 'UP' : 'DOWN' }}
                                    isLoading={isLoading}
                                    lastChecked={lastUpdated || undefined}
                                />
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* Services Tab */}
                    <TabsContent value="services" className="space-y-6">
                        <ServiceGrid 
                            services={services} 
                            onServiceClick={(service) => console.log('Service clicked:', service)}
                        />
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-6">
                        {metrics?.systemMetrics && <SystemStatsGrid stats={metrics.systemMetrics} />}
                    </TabsContent>

                    {/* Logs Tab */}
                    <TabsContent value="logs" className="space-y-6">
                        <ServiceLogsViewer />
                    </TabsContent>

                    {/* Controls Tab */}
                    <TabsContent value="controls" className="space-y-6">
                        <AdminControls 
                            services={services}
                            onServiceAction={handleServiceAction}
                        />
                    </TabsContent>
                </Tabs>

                {/* Auto-refresh indicator */}
                {autoRefresh && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="fixed bottom-4 right-4 bg-primary/10 text-primary text-xs px-3 py-2 rounded-full border border-primary/20"
                    >
                        Auto-refreshing every 15s
                    </motion.div>
                )}
            </div>
        </div>
    );
}