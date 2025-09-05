'use client'

import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TooltipProvider } from '@/contexts/TooltipContext'

export default function InterfaceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Check if we're on the summary page - render without main layout
    const isSummaryPage = pathname.includes('/summary')

    if (isSummaryPage) {
        return (
            <SettingsProvider>
                <TooltipProvider>
                    <ProtectedRoute>
                        {children}
                    </ProtectedRoute>
                </TooltipProvider>
            </SettingsProvider>
        )
    }

    return (
        <SettingsProvider>
            <TooltipProvider>
                <ProtectedRoute>
                    <MainLayout>
                        {children}
                    </MainLayout>
                </ProtectedRoute>
            </TooltipProvider>
        </SettingsProvider>
    )
} 