import { ProjectLayout } from "@/components/interface/ProjectLayout"

interface ProjectLayoutProps {
    children: React.ReactNode
    params: Promise<{
        id: string
    }>
}

export default async function Layout({ children, params }: ProjectLayoutProps) {
    const { id } = await params

    return (
        <ProjectLayout projectId={id}>
            {children}
        </ProjectLayout>
    )
} 