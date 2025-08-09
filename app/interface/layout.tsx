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
    const isProjectRoute = pathname.includes('/projects/')

    return (
        <SettingsProvider>
            <TooltipProvider>
                <ProtectedRoute>
                    {isProjectRoute ? (
                        children
                    ) : (
                        <MainLayout>
                            {children}
                        </MainLayout>
                    )}
                </ProtectedRoute>
            </TooltipProvider>
        </SettingsProvider>
    )
} 