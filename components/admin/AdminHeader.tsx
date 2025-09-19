import { motion } from "framer-motion";
import { RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
    lastUpdated?: Date;
    isRefreshing: boolean;
    onRefresh: () => void;
    autoRefresh: boolean;
    onToggleAutoRefresh: () => void;
    onLogout: () => void;
}

export function AdminHeader({ 
    lastUpdated, 
    isRefreshing, 
    onRefresh, 
    autoRefresh, 
    onToggleAutoRefresh,
    onLogout
}: AdminHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                {lastUpdated && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center gap-3"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Auto-refresh:</span>
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={onToggleAutoRefresh}
                        className="text-xs px-3 py-1"
                    >
                        {autoRefresh ? "ON" : "OFF"}
                    </Button>
                </div>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onLogout}
                    className="flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </motion.div>
        </div>
    );
}