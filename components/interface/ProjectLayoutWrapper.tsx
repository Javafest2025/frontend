"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { ProjectLayout } from "./ProjectLayout"

interface ProjectLayoutWrapperProps {
    children: React.ReactNode
    projectId: string
}

export function ProjectLayoutWrapper({ children, projectId }: ProjectLayoutWrapperProps) {
    const pathname = usePathname()

    // Check if we're on the LaTeX editor page
    const isLatexEditorPage = pathname.includes('/latex-editor')

    // Check if we're on the summary page - render without project layout
    const isSummaryPage = pathname.includes('/summary')

    if (isSummaryPage) {
        return <>{children}</>
    }

    return (
        <ProjectLayout
            projectId={projectId}
            autoCollapseSidebar={isLatexEditorPage}
            hideHeader={isLatexEditorPage}
        >
            {children}
        </ProjectLayout>
    )
}

