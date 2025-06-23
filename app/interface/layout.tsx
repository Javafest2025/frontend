'use client'

import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

export default function InterfaceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isProjectRoute = pathname.includes('/projects/')

    return (
        <ProtectedRoute>
            {isProjectRoute ? (
                children
            ) : (
                <MainLayout>
                    {children}
                </MainLayout>
            )}
        </ProtectedRoute>
    )
} 