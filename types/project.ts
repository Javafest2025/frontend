import { Paper } from "@/types/websearch"

export type ProjectStatus =
    | 'ACTIVE'
    | 'PAUSED'
    | 'COMPLETED'
    | 'ARCHIVED'


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
    userId: string
    name: string
    description?: string
    domain?: string
    topics?: string[]
    tags?: string[]
}

export interface UpdateProjectRequest {
    userId: string
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

export interface Collaborator {
    id: string
    projectId: string
    collaboratorId: string
    collaboratorEmail: string
    collaboratorName: string
    ownerEmail: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
    status: 'PENDING' | 'ACTIVE' | 'DECLINED'
    createdAt: string
    invitedAt?: string
    joinedAt?: string
}

export interface AddCollaboratorRequest {
    collaboratorEmail: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
}

export interface CollaboratorResponse {
    collaborators: Collaborator[]
}

export interface Note {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    isFavorite: boolean
    tags?: string[]
}

export interface CreateNoteRequest {
    title: string
    content: string
    tags?: string[]
}

export interface UpdateNoteRequest {
    title?: string
    content?: string
    tags?: string[]
}

// Reading List Types
export interface ReadingListItem {
    id: string
    paperId: string
    paper?: Paper // Made optional since backend doesn't include it
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    addedAt: string
    startedAt?: string
    completedAt?: string
    estimatedTime?: number // in minutes
    actualTime?: number // in minutes
    notes?: string
    tags?: string[]
    rating?: number // 1-5 stars
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    readingProgress?: number // 0-100
    lastReadAt?: string
    readCount?: number
    isBookmarked?: boolean
    isRecommended?: boolean
    recommendedBy?: string
    recommendedReason?: string
}

export interface CreateReadingListItemRequest {
    paperId: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    estimatedTime?: number
    notes?: string
    tags?: string[]
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface UpdateReadingListItemRequest {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    estimatedTime?: number
    actualTime?: number
    notes?: string
    tags?: string[]
    rating?: number
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    readingProgress?: number
    isBookmarked?: boolean
}

export interface ReadingListStats {
    totalItems: number
    pendingItems: number
    inProgressItems: number
    completedItems: number
    skippedItems: number
    totalEstimatedTime: number
    totalActualTime: number
    averageRating: number
    completionRate: number
    averageReadingTime: number
    mostReadAuthor: string
    mostReadVenue: string
    topTags: string[]
    readingStreak: number
    lastActivity: string
}

export interface BulkReadingListUpdate {
    itemId: string
    updates: Partial<UpdateReadingListItemRequest>
} 