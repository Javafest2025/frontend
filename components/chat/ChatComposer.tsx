"use client"

import type React from "react"
import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import {
  Send,
  ImageIcon,
  X,
  Plus,
  Infinity,
  AtSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { useDocument } from "@/lib/hooks/useDocument"

type Props = {
  onSend: (message: string, context?: string[]) => void
  isLoading?: boolean
  externalContexts?: string[]
  onExternalContextsCleared?: () => void
  disabled?: boolean
}

export function ChatComposer({ onSend, isLoading = false, externalContexts = [], onExternalContextsCleared, disabled = false }: Props) {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { documents } = useDocument()

  const handleSend = () => {
    if ((message.trim() || externalContexts.length > 0) && !isLoading && !disabled) {
      const combinedContexts = [...externalContexts, ...selectedContexts]
      onSend(message, combinedContexts.length > 0 ? combinedContexts : undefined)
      setMessage("")
      setSelectedContexts([])
      setUploadedImage(null)
      if (onExternalContextsCleared) onExternalContextsCleared()

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === "@") {
      setShowMentions(true)
      setMentionQuery("")
    } else if (showMentions && e.key === "Escape") {
      setShowMentions(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Check for @ mentions
    const lastAtIndex = e.target.value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const query = e.target.value.slice(lastAtIndex + 1).split(" ")[0]
      setMentionQuery(query)
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const addContext = (docId: string, title: string) => {
    if (!selectedContexts.includes(docId)) {
      setSelectedContexts([...selectedContexts, docId])
      // Replace the @mention with empty string
      const lastAtIndex = message.lastIndexOf("@")
      if (lastAtIndex !== -1) {
        setMessage(message.substring(0, lastAtIndex) + message.substring(lastAtIndex + mentionQuery.length + 1))
      }
    }
    setShowMentions(false)
  }

  const removeContext = (docId: string) => {
    setSelectedContexts(selectedContexts.filter((id) => id !== docId))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Handle image upload logic here
      // For now, just store the filename
      setUploadedImage(file.name)
    }
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-primary transition-all"
      )}
    >
      {/* Mention suggestions dropdown */}
      {showMentions && filteredDocuments.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md z-50">
          <div className="p-2 text-xs font-medium text-muted-foreground">Add context from library</div>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
              onClick={() => addContext(doc.id, doc.title)}
            >
              <div className="flex-1 truncate">{doc.title}</div>
              <div className="text-xs text-muted-foreground">{doc.type.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header row with @ Add Context and selected chips */}
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <AtSign className="h-3 w-3" />
          <span>Add Context</span>
        </div>

        {/* External context chips */}
        {externalContexts.map((ctx, idx) => (
          <div
            key={`ext-${idx}`}
            className="inline-flex items-center gap-1.5 bg-muted/20 text-foreground px-2 py-1 rounded text-xs"
          >
            {ctx.length > 40 ? ctx.slice(0, 37) + '…' : ctx}
          </div>
        ))}

        {selectedContexts.map((docId) => {
          const doc = documents.find((d) => d.id === docId)
          return doc ? (
            <div
              key={docId}
              className="inline-flex items-center gap-1.5 bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-xs"
            >
              <span>{doc.title}</span>
              <button
                onClick={() => removeContext(docId)}
                className="ml-0.5 hover:bg-secondary/80 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null
        })}

        {uploadedImage && (
          <div className="inline-flex items-center gap-1.5 bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-xs">
            <ImageIcon className="h-3 w-3" />
            <span>{uploadedImage}</span>
            <button
              onClick={() => setUploadedImage(null)}
              className="ml-0.5 hover:bg-secondary/80 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Textarea */}
      <div className="px-3 pb-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={disabled ? "Chat is being prepared..." : "Plan, search, build anything"}
          className="w-full resize-none bg-transparent text-sm focus:outline-none min-h-[44px] max-h-[200px] py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          disabled={disabled}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background rounded-b-lg">
        <div className="flex items-center gap-3 text-xs">
          <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Infinity className="h-4 w-4" /> Agent
          </button>
          <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            gemini-2.5-pro
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="image-upload"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!message.trim() && selectedContexts.length === 0 && externalContexts.length === 0) || isLoading || disabled}
            className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}