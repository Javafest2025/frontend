"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Palette, Check, RotateCcw } from 'lucide-react'
import {
    hexToHsl,
    hslToHex,
    hexToRgb,
    rgbToHex,
    hslToCssString,
    parseCssHsl,
    isValidHex,
    COLOR_PRESETS,
    type HSLColor,
    type RGBColor
} from '@/lib/utils/color'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
    onChangeComplete?: (color: string) => void
    presets?: typeof COLOR_PRESETS
    className?: string
    disabled?: boolean
}

export function ColorPicker({
    value,
    onChange,
    onChangeComplete,
    presets = COLOR_PRESETS,
    className,
    disabled = false
}: Readonly<ColorPickerProps>) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentColor, setCurrentColor] = useState(value)
    const [hsl, setHsl] = useState<HSLColor>({ h: 0, s: 0, l: 0 })
    const [rgb, setRgb] = useState<RGBColor>({ r: 0, g: 0, b: 0 })
    const [hex, setHex] = useState('#000000')
    const [activeTab, setActiveTab] = useState('presets')

    const hueRef = useRef<HTMLDivElement>(null)

    const updateFromValue = useCallback((newValue: string) => {
        if (!newValue) return

        let hslColor: HSLColor
        let hexColor: string

        if (newValue.startsWith('hsl')) {
            const parsed = parseCssHsl(newValue)
            if (parsed) {
                hslColor = parsed
                hexColor = hslToHex(parsed.h, parsed.s, parsed.l)
            } else {
                return
            }
        } else if (newValue.startsWith('#')) {
            if (!isValidHex(newValue)) return
            hexColor = newValue
            hslColor = hexToHsl(newValue)
        } else {
            return
        }

        const rgbColor = hexToRgb(hexColor)

        setHsl(hslColor)
        setRgb(rgbColor)
        setHex(hexColor)
        setCurrentColor(newValue)
    }, [])

    // Initialize color values when component mounts or value changes
    useEffect(() => {
        updateFromValue(value)
    }, [value, updateFromValue])

    const handleColorChange = useCallback((newColor: string, format: 'hsl' | 'hex' = 'hsl') => {
        if (disabled) return

        updateFromValue(newColor)
        onChange(newColor)
    }, [disabled, onChange, updateFromValue])

    const handleComplete = useCallback(() => {
        onChangeComplete?.(currentColor)
        setIsOpen(false)
    }, [currentColor, onChangeComplete])

    const handleHslChange = useCallback((newHsl: Partial<HSLColor>) => {
        const updatedHsl = { ...hsl, ...newHsl }
        const hslString = hslToCssString(updatedHsl.h, updatedHsl.s, updatedHsl.l)
        handleColorChange(hslString)
    }, [hsl, handleColorChange])

    const handleRgbChange = useCallback((newRgb: Partial<RGBColor>) => {
        const updatedRgb = { ...rgb, ...newRgb }
        const hexString = rgbToHex(updatedRgb.r, updatedRgb.g, updatedRgb.b)
        handleColorChange(hexString, 'hex')
    }, [rgb, handleColorChange])

    const handleHexChange = useCallback((newHex: string) => {
        if (isValidHex(newHex)) {
            handleColorChange(newHex, 'hex')
        }
    }, [handleColorChange])

    const handlePresetSelect = useCallback((preset: typeof COLOR_PRESETS[0]) => {
        handleColorChange(preset.color)
    }, [handleColorChange])

    const handleCanvasInteraction = useCallback((
        canvas: HTMLDivElement | null,
        event: React.MouseEvent | MouseEvent,
        type: 'saturation' | 'hue' | 'lightness'
    ) => {
        if (!canvas || disabled) return

        const rect = canvas.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))

        if (type === 'saturation') {
            handleHslChange({ s: Math.round(x * 100), l: Math.round((1 - y) * 100) })
        } else if (type === 'hue') {
            handleHslChange({ h: Math.round(x * 360) })
        } else if (type === 'lightness') {
            handleHslChange({ l: Math.round((1 - y) * 100) })
        }
    }, [disabled, handleHslChange])

    const resetToDefault = useCallback(() => {
        const defaultColor = COLOR_PRESETS[0].color
        handleColorChange(defaultColor)
    }, [handleColorChange])

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !currentColor && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: currentColor }}
                        />
                        <Palette className="w-4 h-4" />
                        <span className="truncate">Pick Color</span>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Color Picker</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetToDefault}
                                className="h-6 w-6 p-0"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </Button>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="presets">Presets</TabsTrigger>
                                <TabsTrigger value="custom">Custom</TabsTrigger>
                            </TabsList>

                            <TabsContent value="presets" className="space-y-4 mt-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => handlePresetSelect(preset)}
                                            className={cn(
                                                "w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-all duration-200 hover:scale-105 relative group",
                                                currentColor === preset.color && "border-primary ring-2 ring-primary/20"
                                            )}
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.name}
                                        >
                                            {currentColor === preset.color && (
                                                <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="custom" className="space-y-4 mt-4">
                                {/* Color Preview */}
                                <div className="h-16 rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
                                    <div
                                        className="absolute inset-0"
                                        style={{ backgroundColor: currentColor }}
                                    />
                                    <div className="relative z-10 text-center">
                                        <div
                                            className="text-sm font-medium drop-shadow-sm"
                                            style={{
                                                color: (() => {
                                                    if (!currentColor) return '#fff'
                                                    const colorToCheck = currentColor.startsWith('#') ? currentColor : hslToHex(hsl.h, hsl.s, hsl.l)
                                                    const lightness = hexToHsl(colorToCheck).l
                                                    return lightness > 50 ? '#000' : '#fff'
                                                })()
                                            }}
                                        >
                                            Preview
                                        </div>
                                    </div>
                                </div>

                                {/* HSL Sliders */}
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Hue: {hsl.h}°</Label>
                                        <button
                                            ref={hueRef}
                                            type="button"
                                            className="w-full h-4 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            style={{
                                                background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
                                            }}
                                            onClick={(e) => handleCanvasInteraction(hueRef.current, e, 'hue')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowLeft') {
                                                    e.preventDefault()
                                                    handleHslChange({ h: Math.max(0, hsl.h - 1) })
                                                } else if (e.key === 'ArrowRight') {
                                                    e.preventDefault()
                                                    handleHslChange({ h: Math.min(360, hsl.h + 1) })
                                                }
                                            }}
                                            aria-label={`Hue slider, current value ${hsl.h} degrees`}
                                        >
                                            <div
                                                className="w-2 h-full bg-white border border-gray-300 rounded-sm shadow-sm pointer-events-none"
                                                style={{ marginLeft: `${(hsl.h / 360) * 100}%`, transform: 'translateX(-50%)' }}
                                            />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Saturation: {hsl.s}%</Label>
                                        <button
                                            type="button"
                                            className="w-full h-4 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            style={{
                                                background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`
                                            }}
                                            onClick={(e) => handleCanvasInteraction(e.currentTarget, e, 'saturation')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowLeft') {
                                                    e.preventDefault()
                                                    handleHslChange({ s: Math.max(0, hsl.s - 1) })
                                                } else if (e.key === 'ArrowRight') {
                                                    e.preventDefault()
                                                    handleHslChange({ s: Math.min(100, hsl.s + 1) })
                                                }
                                            }}
                                            aria-label={`Saturation slider, current value ${hsl.s} percent`}
                                        >
                                            <div
                                                className="w-2 h-full bg-white border border-gray-300 rounded-sm shadow-sm pointer-events-none"
                                                style={{ marginLeft: `${hsl.s}%`, transform: 'translateX(-50%)' }}
                                            />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Lightness: {hsl.l}%</Label>
                                        <button
                                            type="button"
                                            className="w-full h-4 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            style={{
                                                background: `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`
                                            }}
                                            onClick={(e) => handleCanvasInteraction(e.currentTarget, e, 'lightness')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowLeft') {
                                                    e.preventDefault()
                                                    handleHslChange({ l: Math.max(0, hsl.l - 1) })
                                                } else if (e.key === 'ArrowRight') {
                                                    e.preventDefault()
                                                    handleHslChange({ l: Math.min(100, hsl.l + 1) })
                                                }
                                            }}
                                            aria-label={`Lightness slider, current value ${hsl.l} percent`}
                                        >
                                            <div
                                                className="w-2 h-full bg-white border border-gray-300 rounded-sm shadow-sm pointer-events-none"
                                                style={{ marginLeft: `${hsl.l}%`, transform: 'translateX(-50%)' }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Color Input Fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Hex</Label>
                                        <Input
                                            value={hex}
                                            onChange={(e) => handleHexChange(e.target.value)}
                                            placeholder="#000000"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">HSL</Label>
                                        <Input
                                            value={hslToCssString(hsl.h, hsl.s, hsl.l)}
                                            readOnly
                                            className="h-8 text-xs font-mono bg-muted"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">R</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.r}
                                            onChange={(e) => handleRgbChange({ r: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">G</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.g}
                                            onChange={(e) => handleRgbChange({ g: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">B</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.b}
                                            onChange={(e) => handleRgbChange({ b: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex gap-2 pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleComplete}
                                className="flex-1"
                            >
                                Apply
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    )
}
