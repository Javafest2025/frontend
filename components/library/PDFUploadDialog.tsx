"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { PDFExtractor } from "@/lib/pdf-extractor"
import { addUploadedPaper } from "@/lib/api/library"
import { cn } from "@/lib/utils"

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

                setUploadProgress({
                    stage: 'uploading',
                    progress: (i / selectedFiles.length) * 100,
                    message: `Uploading ${file.name}...`
                })

                // Upload to B2 via server API
                const formData = new FormData()
                formData.append('file', file)

                const uploadResponse = await fetch('/api/b2/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json()
                    throw new Error(errorData.details || `Upload failed: ${uploadResponse.status}`)
                }

                const uploadResult = await uploadResponse.json()

                setUploadProgress({
                    stage: 'processing',
                    progress: ((i + 0.5) / selectedFiles.length) * 100,
                    message: `Processing ${file.name}...`
                })

                        // Create paper entry in backend
        const paperData = {
          projectId: projectId,
          title: metadata.title,
          abstract: metadata.abstract || null,
          authors: metadata.authors?.map(name => ({ name })) || [],
          publicationDate: new Date().toISOString().split('T')[0], // Today's date as fallback
          source: 'Uploaded',
          pdfContentUrl: uploadResult.downloadUrl,
          pdfUrl: uploadResult.downloadUrl,
          isOpenAccess: true,
          publicationTypes: ['Uploaded Document'],
          fieldsOfStudy: [],
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          fileName: file.name
        }

                await addUploadedPaper(projectId, paperData)

                setUploadProgress({
                    stage: 'processing',
                    progress: ((i + 1) / selectedFiles.length) * 100,
                    message: `Completed ${file.name}`
                })
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
                                                                    <Badge key={i} variant="secondary" className="text-xs">
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
        </Dialog>
    )
} 