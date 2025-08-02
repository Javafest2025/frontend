"use client"

import { useState, useEffect, useMemo } from "react"
import { isAuthenticated } from "@/lib/api/auth"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  GraduationCap,
  Search,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  BookOpen,
  FileText,
  Globe,
  Target,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { format, formatDistance, parseISO } from "date-fns"
import { getAllPaperCalls, syncPaperCalls } from "@/lib/api/papercall"

interface PaperCall {
  title: string
  link: string
  type: string
  source: string
  whenHeld: string
  whereHeld: string
  deadline: string
  description: string
  domain: string
  createdAt: string
}

interface PaperCallStatistics {
  domain: string
  totalCalls: number
  conferences: number
  journals: number
  sources: Record<string, number>
  timestamp: string
}

export function PaperCallContent() {
  const [paperCalls, setPaperCalls] = useState<PaperCall[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [domain, setDomain] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")

  // Load data on page load with delay and authentication check
  useEffect(() => {
    const loadDataWithDelay = async () => {
      // Wait for authentication to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if user is authenticated
      if (isAuthenticated()) {
        console.log("✅ User is authenticated, loading paper calls")
        await handleGetAllPaperCalls()
      } else {
        console.log("❌ User not authenticated, skipping data load")
      }
    }

    loadDataWithDelay()
  }, [])

  // Filter paper calls based on search and filters
  const filteredPaperCalls = useMemo(() => {
    return paperCalls.filter(call => {
      const matchesSearch = searchTerm === "" ||
        call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.description && call.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        call.source.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = selectedType === "all" || call.type.toLowerCase() === selectedType.toLowerCase()
      const matchesSource = selectedSource === "all" || call.source.toLowerCase() === selectedSource.toLowerCase()

      return matchesSearch && matchesType && matchesSource
    }).sort((a, b) => {
      // Sort by deadline if available, otherwise by creation date
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      // Handle null createdAt values
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })
  }, [paperCalls, searchTerm, selectedType, selectedSource])

  // Sync paper calls from backend
  // Get all paper calls (load on page load)
  const handleGetAllPaperCalls = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Getting all paper calls")

      const data = await getAllPaperCalls()
      console.log("📊 API Response:", data)

      // Handle direct array response
      const paperCallsArray = Array.isArray(data) ? data : []
      setPaperCalls(paperCallsArray)
      console.log("✅ Data set to state:", paperCallsArray)

    } catch (error) {
      console.error("❌ Error:", error)
      toast.error("Failed to fetch all paper calls")
    } finally {
      setIsLoading(false)
    }
  }

  // Sync paper calls from backend
  const handleSyncPaperCalls = async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain")
      return
    }

    setIsSyncing(true)
    try {
      console.log("🔄 Calling sync API for domain:", domain)

      const data = await syncPaperCalls(domain)
      console.log("📊 API Response:", data)

      // Ensure we always set an array
      const paperCallsArray = Array.isArray(data) ? data : []
      setPaperCalls(paperCallsArray)
      console.log("✅ Data set to state:", paperCallsArray)

    } catch (error) {
      console.error("❌ Error:", error)
      toast.error("Failed to fetch data")
    } finally {
      setIsSyncing(false)
    }
  }





  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'conference':
        return <Calendar className="h-4 w-4" />
      case 'journal':
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'conference':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'journal':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get deadline status
  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { status: 'no-deadline', color: 'text-gray-500', label: 'No Deadline' }

    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'expired', color: 'text-red-500', label: 'Expired' }
    } else if (diffDays <= 7) {
      return { status: 'urgent', color: 'text-orange-500', label: 'Urgent' }
    } else if (diffDays <= 30) {
      return { status: 'soon', color: 'text-yellow-500', label: 'Soon' }
    } else {
      return { status: 'upcoming', color: 'text-green-500', label: 'Upcoming' }
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-primary/10 bg-background/40 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                PaperCall
              </h1>
              <p className="text-muted-foreground mt-1">
                Academic deadlines, research opportunities, and paper submissions
              </p>
            </div>


          </div>

          {/* Domain Input and Search */}
          <div className="mt-6 space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="domain" className="text-sm font-medium mb-2 block">
                  Research Domain
                </Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., machine learning, computer vision, NLP..."
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSyncPaperCalls}
                disabled={isSyncing || !domain.trim()}
                className="bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Syncing...' : 'Search'}
              </Button>
              <Button
                onClick={handleGetAllPaperCalls}
                disabled={isLoading}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Loading...' : 'Get All'}
              </Button>
            </div>

            {/* Filters */}
            {paperCalls.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search paper calls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-primary/20 rounded-md bg-background/80 text-foreground hover:border-primary/40 transition-colors"
                >
                  <option value="all">All Types</option>
                  <option value="conference">Conference</option>
                  <option value="journal">Journal</option>
                </select>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-3 py-2 border border-primary/20 rounded-md bg-background/80 text-foreground hover:border-primary/40 transition-colors"
                >
                  <option value="all">All Sources</option>
                  <option value="wikicfp">WikiCFP</option>
                  <option value="mdpi">MDPI</option>
                  <option value="springer">Springer</option>
                  <option value="crossref">CrossRef</option>
                </select>
              </div>
            )}


          </div>
        </div>
      </motion.div>

      {/* Paper Calls List */}
      <div className="relative z-10 container mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {isSyncing ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (!Array.isArray(filteredPaperCalls) || filteredPaperCalls.length === 0) ? (
              <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                <CardContent className="p-12 text-center">
                  <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {paperCalls.length === 0 ? "No Paper Calls Found" : "No Matching Results"}
                  </h3>
                  <p className="text-muted-foreground">
                    {paperCalls.length === 0
                      ? "Enter a domain and click search to find paper calls."
                      : "Try adjusting your search criteria."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              (Array.isArray(filteredPaperCalls) ? filteredPaperCalls : []).map((paperCall: PaperCall, index: number) => {
                const deadlineStatus = getDeadlineStatus(paperCall.deadline)

                return (
                  <motion.div
                    key={`${paperCall.title}-${paperCall.link}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-background/40 backdrop-blur-xl border shadow-lg transition-all hover:shadow-xl border-primary/10">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                                {paperCall.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <Badge className={cn("text-xs", getTypeColor(paperCall.type))}>
                                  {getTypeIcon(paperCall.type)}
                                  <span className="ml-1 capitalize">{paperCall.type}</span>
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {paperCall.source}
                                </span>
                                {paperCall.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistance(new Date(paperCall.createdAt), new Date(), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(paperCall.link, '_blank')}
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>

                          {/* Description */}
                          {paperCall.description && (
                            <p className="text-muted-foreground text-sm line-clamp-3">
                              {paperCall.description}
                            </p>
                          )}

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* When and Where */}
                            {(paperCall.whenHeld || paperCall.whereHeld) && (
                              <div className="space-y-2">
                                {paperCall.whenHeld && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="text-foreground font-medium">When:</span>
                                    <span className="text-muted-foreground">{paperCall.whenHeld}</span>
                                  </div>
                                )}
                                {paperCall.whereHeld && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    <span className="text-foreground font-medium">Where:</span>
                                    <span className="text-muted-foreground">{paperCall.whereHeld}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Deadline */}
                            <div className="space-y-2">
                              {paperCall.deadline && (
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-orange-500" />
                                  <span className="text-foreground font-medium">Deadline:</span>
                                  <span className={cn("font-medium", deadlineStatus.color)}>
                                    {format(new Date(paperCall.deadline), 'MMM dd, yyyy')}
                                  </span>
                                  <Badge variant="outline" className={cn("text-xs", deadlineStatus.color)}>
                                    {deadlineStatus.label}
                                  </Badge>
                                </div>
                              )}
                              {paperCall.domain && (
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-purple-500" />
                                  <span className="text-foreground font-medium">Domain:</span>
                                  <span className="text-muted-foreground capitalize">{paperCall.domain}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 