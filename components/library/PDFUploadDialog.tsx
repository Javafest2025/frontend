"use client"

import { useState, useRef } from "react"
import { } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { PDFExtractor } from "@/lib/pdf-extractor"
import { libraryApi } from "@/lib/api/project-service"
import { cn } from "@/lib/utils"

import { AuthorDialog } from "@/components/interface/AuthorDialog"
import { useAuthorDialog } from "@/hooks/useAuthorDialog"

interface PDFUploadDialogProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    onUploadComplete?: () => void
}

interface UploadProgress {
    stage: 'selecting' | 'extracting' | 'uploading' | 'processing' | 'complete' | 'error'
    progress: number
    message: string
    error?: string
}

export function PDFUploadDialog({ isOpen, onClose, projectId, onUploadComplete }: PDFUploadDialogProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
        stage: 'selecting',
        progress: 0,
        message: 'Select PDF files to upload'
    })
    const [extractedMetadata, setExtractedMetadata] = useState<Array<{
        file: File
        title: string
        abstract?: string
        authors?: string[]
        showPreview: boolean
    }>>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const { authorName, isOpen: isAuthorDialogOpen, openAuthorDialog, setIsOpen: setIsAuthorDialogOpen } = useAuthorDialog()

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        const pdfFiles = files.filter(file => file.type === 'application/pdf')

        if (pdfFiles.length === 0) {
            toast({
                title: "No PDF files selected",
                description: "Please select PDF files to upload.",
                variant: "destructive"
            })
            return
        }

        setSelectedFiles(pdfFiles)
        setUploadProgress({
            stage: 'extracting',
            progress: 0,
            message: 'Extracting metadata from PDFs...'
        })

        // Extract metadata from each PDF
        extractMetadataFromFiles(pdfFiles)
    }

    const extractMetadataFromFiles = async (files: File[]) => {
        const metadataArray = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            setUploadProgress({
                stage: 'extracting',
                progress: (i / files.length) * 100,
                message: `Extracting metadata from ${file.name}...`
            })

            try {
                const metadata = await PDFExtractor.extractMetadata(file)
                const abstract = await PDFExtractor.generateAbstract(file)

                // Parse authors if available
                let authors: string[] = []
                if (metadata.author) {
                    authors = metadata.author.split(/[,;]/).map(author => author.trim()).filter(Boolean)
                }

                metadataArray.push({
                    file,
                    title: metadata.title || file.name.replace('.pdf', ''),
                    abstract,
                    authors,
                    showPreview: false
                })
            } catch (error) {
                console.error('Error extracting metadata from', file.name, error)
                metadataArray.push({
                    file,
                    title: file.name.replace('.pdf', ''),
                    showPreview: false
                })
            }
        }

        setExtractedMetadata(metadataArray)
        setUploadProgress({
            stage: 'selecting',
            progress: 100,
            message: 'Ready to upload'
        })
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        setIsUploading(true)
        setUploadProgress({
            stage: 'uploading',
            progress: 0,
            message: 'Uploading files to cloud storage...'
        })

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                const metadata = extractedMetadata[i]

                // Create smooth progress tracking for this file
                const baseProgress = (i / selectedFiles.length) * 100
                const progressPerFile = 100 / selectedFiles.length

                const updateSmoothProgress = (phase: 'upload' | 'extract' | 'save', phaseProgress: number) => {
                    const phaseWeight = progressPerFile / 3 // Each phase is 1/3 of a file's progress
                    const phaseOffset = phase === 'upload' ? 0 : phase === 'extract' ? phaseWeight : phaseWeight * 2
                    const totalProgress = baseProgress + phaseOffset + (phaseProgress / 100) * phaseWeight

                    setUploadProgress({
                        stage: phase === 'upload' ? 'uploading' : 'processing',
                        progress: Math.min(100, totalProgress),
                        message: phase === 'upload'
                            ? `Uploading ${file.name}... ${Math.round(phaseProgress)}%`
                            : phase === 'extract'
                                ? `Extracting metadata from ${file.name}... ${Math.round(phaseProgress)}%`
                                : `Saving ${file.name}... ${Math.round(phaseProgress)}%`
                    })
                }

                // Phase 1: Upload with simulated progress
                updateSmoothProgress('upload', 0)

                const formData = new FormData()
                formData.append('file', file)

                // Create smooth upload progress simulation
                let uploadProgress = 0
                const uploadProgressInterval = setInterval(() => {
                    uploadProgress = Math.min(95, uploadProgress + Math.random() * 15)
                    updateSmoothProgress('upload', uploadProgress)
                }, 100)

                const uploadResponse = await fetch('/api/b2/upload', {
                    method: 'POST',
                    body: formData
                })
                clearInterval(uploadProgressInterval)
                updateSmoothProgress('upload', 100)

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json()
                    throw new Error(errorData.details || `Upload failed: ${uploadResponse.status}`)
                }

                const uploadResult = await uploadResponse.json()

                // Phase 2: GROBID extraction with progress
                updateSmoothProgress('extract', 0)

                // Call GROBID to extract metadata from the uploaded PDF
                console.log("🔍 Calling GROBID to extract metadata from:", file.name)
                const grobidForm = new FormData()
                grobidForm.append('file', file)

                // Create smooth GROBID progress simulation (header extraction is faster)
                let extractProgress = 0
                const extractProgressInterval = setInterval(() => {
                    extractProgress = Math.min(95, extractProgress + Math.random() * 20)
                    updateSmoothProgress('extract', extractProgress)
                }, 120)

                const grobidRes = await fetch('/api/grobid/metadata', {
                    method: 'POST',
                    body: grobidForm
                })
                clearInterval(extractProgressInterval)
                updateSmoothProgress('extract', 100)

                console.log("📊 GROBID response status:", grobidRes.status, grobidRes.statusText)

                if (!grobidRes.ok) {
                    const err = await grobidRes.json().catch(() => ({}))
                    console.error("❌ GROBID API error:", err)

                    // If GROBID service is unavailable, fall back to basic metadata
                    if (grobidRes.status === 503) {
                        console.warn("⚠️ GROBID service unavailable, using fallback metadata")
                        toast({
                            title: "GROBID service unavailable",
                            description: "Using fallback metadata extraction. Some features may be limited.",
                            variant: "default"
                        })

                        // Use fallback metadata from PDF.js extraction
                        const extracted = {
                            title: metadata.title || file.name.replace('.pdf', ''),
                            authors: metadata.authors || [],
                            abstractText: metadata.abstract || null,
                            isValid: !!(metadata.title || metadata.abstract)
                        }

                        if (!extracted.isValid) {
                            throw new Error('Could not extract basic metadata from PDF. Please ensure this is a valid academic paper.')
                        }

                        // Continue with fallback data
                        var grobidExtracted = extracted
                    } else {
                        throw new Error(err.details || `GROBID extraction failed: ${grobidRes.status}`)
                    }
                } else {
                    const grobidData = await grobidRes.json()
                    var grobidExtracted = grobidData.data as { title?: string; authors?: string[]; abstractText?: string; isValid?: boolean }
                    console.log("✅ GROBID extraction successful:", grobidExtracted)
                }

                // Validate metadata with more detailed error messages
                if (!grobidExtracted?.isValid) {
                    const missingParts = []
                    if (!grobidExtracted?.title || grobidExtracted.title.trim().length < 3) missingParts.push('title')
                    if (!grobidExtracted?.abstractText || grobidExtracted.abstractText.trim().length < 10) missingParts.push('abstract')
                    if (!grobidExtracted?.authors || grobidExtracted.authors.length === 0) missingParts.push('authors')

                    const missingText = missingParts.length > 0 ? ` (missing: ${missingParts.join(', ')})` : ''
                    throw new Error(`This PDF does not appear to be an academic paper${missingText}. Please ensure you're uploading a research paper with proper metadata.`)
                }

                const extracted = grobidExtracted

                // Phase 3: Save to backend with progress
                updateSmoothProgress('save', 0)

                // Get user data for authentication
                const { getUserData } = await import("@/lib/api/user-service/auth")
                const userData = getUserData()

                if (!userData?.id) {
                    throw new Error('User not authenticated')
                }

                updateSmoothProgress('save', 20)

                // Create paper entry in backend
                const paperData = {
                    userId: userData.id,
                    projectId: projectId,
                    title: extracted.title || metadata.title,
                    abstractText: extracted.abstractText || metadata.abstract || null,
                    authors: (extracted.authors && extracted.authors.length > 0
                        ? extracted.authors
                        : (metadata.authors || [])
                    ).map(name => ({
                        name: name,
                        primaryAffiliation: null,
                        allAffiliations: null,
                        semanticScholarId: null,
                        orcidId: null,
                        googleScholarId: null,
                        openalexId: null,
                        citationCount: null,
                        hIndex: null,
                        i10Index: null,
                        paperCount: null,
                        firstPublicationYear: null,
                        lastPublicationYear: null,
                        researchAreas: null,
                        recentPublications: null,
                        dataSources: null,
                        dataQualityScore: null,
                        searchStrategy: null,
                        sourcesAttempted: null,
                        sourcesSuccessful: null,
                        isSynced: false,
                        lastSyncAt: null,
                        syncError: null,
                        homepageUrl: null,
                        email: null,
                        profileImageUrl: null,
                        createdAt: null,
                        updatedAt: null
                    })),
                    publicationDate: null, // Unknown date for uploaded papers
                    source: 'Uploaded',
                    pdfContentUrl: uploadResult.downloadUrl,
                    pdfUrl: uploadResult.downloadUrl,
                    isOpenAccess: false, // Mark uploaded papers as not open access
                    publicationTypes: ['Uploaded Document'],
                    fieldsOfStudy: [],
                    uploadedAt: new Date().toISOString(),
                    fileSize: file.size,
                    fileName: file.name
                }

                updateSmoothProgress('save', 50)

                await libraryApi.uploadPaper(projectId, paperData)

                updateSmoothProgress('save', 100)

                // Brief completion message for this file
                setUploadProgress({
                    stage: 'processing',
                    progress: ((i + 1) / selectedFiles.length) * 100,
                    message: `✅ Completed ${file.name}`
                })

                // Small delay to show completion
                await new Promise(resolve => setTimeout(resolve, 200))
            }

            setUploadProgress({
                stage: 'complete',
                progress: 100,
                message: 'Upload completed successfully!'
            })

            toast({
                title: "Upload successful",
                description: `Successfully uploaded ${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''}.`,
            })

            // Reset and close
            setTimeout(() => {
                resetAndClose()
                onUploadComplete?.()
            }, 2000)

        } catch (error) {
            console.error('Upload error:', error)
            setUploadProgress({
                stage: 'error',
                progress: 0,
                message: 'Upload failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            })

            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload files.",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const resetAndClose = () => {
        setSelectedFiles([])
        setExtractedMetadata([])
        setUploadProgress({
            stage: 'selecting',
            progress: 0,
            message: 'Select PDF files to upload'
        })
        setIsUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onClose()
    }

    const togglePreview = (index: number) => {
        setExtractedMetadata(prev => prev.map((item, i) =>
            i === index ? { ...item, showPreview: !item.showPreview } : item
        ))
    }

    const getStageIcon = () => {
        switch (uploadProgress.stage) {
            case 'selecting':
                return <FileText className="h-5 w-5" />
            case 'extracting':
                return <Loader2 className="h-5 w-5 animate-spin" />
            case 'uploading':
                return <Upload className="h-5 w-5" />
            case 'processing':
                return <Loader2 className="h-5 w-5 animate-spin" />
            case 'complete':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />
            default:
                return <FileText className="h-5 w-5" />
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload PDF Papers
                    </DialogTitle>
                    <DialogDescription>
                        Upload PDF files to your project library. We'll extract metadata and make them searchable.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Selection */}
                    {uploadProgress.stage === 'selecting' && selectedFiles.length === 0 && (
                        <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Select PDF files</h3>
                            <p className="text-muted-foreground mb-4">
                                Choose one or more PDF files to upload to your library
                            </p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <FileText className="mr-2 h-4 w-4" />
                                Choose Files
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Progress Indicator */}
                    {uploadProgress.stage !== 'selecting' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {getStageIcon()}
                                <div className="flex-1">
                                    <p className="font-medium">{uploadProgress.message}</p>
                                    {uploadProgress.error && (
                                        <p className="text-sm text-red-500">{uploadProgress.error}</p>
                                    )}
                                </div>
                                {uploadProgress.stage !== 'complete' && uploadProgress.stage !== 'error' && (
                                    <span className="text-sm text-muted-foreground">
                                        {Math.round(uploadProgress.progress)}%
                                    </span>
                                )}
                            </div>
                            <Progress value={uploadProgress.progress} className="w-full" />
                        </div>
                    )}

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                            <div className="space-y-3">
                                {extractedMetadata.map((metadata, index) => (
                                    <Card key={index} className="p-4">
                                        <CardContent className="p-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium mb-1">{metadata.title}</h4>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {(metadata.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>

                                                    {metadata.authors && metadata.authors.length > 0 && (
                                                        <div className="mb-2">
                                                            <p className="text-sm text-muted-foreground">Authors:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {metadata.authors.slice(0, 3).map((author, i) => (
                                                                    <Badge
                                                                        key={i}
                                                                        variant="secondary"
                                                                        className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            openAuthorDialog(author)
                                                                        }}
                                                                    >
                                                                        {author}
                                                                    </Badge>
                                                                ))}
                                                                {metadata.authors.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{metadata.authors.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {metadata.abstract && (
                                                        <div className="mb-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-sm text-muted-foreground">Abstract:</p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => togglePreview(index)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    {metadata.showPreview ? (
                                                                        <EyeOff className="h-3 w-3" />
                                                                    ) : (
                                                                        <Eye className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            {metadata.showPreview && (
                                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                                    {metadata.abstract}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                                                        setExtractedMetadata(prev => prev.filter((_, i) => i !== index))
                                                    }}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={resetAndClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className={cn(
                                "gradient-primary-to-accent hover:gradient-accent text-white",
                                isUploading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Author Dialog */}
            <AuthorDialog
                authorName={authorName}
                open={isAuthorDialogOpen}
                onOpenChange={setIsAuthorDialogOpen}
            />
        </Dialog>
    )
} 