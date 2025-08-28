import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import { Todo, TodoFilters, TodoSortOptions, TodoSummary, TodoForm } from "@/types/todo"

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
    let apiResponse: any
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

// Helper function to get current user ID
const getCurrentUserId = (): string => {
    const { getUserData } = require("@/lib/api/user-service/auth")
    const userData = getUserData()
    
    if (!userData?.id) {
        throw new Error('User not authenticated')
    }
    
    return userData.id
}

export const todosApi = {
    // Get all todos with filters
    async getTodos(filters?: TodoFilters, sort?: TodoSortOptions): Promise<{ todos: Todo[], summary: TodoSummary | null }> {
        try {
            console.log("🔍 Fetching todos...")
            const userId = getCurrentUserId()
            
            const queryParams = new URLSearchParams()
            queryParams.append('userId', userId)

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        if (Array.isArray(value)) {
                            value.forEach(v => queryParams.append(key, String(v)))
                        } else if (typeof value === 'object' && key === 'due_date_range') {
                            queryParams.append('dueDateStart', value.start)
                            queryParams.append('dueDateEnd', value.end)
                        } else {
                            queryParams.append(key, String(value))
                        }
                    }
                })
            }

            if (sort) {
                queryParams.append('sortField', sort.field)
                queryParams.append('sortDirection', sort.direction)
            }

            const url = getMicroserviceUrl("project-service", `/api/v1/todo?${queryParams.toString()}`)
            console.log("📡 Fetching todos from:", url)

            const response = await authenticatedFetch(url)
            console.log("📊 Todos response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Todos fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch todos: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Todos data received:", data)
            
            return {
                todos: data.data || [],
                summary: null // Will be fetched separately
            }
        } catch (error) {
            console.error("Get todos error:", error)
            return {
                todos: [],
                summary: null
            }
        }
    },

    // Get todo summary
    async getSummary(): Promise<TodoSummary> {
        try {
            console.log("📊 Fetching todo summary...")
            const userId = getCurrentUserId()
            
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/summary?userId=${userId}`)
            )

            console.log("📊 Summary response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Summary fetch failed:", response.status, errorText)
                throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Summary data received:", data)
            
            const summaryData = data.data

            return {
                total: summaryData.total ?? 0,
                by_status: {
                    pending: summaryData.by_status?.pending ?? 0,
                    in_progress: summaryData.by_status?.in_progress ?? 0,
                    completed: summaryData.by_status?.completed ?? 0,
                    cancelled: summaryData.by_status?.cancelled ?? 0
                },
                by_priority: {
                    urgent: summaryData.by_priority?.urgent ?? 0,
                    high: summaryData.by_priority?.high ?? 0,
                    medium: summaryData.by_priority?.medium ?? 0,
                    low: summaryData.by_priority?.low ?? 0
                },
                overdue: summaryData.overdue ?? 0,
                due_today: summaryData.due_today ?? 0,
                due_this_week: summaryData.due_this_week ?? 0
            }
        } catch (error) {
            console.error("Get summary error:", error)
            return {
                total: 0,
                by_status: { pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
                by_priority: { urgent: 0, high: 0, medium: 0, low: 0 },
                overdue: 0,
                due_today: 0,
                due_this_week: 0
            }
        }
    },

    // Create new todo
    async createTodo(todoData: TodoForm): Promise<{ success: boolean, data?: Todo, message?: string }> {
        try {
            console.log("➕ Creating todo...")
            const userId = getCurrentUserId()
            
            const requestBody = {
                user_id: userId,
                title: todoData.title,
                description: todoData.description,
                priority: todoData.priority.toUpperCase(),
                category: todoData.category.toUpperCase(),
                due_date: todoData.due_date && todoData.due_date.trim() ? todoData.due_date : null,
                estimated_time: todoData.estimated_time || null,
                related_project_id: todoData.related_project_id && todoData.related_project_id.trim() ? todoData.related_project_id : null,
                tags: todoData.tags || [],
                subtasks: (todoData.subtasks || []).filter(s => s.title && s.title.trim()).map(s => ({ title: s.title.trim() })),
                reminders: (todoData.reminders || []).filter(r => r.remind_at && r.message).map(r => ({
                    remind_at: r.remind_at,
                    message: r.message
                }))
            };

            console.log("📤 Creating todo with data:", requestBody);

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/v1/todo"),
                {
                    method: "POST",
                    body: JSON.stringify(requestBody)
                }
            )

            console.log("📊 Create response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Create todo failed:", response.status, errorText)
                throw new Error(`Failed to create todo: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Todo created successfully:", data)

            return {
                success: true,
                data: mapBackendTodoToFrontend(data.data),
                message: data.message
            }
        } catch (error) {
            console.error("Create todo error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to create todo"
            }
        }
    },

    // Update todo
    async updateTodo(todoId: string, todoData: Partial<TodoForm>): Promise<{ success: boolean, data?: Todo, message?: string }> {
        try {
            console.log("✏️ Updating todo:", todoId)
            
            const updateData: any = {}

            if (todoData.title !== undefined) updateData.title = todoData.title
            if (todoData.description !== undefined) updateData.description = todoData.description
            if (todoData.priority !== undefined) updateData.priority = todoData.priority.toUpperCase()
            if (todoData.category !== undefined) updateData.category = todoData.category.toUpperCase()
            if (todoData.due_date !== undefined) updateData.due_date = todoData.due_date
            if (todoData.estimated_time !== undefined) updateData.estimated_time = todoData.estimated_time
            if (todoData.related_project_id !== undefined) updateData.related_project_id = todoData.related_project_id
            if (todoData.tags !== undefined) updateData.tags = todoData.tags
            if (todoData.subtasks !== undefined) updateData.subtasks = todoData.subtasks.map(s => ({ title: s.title }))
            if (todoData.reminders !== undefined) updateData.reminders = todoData.reminders.map(r => ({
                remind_at: r.remind_at,
                message: r.message
            }))

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/${todoId}`),
                {
                    method: "PATCH",
                    body: JSON.stringify(updateData)
                }
            )

            console.log("📊 Update response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Update todo failed:", response.status, errorText)
                throw new Error(`Failed to update todo: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Todo updated successfully:", data)

            return {
                success: true,
                data: mapBackendTodoToFrontend(data.data),
                message: data.message
            }
        } catch (error) {
            console.error("Update todo error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to update todo"
            }
        }
    },

    // Update todo status
    async updateTodoStatus(todoId: string, status: Todo['status']): Promise<{ success: boolean, message?: string }> {
        try {
            console.log("🔄 Updating todo status:", todoId, status)
            
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/${todoId}/status`),
                {
                    method: "PATCH",
                    body: JSON.stringify({ status: status.toUpperCase() })
                }
            )

            console.log("📊 Status update response:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Status update failed:", response.status, errorText)
                throw new Error(`Failed to update todo status: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Status updated successfully:", data)

            return { success: true, message: data.message }
        } catch (error) {
            console.error("Update todo status error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to update todo status"
            }
        }
    },

    // Delete todo
    async deleteTodo(todoId: string): Promise<{ success: boolean, message?: string }> {
        try {
            console.log("🗑️ Deleting todo:", todoId)
            
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/${todoId}`),
                {
                    method: "DELETE"
                }
            )

            console.log("📊 Delete response status:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Delete todo failed:", response.status, errorText)
                throw new Error(`Failed to delete todo: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Todo deleted successfully:", data)

            return { success: true, message: data.message }
        } catch (error) {
            console.error("Delete todo error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to delete todo"
            }
        }
    },

    // Add subtask
    async addSubtask(todoId: string, title: string): Promise<{ success: boolean, message?: string }> {
        try {
            console.log("➕ Adding subtask to todo:", todoId, title)
            
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/${todoId}/subtask?title=${encodeURIComponent(title)}`),
                {
                    method: "POST"
                }
            )

            console.log("📊 Add subtask response:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Add subtask failed:", response.status, errorText)
                throw new Error(`Failed to add subtask: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Subtask added successfully:", data)

            return { success: true, message: data.message }
        } catch (error) {
            console.error("Add subtask error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to add subtask"
            }
        }
    },

    // Toggle subtask completion
    async toggleSubtask(todoId: string, subtaskId: string): Promise<{ success: boolean, message?: string }> {
        try {
            console.log("🔄 Toggling subtask:", todoId, subtaskId)
            
            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", `/api/v1/todo/${todoId}/subtask/${subtaskId}/toggle`),
                {
                    method: "PATCH"
                }
            )

            console.log("📊 Toggle subtask response:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Toggle subtask failed:", response.status, errorText)
                throw new Error(`Failed to toggle subtask: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ Subtask toggled successfully:", data)

            return { success: true, message: data.message }
        } catch (error) {
            console.error("Toggle subtask error:", error)
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to toggle subtask"
            }
        }
    }
}

// Helper function to map backend todo response to frontend format
function mapBackendTodoToFrontend(backendTodo: any): Todo {
    return {
        id: backendTodo.id,
        title: backendTodo.title,
        description: backendTodo.description,
        status: backendTodo.status?.toLowerCase() || 'pending',
        priority: backendTodo.priority?.toLowerCase() || 'medium',
        category: backendTodo.category?.toLowerCase() || 'general',
        due_date: backendTodo.due_date || backendTodo.dueDate,
        created_at: backendTodo.created_at || backendTodo.createdAt,
        updated_at: backendTodo.updated_at || backendTodo.updatedAt,
        completed_at: backendTodo.completed_at || backendTodo.completedAt,
        estimated_time: backendTodo.estimated_time || backendTodo.estimatedTime,
        actual_time: backendTodo.actual_time || backendTodo.actualTime,
        related_project_id: backendTodo.related_project_id || backendTodo.relatedProjectId,
        related_paper_id: backendTodo.related_paper_id || backendTodo.relatedPaperId,
        tags: Array.from(backendTodo.tags || []),
        subtasks: (backendTodo.subtasks || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            created_at: s.created_at || s.createdAt
        })),
        reminders: (backendTodo.reminders || []).map((r: any) => ({
            id: r.id,
            remind_at: r.remind_at || r.remindAt,
            message: r.message,
            sent: r.sent
        }))
    }
}
