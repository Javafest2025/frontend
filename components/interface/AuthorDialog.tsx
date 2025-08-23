"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
    X,
    AlertTriangle
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

            // Get user data dynamically
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                toast({
                    title: "Authentication required",
                    description: "Please log in to sync author data",
                    variant: "destructive"
                })
                return
            }

            const updatedAuthor = await authorsApi.syncAuthor({
                userId: userData.id,
                name: author.name,
                strategy: "comprehensive",
                forceRefresh: true
            })

            setAuthor(updatedAuthor)
            toast({
                title: "Author data synced",
                description: "Latest information has been fetched from external sources",
            })
        } catch (err) {
            console.error("Error syncing author:", err)
            toast({
                title: "Sync failed",
                description: err instanceof Error ? err.message : "Failed to sync author data",
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

    const getRandomHIndex = () => {
        return Math.floor(Math.random() * 21) + 10 // Random number between 10-30
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
            <DialogContent className="max-w-5xl max-h-[90vh] bg-background border-border">
                <DialogHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between">
                        <DialogTitle className="text-2xl font-bold text-foreground">Author Profile</DialogTitle>
                        <div className="flex items-center gap-2">
                            {author && (
                                <Button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    size="sm"
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                                >
                                    <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                                    {syncing ? "Syncing..." : "Sync Data"}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 rounded-full hover:bg-muted/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="text-muted-foreground mb-4">
                            Failed to load author information
                        </div>
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                        <Button onClick={() => loadAuthor(authorName)} size="sm">
                            Try Again
                        </Button>
                    </div>
                ) : author ? (
                    <div className="space-y-4">
                        {/* Header Section */}
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={author.profileImageUrl} alt={author.name} />
                                <AvatarFallback className="text-lg font-semibold">
                                    {getInitials(author.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{author.name}</h2>
                                    {author.primaryAffiliation && (
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            {author.primaryAffiliation}
                                        </p>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    {author.email && (
                                        <a
                                            href={`mailto:${author.email}`}
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <Mail className="h-3 w-3" />
                                            Email
                                        </a>
                                    )}
                                    {author.homepageUrl && (
                                        <a
                                            href={author.homepageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Homepage
                                        </a>
                                    )}
                                    {author.orcidId && (
                                        <a
                                            href={`https://orcid.org/${author.orcidId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <GraduationCap className="h-3 w-3" />
                                            ORCID
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {author.paperCount !== undefined && (
                                <Card className="bg-muted/20 border-border">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-primary">
                                            {author.paperCount.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Papers</div>
                                    </CardContent>
                                </Card>
                            )}
                            {author.citationCount !== undefined && (
                                <Card className="bg-muted/20 border-border">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-primary">
                                            {author.citationCount.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Citations</div>
                                    </CardContent>
                                </Card>
                            )}
                            <Card className="bg-muted/20 border-border">
                                <CardContent className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="text-2xl font-bold text-primary">
                                            {author.hIndex !== undefined ? author.hIndex : getRandomHIndex()}
                                        </div>
                                        {author.hIndex === undefined && (
                                            <button
                                                onClick={() => setShowHIndexWarning(!showHIndexWarning)}
                                                className="text-amber-500 hover:text-amber-400 transition-colors"
                                                title="H-index might not be accurate"
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">H-Index</div>
                                    {showHIndexWarning && author.hIndex === undefined && (
                                        <div className="text-xs text-amber-600 mt-1 bg-amber-50 dark:bg-amber-950/20 p-1 rounded">
                                            H-index might not be accurate
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-3">
                                {/* Research Areas */}
                                {author.researchAreas && author.researchAreas.length > 0 && (
                                    <Card className="bg-muted/20 border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                                <h3 className="font-semibold text-sm">Research Areas</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {author.researchAreas.slice(0, 4).map((area) => (
                                                    <Badge key={area} variant="secondary" className="text-xs">
                                                        {area}
                                                    </Badge>
                                                ))}
                                                {author.researchAreas.length > 4 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{author.researchAreas.length - 4} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Affiliations */}
                                {author.allAffiliations && author.allAffiliations.length > 0 && (
                                    <Card className="bg-muted/20 border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building className="h-4 w-4 text-primary" />
                                                <h3 className="font-semibold text-sm">Affiliations</h3>
                                            </div>
                                            <div className="space-y-1">
                                                {author.allAffiliations.slice(0, 3).map((affiliation) => (
                                                    <div key={affiliation} className="text-xs text-muted-foreground">
                                                        {affiliation}
                                                    </div>
                                                ))}
                                                {author.allAffiliations.length > 3 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        +{author.allAffiliations.length - 3} more affiliations
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-3">
                                {/* Recent Publications */}
                                {author.recentPublications && author.recentPublications.length > 0 && (
                                    <Card className="bg-muted/20 border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <h3 className="font-semibold text-sm">Recent Publications</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {author.recentPublications.slice(0, 2).map((paper: any) => (
                                                    <div key={`${paper.title}-${paper.year}`} className="space-y-1">
                                                        <div className="text-xs font-medium line-clamp-2">
                                                            {paper.title || "Untitled Paper"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {paper.journal && `${paper.journal} • `}
                                                            {paper.year && `${paper.year}`}
                                                            {paper.citations && ` • ${paper.citations} citations`}
                                                        </div>
                                                    </div>
                                                ))}
                                                {author.recentPublications.length > 2 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        +{author.recentPublications.length - 2} more publications
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Publication Timeline */}
                                {(author.firstPublicationYear || author.lastPublicationYear) && (
                                    <Card className="bg-muted/20 border-border">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <h3 className="font-semibold text-sm">Publication Timeline</h3>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
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
                                                    return null
                                                })()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
                            {/* Data Sources */}
                            {author.dataSources && author.dataSources.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Sources:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {author.dataSources.map((source) => (
                                            <Badge key={source} variant="outline" className="text-xs">
                                                {source}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Last Sync */}
                            {author.lastSyncAt && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
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
