import { getApiUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "./auth"
import { Todo, TodoFilters, TodoSortOptions, TodoSummary, TodoForm } from "@/types/todo"

export const todosApi = {
  // Get all todos with filters
  getTodos: async (filters?: TodoFilters, sort?: TodoSortOptions): Promise<{ todos: Todo[], summary: TodoSummary | null }> => {
    try {
      const queryParams = new URLSearchParams()
      
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

      const url = `${getApiUrl("/api/v1/todo")}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await authenticatedFetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch todos: ${response.statusText}`)
      }
      
      const data = await response.json()
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
  getSummary: async (): Promise<TodoSummary> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/todo/summary"))
      
      if (!response.ok) {
        throw new Error(`Failed to fetch summary: ${response.statusText}`)
      }
      
      const data = await response.json()
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
  createTodo: async (todoData: TodoForm): Promise<{success: boolean, data?: Todo, message?: string}> => {
    try {
      const requestBody = {
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
      
      console.log("Creating todo with data:", requestBody);
      
      const response = await authenticatedFetch(getApiUrl("/api/v1/todo"), {
        method: "POST",
        body: JSON.stringify(requestBody)
      })
      
      console.log("Response status:", response.status, response.statusText);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
          console.log("Parsed JSON response:", data);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          throw new Error("Invalid JSON response from server");
        }
      } else {
        try {
          responseText = await response.text();
          console.log("Response text:", responseText);
          // Only try to parse as JSON if we have actual content
          if (responseText && responseText.trim().length > 0) {
            try {
              data = JSON.parse(responseText);
              console.log("Parsed text as JSON:", data);
            } catch {
              // Not JSON, keep as text
              console.log("Response is not JSON, keeping as text");
            }
          }
        } catch (textError) {
          console.error("Error reading response text:", textError);
          responseText = '';
        }
      }
      
      if (!response.ok) {
        const errorMessage = (data && data.message) || 
                           (responseText && responseText.trim()) || 
                           response.statusText || 
                           `HTTP ${response.status} Error`;
        console.error("Request failed with error:", errorMessage);
        throw new Error(errorMessage);
      }
      
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
  updateTodo: async (todoId: string, todoData: Partial<TodoForm>): Promise<{success: boolean, data?: Todo, message?: string}> => {
    try {
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

      const response = await authenticatedFetch(getApiUrl(`/api/v1/todo/${todoId}`), {
        method: "PATCH",
        body: JSON.stringify(updateData)
      })
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON, keep as text
          }
        }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || responseText || response.statusText || "Failed to update todo";
        throw new Error(errorMessage);
      }
      
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
  updateTodoStatus: async (todoId: string, status: Todo['status']): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/todo/${todoId}/status`), {
        method: "PATCH",
        body: JSON.stringify({ status: status.toUpperCase() })
      })
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON, keep as text
          }
        }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || responseText || response.statusText || "Failed to update todo status";
        throw new Error(errorMessage);
      }
      
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
  deleteTodo: async (todoId: string): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/todo/${todoId}`), {
        method: "DELETE"
      })
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON, keep as text
          }
        }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || responseText || response.statusText || "Failed to delete todo";
        throw new Error(errorMessage);
      }
      
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
  addSubtask: async (todoId: string, title: string): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/todo/${todoId}/subtask?title=${encodeURIComponent(title)}`), {
        method: "POST"
      })
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON, keep as text
          }
        }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || responseText || response.statusText || "Failed to add subtask";
        throw new Error(errorMessage);
      }
      
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
  toggleSubtask: async (todoId: string, subtaskId: string): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/todo/${todoId}/subtask/${subtaskId}/toggle`), {
        method: "PATCH"
      })
      
      let data: any = {};
      let responseText = '';
      
      // Read response body only once
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      } else {
        responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // Not JSON, keep as text
          }
        }
      }
      
      if (!response.ok) {
        const errorMessage = data.message || responseText || response.statusText || "Failed to toggle subtask";
        throw new Error(errorMessage);
      }
      
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