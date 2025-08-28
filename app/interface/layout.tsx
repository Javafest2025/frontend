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