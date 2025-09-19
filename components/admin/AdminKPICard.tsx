import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";

interface AdminKPICardProps {
    title: string;
    value: number | string;
    isLoading: boolean;
    icon: React.ReactNode;
    description?: string;
}

export function AdminKPICard({ title, value, isLoading, icon, description }: AdminKPICardProps) {
    return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-border transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                        {description && <div className="h-4 w-32 bg-muted animate-pulse rounded" />}
                    </div>
                ) : (
                    <div className="space-y-1">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 100,
                                delay: 0.1
                            }}
                            className="text-2xl font-bold text-foreground"
                        >
                            <CountUpNumber value={value} />
                        </motion.div>
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface CountUpNumberProps {
    value: number | string;
}

function CountUpNumber({ value }: CountUpNumberProps) {
    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                }}
            >
                {typeof value === 'string' ? value : value.toLocaleString()}
            </motion.span>
        </motion.span>
    );
}