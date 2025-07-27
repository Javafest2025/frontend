import { useSettings } from '@/contexts/SettingsContext'

export const useGlowEffects = () => {
  const { settings } = useSettings()
  
  return {
    glowEnabled: settings.enableGlowEffects,
    // Helper function to conditionally apply glow styles
    withGlow: <T>(withGlowValue: T, withoutGlowValue: T): T => {
      return settings.enableGlowEffects ? withGlowValue : withoutGlowValue
    }
  }
} 