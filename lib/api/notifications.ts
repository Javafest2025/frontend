import { getApiUrl } from "@/lib/config/api-config"
import { authenticatedFetch } from "./auth"
import { Notification, NotificationFilters, NotificationSummary, NotificationSettings } from "@/types/notification"

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (filters?: NotificationFilters): Promise<{ notifications: Notification[], summary: NotificationSummary }> => {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (typeof value === 'object' && key === 'date_range') {
              queryParams.append('start_date', value.start)
              queryParams.append('end_date', value.end)
            } else {
              queryParams.append(key, String(value))
            }
          }
        })
      }

      const url = `${getApiUrl("/api/v1/notifications")}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await authenticatedFetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }
      
      const data = await response.json()
      return {
        notifications: data.data.notifications || [],
        summary: data.data.summary
      }
    } catch (error) {
      console.error("Get notifications error:", error)
      return {
        notifications: [],
        summary: {
          total: 0,
          unread: 0,
          by_type: {
            academic: { total: 0, unread: 0, urgent: 0 },
            general: { total: 0, unread: 0, urgent: 0 }
          },
          by_priority: { urgent: 0, high: 0, medium: 0, low: 0 }
        }
      }
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/notifications/${notificationId}/read`), {
        method: "PATCH"
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to mark notification as read")
      }
      
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Mark as read error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to mark notification as read"
      }
    }
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds: string[]): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/notifications/bulk-read"), {
        method: "PATCH",
        body: JSON.stringify({ notification_ids: notificationIds })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to mark notifications as read")
      }
      
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Bulk mark as read error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to mark notifications as read"
      }
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<{success: boolean, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/v1/notifications/${notificationId}`), {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete notification")
      }
      
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Delete notification error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete notification"
      }
    }
  },

  // Get notification settings
  getSettings: async (): Promise<NotificationSettings | null> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/notifications/settings"))
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notification settings: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error("Get notification settings error:", error)
      return null
    }
  },

  // Update notification settings
  updateSettings: async (settings: Partial<NotificationSettings>): Promise<{success: boolean, data?: NotificationSettings, message?: string}> => {
    try {
      const response = await authenticatedFetch(getApiUrl("/api/v1/notifications/settings"), {
        method: "PUT",
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update notification settings")
      }
      
      return {
        success: true,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error("Update notification settings error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update notification settings"
      }
    }
  }
} 