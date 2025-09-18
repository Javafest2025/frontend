'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    FileText, 
    Search, 
    Filter, 
    Trash2, 
    Download,
    Info,
    AlertTriangle,
    XCircle,
    Bug
} from 'lucide-react';
import { ServiceLogs, getServiceLogs } from '@/lib/api/admin/service-health';

interface ServiceLogsViewerProps {
    className?: string;
}

const levelColors = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    debug: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const levelIcons = {
    info: Info,
    warn: AlertTriangle,
    error: XCircle,
    debug: Bug
};

export function ServiceLogsViewer({ className }: ServiceLogsViewerProps) {
    const [logs, setLogs] = useState<ServiceLogs[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ServiceLogs[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Load logs
    useEffect(() => {
        const loadLogs = () => {
            setIsLoading(true);
            const newLogs = getServiceLogs(100);
            setLogs(newLogs);
            setIsLoading(false);
        };

        loadLogs();
        
        // Auto-refresh logs every 5 seconds
        const interval = setInterval(loadLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    // Filter logs
    useEffect(() => {
        let filtered = logs;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log => 
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.service.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by service
        if (selectedService !== 'all') {
            filtered = filtered.filter(log => log.service === selectedService);
        }

        // Filter by level
        if (selectedLevel !== 'all') {
            filtered = filtered.filter(log => log.level === selectedLevel);
        }

        setFilteredLogs(filtered);
    }, [logs, searchTerm, selectedService, selectedLevel]);

    const uniqueServices = Array.from(new Set(logs.map(log => log.service)));

    const clearLogs = () => {
        setLogs([]);
        setFilteredLogs([]);
    };

    const exportLogs = () => {
        const logText = filteredLogs.map(log => 
            `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.service}: ${log.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <CardTitle>Service Logs</CardTitle>
                        <Badge variant="secondary">{filteredLogs.length} entries</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportLogs}
                            disabled={filteredLogs.length === 0}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearLogs}
                            disabled={logs.length === 0}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear
                        </Button>
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Service" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {uniqueServices.map(service => (
                                <SelectItem key={service} value={service}>
                                    {service}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-96">
                    <div className="p-4 space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="ml-2 text-sm text-muted-foreground">Loading logs...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No logs found</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredLogs.map((log, index) => {
                                    const LevelIcon = levelIcons[log.level];
                                    return (
                                        <motion.div
                                            key={`${log.timestamp.getTime()}-${index}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, delay: index * 0.02 }}
                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 font-mono text-sm"
                                        >
                                            <span className="text-muted-foreground text-xs mt-0.5 min-w-0 flex-shrink-0">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                            <Badge 
                                                variant="secondary" 
                                                className={`${levelColors[log.level]} text-xs min-w-0 flex-shrink-0`}
                                            >
                                                <LevelIcon className="w-3 h-3 mr-1" />
                                                {log.level.toUpperCase()}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs min-w-0 flex-shrink-0">
                                                {log.service}
                                            </Badge>
                                            <span className="text-foreground min-w-0 flex-1">
                                                {log.message}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}