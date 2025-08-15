import { ProjectLayoutWrapper } from "@/components/interface/ProjectLayoutWrapper"
import { isValidUUID } from "@/lib/utils"

interface ProjectLayoutProps {
    children: React.ReactNode
    params: Promise<{
        id: string
    }>
}

export default async function Layout({ children, params }: ProjectLayoutProps) {
    const { id } = await params

    // Validate project ID format
    if (!isValidUUID(id)) {
        console.error('Invalid project ID in layout:', id)
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Project ID</h1>
                    <p className="text-muted-foreground">
                        The project ID "{id}" is not in a valid format.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Please check the URL and try again.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ProjectLayoutWrapper projectId={id}>
            {children}
        </ProjectLayoutWrapper>
    )
} 