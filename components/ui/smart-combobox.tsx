"use client"

import * as React from "react"
import { useState } from "react"
import { Check, ChevronsUpDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface SmartComboBoxProps {
    value?: string
    placeholder?: string
    suggestions: string[]
    onValueChange: (value: string) => void
    onInputChange?: (value: string) => void
    searchFunction?: (query: string, suggestions: string[]) => string[]
    emptyMessage?: string
    className?: string
    style?: React.CSSProperties
    disabled?: boolean
    allowCustomInput?: boolean
    showSuggestionsIcon?: boolean
}

export function SmartComboBox({
    value = "",
    placeholder = "Type to search...",
    suggestions,
    onValueChange,
    onInputChange,
    searchFunction,
    emptyMessage = "No suggestions found.",
    className,
    style,
    disabled = false,
    allowCustomInput = true,
    showSuggestionsIcon = true
}: SmartComboBoxProps) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)

    // Default search function
    const defaultSearchFunction = (query: string, items: string[]): string[] => {
        if (!query.trim()) return items.slice(0, 8)

        const queryLower = query.toLowerCase()
        const filtered = items.filter(item =>
            item.toLowerCase().includes(queryLower)
        )

        return filtered.sort((a, b) => {
            const aLower = a.toLowerCase()
            const bLower = b.toLowerCase()

            if (aLower === queryLower) return -1
            if (bLower === queryLower) return 1
            if (aLower.startsWith(queryLower)) return -1
            if (bLower.startsWith(queryLower)) return 1
            return 0
        }).slice(0, 8)
    }

    const search = searchFunction || defaultSearchFunction
    const filteredSuggestions = search(inputValue, suggestions)

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        onInputChange?.(newValue)

        if (allowCustomInput) {
            onValueChange(newValue)
        }
    }

    const handleSelect = (selectedValue: string) => {
        setInputValue(selectedValue)
        onValueChange(selectedValue)
        setOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && allowCustomInput) {
            e.preventDefault()
            onValueChange(inputValue)
            setOpen(false)
        }
    }

    // Update input value when external value changes
    React.useEffect(() => {
        setInputValue(value)
    }, [value])

    return (
        <div className={cn("relative", className)} style={style}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between text-left font-normal bg-background/40 backdrop-blur-xl border-primary/20 hover:border-primary/40 focus:border-primary/60 transition-all duration-300",
                            !inputValue && "text-muted-foreground",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {showSuggestionsIcon && (
                                <Sparkles className="h-4 w-4 text-primary/60 shrink-0" />
                            )}
                            <span className="truncate">
                                {inputValue || placeholder}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[90vw] p-0 bg-background/95 backdrop-blur-xl border-primary/20">
                    <Command>
                        <div className="flex items-center border-b border-primary/10 px-3">
                            {showSuggestionsIcon && (
                                <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary/60" />
                            )}
                            <CommandInput
                                placeholder={placeholder}
                                value={inputValue}
                                onValueChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
                            />
                        </div>
                        <CommandList className="max-h-[200px]">
                            {filteredSuggestions.length === 0 ? (
                                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                    {emptyMessage}
                                    {allowCustomInput && inputValue && (
                                        <div className="mt-2">
                                            <Badge
                                                variant="outline"
                                                className="cursor-pointer hover:bg-primary/10 transition-colors"
                                                onClick={() => handleSelect(inputValue)}
                                            >
                                                Use "{inputValue}"
                                            </Badge>
                                        </div>
                                    )}
                                </CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {allowCustomInput && inputValue && !filteredSuggestions.includes(inputValue) && (
                                        <CommandItem
                                            value={inputValue}
                                            onSelect={() => handleSelect(inputValue)}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    Custom
                                                </Badge>
                                                <span>"{inputValue}"</span>
                                            </div>
                                        </CommandItem>
                                    )}
                                    {filteredSuggestions.map((suggestion, index) => (
                                        <CommandItem
                                            key={`${suggestion}-${index}`}
                                            value={suggestion}
                                            onSelect={() => handleSelect(suggestion)}
                                            className="flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                                        >
                                            <span>{suggestion}</span>
                                            {value === suggestion && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
} 