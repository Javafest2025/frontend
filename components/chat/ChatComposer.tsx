"use client"

import type React from "react"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Send, ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { useDocument } from "@/lib/hooks/useDocument"

type Props = {
  onSend: (message: string, context?: string[]) => void
  isLoading?: boolean
}

export function ChatComposer({ onSend, isLoading = false }: Props) {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])
  const [showImageUpload, setShowImageUpload] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { documents } = useDocument()

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message, selectedContexts.length > 0 ? selectedContexts : undefined)
      setMessage("")
      setSelectedContexts([])

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
      // Replace the @mention with the document title
      const lastAtIndex = message.lastIndexOf("@")
      if (lastAtIndex !== -1) {
        setMessage(message.substring(0, lastAtIndex) + title + message.substring(lastAtIndex + mentionQuery.length + 1))
      }
    }
    setShowMentions(false)
  }

  const removeContext = (docId: string) => {
    setSelectedContexts(selectedContexts.filter((id) => id !== docId))
  }

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(mentionQuery.toLowerCase()))

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className="space-y-2">
      {/* Selected contexts */}
      {selectedContexts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedContexts.map((docId) => {
            const doc = documents.find((d) => d.id === docId)
            return doc ? (
              <div
                key={docId}
                className="flex items-center gap-1 bg-accent/50 text-accent-foreground px-2 py-1 rounded-md text-xs"
              >
                <span>{doc.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full"
                  onClick={() => removeContext(docId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : null
          })}
        </div>
      )}

      {/* Image upload area */}
      {showImageUpload && (
        <div className="border border-dashed rounded-md p-4 text-center">
          <p className="text-sm text-muted-foreground">Drag and drop an image or click to upload</p>
          <input type="file" accept="image/*" className="hidden" id="image-upload" />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            Select Image
          </Button>
        </div>
      )}

      <div
        className={cn(
          "relative flex items-end gap-2 rounded-lg border bg-background transition-all",
          isFocused ? "ring-2 ring-ring" : "",
        )}
      >
        {/* Mention suggestions */}
        {showMentions && filteredDocuments.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md">
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

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => setShowImageUpload(!showImageUpload)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <div className="absolute left-0 top-0 p-3 text-muted-foreground pointer-events-none">
            {message.length === 0 && !isFocused && (
              <div className="flex items-center gap-1">
                <span className="text-sm">@</span>
                <span className="text-sm">Add context</span>
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "Plan, search, build anything" : ""}
            className="min-h-[40px] max-h-[200px] w-full resize-none bg-transparent p-3 focus:outline-none"
            rows={1}
          />
        </div>

        <Button
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full mr-2"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
