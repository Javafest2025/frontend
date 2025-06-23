"use client"

import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils/cn"
import type { Message } from "@/types/chat"
import { useDocument } from "@/lib/hooks/useDocument"

type Props = {
  message: Message
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user"
  const { documents } = useDocument()

  // Get document titles for context
  const contextTitles = message.context?.map((docId) => {
    const doc = documents.find((d) => d.id === docId)
    return doc?.title || docId
  })

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">AI</div>
        </Avatar>
      )}

      <div className="flex flex-col max-w-[80%]">
        {message.context && message.context.length > 0 && (
          <div className="text-xs text-muted-foreground mb-1">Context: {contextTitles?.join(", ")}</div>
        )}
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <div className="flex h-full w-full items-center justify-center bg-accent text-accent-foreground">You</div>
        </Avatar>
      )}
    </div>
  )
}
