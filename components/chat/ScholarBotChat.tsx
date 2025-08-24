"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, Brain, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { scholarbotApi } from "@/lib/api/project-service"
import { ScholarBotMessage } from "@/types/scholarbot"

interface ScholarBotChatProps {
    className?: string
    onClose?: () => void
}

export function ScholarBotChat({ className, onClose }: ScholarBotChatProps) {
    const [messages, setMessages] = useState<ScholarBotMessage[]>([
        {
            id: '1',
            content: "Hello! I'm ScholarBot, your AI research assistant. I can help you with:\n\n• Creating and managing todos\n• Searching and summarizing your tasks\n• Finding academic papers\n• Answering general questions\n\nWhat would you like to do today?",
            sender: 'bot',
            timestamp: new Date(),
            commandType: 'GENERAL_QUESTION'
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage: ScholarBotMessage = {
            id: Date.now().toString(),
            content: inputValue,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)

        try {
            const response = await scholarbotApi.sendMessage(inputValue)

            const botMessage: ScholarBotMessage = {
                id: (Date.now() + 1).toString(),
                content: response.message,
                sender: 'bot',
                timestamp: new Date(response.timestamp),
                data: response.data,
                commandType: response.commandType
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            console.error('Error sending message:', error)

            const errorMessage: ScholarBotMessage = {
                id: (Date.now() + 1).toString(),
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
                commandType: 'ERROR'
            }

            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const renderMessage = (message: ScholarBotMessage) => {
        const isUser = message.sender === 'user'

        return (
            <div
                key={message.id}
                className={cn(
                    "flex gap-3 mb-4",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}
            >
                <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}>
                    {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4 text-gradient-primary" />}
                </div>

                <div className={cn(
                    "flex-1 max-w-[80%]",
                    isUser ? "text-right" : "text-left"
                )}>
                    <div className={cn(
                        "inline-block p-3 rounded-lg",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                    )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.data && !isUser && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            {message.commandType && (
                                <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">
                                    {message.commandType}
                                </span>
                            )}
                            {message.data.todo && (
                                <div className="mt-2 p-2 bg-secondary rounded text-xs">
                                    <strong>Created Todo:</strong> {message.data.todo.title}
                                </div>
                            )}
                            {message.data.todos && message.data.count > 0 && (
                                <div className="mt-2 p-2 bg-secondary rounded text-xs">
                                    <strong>Found {message.data.count} todos</strong>
                                </div>
                            )}
                            {message.data.summary && (
                                <div className="mt-2 p-2 bg-secondary rounded text-xs">
                                    <strong>Summary:</strong> {message.data.summary}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-gradient-primary" />
                    ScholarBot
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <ScrollArea
                    ref={scrollAreaRef}
                    className="h-96 w-full rounded-md border p-4"
                >
                    <div className="space-y-4">
                        {messages.map(renderMessage)}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-gradient-primary" />
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">ScholarBot is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask ScholarBot anything..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
