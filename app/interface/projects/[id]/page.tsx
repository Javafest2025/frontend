import { ProjectLayout } from "@/components/interface/ProjectLayout"
import { redirect } from "next/navigation"

interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params

    // Redirect to overview by default when project is opened
    redirect(`/interface/projects/${id}/overview`)
} 