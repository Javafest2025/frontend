"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { authorsApi, type Author } from "@/lib/api/project-service/authors"
import {
    Building,
    Mail,
    ExternalLink,
    GraduationCap,
    RefreshCw,
    Clock,
    FileText,
    TrendingUp,
    Calendar,
    AlertTriangle,
    Star,
    Award,
    Users,
    Globe,
    Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthorDialogProps {
    readonly authorName: string
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
}

export function AuthorDialog({ authorName, open, onOpenChange }: AuthorDialogProps) {
    const [author, setAuthor] = useState<Author | null>(null)
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showHIndexWarning, setShowHIndexWarning] = useState(false)
    const [expandedSections, setExpandedSections] = useState<{
        researchAreas: boolean
        affiliations: boolean
        publications: boolean
    }>({
        researchAreas: false,
        affiliations: false,
        publications: false
    })
    const { toast } = useToast()

    useEffect(() => {
        if (open && authorName) {
            loadAuthor(authorName)
        }
    }, [open, authorName])

    const loadAuthor = async (name: string) => {
        try {
            setLoading(true)
            setError(null)
            const authorData = await authorsApi.getAuthorByName(name)
            setAuthor(authorData)
        } catch (err) {
            console.error("Error loading author:", err)
            setError(err instanceof Error ? err.message : "Failed to load author")
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async () => {
        if (!author) return

        try {
            setSyncing(true)

            // Use the new resync endpoint
            const updatedAuthor = await authorsApi.resyncAuthor(author.name, "comprehensive")

            setAuthor(updatedAuthor)
            toast({
                title: "Author data resynced",
                description: "Latest information has been fetched from external sources",
            })
        } catch (err) {
            console.error("Error resyncing author:", err)
            toast({
                title: "Resync failed",
                description: err instanceof Error ? err.message : "Failed to resync author data",
                variant: "destructive"
            })
        } finally {
            setSyncing(false)
        }
    }

    const getInitials = (name: string) => {
        if (!name) return "AU"
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }


    const formatDate = (dateString?: string) => {
        if (!dateString) return "Unknown"
        try {
            return new Date(dateString).toLocaleDateString()
        } catch {
            return dateString
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[85vh] bg-background/60 backdrop-blur-2xl border-2 border-primary/40 shadow-2xl shadow-primary/20 ring-1 ring-primary/20">
                {/* Enhanced glassy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 via-transparent to-purple-500/5 rounded-lg" />

                <DialogHeader className="relative space-y-2 pb-3 pr-12">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary shadow-lg">
                                <Users className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                Author Profile
                            </DialogTitle>
                        </div>
                        <div className="flex items-center gap-3 mr-2">
                            {(author || loading) && (
                                <Button
                                    onClick={handleSync}
                                    disabled={syncing || loading}
                                    size="sm"
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <RefreshCw className={cn("h-4 w-4", (syncing || loading) && "animate-spin")} />
                                    {loading ? "Collecting author data..." : syncing ? "Resyncing..." : "Resync Data"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-6 relative">
                        {/* Animated Loading Header */}
                        <div className="relative p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse rounded-2xl" />
                            <div className="relative flex items-start gap-4">
                                <div className="relative">
                                    <Skeleton className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 ring-4 ring-primary/30 shadow-2xl" />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-background animate-pulse" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-6 w-48 bg-gradient-to-r from-primary/20 to-primary/40 rounded" />
                                    <Skeleton className="h-4 w-64 bg-gradient-to-r from-muted/30 to-muted/50 rounded" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg" />
                                        <Skeleton className="h-6 w-20 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Animated Loading Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <div className="relative p-4 text-center">
                                        <Skeleton className="h-5 w-5 mx-auto mb-2 bg-gradient-to-br from-primary/30 to-primary/50 rounded" />
                                        <Skeleton className="h-8 w-16 mx-auto mb-1 bg-gradient-to-br from-primary/20 to-primary/40 rounded" />
                                        <Skeleton className="h-3 w-12 mx-auto bg-gradient-to-br from-muted/30 to-muted/50 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Animated Loading Content Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <div className="relative p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/40" />
                                            <Skeleton className="h-4 w-24 bg-gradient-to-r from-purple-500/20 to-purple-600/40 rounded" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[1, 2, 3].map((i) => (
                                                <Skeleton key={i} className="h-6 w-20 bg-gradient-to-br from-purple-500/20 to-purple-600/40 rounded-full" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <div className="relative p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-600/40" />
                                            <Skeleton className="h-4 w-20 bg-gradient-to-r from-teal-500/20 to-teal-600/40 rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Skeleton className="w-1 h-1 bg-teal-500 rounded-full" />
                                                    <Skeleton className="h-3 flex-1 bg-gradient-to-r from-teal-500/20 to-teal-600/40 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <div className="relative p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/40" />
                                            <Skeleton className="h-4 w-32 bg-gradient-to-r from-indigo-500/20 to-indigo-600/40 rounded" />
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2].map((i) => (
                                                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                                                    <Skeleton className="h-4 w-full mb-2 bg-gradient-to-r from-indigo-500/20 to-indigo-600/40 rounded" />
                                                    <div className="flex gap-2">
                                                        <Skeleton className="h-3 w-16 bg-gradient-to-r from-muted/30 to-muted/50 rounded" />
                                                        <Skeleton className="h-3 w-12 bg-gradient-to-r from-muted/30 to-muted/50 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <div className="relative p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/40" />
                                            <Skeleton className="h-4 w-28 bg-gradient-to-r from-orange-500/20 to-orange-600/40 rounded" />
                                        </div>
                                        <Skeleton className="h-4 w-24 bg-gradient-to-r from-orange-500/20 to-orange-600/40 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center relative">
                        <div className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 mb-6">
                            <AlertTriangle className="h-12 w-12 text-red-400" />
                        </div>
                        <div className="text-gray-300 mb-4 text-lg font-medium">
                            Failed to load author information
                        </div>
                        <p className="text-sm text-red-400 mb-6 max-w-md">{error}</p>
                        <Button
                            onClick={() => loadAuthor(authorName)}
                            size="lg"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg"
                        >
                            Try Again
                        </Button>
                    </div>
                ) : author ? (
                    <div className="space-y-3 relative">
                        {/* Header Section with Glassmorphism */}
                        <div className="relative p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
                            <div className="relative flex items-start gap-4">
                                <div className="relative">
                                    <Avatar className="h-14 w-14 ring-3 ring-primary/30 shadow-xl">
                                        <AvatarImage src={author.profileImageUrl} alt={author.name} />
                                        <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                                            {getInitials(author.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                                        <Star className="h-2 w-2 text-primary-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">
                                            {author.name}
                                        </h2>
                                        {author.primaryAffiliation && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                <Building className="h-2.5 w-2.5 text-primary" />
                                                {author.primaryAffiliation}
                                            </p>
                                        )}
                                    </div>

                                    {/* Contact Info with Hover Effects */}
                                    <div className="flex flex-wrap gap-1.5 text-xs">
                                        {author.email && (
                                            <a
                                                href={`mailto:${author.email}`}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border text-primary hover:text-primary/80 transition-all duration-300 group"
                                            >
                                                <Mail className="h-2.5 w-2.5 group-hover:scale-110 transition-transform" />
                                                Email
                                            </a>
                                        )}
                                        {author.homepageUrl && (
                                            <a
                                                href={author.homepageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border text-primary hover:text-primary/80 transition-all duration-300 group"
                                            >
                                                <ExternalLink className="h-2.5 w-2.5 group-hover:scale-110 transition-transform" />
                                                Homepage
                                            </a>
                                        )}
                                        {author.orcidId && (
                                            <a
                                                href={`https://orcid.org/${author.orcidId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border text-primary hover:text-primary/80 transition-all duration-300 group"
                                            >
                                                <GraduationCap className="h-2.5 w-2.5 group-hover:scale-110 transition-transform" />
                                                ORCID
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid with Stunning Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-border transition-all duration-300 group">
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="relative p-3 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1.5">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="text-xl font-bold text-blue-400">
                                        {author.paperCount !== undefined ? author.paperCount.toLocaleString() : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">Papers</div>
                                </CardContent>
                            </Card>
                            <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-border transition-all duration-300 group">
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="relative p-3 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1.5">
                                        <Award className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div className="text-xl font-bold text-emerald-400">
                                        {author.citationCount !== undefined ? author.citationCount.toLocaleString() : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">Citations</div>
                                </CardContent>
                            </Card>
                            <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-border transition-all duration-300 group">
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="relative p-3 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1.5">
                                        <TrendingUp className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="text-xl font-bold text-amber-400">
                                            {author.hIndex ?? "N/A"}
                                        </div>
                                        {author.hIndex === undefined && (
                                            <button
                                                onClick={() => setShowHIndexWarning(!showHIndexWarning)}
                                                className="text-amber-500 hover:text-amber-400 transition-colors"
                                                title="H-index not available"
                                            >
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">H-Index</div>
                                    {showHIndexWarning && author.hIndex === undefined && (
                                        <div className="text-xs text-amber-500 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                            H-index not available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Two Column Layout with Enhanced Cards */}
                        <div className="grid md:grid-cols-2 gap-3">
                            {/* Left Column */}
                            <div className="space-y-2.5">
                                {/* Research Areas */}
                                <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardContent className="relative p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-purple-500/20">
                                                <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                                            </div>
                                            <h3 className="font-semibold text-foreground text-sm">Research Areas</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {author.researchAreas && author.researchAreas.length > 0 ? (
                                                <>
                                                    {author.researchAreas.slice(0, expandedSections.researchAreas ? undefined : 4).map((area) => (
                                                        <Badge
                                                            key={area}
                                                            className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/30 hover:scale-105 hover:shadow-sm transition-all duration-300 cursor-pointer"
                                                        >
                                                            {area}
                                                        </Badge>
                                                    ))}
                                                    {author.researchAreas.length > 4 && !expandedSections.researchAreas && (
                                                        <button
                                                            onClick={() => setExpandedSections(prev => ({ ...prev, researchAreas: true }))}
                                                            className="bg-muted/50 text-muted-foreground border border-border/50 px-2 py-1 rounded-md text-xs hover:bg-muted transition-colors"
                                                        >
                                                            +{author.researchAreas.length - 4} more
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                                    N/A
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Affiliations */}
                                <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.01] transition-all duration-300 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardContent className="relative p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-teal-500/20">
                                                <Building className="h-3.5 w-3.5 text-teal-500" />
                                            </div>
                                            <h3 className="font-semibold text-foreground text-sm">Affiliations</h3>
                                        </div>
                                        <div className="space-y-1.5 max-h-20 overflow-y-auto">
                                            {author.allAffiliations && author.allAffiliations.length > 0 ? (
                                                <>
                                                    {author.allAffiliations.slice(0, expandedSections.affiliations ? undefined : 3).map((affiliation) => (
                                                        <div key={affiliation} className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-teal-500 rounded-full" />
                                                            {affiliation}
                                                        </div>
                                                    ))}
                                                    {author.allAffiliations.length > 3 && !expandedSections.affiliations && (
                                                        <button
                                                            onClick={() => setExpandedSections(prev => ({ ...prev, affiliations: true }))}
                                                            className="text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors"
                                                        >
                                                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                                            +{author.allAffiliations.length - 3} more affiliations
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                                    N/A
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2.5">
                                {/* Publication Timeline */}
                                <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.01] transition-all duration-300 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardContent className="relative p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-orange-500/20">
                                                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                            </div>
                                            <h3 className="font-semibold text-foreground text-sm">Publication Timeline</h3>
                                        </div>
                                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                            {(() => {
                                                if (author.firstPublicationYear && author.lastPublicationYear) {
                                                    return `${author.firstPublicationYear} - ${author.lastPublicationYear}`
                                                }
                                                if (author.firstPublicationYear) {
                                                    return `Since ${author.firstPublicationYear}`
                                                }
                                                if (author.lastPublicationYear) {
                                                    return `Until ${author.lastPublicationYear}`
                                                }
                                                return "N/A"
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Publications */}
                                <Card className="relative overflow-hidden bg-card/50 border border-border/50 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.01] transition-all duration-300 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardContent className="relative p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-indigo-500/20">
                                                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                            </div>
                                            <h3 className="font-semibold text-foreground text-sm">Recent Publications</h3>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {author.recentPublications && author.recentPublications.length > 0 ? (
                                                <>
                                                    {author.recentPublications.slice(0, expandedSections.publications ? undefined : 3).map((paper: any) => (
                                                        <div key={`${paper.title}-${paper.year}`} className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
                                                            <div className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                                                {paper.title || "Untitled Paper"}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                {paper.journal && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Globe className="h-3 w-3" />
                                                                        {paper.journal}
                                                                    </span>
                                                                )}
                                                                {paper.year && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {paper.year}
                                                                    </span>
                                                                )}
                                                                {paper.citations && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Award className="h-3 w-3" />
                                                                        {paper.citations} citations
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {author.recentPublications.length > 3 && !expandedSections.publications && (
                                                        <button
                                                            onClick={() => setExpandedSections(prev => ({ ...prev, publications: true }))}
                                                            className="text-sm text-muted-foreground flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/30 transition-colors w-full"
                                                        >
                                                            <Sparkles className="h-3 w-3" />
                                                            +{author.recentPublications.length - 3} more publications
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                                    N/A
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Footer Info with Enhanced Styling */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-600/30">
                            {/* Data Sources */}
                            {author.dataSources && author.dataSources.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 font-medium">Sources:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {author.dataSources.map((source) => (
                                            <Badge
                                                key={source}
                                                className="bg-gradient-to-r from-slate-600/50 to-slate-500/50 text-gray-300 border border-slate-500/50 hover:border-slate-400/50 transition-all duration-300"
                                            >
                                                {source}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Last Sync */}
                            {author.lastSyncAt && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 bg-slate-800/30 px-3 py-2 rounded-lg border border-slate-600/30">
                                    <Clock className="h-4 w-4 text-blue-400" />
                                    Last synced: {formatDate(author.lastSyncAt)}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
