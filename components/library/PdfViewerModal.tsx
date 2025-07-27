"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { PDFViewer } from "@/components/document/PdfViewer"
import type { Paper } from "@/types/websearch"
import { useState } from "react"

interface PdfViewerModalProps {
    paper: Paper | null
    isOpen: boolean
    onClose: () => void
}

export function PdfViewerModal({ paper, isOpen, onClose }: PdfViewerModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Debug: Log the paper object to see if it has an id
    console.log("PdfViewerModal paper object:", paper)
    console.log("Paper ID:", paper?.id)

    // Get PDF URL from either pdfUrl or pdfContentUrl
    const pdfUrl = paper?.pdfUrl || paper?.pdfContentUrl

    if (!isOpen || !paper || !pdfUrl) return null

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-background border border-primary/20 rounded-lg shadow-2xl flex flex-col ${isFullscreen
                    ? "w-full h-full rounded-none"
                    : "w-full h-full max-w-7xl max-h-[95vh]"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold line-clamp-1 pr-4">
                            {paper.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {paper.authors.slice(0, 3).map(a => a.name).join(", ")}
                            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFullscreen}
                            className="hidden md:flex"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden">
                    <PDFViewer
                        documentUrl={pdfUrl}
                        documentName={paper.title}
                        paperId={paper.id}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
} 