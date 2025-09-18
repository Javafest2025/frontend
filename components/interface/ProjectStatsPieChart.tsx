"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, BookOpen, MessageSquare, ListTodo, FileText } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ProjectStatsPieChartProps {
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly projectName: string
    readonly stats: {
        readonly totalPapers: number
        readonly totalNotes: number
        readonly totalReadingList: number
        readonly totalDocuments: number
    }
}

const COLORS = [
    "#06b6d4",                  // Cyan for papers
    "#8b5cf6",                  // Purple for notes  
    "#f59e0b",                  // Amber for reading list
    "#10b981",                  // Emerald for documents
]

const ICONS = [
    BookOpen,
    MessageSquare,
    ListTodo,
    FileText
]

const LABELS = [
    "Papers",
    "Notes",
    "Reading List",
    "Documents"
]

// Custom tooltip component
const CustomTooltip = ({ active, payload, total }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <data.icon className="h-5 w-5 text-white" style={{ color: data.color }} />
                    <span className="font-semibold text-white text-lg">{data.name}</span>
                </div>
                <div className="text-sm text-white/80 mb-1">
                    Count: <span className="font-bold text-white">{data.value}</span>
                </div>
                <div className="text-sm text-white/80">
                    Percentage: <span className="font-bold text-white">
                        {((data.value / total) * 100).toFixed(1)}%
                    </span>
                </div>
            </div>
        )
    }
    return null
}

// Custom legend component
const CustomLegend = ({ payload, activeIndex, setActiveIndex }: any) => {
    return (
        <div className="flex flex-wrap justify-center gap-6">
            {payload.map((entry: any, index: number) => {
                const IconComponent = ICONS[index]
                return (
                    <motion.div
                        key={entry.value}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    >
                        <div
                            className="w-4 h-4 rounded-full shadow-lg"
                            style={{
                                backgroundColor: entry.color,
                                boxShadow: `0 0 15px ${entry.color}60`
                            }}
                        />
                        <IconComponent className="h-5 w-5 text-white/80 group-hover:text-white transition-colors duration-300" />
                        <span className="text-base font-semibold text-white">{entry.value}</span>
                        <span className="text-sm text-white/70 font-medium">({entry.payload.value})</span>
                    </motion.div>
                )
            })}
        </div>
    )
}

export function ProjectStatsPieChart({ open, onOpenChange, projectName, stats }: ProjectStatsPieChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    // Prepare data for the pie chart
    const data = [
        { name: "Papers", value: stats.totalPapers, icon: BookOpen, color: COLORS[0] },
        { name: "Notes", value: stats.totalNotes, icon: MessageSquare, color: COLORS[1] },
        { name: "Reading List", value: stats.totalReadingList, icon: ListTodo, color: COLORS[2] },
        { name: "Documents", value: stats.totalDocuments, icon: FileText, color: COLORS[3] },
    ].filter(item => item.value > 0) // Only show items with values > 0

    const total = data.reduce((sum, item) => sum + item.value, 0)

    if (total === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md mx-auto bg-background/95 backdrop-blur-xl border border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold text-gradient-primary">
                            {projectName} Statistics
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">
                            No data available yet
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Start adding papers, notes, and documents to see your project statistics.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none w-full h-full max-h-none bg-transparent border-0 shadow-none p-0 m-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>{projectName} Statistics</DialogTitle>
                </DialogHeader>

                {/* Full screen overlay with glassy effect */}
                <div className="fixed inset-0 bg-black/10 backdrop-blur-md z-50" />

                {/* Main dialog content - Full screen glassy container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Glassy content container */}
                    <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-background/20 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        style={{
                            background: `
                                 linear-gradient(135deg, 
                                     rgba(255, 255, 255, 0.1) 0%, 
                                     rgba(255, 255, 255, 0.05) 50%, 
                                     rgba(255, 255, 255, 0.1) 100%
                                 ),
                                 linear-gradient(45deg, 
                                     rgba(6, 182, 212, 0.1) 0%, 
                                     rgba(139, 92, 246, 0.1) 50%, 
                                     rgba(16, 185, 129, 0.1) 100%
                                 )
                             `,
                            boxShadow: `
                                 0 25px 50px -12px rgba(0, 0, 0, 0.25),
                                 0 0 0 1px rgba(255, 255, 255, 0.1),
                                 inset 0 1px 0 rgba(255, 255, 255, 0.2)
                             `
                        }}
                    >
                        {/* Animated background effects */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 p-8 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                                        {projectName} Statistics
                                    </h2>
                                    <p className="text-white/70 text-lg">
                                        Visual breakdown of your project data
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-10 w-10 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-xl backdrop-blur-sm border border-white/20"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Chart content */}
                        <div className="relative z-10 p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                {/* Enhanced Pie Chart */}
                                <div className="flex justify-center">
                                    <div className="w-96 h-96 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={140}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                                    onMouseLeave={() => setActiveIndex(null)}
                                                >
                                                    {data.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            stroke="rgba(255, 255, 255, 0.2)"
                                                            strokeWidth={3}
                                                            className={cn(
                                                                "transition-all duration-500",
                                                                activeIndex === index && "drop-shadow-2xl"
                                                            )}
                                                            style={{
                                                                filter: activeIndex === index
                                                                    ? `drop-shadow(0 0 20px ${entry.color}) brightness(1.2)`
                                                                    : 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.3))',
                                                                transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                                                transformOrigin: 'center'
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip total={total} />} />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Enhanced center text */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                                                    {total}
                                                </div>
                                                <div className="text-sm text-white/70 font-medium">
                                                    Total Items
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Statistics breakdown */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white mb-6">
                                        Breakdown
                                    </h3>
                                    {data.map((item, index) => {
                                        const percentage = ((item.value / total) * 100).toFixed(1)
                                        const IconComponent = item.icon

                                        return (
                                            <motion.div
                                                key={item.name}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-center justify-between p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-300 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-6 h-6 rounded-full shadow-lg"
                                                        style={{
                                                            backgroundColor: item.color,
                                                            boxShadow: `0 0 20px ${item.color}40`
                                                        }}
                                                    />
                                                    <IconComponent className="h-6 w-6 text-white/80 group-hover:text-white transition-colors duration-300" />
                                                    <span className="font-semibold text-white text-lg">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-white text-xl">{item.value}</div>
                                                    <div className="text-sm text-white/70 font-medium">{percentage}%</div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Enhanced Legend */}
                            <div className="mt-12 px-8">
                                <CustomLegend
                                    payload={data.map((item, index) => ({
                                        value: item.name,
                                        color: item.color,
                                        payload: item
                                    }))}
                                    activeIndex={activeIndex}
                                    setActiveIndex={setActiveIndex}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}