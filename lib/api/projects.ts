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
} from "@/types/project";
import { authenticatedFetch } from "@/lib/api/auth";
import { getApiUrl } from "@/lib/config/api-config";

const PROJECTS_ENDPOINT = "/api/v1/projects";

// Helper function to handle API response
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Try to parse error response as JSON, fallback to text
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, try to get text content
      try {
        const textContent = await response.text();
        errorMessage = textContent || errorMessage;
      } catch {
        // If all else fails, use the status-based message
      }
    }
    throw new Error(errorMessage);
  }

  // Try to parse the response as JSON
  let apiResponse: APIResponse<T>;
  try {
    const jsonData = await response.json();
    apiResponse = jsonData;
  } catch (error) {
    throw new Error("Invalid JSON response from server");
  }

  // Handle different response structures
  if (apiResponse.data !== undefined) {
    // Check if data has an 'items' property (for paginated responses)
    if (apiResponse.data && typeof apiResponse.data === 'object' && 'items' in apiResponse.data) {
      return (apiResponse.data as any).items;
    }
    // Return the data directly
    return apiResponse.data;
  } else if (Array.isArray(apiResponse)) {
    // Direct array response
    return apiResponse as unknown as T;
  } else {
    // If no data property, return the whole response
    return apiResponse as unknown as T;
  }
};

export const projectsApi = {
  // Get all projects for the authenticated user
  async getProjects(): Promise<Project[]> {
    const response = await authenticatedFetch(
      getApiUrl(PROJECTS_ENDPOINT),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Project[]>(response);
  },

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(id)) {
      throw new Error(`Invalid project ID format: ${id}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${id}`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Project>(response);
  },

  // Get projects by status
  async getProjectsByStatus(status: string): Promise<Project[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/status/${status}`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Project[]>(response);
  },

  // Get starred projects
  async getStarredProjects(): Promise<Project[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/starred`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Project[]>(response);
  },

  // Get project statistics
  async getProjectStats(): Promise<ProjectStats> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/stats`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<ProjectStats>(response);
  },

  // Create a new project
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await authenticatedFetch(
      getApiUrl(PROJECTS_ENDPOINT),
      {
        method: "POST",
        body: JSON.stringify(projectData),
      }
    );

    return handleApiResponse<Project>(response);
  },

  // Update an existing project
  async updateProject(
    id: string,
    projectData: UpdateProjectRequest
  ): Promise<Project> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(id)) {
      throw new Error(`Invalid project ID format: ${id}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${id}`),
      {
        method: "PUT",
        body: JSON.stringify(projectData),
      }
    );

    return handleApiResponse<Project>(response);
  },

  // Delete a project
  async deleteProject(id: string): Promise<void> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(id)) {
      throw new Error(`Invalid project ID format: ${id}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${id}`),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
  },

  // Toggle project star status
  async toggleStar(id: string): Promise<Project> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(id)) {
      throw new Error(`Invalid project ID format: ${id}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${id}/toggle-star`),
      {
        method: "POST",
      }
    );

    return handleApiResponse<Project>(response);
  },

  // Update project status
  async updateStatus(id: string, status: string): Promise<Project> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(id)) {
      throw new Error(`Invalid project ID format: ${id}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${id}`),
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );

    return handleApiResponse<Project>(response);
  },

  // Get project collaborators
  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    // Validate project ID before making API call
    const { isValidUUID } = await import("@/lib/utils");
    if (!isValidUUID(projectId)) {
      throw new Error(`Invalid project ID format: ${projectId}`);
    }

    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/collaborators`),
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    // Try to parse the response directly to handle different structures
    const rawResponse = await response.json();

    // Handle different possible response structures
    if (rawResponse.data && rawResponse.data.collaborators) {
      // Standard API response structure
      return rawResponse.data.collaborators;
    } else if (rawResponse.collaborators) {
      // Direct response structure
      return rawResponse.collaborators;
    } else if (Array.isArray(rawResponse)) {
      // Direct array response
      return rawResponse;
    } else if (Array.isArray(rawResponse.data)) {
      // Data is directly an array
      return rawResponse.data;
    }

    // Default to empty array if structure is unknown
    return [];
  },

  // Add collaborator to project
  async addCollaborator(projectId: string, collaboratorData: AddCollaboratorRequest): Promise<Collaborator> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/collaborators`),
      {
        method: "POST",
        body: JSON.stringify(collaboratorData),
      }
    );

    return handleApiResponse<Collaborator>(response);
  },

  // Remove collaborator from project
  async removeCollaborator(projectId: string, collaboratorEmail: string): Promise<void> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/collaborators`),
      {
        method: "DELETE",
        body: JSON.stringify({ collaboratorEmail }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
  },

  // Update collaborator role
  async updateCollaborator(projectId: string, collaboratorEmail: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN'): Promise<Collaborator> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/collaborators`),
      {
        method: "PUT",
        body: JSON.stringify({ collaboratorEmail, role }),
      }
    );

    return handleApiResponse<Collaborator>(response);
  },

  // Check if project has collaborators (more efficient than fetching all)
  async hasCollaborators(projectId: string): Promise<boolean> {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/collaborators`),
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        return false;
      }

      // Try to parse the response directly to handle different structures
      const rawResponse = await response.json();

      // Handle different possible response structures
      let collaborators: Collaborator[] = [];

      if (rawResponse.data && rawResponse.data.collaborators) {
        // Standard API response structure
        collaborators = rawResponse.data.collaborators;
      } else if (rawResponse.collaborators) {
        // Direct response structure
        collaborators = rawResponse.collaborators;
      } else if (Array.isArray(rawResponse)) {
        // Direct array response
        collaborators = rawResponse;
      } else if (Array.isArray(rawResponse.data)) {
        // Data is directly an array
        collaborators = rawResponse.data;
      }

      return collaborators.length > 0;
    } catch (error) {
      console.error('Error checking collaborators:', error);
      return false;
    }
  },

  // Quick Notes API Methods
  async getNotes(projectId: string): Promise<Note[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Note[]>(response);
  },

  async createNote(projectId: string, noteData: CreateNoteRequest): Promise<Note> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes`),
      {
        method: "POST",
        body: JSON.stringify(noteData),
      }
    );

    return handleApiResponse<Note>(response);
  },

  async updateNote(projectId: string, noteId: string, noteData: UpdateNoteRequest): Promise<Note> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/${noteId}`),
      {
        method: "PUT",
        body: JSON.stringify(noteData),
      }
    );

    return handleApiResponse<Note>(response);
  },

  async deleteNote(projectId: string, noteId: string): Promise<void> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/${noteId}`),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
  },

  async toggleNoteFavorite(projectId: string, noteId: string): Promise<Note> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/${noteId}/favorite`),
      {
        method: "PUT",
      }
    );

    return handleApiResponse<Note>(response);
  },

  async searchNotesByContent(projectId: string, query: string): Promise<Note[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/search/content?q=${encodeURIComponent(query)}`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Note[]>(response);
  },

  async searchNotesByTag(projectId: string, tag: string): Promise<Note[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/search/tag?tag=${encodeURIComponent(tag)}`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Note[]>(response);
  },

  async getFavoriteNotes(projectId: string): Promise<Note[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/notes/favorites`),
      {
        method: "GET",
      }
    );

    return handleApiResponse<Note[]>(response);
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

    const url = `${PROJECTS_ENDPOINT}/${projectId}/reading-list${params.toString() ? `?${params.toString()}` : ''}`

    const response = await authenticatedFetch(
      getApiUrl(url),
      {
        method: "GET",
      }
    );

    return handleApiResponse<ReadingListItem[]>(response);
  },

  async addToReadingList(projectId: string, paperId: string, readingListData?: Partial<CreateReadingListItemRequest>): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list`),
      {
        method: "POST",
        body: JSON.stringify({
          paperId,
          ...readingListData
        }),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async updateReadingListItem(projectId: string, itemId: string, updateData: UpdateReadingListItemRequest): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}`),
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async updateReadingListItemStatus(projectId: string, itemId: string, status: ReadingListItem['status']): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}/status`),
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async updateReadingProgress(projectId: string, itemId: string, progress: number): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}/progress`),
      {
        method: "PATCH",
        body: JSON.stringify({ readingProgress: progress }),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async removeFromReadingList(projectId: string, itemId: string): Promise<void> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}`),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
  },

  async getReadingListStats(
    projectId: string,
    timeRange?: '7d' | '30d' | '90d' | 'all'
  ): Promise<ReadingListStats> {
    const params = new URLSearchParams()
    if (timeRange) params.append('timeRange', timeRange)

    const url = `${PROJECTS_ENDPOINT}/${projectId}/reading-list/stats${params.toString() ? `?${params.toString()}` : ''}`

    const response = await authenticatedFetch(
      getApiUrl(url),
      {
        method: "GET",
      }
    );

    return handleApiResponse<ReadingListStats>(response);
  },

  async getReadingListRecommendations(
    projectId: string,
    options?: {
      limit?: number
      difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
      excludeRead?: boolean
    }
  ): Promise<ReadingListItem[]> {
    const params = new URLSearchParams()

    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.difficulty) params.append('difficulty', options.difficulty)
    if (options?.excludeRead !== undefined) params.append('excludeRead', options.excludeRead.toString())

    const url = `${PROJECTS_ENDPOINT}/${projectId}/reading-list/recommendations${params.toString() ? `?${params.toString()}` : ''}`

    const response = await authenticatedFetch(
      getApiUrl(url),
      {
        method: "GET",
      }
    );

    return handleApiResponse<ReadingListItem[]>(response);
  },

  async addReadingListNote(projectId: string, itemId: string, note: string): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}/notes`),
      {
        method: "POST",
        body: JSON.stringify({ note }),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async rateReadingListItem(projectId: string, itemId: string, rating: number): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}/rating`),
      {
        method: "PATCH",
        body: JSON.stringify({ rating }),
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async toggleReadingListItemBookmark(projectId: string, itemId: string): Promise<ReadingListItem> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/${itemId}/bookmark`),
      {
        method: "PUT",
      }
    );

    return handleApiResponse<ReadingListItem>(response);
  },

  async bulkUpdateReadingList(projectId: string, updates: BulkReadingListUpdate[]): Promise<ReadingListItem[]> {
    const response = await authenticatedFetch(
      getApiUrl(`${PROJECTS_ENDPOINT}/${projectId}/reading-list/bulk`),
      {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      }
    );

    return handleApiResponse<ReadingListItem[]>(response);
  }
};
