import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "@/lib/api/user-service/auth"
import { ScholarBotRequest, ScholarBotResponse, ScholarBotHealthResponse } from "@/types/scholarbot"

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

export const scholarbotApi = {
    // Send message to ScholarBot
    async sendMessage(message: string, userId?: string): Promise<ScholarBotResponse> {
        try {
            console.log("🤖 Sending message to ScholarBot...")
            const currentUserId = userId || getCurrentUserId()

            const requestBody: ScholarBotRequest = {
                message,
                userId: currentUserId,
            }

            console.log("📤 Sending message:", requestBody)

            const response = await authenticatedFetch(
                getMicroserviceUrl("project-service", "/api/chat/message"),
                {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                }
            )

            console.log("📊 ScholarBot response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ ScholarBot message failed:", response.status, errorText)
                throw new Error(`Failed to send message to ScholarBot: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("✅ ScholarBot response received:", data)

            return data
        } catch (error) {
            console.error("ScholarBot send message error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to communicate with ScholarBot")
        }
    },

    // Check ScholarBot health
    async checkHealth(): Promise<boolean> {
        try {
            console.log("🏥 Checking ScholarBot health...")

            const response = await fetch(
                getMicroserviceUrl("project-service", "/api/chat/health")
            )

            console.log("📊 Health check response status:", response.status, response.statusText)

            if (!response.ok) {
                console.error("❌ Health check failed:", response.status)
                return false
            }

            const data: ScholarBotHealthResponse = await response.json()
            console.log("✅ Health check response:", data)

            return data.status === "UP"
        } catch (error) {
            console.error("ScholarBot health check error:", error)
            return false
        }
    },

    // Get ScholarBot health details
    async getHealthDetails(): Promise<ScholarBotHealthResponse> {
        try {
            console.log("🏥 Getting ScholarBot health details...")

            const response = await fetch(
                getMicroserviceUrl("project-service", "/api/chat/health")
            )

            console.log("📊 Health details response status:", response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("❌ Health details failed:", response.status, errorText)
                throw new Error(`Failed to get health details: ${response.status} ${response.statusText}`)
            }

            const data: ScholarBotHealthResponse = await response.json()
            console.log("✅ Health details received:", data)

            return data
        } catch (error) {
            console.error("ScholarBot health details error:", error)
            throw error instanceof Error
                ? error
                : new Error("Failed to get ScholarBot health details")
        }
    }
}
