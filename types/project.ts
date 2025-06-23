export enum ProjectStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED'
}

export interface Project {
    id: string
    name: string
    description?: string
    domain?: string
    topics?: string[]
    tags?: string[]
    userId: string
    status: ProjectStatus
    progress: number
    totalPapers: number
    activeTasks: number
    createdAt: string
    updatedAt: string
    lastActivity?: string
    isStarred: boolean
}

export interface APIResponse<T> {
    timestamp: string
    status: number
    message: string
    data: T
}

export interface CreateProjectRequest {
    name: string
    description?: string
    domain?: string
    topics?: string[]
    tags?: string[]
}

export interface UpdateProjectRequest {
    name?: string
    description?: string
    domain?: string
    topics?: string[]
    tags?: string[]
    status?: ProjectStatus
    progress?: number
    lastActivity?: string
    isStarred?: boolean
}

export interface ProjectFormData {
    name: string
    description: string
    domain: string
    topics: string
    tags: string
}

export interface ProjectStats {
    active: number
    paused: number
    completed: number
    archived: number
    total: number
} 