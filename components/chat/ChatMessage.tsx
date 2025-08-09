"use client"

import { cn } from "@/lib/utils/cn"
import type { Message } from "@/types/chat"
import { useDocument } from "@/lib/hooks/useDocument"
import { AtSign } from "lucide-react"

type Props = {
  message: Message
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user"
  const { documents } = useDocument()

  // Build context chips array mixing docs and raw strings
  const contextChips = (message.context || []).map((ctx) => {
    const doc = documents.find((d) => d.id === ctx)
    if (doc) {
      return { type: "doc" as const, label: doc.title, id: doc.id }
    }
    return { type: "text" as const, label: ctx }
  })

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1.5 py-4",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Context chips above user messages */}
      {isUser && contextChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1 max-w-full justify-end">
          {contextChips.map((chip, idx) => (
            <div
              key={idx}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs max-w-[200px] truncate",
                chip.type === "doc"
                  ? "bg-secondary/50 text-secondary-foreground"
                  : "bg-muted/20 text-foreground"
              )}
            >
              {chip.type === "doc" && <AtSign className="h-3 w-3" />}
              <span className="truncate">{chip.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message bubble */}
      {message.content && (
        <div
          className={cn(
            "relative max-w-[85%] rounded-lg px-3 py-2",
            isUser ? "bg-primary/10 text-foreground" : "bg-transparent text-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      )}

      {/* Assistant label */}
      {!isUser && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>Assistant</span>
        </div>
      )}
    </div>
  )
}