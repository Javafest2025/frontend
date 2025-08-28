"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
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
    theme?: 'primary' | 'purple' | 'green' | 'orange'
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
    theme = 'primary'
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

    const getThemeColors = (theme: string) => {
        switch (theme) {
            case 'purple':
                return {
                    border: 'border-purple-500/20',
                    scrollbar: 'scrollbar-thumb-purple-500/20 hover:scrollbar-thumb-purple-500/30',
                    icon: 'text-purple-500/60',
                    hover: 'hover:from-purple-500/10 hover:to-violet-500/10',
                    borderLeft: 'hover:border-l-purple-500',
                    iconHover: 'group-hover:text-purple-500',
                    tagBg: 'bg-transparent backdrop-blur-sm',
                    tagBorder: 'border-purple-500/30',
                    tagText: 'text-purple-400',
                    tagHover: 'hover:bg-purple-500/10 hover:border-purple-500/50'
                }
            case 'green':
                return {
                    border: 'border-green-500/20',
                    scrollbar: 'scrollbar-thumb-green-500/20 hover:scrollbar-thumb-green-500/30',
                    icon: 'text-green-500/60',
                    hover: 'hover:from-green-500/10 hover:to-emerald-500/10',
                    borderLeft: 'hover:border-l-green-500',
                    iconHover: 'group-hover:text-green-500',
                    tagBg: 'bg-transparent backdrop-blur-sm',
                    tagBorder: 'border-green-500/30',
                    tagText: 'text-green-400',
                    tagHover: 'hover:bg-green-500/10 hover:border-green-500/50'
                }
            case 'orange':
                return {
                    border: 'border-orange-500/20',
                    scrollbar: 'scrollbar-thumb-orange-500/20 hover:scrollbar-thumb-orange-500/30',
                    icon: 'text-orange-500/60',
                    hover: 'hover:from-orange-500/10 hover:to-amber-500/10',
                    borderLeft: 'hover:border-l-orange-500',
                    iconHover: 'group-hover:text-orange-500',
                    tagBg: 'bg-transparent backdrop-blur-sm',
                    tagBorder: 'border-orange-500/30',
                    tagText: 'text-orange-400',
                    tagHover: 'hover:bg-orange-500/10 hover:border-orange-500/50'
                }
            default:
                return {
                    border: 'border-primary/20',
                    scrollbar: 'scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30',
                    icon: 'text-primary/60',
                    hover: 'hover:from-primary/10 hover:to-purple-500/10',
                    borderLeft: 'hover:border-l-primary',
                    iconHover: 'group-hover:text-primary',
                    tagBg: 'bg-transparent backdrop-blur-sm',
                    tagBorder: 'border-primary/30',
                    tagText: 'text-primary-400',
                    tagHover: 'hover:bg-primary/10 hover:border-primary/50'
                }
        }
    }

    const themeColors = getThemeColors(theme)

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !value.includes(trimmedTag)) {
            if (!maxTags || value.length < maxTags) {
                onValueChange([...value, trimmedTag])
                setInputValue("")
                setIsOpen(false)
                // Maintain focus on the input after adding a tag
                setTimeout(() => {
                    inputRef.current?.focus()
                }, 0)
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        onValueChange(value.filter(tag => tag !== tagToRemove))
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        setIsOpen(newValue.length > 0 && filteredSuggestions.length > 0)
    }

    const handleSuggestionSelect = (suggestion: string) => {
        addTag(suggestion)
        // Ensure focus is maintained after selection
        setTimeout(() => {
            inputRef.current?.focus()
        }, 0)
    }

    useEffect(() => {
        setIsOpen(inputValue.length > 0 && filteredSuggestions.length > 0)
    }, [inputValue, filteredSuggestions.length])

    // Ensure input maintains focus when popover state changes
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    return (
        <div className={cn("relative", className)} style={style}>
            <div className="flex flex-wrap items-center gap-2 p-3 min-h-[2.5rem] bg-background/40 backdrop-blur-xl border border-primary/20 rounded-lg focus-within:border-primary/40 transition-all duration-300">
                {value.map((tag) => (
                    <Badge
                        key={tag}
                        className={`flex items-center gap-1 ${themeColors.tagBg} ${themeColors.tagText} border ${themeColors.tagBorder} ${themeColors.tagHover} transition-all duration-200 shadow-sm`}
                    >
                        <span className="font-medium">{tag}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className={`ml-1 ${themeColors.tagHover} rounded-full p-0.5 transition-colors hover:scale-110`}
                            >
                                <X className={`h-3 w-3 ${themeColors.tagText}`} />
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
                                <Sparkles className={`h-4 w-4 ${themeColors.icon} shrink-0`} />
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        className={`w-[--radix-popover-trigger-width] max-w-[90vw] p-0 bg-background/95 backdrop-blur-xl ${themeColors.border}`}
                        align="start"
                    >
                        <Command>
                            <CommandList className={`max-h-[150px] scrollbar-thin scrollbar-track-transparent ${themeColors.scrollbar}`}>
                                {filteredSuggestions.length === 0 ? (
                                    <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                        Start typing to see suggestions...
                                    </CommandEmpty>
                                ) : (
                                    <CommandGroup>
                                        {filteredSuggestions.map((suggestion) => (
                                            <CommandItem
                                                key={suggestion}
                                                value={suggestion}
                                                onSelect={() => handleSuggestionSelect(suggestion)}
                                                className={`cursor-pointer hover:bg-gradient-to-r ${themeColors.hover} transition-all duration-200 border-l-2 border-l-transparent ${themeColors.borderLeft} group`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className={`h-3 w-3 ${themeColors.icon} ${themeColors.iconHover} transition-colors`} />
                                                    <span className="group-hover:font-medium transition-all duration-200">{suggestion}</span>
                                                </div>
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