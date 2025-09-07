import { Shimmer, ShimmerText, ShimmerBadge } from "@/components/ui/shimmer"
import {
    Brain,
    Zap,
    Award,
    Microscope,
    Target,
    AlertTriangle,
    ListChecks,
    BookOpen,
    TrendingUp,
    BarChart3,
    Database,
    Settings,
    RefreshCw,
    Shield,
    Cpu,
    Lightbulb,
    CheckCircle
} from "lucide-react"

export function SummaryShimmer() {
    // Generate unique keys for shimmer items
    const generateKey = (prefix: string, index: number) => `${prefix}-shimmer-${index}-${Math.random().toString(36).substring(2, 11)}`

    return (
        <div className="space-y-8">
            {/* Clean Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Brain className="h-8 w-8 text-blue-500 animate-pulse" />
                    <Shimmer className="h-8 w-48 rounded" />
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto animate-pulse" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Main Summary */}
                <div className="xl:col-span-2 space-y-6">
                    {/* One-Liner Section */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Zap className="h-5 w-5 text-cyan-500" />
                            <Shimmer className="h-6 w-24 rounded" />
                        </div>
                        <div className="relative bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
                            <ShimmerText lines={2} width="w-full" />
                        </div>
                    </div>

                    {/* Key Contributions Section */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Award className="h-5 w-5 text-orange-500" />
                            <Shimmer className="h-6 w-36 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={generateKey('contribution', index)} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                    <Shimmer className="h-6 w-6 rounded-full flex-shrink-0" />
                                    <ShimmerText lines={1} width="w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Method Overview Section */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Microscope className="h-5 w-5 text-lime-500" />
                            <Shimmer className="h-6 w-32 rounded" />
                        </div>
                        <div className="relative bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
                            <ShimmerText lines={3} width="w-full" />
                        </div>
                    </div>

                    {/* Applicability Section */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-yellow-500" />
                            <Shimmer className="h-6 w-28 rounded" />
                        </div>
                        <div className="relative space-y-2">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={generateKey('applicability', index)} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                    <Shimmer className="h-5 w-5 rounded-full flex-shrink-0" />
                                    <ShimmerText lines={1} width="w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Limitations & Future Work */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                            <div className="relative flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <Shimmer className="h-6 w-24 rounded" />
                            </div>
                            <div className="relative space-y-3">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <div key={generateKey('limitation', index)} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                        <Shimmer className="h-5 w-5 rounded-full flex-shrink-0" />
                                        <ShimmerText lines={1} width="w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                            <div className="relative flex items-center gap-2 mb-4">
                                <ListChecks className="h-5 w-5 text-cyan-500" />
                                <Shimmer className="h-6 w-28 rounded" />
                            </div>
                            <div className="relative space-y-3">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <div key={generateKey('future-work', index)} className="flex items-start gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                        <Shimmer className="h-5 w-5 rounded-full flex-shrink-0" />
                                        <ShimmerText lines={1} width="w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Works */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            <Shimmer className="h-6 w-32 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={generateKey('related-work', index)} className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Shimmer className="h-4 w-16 rounded mb-1" />
                                            <ShimmerText lines={1} width="w-3/4" />
                                        </div>
                                        <div>
                                            <Shimmer className="h-4 w-12 rounded mb-1" />
                                            <ShimmerText lines={1} width="w-1/4" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Shimmer className="h-4 w-20 rounded mb-1" />
                                            <ShimmerText lines={2} width="w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar Info */}
                <div className="space-y-6">
                    {/* Study Type */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-violet-500" />
                            <Shimmer className="h-5 w-32 rounded" />
                        </div>
                        <div className="relative flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                            <Shimmer className="h-4 w-20 rounded" />
                            <ShimmerBadge />
                        </div>
                    </div>

                    {/* Main Findings */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-yellow-500" />
                            <Shimmer className="h-5 w-28 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={generateKey('finding', index)} className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <Shimmer className="h-3 w-12 rounded mb-1" />
                                            <ShimmerText lines={1} width="w-3/4" />
                                        </div>
                                        <div>
                                            <Shimmer className="h-3 w-16 rounded mb-1" />
                                            <ShimmerText lines={1} width="w-1/2" />
                                        </div>
                                        <div className="col-span-2">
                                            <Shimmer className="h-3 w-14 rounded mb-1" />
                                            <ShimmerText lines={1} width="w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Research Questions */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Lightbulb className="h-5 w-5 text-indigo-500" />
                            <Shimmer className="h-5 w-36 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={generateKey('question', index)} className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                    <ShimmerText lines={1} width="w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Datasets */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-emerald-500" />
                            <Shimmer className="h-5 w-20 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={generateKey('dataset', index)} className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg backdrop-blur-sm">
                                    <Shimmer className="h-4 w-24 rounded mb-1" />
                                    <Shimmer className="h-3 w-16 rounded mb-2" />
                                    <ShimmerText lines={1} width="w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            <Shimmer className="h-5 w-36 rounded" />
                        </div>
                        <div className="relative bg-white/30 dark:bg-gray-800/30 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Cpu className="h-4 w-4 text-indigo-500" />
                                <Shimmer className="h-4 w-24 rounded" />
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <Shimmer className="h-3 w-20 rounded mb-1" />
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <ShimmerBadge />
                                        <ShimmerBadge />
                                        <ShimmerBadge />
                                    </div>
                                </div>
                                <div>
                                    <Shimmer className="h-3 w-16 rounded mb-1" />
                                    <ShimmerText lines={1} width="w-1/3" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reproducibility */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <RefreshCw className="h-5 w-5 text-lime-500" />
                            <Shimmer className="h-5 w-32 rounded" />
                        </div>
                        <div className="relative bg-white/30 dark:bg-gray-800/30 rounded-lg p-3 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Shimmer className="h-4 w-12 rounded" />
                                <Shimmer className="h-6 w-12 rounded" />
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <Shimmer className="h-2 w-3/4 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Ethics */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                        <div className="relative flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-gray-500" />
                            <Shimmer className="h-5 w-40 rounded" />
                        </div>
                        <div className="relative space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={generateKey('ethics', index)} className="flex items-center gap-2">
                                    <Shimmer className="h-4 w-4 rounded-full" />
                                    <Shimmer className="h-4 w-24 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality & Trust Section */}
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-background/80 to-primary/10 backdrop-blur-xl p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                <div className="relative flex items-center gap-2 mb-6">
                    <CheckCircle className="h-6 w-6 text-cyan-500" />
                    <Shimmer className="h-6 w-36 rounded" />
                </div>
                <div className="relative space-y-6">
                    {/* Overall Confidence & Validation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={generateKey('quality', index)} className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shimmer className="h-5 w-5 rounded" />
                                    <Shimmer className="h-5 w-24 rounded" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                        <Shimmer className="h-4 w-3/4 rounded-full" />
                                    </div>
                                    <Shimmer className="h-8 w-12 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Evidence Anchors Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-cyan-500" />
                            <Shimmer className="h-5 w-40 rounded" />
                        </div>
                        <div className="bg-white/30 dark:bg-gray-800/30 rounded-lg overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <Shimmer className="h-4 w-12 rounded" />
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <Shimmer className="h-4 w-12 rounded" />
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <Shimmer className="h-4 w-20 rounded" />
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                <Shimmer className="h-4 w-16 rounded" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <tr key={generateKey('anchor', index)}>
                                                <td className="px-4 py-3">
                                                    <ShimmerText lines={1} width="w-16" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ShimmerText lines={1} width="w-8" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ShimmerText lines={1} width="w-12" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ShimmerText lines={1} width="w-20" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}