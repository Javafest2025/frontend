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
    theme?: 'primary' | 'purple' | 'green' | 'orange'
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
    showSuggestionsIcon = true,
    theme = 'primary'
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

    const getThemeColors = (theme: string) => {
        switch (theme) {
            case 'purple':
                return {
                    border: 'border-purple-500/20',
                    borderHover: 'hover:border-purple-500/40',
                    borderFocus: 'focus:border-purple-500/60',
                    scrollbar: 'scrollbar-thumb-purple-500/20 hover:scrollbar-thumb-purple-500/30',
                    icon: 'text-purple-500/60',
                    hover: 'hover:from-purple-500/10 hover:to-violet-500/10',
                    borderLeft: 'hover:border-l-purple-500',
                    iconHover: 'group-hover:text-purple-500'
                }
            case 'green':
                return {
                    border: 'border-green-500/20',
                    borderHover: 'hover:border-green-500/40',
                    borderFocus: 'focus:border-green-500/60',
                    scrollbar: 'scrollbar-thumb-green-500/20 hover:scrollbar-thumb-green-500/30',
                    icon: 'text-green-500/60',
                    hover: 'hover:from-green-500/10 hover:to-emerald-500/10',
                    borderLeft: 'hover:border-l-green-500',
                    iconHover: 'group-hover:text-green-500'
                }
            case 'orange':
                return {
                    border: 'border-orange-500/20',
                    borderHover: 'hover:border-orange-500/40',
                    borderFocus: 'focus:border-orange-500/60',
                    scrollbar: 'scrollbar-thumb-orange-500/20 hover:scrollbar-thumb-orange-500/30',
                    icon: 'text-orange-500/60',
                    hover: 'hover:from-orange-500/10 hover:to-amber-500/10',
                    borderLeft: 'hover:border-l-orange-500',
                    iconHover: 'group-hover:text-orange-500'
                }
            default:
                return {
                    border: 'border-primary/20',
                    borderHover: 'hover:border-primary/40',
                    borderFocus: 'focus:border-primary/60',
                    scrollbar: 'scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30',
                    icon: 'text-primary/60',
                    hover: 'hover:from-primary/10 hover:to-purple-500/10',
                    borderLeft: 'hover:border-l-primary',
                    iconHover: 'group-hover:text-primary'
                }
        }
    }

    const themeColors = getThemeColors(theme)

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
                            `w-full justify-between text-left font-normal bg-background/40 backdrop-blur-xl ${themeColors.border} ${themeColors.borderHover} ${themeColors.borderFocus} transition-all duration-300`,
                            !inputValue && "text-muted-foreground",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {showSuggestionsIcon && (
                                <Sparkles className={`h-4 w-4 ${themeColors.icon} shrink-0`} />
                            )}
                            <span className="truncate">
                                {inputValue || placeholder}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-[--radix-popover-trigger-width] max-w-[90vw] p-0 bg-background/95 backdrop-blur-xl ${themeColors.border}`}>
                    <Command>
                        <div className="flex items-center border-b border-primary/10 px-3">
                            {showSuggestionsIcon && (
                                <Sparkles className={`mr-2 h-4 w-4 shrink-0 ${themeColors.icon}`} />
                            )}
                            <CommandInput
                                placeholder={placeholder}
                                value={inputValue}
                                onValueChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={`flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:text-primary`}
                            />
                        </div>
                        <CommandList className={`max-h-[200px] scrollbar-thin scrollbar-track-transparent ${themeColors.scrollbar}`}>
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
                                            className={`flex items-center gap-2 cursor-pointer hover:bg-gradient-to-r ${themeColors.hover} transition-all duration-200 border-l-2 border-l-transparent ${themeColors.borderLeft}`}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30">
                                                    Custom
                                                </Badge>
                                                <span className="font-medium">"{inputValue}"</span>
                                            </div>
                                        </CommandItem>
                                    )}
                                    {filteredSuggestions.map((suggestion, index) => (
                                        <CommandItem
                                            key={`${suggestion}-${index}`}
                                            value={suggestion}
                                            onSelect={() => handleSelect(suggestion)}
                                            className={`flex items-center justify-between cursor-pointer hover:bg-gradient-to-r ${themeColors.hover} transition-all duration-200 border-l-2 border-l-transparent ${themeColors.borderLeft} group`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className={`h-3 w-3 ${themeColors.icon} ${themeColors.iconHover} transition-colors`} />
                                                <span className="group-hover:font-medium transition-all duration-200">{suggestion}</span>
                                            </div>
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