"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TagInputProps {
    value?: string[]
    placeholder?: string
    suggestions?: string[]
    onValueChange: (tags: string[]) => void
    searchFunction?: (query: string, suggestions: string[]) => string[]
    maxTags?: number
    className?: string
    style?: React.CSSProperties
    disabled?: boolean
    allowCustomTags?: boolean
}

export function TagInput({
    value = [],
    placeholder = "Add tags...",
    suggestions = [],
    onValueChange,
    searchFunction,
    maxTags,
    className,
    style,
    disabled = false,
    allowCustomTags = true
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Default search function
    const defaultSearchFunction = (query: string, items: string[]): string[] => {
        if (!query.trim()) return items.slice(0, 6)

        const queryLower = query.toLowerCase()
        const filtered = items.filter(item =>
            item.toLowerCase().includes(queryLower) && !value.includes(item)
        )

        return filtered.sort((a, b) => {
            const aLower = a.toLowerCase()
            const bLower = b.toLowerCase()

            if (aLower.startsWith(queryLower)) return -1
            if (bLower.startsWith(queryLower)) return 1
            return 0
        }).slice(0, 6)
    }

    const search = searchFunction || defaultSearchFunction
    const filteredSuggestions = search(inputValue, suggestions)

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !value.includes(trimmedTag)) {
            if (!maxTags || value.length < maxTags) {
                onValueChange([...value, trimmedTag])
                setInputValue("")
                setIsOpen(false)
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        onValueChange(value.filter(tag => tag !== tagToRemove))
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            if (allowCustomTags && inputValue.trim()) {
                addTag(inputValue.trim())
            }
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        setIsOpen(newValue.length > 0 && filteredSuggestions.length > 0)
    }

    const handleSuggestionSelect = (suggestion: string) => {
        addTag(suggestion)
    }

    useEffect(() => {
        setIsOpen(inputValue.length > 0 && filteredSuggestions.length > 0)
    }, [inputValue, filteredSuggestions.length])

    return (
        <div className={cn("relative", className)} style={style}>
            <div className="flex flex-wrap items-center gap-2 p-3 min-h-[2.5rem] bg-background/40 backdrop-blur-xl border border-primary/20 rounded-lg focus-within:border-primary/40 transition-all duration-300">
                {value.map((tag) => (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        <span>{tag}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </Badge>
                ))}

                <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder={value.length === 0 ? placeholder : "Add more..."}
                                disabled={disabled || (maxTags ? value.length >= maxTags : false)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto"
                            />
                            {suggestions.length > 0 && (
                                <Sparkles className="h-4 w-4 text-primary/40 shrink-0" />
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-[--radix-popover-trigger-width] max-w-[90vw] p-0 bg-background/95 backdrop-blur-xl border-primary/20"
                        align="start"
                    >
                        <Command>
                            <CommandList className="max-h-[150px]">
                                {filteredSuggestions.length === 0 ? (
                                    <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                        {inputValue && allowCustomTags ? (
                                            <div className="space-y-2">
                                                <p>No suggestions found.</p>
                                                <Badge
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                                                    onClick={() => addTag(inputValue)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add "{inputValue}"
                                                </Badge>
                                            </div>
                                        ) : (
                                            "Start typing to see suggestions..."
                                        )}
                                    </CommandEmpty>
                                ) : (
                                    <CommandGroup>
                                        {allowCustomTags && inputValue && !filteredSuggestions.includes(inputValue) && (
                                            <CommandItem
                                                value={inputValue}
                                                onSelect={() => handleSuggestionSelect(inputValue)}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 transition-colors"
                                            >
                                                <Plus className="h-3 w-3 text-primary" />
                                                <span>Add "{inputValue}"</span>
                                                <Badge variant="secondary" className="text-xs ml-auto">
                                                    Custom
                                                </Badge>
                                            </CommandItem>
                                        )}
                                        {filteredSuggestions.map((suggestion) => (
                                            <CommandItem
                                                key={suggestion}
                                                value={suggestion}
                                                onSelect={() => handleSuggestionSelect(suggestion)}
                                                className="cursor-pointer hover:bg-primary/10 transition-colors"
                                            >
                                                <Sparkles className="h-3 w-3 mr-2 text-primary/60" />
                                                {suggestion}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {maxTags && (
                <div className="text-xs text-muted-foreground mt-1 text-right">
                    {value.length}/{maxTags} tags
                </div>
            )}
        </div>
    )
} 