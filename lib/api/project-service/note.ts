import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import {
    Note,
    CreateNoteRequest,
    UpdateNoteRequest,
    APIResponse,
} from "@/types/project"

export interface ImageUploadResponse {
    imageId: string
    originalFilename: string
    storedFilename: string
    fileSize: number
    mimeType: string
    uploadedAt: string
    imageUrl: string
}

export interface PaperSuggestion {
    id: string
    title: string
    abstractText: string
    authors: string[]
    publicationDate: string
    venueName: string
    citationCount: number
    displayText: string
}

export interface AIContentRequest {
    prompt: string
    context?: string
}

export interface AIContentResponse {
    content: string
    status: string
    error?: string
}

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

export const notesApi = {
    // Get all notes for a project
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

    // Get a specific note by ID
    async getNote(projectId: string, noteId: string): Promise<Note> {
        try {
            console.log("🔍 Fetching note:", noteId, "for project:", projectId)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}`)
            )

            console.log("📊 Note response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Note fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch note: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Note data received:", data)
            return data.data
        } catch (error) {
            console.error("Get note error:", error)
            throw error
        }
    },

    // Create a new note
    async createNote(projectId: string, noteData: CreateNoteRequest): Promise<Note> {
        try {
            console.log("📝 Creating note for project:", projectId, "with data:", noteData)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
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

    // Update an existing note
    async updateNote(projectId: string, noteId: string, noteData: UpdateNoteRequest): Promise<Note> {
        try {
            console.log("✏️ Updating note:", noteId, "for project:", projectId, "with data:", noteData)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}`),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
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

    // Delete a note
    async deleteNote(projectId: string, noteId: string): Promise<void> {
        try {
            console.log("🗑️ Deleting note:", noteId, "for project:", projectId)

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

    // Toggle favorite status of a note
    async toggleNoteFavorite(projectId: string, noteId: string): Promise<Note> {
        try {
            console.log("⭐ Toggling favorite for note:", noteId, "in project:", projectId)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/${noteId}/favorite`),
                {
                    method: "PUT",
                }
            )

            console.log("📊 Toggle favorite response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle favorite failed:", response.status, errorText)
                throw new Error(`Failed to toggle favorite: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Favorite status updated successfully:", data)
            return data.data
        } catch (error) {
            console.error("Toggle favorite error:", error)
            throw error
        }
    },

    // Get favorite notes for a project
    async getFavoriteNotes(projectId: string): Promise<Note[]> {
        try {
            console.log("⭐ Fetching favorite notes for project:", projectId)

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

    // Search notes by tag
    async searchNotesByTag(projectId: string, tag: string): Promise<Note[]> {
        try {
            console.log("🔍 Searching notes by tag:", tag, "for project:", projectId)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/search/tag?tag=${encodeURIComponent(tag)}`)
            )

            console.log("📊 Search by tag response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Search by tag failed:", response.status, errorText)
                throw new Error(`Failed to search notes by tag: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search by tag data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Search by tag error:", error)
            throw error
        }
    },

    // Search notes by content
    async searchNotesByContent(projectId: string, searchTerm: string): Promise<Note[]> {
        try {
            console.log("🔍 Searching notes by content:", searchTerm, "for project:", projectId)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/search/content?q=${encodeURIComponent(searchTerm)}`)
            )

            console.log("📊 Search by content response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Search by content failed:", response.status, errorText)
                throw new Error(`Failed to search notes by content: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Search by content data received:", data)
            return data.data || []
        } catch (error) {
            console.error("Search by content error:", error)
            throw error
        }
    },

    // Upload image for notes
    async uploadImage(projectId: string, file: File): Promise<ImageUploadResponse> {
        try {
            console.log("📸 Uploading image for project:", projectId, "File:", file.name)

            const formData = new FormData()
            formData.append('file', file)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/images`),
                {
                    method: "POST",
                    body: formData,
                }
            )

            console.log("📊 Upload image response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Upload image failed:", response.status, errorText)
                throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Image uploaded successfully:", data)
            return data.data
        } catch (error) {
            console.error("Upload image error:", error)
            throw error
        }
    },

    // Get image by ID
    getImageUrl(projectId: string, imageId: string): string {
        return getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/images/${imageId}`)
    },

    async searchPapersForMention(projectId: string, query: string): Promise<PaperSuggestion[]> {
        try {
            console.log("🔍 Searching papers for mention:", projectId, query)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/papers/search?q=${encodeURIComponent(query)}`),
                {
                    method: "GET",
                }
            )

            console.log("📊 Paper search response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Paper search failed:", response.status, errorText)
                throw new Error(`Failed to search papers: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Paper suggestions retrieved:", data)
            return data.data || []
        } catch (error) {
            console.error("Paper search error:", error)
            throw error
        }
    },

    async generateAIContent(projectId: string, request: AIContentRequest): Promise<AIContentResponse> {
        try {
            console.log("🤖 Generating AI content:", projectId, request.prompt)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/projects/${projectId}/notes/ai/generate`),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(request),
                }
            )

            console.log("📊 AI content generation response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ AI content generation failed:", response.status, errorText)
                throw new Error(`Failed to generate AI content: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ AI content generated:", data)
            return data.data || { content: "", status: "error", error: "No content generated" }
        } catch (error) {
            console.error("AI content generation error:", error)
            throw error
        }
    },
}
