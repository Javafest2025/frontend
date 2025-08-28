"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, X } from "lucide-react"
import type { Paper } from "@/types/websearch"

interface PdfViewerModalProps {
    paper: Paper | null
    isOpen: boolean
    onClose: () => void
}

export function PdfViewerModal({ paper, isOpen, onClose }: PdfViewerModalProps) {
    if (!paper) return null

    const pdfUrl = paper.pdfUrl || paper.pdfContentUrl

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-lg font-semibold line-clamp-2 pr-8">
                        {paper.title}
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute right-4 top-4 h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col">
                    {pdfUrl ? (
                        <div className="flex-1 relative">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full border-0"
                                title={`PDF: ${paper.title}`}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-muted/30">
                            <div className="text-center space-y-4">
                                <div className="text-muted-foreground">
                                    PDF not available for viewing
                                </div>
                                {paper.paperUrl && (
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(paper.paperUrl, '_blank')}
                                        className="gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        View on Publisher Site
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="px-6 py-3 border-t bg-muted/30 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {paper.authors.map(author => author.name).join(", ")}
                    </div>
                    {pdfUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open in New Tab
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
