import { Project, CreateProjectRequest, UpdateProjectRequest, APIResponse, ProjectStats } from '@/types/project'
import { authenticatedFetch } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const PROJECTS_ENDPOINT = '/api/v1/projects'

// Helper function to handle API response
const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const apiResponse: APIResponse<T> = await response.json()
    return apiResponse.data
}

export const projectsApi = {
    // Get all projects for the authenticated user
    async getProjects(): Promise<Project[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}`, {
            method: 'GET',
        })

        return handleApiResponse<Project[]>(response)
    },

    // Get project by ID
    async getProject(id: string): Promise<Project> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/${id}`, {
            method: 'GET',
        })

        return handleApiResponse<Project>(response)
    },

    // Get projects by status
    async getProjectsByStatus(status: string): Promise<Project[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/status/${status}`, {
            method: 'GET',
        })

        return handleApiResponse<Project[]>(response)
    },

    // Get starred projects
    async getStarredProjects(): Promise<Project[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/starred`, {
            method: 'GET',
        })

        return handleApiResponse<Project[]>(response)
    },

    // Get project statistics
    async getProjectStats(): Promise<ProjectStats> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/stats`, {
            method: 'GET',
        })

        return handleApiResponse<ProjectStats>(response)
    },

    // Create a new project
    async createProject(projectData: CreateProjectRequest): Promise<Project> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}`, {
            method: 'POST',
            body: JSON.stringify(projectData),
        })

        return handleApiResponse<Project>(response)
    },

    // Update an existing project
    async updateProject(id: string, projectData: UpdateProjectRequest): Promise<Project> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        })

        return handleApiResponse<Project>(response)
    },

    // Delete a project
    async deleteProject(id: string): Promise<void> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/${id}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
    },

    // Toggle project star status
    async toggleStar(id: string): Promise<Project> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/${id}/toggle-star`, {
            method: 'POST',
        })

        return handleApiResponse<Project>(response)
    },

    // Update project status
    async updateStatus(id: string, status: string): Promise<Project> {
        const response = await authenticatedFetch(`${API_BASE_URL}${PROJECTS_ENDPOINT}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        })

        return handleApiResponse<Project>(response)
    }
} 