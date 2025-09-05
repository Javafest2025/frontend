import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import {
    Project,
    CreateProjectRequest,
    UpdateProjectRequest,
    APIResponse,
    ProjectStats,
    Collaborator,
    AddCollaboratorRequest,
    CollaboratorResponse,
    Note,
    CreateNoteRequest,
    UpdateNoteRequest,
    ReadingListItem,
    CreateReadingListItemRequest,
    UpdateReadingListItemRequest,
    ReadingListStats,
    BulkReadingListUpdate,
} from "@/types/project"

// Helper function to handle API response
const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        // Try to parse error response as JSON, fallback to text
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
            // If JSON parsing fails, try to get text content
            try {
                const textContent = await response.text()
                errorMessage = textContent || errorMessage
            } catch {
                // If all else fails, use the status-based message
            }
        }
        throw new Error(errorMessage)
    }

    // Try to parse the response as JSON
    let apiResponse: APIResponse<T>
    try {
        const jsonData = await response.json()
        apiResponse = jsonData
    } catch (error) {
        throw new Error("Invalid JSON response from server")
    }

    // Handle different response structures
    if (apiResponse.data !== undefined) {
        // Check if data has an 'items' property (for paginated responses)
        if (apiResponse.data && typeof apiResponse.data === 'object' && 'items' in apiResponse.data) {
            return (apiResponse.data as any).items
        }
        // Return the data directly
        return apiResponse.data
    } else if (Array.isArray(apiResponse)) {
        // Direct array response
        return apiResponse as unknown as T
    } else {
        // If no data property, return the whole response
        return apiResponse as unknown as T
    }
}

export const projectsApi = {
    // Get all projects for the authenticated user
    async getProjects(): Promise<Project[]> {
        try {
            console.log("🔍 Fetching projects...")
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects?userId=${userData.id}`)
            )

            console.log("📊 Projects response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Projects fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Projects data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get projects error:", error)
            throw error
        }
    },

    // Get project by ID
    async getProject(id: string, silent: boolean = false): Promise<Project> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            if (!silent) {
                console.log("🔍 Fetching project:", id)
            }
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}?userId=${userData.id}`)
            )

            if (!silent) {
                console.log("📊 Project response status:", response.status, response.statusText)
            }

            if (!response.ok) {
                const errorText = await response.text()
                if (!silent) {
                    console.error("❌ Project fetch failed:", response.status, errorText)
                }
                // Provide more specific error messages
                if (response.status === 404) {
                    throw new Error(`Project not found or access denied: ${id}`)
                }
                throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            if (!silent) {
                console.log("✅ Project data received:", data)
            }
            return data.data
        } catch (error) {
            if (!silent) {
                console.error("Get project error:", error)
            }
            throw error
        }
    },

    // Get projects by status
    async getProjectsByStatus(status: string): Promise<Project[]> {
        try {
            console.log("🔍 Fetching projects by status:", status)
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/status/${status}?userId=${userData.id}`)
            )

            console.log("📊 Projects by status response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Projects by status fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch projects by status: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Projects by status data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get projects by status error:", error)
            throw error
        }
    },

    // Get starred projects
    async getStarredProjects(): Promise<Project[]> {
        try {
            console.log("🔍 Fetching starred projects...")
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/starred?userId=${userData.id}`)
            )

            console.log("📊 Starred projects response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Starred projects fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch starred projects: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Starred projects data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get starred projects error:", error)
            throw error
        }
    },

    // Get project statistics
    async getProjectStats(): Promise<ProjectStats> {
        try {
            console.log("🔍 Fetching project statistics...")
            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/stats?userId=${userData.id}`)
            )

            console.log("📊 Project stats response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Project stats fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch project stats: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Project stats data received:", data)
            return data.data
        } catch (error) {
            console.error("Get project stats error:", error)
            throw error
        }
    },

    // Create a new project
    async createProject(projectData: CreateProjectRequest): Promise<Project> {
        try {
            console.log("🔍 Creating project:", projectData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/projects"),
                {
                    method: "POST",
                    body: JSON.stringify(projectData),
                }
            )

            console.log("📊 Create project response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Create project failed:", response.status, errorText)
                throw new Error(`Failed to create project: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Project created successfully:", data)
            return data.data
        } catch (error) {
            console.error("Create project error:", error)
            throw error
        }
    },

    // Update an existing project
    async updateProject(id: string, projectData: UpdateProjectRequest): Promise<Project> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            console.log("🔍 Updating project:", id, projectData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}`),
                {
                    method: "PUT",
                    body: JSON.stringify(projectData),
                }
            )

            console.log("📊 Update project response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update project failed:", response.status, errorText)
                throw new Error(`Failed to update project: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Project updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Update project error:", error)
            throw error
        }
    },

    // Delete a project
    async deleteProject(id: string): Promise<void> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("🔍 Deleting project:", id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}?userId=${userData.id}`),
                {
                    method: "DELETE",
                }
            )

            console.log("📊 Delete project response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Delete project failed:", response.status, errorText)
                throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`)
            }

            console.log("✅ Project deleted successfully")
        } catch (error) {
            console.error("Delete project error:", error)
            throw error
        }
    },

    // Toggle project star status
    async toggleStar(id: string): Promise<Project> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            const { getUserData } = await import("@/lib/api/user-service/auth")
            const userData = getUserData()

            if (!userData?.id) {
                throw new Error('User not authenticated')
            }

            console.log("🔍 Toggling star for project:", id)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}/toggle-star?userId=${userData.id}`),
                {
                    method: "POST",
                }
            )

            console.log("📊 Toggle star response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle star failed:", response.status, errorText)
                throw new Error(`Failed to toggle star: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Star toggled successfully:", data)
            return data.data
        } catch (error) {
            console.error("Toggle star error:", error)
            throw error
        }
    },

    // Update project paper count
    async updatePaperCount(id: string, totalPapers: number): Promise<void> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            console.log("🔍 Updating paper count for project:", id, totalPapers)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}/paper-count?totalPapers=${totalPapers}`),
                {
                    method: "PUT",
                }
            )

            console.log("📊 Update paper count response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update paper count failed:", response.status, errorText)
                throw new Error(`Failed to update paper count: ${response.status} ${response.statusText}`)
            }

            console.log("✅ Paper count updated successfully")
        } catch (error) {
            console.error("Update paper count error:", error)
            throw error
        }
    },

    // Update project active tasks count
    async updateActiveTasksCount(id: string, activeTasks: number): Promise<void> {
        try {
            // Validate project ID before making API call
            const { isValidUUID } = await import("@/lib/utils")
            if (!isValidUUID(id)) {
                throw new Error(`Invalid project ID format: ${id}`)
            }

            console.log("🔍 Updating active tasks count for project:", id, activeTasks)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${id}/active-tasks?activeTasks=${activeTasks}`),
                {
                    method: "PUT",
                }
            )

            console.log("📊 Update active tasks count response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update active tasks count failed:", response.status, errorText)
                throw new Error(`Failed to update active tasks count: ${response.status} ${response.statusText}`)
            }

            console.log("✅ Active tasks count updated successfully")
        } catch (error) {
            console.error("Update active tasks count error:", error)
            throw error
        }
    },

    // Get project collaborators
    async getCollaborators(projectId: string): Promise<Collaborator[]> {
        // Not implemented in backend yet
        return []
    },

    // Add collaborator to project
    async addCollaborator(projectId: string, collaboratorData: AddCollaboratorRequest): Promise<Collaborator> {
        // Not implemented in backend yet
        return Promise.reject(new Error("Collaborators API not available"))
    },

    // Remove collaborator from project
    async removeCollaborator(projectId: string, collaboratorEmail: string): Promise<void> {
        // Not implemented in backend yet
        return
    },

    // Update collaborator role
    async updateCollaborator(projectId: string, collaboratorEmail: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN'): Promise<Collaborator> {
        // Not implemented in backend yet
        return Promise.reject(new Error("Collaborators API not available"))
    },

    // Collaborator endpoints are not available on backend yet
    async hasCollaborators(projectId: string): Promise<boolean> {
        return false
    },

    // Quick Notes API Methods
    async getNotes(projectId: string): Promise<Note[]> {
        try {
            console.log("🔍 Fetching notes for project:", projectId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes`)
            )

            console.log("📊 Notes response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Notes fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Notes data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get notes error:", error)
            throw error
        }
    },

    async createNote(projectId: string, noteData: CreateNoteRequest): Promise<Note> {
        try {
            console.log("🔍 Creating note for project:", projectId, noteData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes`),
                {
                    method: "POST",
                    body: JSON.stringify(noteData),
                }
            )

            console.log("📊 Create note response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Create note failed:", response.status, errorText)
                throw new Error(`Failed to create note: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Note created successfully:", data)
            return data.data
        } catch (error) {
            console.error("Create note error:", error)
            throw error
        }
    },

    async updateNote(projectId: string, noteId: string, noteData: UpdateNoteRequest): Promise<Note> {
        try {
            console.log("🔍 Updating note:", projectId, noteId, noteData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}`),
                {
                    method: "PUT",
                    body: JSON.stringify(noteData),
                }
            )

            console.log("📊 Update note response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update note failed:", response.status, errorText)
                throw new Error(`Failed to update note: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Note updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Update note error:", error)
            throw error
        }
    },

    async deleteNote(projectId: string, noteId: string): Promise<void> {
        try {
            console.log("🔍 Deleting note:", projectId, noteId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}`),
                {
                    method: "DELETE",
                }
            )

            console.log("📊 Delete note response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Delete note failed:", response.status, errorText)
                throw new Error(`Failed to delete note: ${response.status} ${response.statusText}`)
            }

            console.log("✅ Note deleted successfully")
        } catch (error) {
            console.error("Delete note error:", error)
            throw error
        }
    },

    async toggleNoteFavorite(projectId: string, noteId: string): Promise<Note> {
        try {
            console.log("🔍 Toggling note favorite:", projectId, noteId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}/favorite`),
                {
                    method: "PUT",
                }
            )

            console.log("📊 Toggle note favorite response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle note favorite failed:", response.status, errorText)
                throw new Error(`Failed to toggle note favorite: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Note favorite toggled successfully:", data)
            return data.data
        } catch (error) {
            console.error("Toggle note favorite error:", error)
            throw error
        }
    },

    async searchNotesByContent(projectId: string, query: string): Promise<Note[]> {
        try {
            console.log("🔍 Searching notes by content:", projectId, query)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/search/content?q=${encodeURIComponent(query)}`)
            )

            console.log("📊 Search notes by content response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Search notes by content failed:", response.status, errorText)
                throw new Error(`Failed to search notes by content: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search notes by content data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Search notes by content error:", error)
            throw error
        }
    },

    async searchNotesByTag(projectId: string, tag: string): Promise<Note[]> {
        try {
            console.log("🔍 Searching notes by tag:", projectId, tag)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/search/tag?tag=${encodeURIComponent(tag)}`)
            )

            console.log("📊 Search notes by tag response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Search notes by tag failed:", response.status, errorText)
                throw new Error(`Failed to search notes by tag: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search notes by tag data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Search notes by tag error:", error)
            throw error
        }
    },

    async getFavoriteNotes(projectId: string): Promise<Note[]> {
        try {
            console.log("🔍 Fetching favorite notes for project:", projectId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/favorites`)
            )

            console.log("📊 Favorite notes response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Favorite notes fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch favorite notes: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Favorite notes data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get favorite notes error:", error)
            throw error
        }
    },

    // Reading List API Methods
    async getReadingList(
        projectId: string,
        options?: {
            status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
            relevance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
            isBookmarked?: boolean
            isRecommended?: boolean
            search?: string
            sortBy?: 'addedAt' | 'priority' | 'title' | 'rating' | 'difficulty'
            sortOrder?: 'asc' | 'desc'
            page?: number
            limit?: number
        }
    ): Promise<ReadingListItem[]> {
        try {
            const params = new URLSearchParams()

            if (options?.status) params.append('status', options.status)
            if (options?.priority) params.append('priority', options.priority)
            if (options?.difficulty) params.append('difficulty', options.difficulty)
            if (options?.relevance) params.append('relevance', options.relevance)
            if (options?.isBookmarked !== undefined) params.append('isBookmarked', options.isBookmarked.toString())
            if (options?.isRecommended !== undefined) params.append('isRecommended', options.isRecommended.toString())
            if (options?.search) params.append('search', options.search)
            if (options?.sortBy) params.append('sortBy', options.sortBy)
            if (options?.sortOrder) params.append('sortOrder', options.sortOrder)
            if (options?.page) params.append('page', options.page.toString())
            if (options?.limit) params.append('limit', options.limit.toString())

            const url = `/api/v1/projects/${projectId}/reading-list${params.toString() ? `?${params.toString()}` : ''}`

            console.log("🔍 Fetching reading list for project:", projectId, options)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", url)
            )

            console.log("📊 Reading list response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Reading list fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch reading list: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get reading list error:", error)
            throw error
        }
    },

    async addToReadingList(projectId: string, paperId: string, readingListData?: Partial<CreateReadingListItemRequest>): Promise<ReadingListItem> {
        try {
            console.log("🔍 Adding to reading list:", projectId, paperId, readingListData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list`),
                {
                    method: "POST",
                    body: JSON.stringify({
                        paperId,
                        ...readingListData
                    }),
                }
            )

            console.log("📊 Add to reading list response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Add to reading list failed:", response.status, errorText)
                throw new Error(`Failed to add to reading list: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Added to reading list successfully:", data)
            return data.data
        } catch (error) {
            console.error("Add to reading list error:", error)
            throw error
        }
    },

    async updateReadingListItem(projectId: string, itemId: string, updateData: UpdateReadingListItemRequest): Promise<ReadingListItem> {
        try {
            console.log("🔍 Updating reading list item:", projectId, itemId, updateData)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}`),
                {
                    method: "PUT",
                    body: JSON.stringify(updateData),
                }
            )

            console.log("📊 Update reading list item response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update reading list item failed:", response.status, errorText)
                throw new Error(`Failed to update reading list item: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list item updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Update reading list item error:", error)
            throw error
        }
    },

    async updateReadingListItemStatus(projectId: string, itemId: string, status: ReadingListItem['status']): Promise<ReadingListItem> {
        try {
            console.log("🔍 Updating reading list item status:", projectId, itemId, status)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}/status`),
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                }
            )

            console.log("📊 Update reading list item status response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update reading list item status failed:", response.status, errorText)
                throw new Error(`Failed to update reading list item status: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list item status updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Update reading list item status error:", error)
            throw error
        }
    },

    async updateReadingProgress(projectId: string, itemId: string, progress: number): Promise<ReadingListItem> {
        try {
            console.log("🔍 Updating reading progress:", projectId, itemId, progress)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}/progress`),
                {
                    method: "PATCH",
                    body: JSON.stringify({ readingProgress: progress }),
                }
            )

            console.log("📊 Update reading progress response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update reading progress failed:", response.status, errorText)
                throw new Error(`Failed to update reading progress: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading progress updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Update reading progress error:", error)
            throw error
        }
    },

    async removeFromReadingList(projectId: string, itemId: string): Promise<void> {
        try {
            console.log("🔍 Removing from reading list:", projectId, itemId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}`),
                {
                    method: "DELETE",
                }
            )

            console.log("📊 Remove from reading list response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Remove from reading list failed:", response.status, errorText)
                throw new Error(`Failed to remove from reading list: ${response.status} ${response.statusText}`)
            }

            console.log("✅ Removed from reading list successfully")
        } catch (error) {
            console.error("Remove from reading list error:", error)
            throw error
        }
    },

    async getReadingListStats(
        projectId: string,
        timeRange?: '7d' | '30d' | '90d' | 'all'
    ): Promise<ReadingListStats> {
        try {
            const params = new URLSearchParams()
            if (timeRange) params.append('timeRange', timeRange)

            const url = `/api/v1/projects/${projectId}/reading-list/stats${params.toString() ? `?${params.toString()}` : ''}`

            console.log("🔍 Fetching reading list stats for project:", projectId, timeRange)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", url)
            )

            console.log("📊 Reading list stats response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Reading list stats fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch reading list stats: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list stats data received:", data)
            return data.data
        } catch (error) {
            console.error("Get reading list stats error:", error)
            throw error
        }
    },

    async getReadingListRecommendations(
        projectId: string,
        options?: {
            limit?: number
            difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
            excludeRead?: boolean
        }
    ): Promise<ReadingListItem[]> {
        try {
            const params = new URLSearchParams()

            if (options?.limit) params.append('limit', options.limit.toString())
            if (options?.difficulty) params.append('difficulty', options.difficulty)
            if (options?.excludeRead !== undefined) params.append('excludeRead', options.excludeRead.toString())

            const url = `/api/v1/projects/${projectId}/reading-list/recommendations${params.toString() ? `?${params.toString()}` : ''}`

            console.log("🔍 Fetching reading list recommendations for project:", projectId, options)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", url)
            )

            console.log("📊 Reading list recommendations response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Reading list recommendations fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch reading list recommendations: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list recommendations data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Get reading list recommendations error:", error)
            throw error
        }
    },

    async addReadingListNote(projectId: string, itemId: string, note: string): Promise<ReadingListItem> {
        try {
            console.log("🔍 Adding note to reading list item:", projectId, itemId, note)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}/notes`),
                {
                    method: "POST",
                    body: JSON.stringify({ note }),
                }
            )

            console.log("📊 Add reading list note response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Add reading list note failed:", response.status, errorText)
                throw new Error(`Failed to add reading list note: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list note added successfully:", data)
            return data.data
        } catch (error) {
            console.error("Add reading list note error:", error)
            throw error
        }
    },

    async rateReadingListItem(projectId: string, itemId: string, rating: number): Promise<ReadingListItem> {
        try {
            console.log("🔍 Rating reading list item:", projectId, itemId, rating)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}/rating`),
                {
                    method: "PATCH",
                    body: JSON.stringify({ rating }),
                }
            )

            console.log("📊 Rate reading list item response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Rate reading list item failed:", response.status, errorText)
                throw new Error(`Failed to rate reading list item: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list item rated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Rate reading list item error:", error)
            throw error
        }
    },

    async toggleReadingListItemBookmark(projectId: string, itemId: string): Promise<ReadingListItem> {
        try {
            console.log("🔍 Toggling reading list item bookmark:", projectId, itemId)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/${itemId}/bookmark`),
                {
                    method: "PUT",
                }
            )

            console.log("📊 Toggle reading list item bookmark response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle reading list item bookmark failed:", response.status, errorText)
                throw new Error(`Failed to toggle reading list item bookmark: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list item bookmark toggled successfully:", data)
            return data.data
        } catch (error) {
            console.error("Toggle reading list item bookmark error:", error)
            throw error
        }
    },

    async bulkUpdateReadingList(projectId: string, updates: BulkReadingListUpdate[]): Promise<ReadingListItem[]> {
        try {
            console.log("🔍 Bulk updating reading list:", projectId, updates)
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/reading-list/bulk`),
                {
                    method: "PATCH",
                    body: JSON.stringify({ updates }),
                }
            )

            console.log("📊 Bulk update reading list response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Bulk update reading list failed:", response.status, errorText)
                throw new Error(`Failed to bulk update reading list: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Reading list bulk updated successfully:", data)
            return data.data || []
        } catch (error) {
            console.error("Bulk update reading list error:", error)
            throw error
        }
    }
}
