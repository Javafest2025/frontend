/**
 * Color utility functions for format conversion and validation
 */

export interface HSLColor {
    h: number
    s: number
    l: number
}

export interface RGBColor {
    r: number
    g: number
    b: number
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): HSLColor {
    // Remove # if present
    hex = hex.replace('#', '')

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h: number, s: number, l: number

    l = (max + min) / 2

    if (max === min) {
        h = s = 0 // achromatic
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
            default: h = 0
        }
        h /= 6
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    }
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }

    let r: number, g: number, b: number

    if (s === 0) {
        r = g = b = l // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGBColor {
    hex = hex.replace('#', '')

    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    }
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
        const hex = Math.round(c).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert HSL to CSS hsl() string
 */
export function hslToCssString(h: number, s: number, l: number): string {
    return `hsl(${h} ${s}% ${l}%)`
}

/**
 * Convert HSL to CSS variable format (without hsl wrapper)
 */
export function hslToCssVariable(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`
}

/**
 * Parse CSS hsl() string to HSL object
 */
export function parseCssHsl(hslString: string): HSLColor | null {
    const match = hslString.match(/hsl\(\s*(\d+)\s+(\d+)%\s+(\d+)%\s*\)/)
    if (!match) return null

    return {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3])
    }
}

/**
 * Convert any color format to CSS variable format (H S% L%)
 */
export function toCssVariable(color: string): string {
    if (color.startsWith('hsl(')) {
        const hsl = parseCssHsl(color)
        if (hsl) {
            return hslToCssVariable(hsl.h, hsl.s, hsl.l)
        }
    } else if (color.startsWith('#')) {
        const hsl = hexToHsl(color)
        return hslToCssVariable(hsl.h, hsl.s, hsl.l)
    }

    // If it's already in the correct format, return as is
    return color
}

/**
 * Validate hex color format
 */
export function isValidHex(hex: string): boolean {
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    return hexRegex.test(hex)
}

/**
 * Get contrasting text color (black or white) for a given background color
 */
export function getContrastingTextColor(bgColor: string): string {
    // Convert to RGB first
    let rgb: RGBColor

    if (bgColor.startsWith('#')) {
        rgb = hexToRgb(bgColor)
    } else if (bgColor.startsWith('hsl')) {
        const hsl = parseCssHsl(bgColor)
        if (!hsl) return '#ffffff'
        const hex = hslToHex(hsl.h, hsl.s, hsl.l)
        rgb = hexToRgb(hex)
    } else {
        return '#ffffff' // Default to white
    }

    // Calculate relative luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255

    return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Predefined color presets
 */
export const COLOR_PRESETS = [
    { name: 'blue', color: 'hsl(221.2 83.2% 53.3%)', hex: '#3B82F6' },
    { name: 'purple', color: 'hsl(262.1 83.3% 57.8%)', hex: '#8B5CF6' },
    { name: 'green', color: 'hsl(142.1 76.2% 36.3%)', hex: '#10B981' },
    { name: 'orange', color: 'hsl(24.6 95% 53.1%)', hex: '#F97316' },
    { name: 'pink', color: 'hsl(346.8 77.2% 49.8%)', hex: '#EC4899' },
    { name: 'red', color: 'hsl(0 84.2% 60.2%)', hex: '#EF4444' },
    { name: 'yellow', color: 'hsl(47.9 95.8% 53.1%)', hex: '#EAB308' },
    { name: 'indigo', color: 'hsl(238.7 83.5% 66.7%)', hex: '#6366F1' },
    { name: 'teal', color: 'hsl(173.4 80.4% 40%)', hex: '#14B8A6' },
    { name: 'cyan', color: 'hsl(188.7 85% 53.3%)', hex: '#06B6D4' }
] as const
