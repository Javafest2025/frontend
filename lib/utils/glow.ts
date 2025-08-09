// Utility functions for handling glow effects based on user settings

export const getGlowStyles = (enabled: boolean = true) => {
    if (!enabled) {
        return {
            boxShadow: 'none',
            textShadow: 'none'
        }
    }

    return {
        boxShadow: '0 0 20px hsl(var(--accent-1) / 0.3), 0 0 40px hsl(var(--accent-2) / 0.15)',
        textShadow: 'none'
    }
}

export const getGlowButtonStyles = (enabled: boolean = true) => {
    if (!enabled) {
        return {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid hsl(var(--primary) / 0.2)'
        }
    }

    return {
        boxShadow: '0 0 15px hsl(var(--accent-1) / 0.4), 0 0 30px hsl(var(--accent-2) / 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid hsl(var(--primary) / 0.3)'
    }
}

export const getGlowCardStyles = (enabled: boolean = true) => {
    if (!enabled) {
        return {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid hsl(var(--primary) / 0.1)'
        }
    }

    return {
        boxShadow: '0 0 20px hsl(var(--accent-1) / 0.15), 0 0 40px hsl(var(--accent-2) / 0.08)',
        border: '1px solid hsl(var(--primary) / 0.15)'
    }
}

export const getGlowProgressStyles = (enabled: boolean = true) => {
    if (!enabled) {
        return {
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
        }
    }

    return {
        boxShadow: '0 0 10px hsl(var(--accent-1) / 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
    }
}

export const getGlowBackgroundStyles = (enabled: boolean = true) => {
    if (!enabled) {
        return {
            background: 'none'
        }
    }

    return {
        background: 'radial-gradient(circle, hsl(var(--accent-1) / 0.1), hsl(var(--accent-2) / 0.05), transparent)'
    }
} 