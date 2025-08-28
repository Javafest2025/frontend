"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings,
    Palette,
    Monitor,
    Zap,
    Eye,
    Sun,
    Moon,
    Palette as PaletteIcon,
    Eye as EyeIcon,
    Volume2,
    RotateCcw,
    Save,
    Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/contexts/SettingsContext"
import { ColorPicker } from "@/components/ui/color-picker"
import { COLOR_PRESETS } from "@/lib/utils/color"

interface SettingsState {
    // Theme & Appearance
    theme: 'light' | 'dark'
    colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'yellow' | 'indigo' | 'teal' | 'cyan' | 'custom'
    customAccentColor: string

    // UI Preferences
    sidebarCollapsed: boolean
    showTooltips: boolean

    // Animations & Effects
    enableGlowEffects: boolean



    // Notifications
    soundEnabled: boolean
    desktopNotifications: boolean
    emailNotifications: boolean

    // Data & Privacy
    analyticsEnabled: boolean
    crashReporting: boolean
    telemetryEnabled: boolean
}

const defaultSettings: SettingsState = {
    theme: 'dark',
    colorScheme: 'blue',
    customAccentColor: 'hsl(221.2 83.2% 53.3%)',
    sidebarCollapsed: false,
    showTooltips: true,
    enableGlowEffects: true,

    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
    analyticsEnabled: true,
    crashReporting: true,
    telemetryEnabled: false
}

// Helper function to get current color value
const getCurrentColorValue = (settings: any) => {
    if (settings.colorScheme === 'custom') {
        return settings.customAccentColor
    }
    const preset = COLOR_PRESETS.find(p => p.name === settings.colorScheme)
    return preset?.color || COLOR_PRESETS[0].color
}

// Helper function to get color display value
const getColorDisplayValue = (settings: any) => {
    if (settings.colorScheme === 'custom') {
        return 'Custom'
    }
    return settings.colorScheme.charAt(0).toUpperCase() + settings.colorScheme.slice(1)
}

export default function SettingsPage() {
    const { settings, updateSetting, resetSettings, saveSettings, hasUnsavedChanges } = useSettings()
    const { toast } = useToast()

    const handleSaveSettings = () => {
        saveSettings()
        toast({
            title: "Settings saved",
            description: "Your preferences have been saved successfully.",
        })
    }

    const handleResetSettings = () => {
        resetSettings()
        toast({
            title: "Settings reset",
            description: "Settings have been reset to default values (Dark theme, Blue accent).",
        })
    }

    const handleColorChange = (color: string) => {
        // Check if the color matches any preset
        const matchingPreset = COLOR_PRESETS.find(preset => preset.color === color)

        if (matchingPreset) {
            // If it matches a preset, use that preset name
            updateSetting('colorScheme', matchingPreset.name as any)
        } else {
            // If it's a custom color, set custom scheme and store the color
            updateSetting('colorScheme', 'custom')
            updateSetting('customAccentColor', color)
        }
    }



    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 container mx-auto px-6 py-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gradient-primary flex items-center gap-2">
                                <Settings className="h-6 w-6 text-primary" />
                                Settings
                                <div
                                    className="w-4 h-4 rounded-full border-2 border-primary/40 ml-2"
                                    style={{
                                        backgroundColor: getCurrentColorValue(settings)
                                    }}
                                />
                                {hasUnsavedChanges && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                        <span className="text-xs text-orange-500 font-medium">Unsaved</span>
                                    </div>
                                )}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Customize your ScholarAI experience
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleResetSettings}
                                className="bg-background/40 backdrop-blur-xl border-2 border-primary/30"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={!hasUnsavedChanges}
                                className={`transition-all duration-200 ${hasUnsavedChanges
                                    ? 'bg-background/40 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-foreground font-semibold shadow-lg hover:shadow-xl'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    }`}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Tabs defaultValue="appearance" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2 bg-background/40 backdrop-blur-xl border-2 border-primary/25">
                            <TabsTrigger value="appearance" className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                <span className="hidden sm:inline">Appearance</span>
                            </TabsTrigger>
                            <TabsTrigger value="interface" className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                <span className="hidden sm:inline">Interface</span>
                            </TabsTrigger>


                        </TabsList>

                        {/* Appearance Settings */}
                        <TabsContent value="appearance" className="space-y-4">
                            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/25 p-4">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <PaletteIcon className="h-5 w-5 text-primary" />
                                        Theme & Colors
                                    </CardTitle>
                                    <CardDescription>
                                        Customize the visual appearance of ScholarAI
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Theme</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Choose your preferred color theme
                                                </p>
                                            </div>
                                            <Select value={settings.theme} onValueChange={(value: 'light' | 'dark') => updateSetting('theme', value)}>
                                                <SelectTrigger className="w-48">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">
                                                        <div className="flex items-center gap-2">
                                                            <Sun className="h-4 w-4 text-yellow-500" />
                                                            Light
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="dark">
                                                        <div className="flex items-center gap-2">
                                                            <Moon className="h-4 w-4 text-blue-400" />
                                                            Dark
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Accent Color</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Choose your preferred accent color
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">Current:</span>
                                                    <div
                                                        className="w-3 h-3 rounded-full border-2 border-primary/30"
                                                        style={{
                                                            backgroundColor: getCurrentColorValue(settings)
                                                        }}
                                                    />
                                                    <span className="text-xs font-medium capitalize">
                                                        {getColorDisplayValue(settings)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ColorPicker
                                                    value={getCurrentColorValue(settings)}
                                                    onChange={handleColorChange}
                                                    onChangeComplete={handleColorChange}
                                                    presets={COLOR_PRESETS}
                                                    className="w-auto"
                                                />
                                            </div>
                                        </div>


                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/25 p-4">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Animations & Effects
                                    </CardTitle>
                                    <CardDescription>
                                        Control motion and visual effects
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Glow Effects</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Enable glowing borders and shadows
                                                </p>
                                                {/* Preview of glow effects */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div
                                                        className={`w-4 h-4 rounded-full border transition-all duration-300 ${settings.enableGlowEffects
                                                            ? 'shadow-primary border-primary/30'
                                                            : 'shadow-none border-2 border-primary/30'
                                                            }`}
                                                        style={{
                                                            backgroundColor: getCurrentColorValue(settings)
                                                        }}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {settings.enableGlowEffects ? 'Glow enabled' : 'Glow disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settings.enableGlowEffects}
                                                onCheckedChange={(checked) => updateSetting('enableGlowEffects', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Interface Settings */}
                        <TabsContent value="interface" className="space-y-4">
                            <Card className="bg-background/40 backdrop-blur-xl border-2 border-primary/25 p-4">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Monitor className="h-5 w-5 text-primary" />
                                        Interface Preferences
                                    </CardTitle>
                                    <CardDescription>
                                        Customize how the interface behaves
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Show Tooltips</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Display helpful tooltips throughout the application
                                                </p>
                                                {/* Preview of tooltip functionality */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-4 h-4 rounded-full border-2 border-primary/30 flex items-center justify-center">
                                                        <span className="text-xs text-primary">?</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {settings.showTooltips ? 'Tooltips enabled' : 'Tooltips disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settings.showTooltips}
                                                onCheckedChange={(checked) => updateSetting('showTooltips', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>






                    </Tabs>
                </motion.div>
            </div>
        </div>
    )
} 