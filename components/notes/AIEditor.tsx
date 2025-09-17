"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Sparkles,
    Check,
    X,
    Loader2,
    Wand2,
    AlertCircle,
    Copy,
    RotateCcw
} from "lucide-react"
import { notesApi, AIContentRequest, AIContentResponse } from "@/lib/api/project-service/note"

interface AIEditorProps {
    isOpen: boolean
    onClose: () => void
    onAccept: (content: string) => void
    onReject: () => void
    projectId: string
    noteContext?: string
    cursorPosition?: number
}

export function AIEditor({
    isOpen,
    onClose,
    onAccept,
    onReject,
    projectId,
    noteContext = "",
    cursorPosition = 0
}: AIEditorProps) {
    const [prompt, setPrompt] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [hasGenerated, setHasGenerated] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLTextAreaElement>(null)

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setPrompt("")
            setGeneratedContent("")
            setError(null)
            setIsGenerating(false)
            setHasGenerated(false)
        }
    }, [isOpen])

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        setIsGenerating(true)
        setError(null)

        try {
            const request: AIContentRequest = {
                prompt: prompt.trim(),
                context: noteContext
            }

            const response: AIContentResponse = await notesApi.generateAIContent(projectId, request)

            if (response.status === "success" && response.content) {
                setGeneratedContent(response.content)
                setHasGenerated(true)
            } else {
                setError(response.error || "Failed to generate content")
            }
        } catch (err) {
            console.error("AI generation error:", err)
            setError(err instanceof Error ? err.message : "Failed to generate content")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAccept = () => {
        if (generatedContent) {
            onAccept(generatedContent)
            onClose()
        }
    }

    const handleReject = () => {
        onReject()
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (!isGenerating && !hasGenerated) {
                handleGenerate()
            } else if (hasGenerated) {
                handleAccept()
            }
        } else if (e.key === "Escape") {
            handleReject()
        }
    }

    const handleRegenerate = () => {
        setGeneratedContent("")
        setError(null)
        setHasGenerated(false)
        handleGenerate()
    }

    const handleCopyContent = () => {
        navigator.clipboard.writeText(generatedContent)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        handleReject()
                    }
                }}
            >
                <Card className="w-full max-w-2xl mx-4 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl">
                    <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-primary/20">
                                <Sparkles className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">AI Content Generator</h3>
                                <p className="text-sm text-muted-foreground">
                                    Describe what you want to add to your note
                                </p>
                            </div>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="ai-prompt-input" className="text-sm font-medium text-foreground">
                                    What would you like to write?
                                </label>
                                <Input
                                    id="ai-prompt-input"
                                    ref={inputRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., 'write a summary of machine learning algorithms' or 'add a conclusion paragraph'"
                                    className="bg-background/40 border-2 border-primary/20 focus:border-primary/60 transition-all duration-300"
                                    disabled={isGenerating}
                                />
                            </div>

                            {/* Context Info */}
                            {noteContext && (
                                <div className="p-3 bg-muted/30 rounded-lg border border-primary/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wand2 className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium text-foreground">Note Context</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-3">
                                        {noteContext.slice(0, 200)}{noteContext.length > 200 ? "..." : ""}
                                    </p>
                                </div>
                            )}

                            {/* Generate Button */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isGenerating}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate Content
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Generated Content */}
                        <AnimatePresence>
                            {(hasGenerated || error) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-6 space-y-4"
                                >
                                    {error ? (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                                <span className="text-sm font-medium text-destructive">Error</span>
                                            </div>
                                            <p className="text-sm text-destructive">{error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                                        Generated Content
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleCopyContent}
                                                        className="h-8 px-3"
                                                    >
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleRegenerate}
                                                        className="h-8 px-3"
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                        Regenerate
                                                    </Button>
                                                </div>
                                            </div>

                                            <Textarea
                                                ref={contentRef}
                                                value={generatedContent}
                                                readOnly
                                                className="min-h-[200px] bg-muted/20 border-2 border-primary/10 font-mono text-sm resize-none"
                                                placeholder="Generated content will appear here..."
                                            />

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleReject}
                                                    className="border-destructive/20 text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    onClick={handleAccept}
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Accept & Insert
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-primary/10">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-4">
                                    <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to generate</span>
                                    <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel</span>
                                </div>
                                <span>Powered by Gemini AI</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}
