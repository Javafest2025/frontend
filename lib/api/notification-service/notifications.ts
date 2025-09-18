import { getMicroserviceUrl } from "@/lib/config/api-config"
import { authenticatedFetch, getUserData } from "../user-service/auth"
import { Notification, NotificationFilters, NotificationSummary, NotificationSettings, ServiceNotification } from "@/types/notification"
// Frontend now reads notifications from backend app-notifications API

// Helper function to map backend notification types to frontend categories
const mapNotificationTypeToCategory = (notificationType: string): ServiceNotification['category'] => {
  console.log('🔄 Mapping notification type:', notificationType)

  switch (notificationType) {
    case 'WELCOME_EMAIL': return 'welcome_email'
    case 'PASSWORD_RESET': return 'password_reset'
    case 'EMAIL_VERIFICATION': return 'email_verification'
    case 'WEB_SEARCH_COMPLETED': return 'web_search_completed'
    case 'SUMMARIZATION_COMPLETED': return 'summarization_completed'
    case 'PROJECT_DELETED': return 'project_deleted'
    case 'GAP_ANALYSIS_COMPLETED': return 'gap_analysis_completed'
    default:
      console.warn('⚠️ Unknown notification type:', notificationType, 'defaulting to web_search_completed')
      return 'web_search_completed' // Changed from welcome_email to a more generic default
  }
}

// Helper function to extract user-friendly message from HTML content
const extractMessageFromContent = (htmlContent: string): string => {
  if (!htmlContent) return ''

  // Remove HTML tags and extract meaningful content
  const textContent = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Get the first meaningful sentence or truncate
  const sentences = textContent.split('.').filter(s => s.trim().length > 10)
  return sentences.length > 0 ? sentences[0] + '.' : textContent.substring(0, 150) + '...'
}

// Helper function to determine priority based on notification type
const determinePriority = (notificationType: string): Notification['priority'] => {
  switch (notificationType) {
    case 'PROJECT_DELETED': return 'high'
    case 'PASSWORD_RESET': return 'high'
    case 'WEB_SEARCH_COMPLETED': return 'medium'
    case 'SUMMARIZATION_COMPLETED': return 'medium'
    case 'GAP_ANALYSIS_COMPLETED': return 'medium'
    case 'EMAIL_VERIFICATION': return 'medium'
    case 'WELCOME_EMAIL': return 'low'
    default: return 'low'
  }
}

// Helper function to determine action URL
const determineActionUrl = (notificationType: string, templateData?: string): string | undefined => {
  const data = parseTemplateData(templateData)

  switch (notificationType) {
    case 'WEB_SEARCH_COMPLETED':
    case 'SUMMARIZATION_COMPLETED':
    case 'GAP_ANALYSIS_COMPLETED':
      return data?.projectName ? `/interface/projects?search=${encodeURIComponent(data.projectName)}` : '/interface/projects'
    case 'PROJECT_DELETED':
      return '/interface/projects'
    case 'EMAIL_VERIFICATION':
      return '/interface/account'
    case 'PASSWORD_RESET':
      return '/interface/account'
    default:
      return undefined
  }
}

// Helper function to determine action text
const determineActionText = (notificationType: string): string | undefined => {
  switch (notificationType) {
    case 'WEB_SEARCH_COMPLETED': return 'View Results'
    case 'SUMMARIZATION_COMPLETED': return 'View Summary'
    case 'GAP_ANALYSIS_COMPLETED': return 'View Analysis'
    case 'PROJECT_DELETED': return 'View Projects'
    case 'EMAIL_VERIFICATION': return 'Verify Email'
    case 'PASSWORD_RESET': return 'Update Password'
    default: return undefined
  }
}

// Helper function to extract project ID from template data
const extractProjectId = (templateData?: string): string | undefined => {
  const data = parseTemplateData(templateData)
  return data?.projectId || data?.project_id
}

// Helper function to extract paper ID from template data
const extractPaperId = (templateData?: string): string | undefined => {
  const data = parseTemplateData(templateData)
  return data?.paperId || data?.paper_id
}

// Helper function to parse template data JSON
const parseTemplateData = (templateData?: string): Record<string, any> | undefined => {
  if (!templateData) return undefined
  try {
    return JSON.parse(templateData)
  } catch {
    return undefined
  }
}

// Helper function to create better notification titles
const createNotificationTitle = (notificationType: string, templateData?: string): string => {
  const data = parseTemplateData(templateData)

  switch (notificationType) {
    case 'WELCOME_EMAIL':
      return '🎉 Welcome to ScholarAI!'
    case 'PASSWORD_RESET':
      return '🔐 Password Reset Request'
    case 'EMAIL_VERIFICATION':
      return '✉️ Email Verification Required'
    case 'WEB_SEARCH_COMPLETED': {
      const projectName = data?.projectName || data?.project_name || data?.name
      const papersCount = data?.papersCount || data?.papers_count || 0
      const projectPart = projectName ? ` • ${projectName}` : ''
      return `🔍 Research Search Complete${projectPart} (${papersCount} papers)`
    }
    case 'SUMMARIZATION_COMPLETED': {
      const paperTitle = data?.paperTitle || data?.paper_title || data?.title
      let titlePart = ''
      if (paperTitle) {
        const truncatedTitle = paperTitle.length > 40 ? paperTitle.substring(0, 40) + '...' : paperTitle
        titlePart = ` • ${truncatedTitle}`
      }
      return `📄 AI Summary Ready${titlePart}`
    }
    case 'PROJECT_DELETED': {
      const deletedProjectName = data?.projectName || data?.project_name || data?.name
      const projectPart = deletedProjectName ? ` • ${deletedProjectName}` : ''
      return `🗑️ Project Deleted${projectPart}`
    }
    case 'GAP_ANALYSIS_COMPLETED': {
      const analyzedPaperTitle = data?.paperTitle || data?.paper_title || data?.title
      const gapsCount = data?.gapsCount || data?.gaps_count || data?.totalGaps || data?.total_gaps || 0
      let titlePart = ''
      if (analyzedPaperTitle) {
        const truncatedTitle = analyzedPaperTitle.length > 30 ? analyzedPaperTitle.substring(0, 30) + '...' : analyzedPaperTitle
        titlePart = ` • ${truncatedTitle}`
      }
      return `🎯 Gap Analysis Complete${titlePart} (${gapsCount} gaps)`
    }
    default:
      return `📢 ${notificationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
  }
}

// Helper function to create better notification messages
const createNotificationMessage = (notificationType: string, templateData?: string): string => {
  const data = parseTemplateData(templateData)

  switch (notificationType) {
    case 'WELCOME_EMAIL':
      return 'Welcome to ScholarAI! Your account has been created successfully. Start exploring research papers and manage your academic projects.'
    case 'PASSWORD_RESET':
      return 'A password reset request was received for your account. Check your email for secure reset instructions.'
    case 'EMAIL_VERIFICATION':
      return 'Please verify your email address to complete your account setup and unlock all features.'
    case 'WEB_SEARCH_COMPLETED': {
      const papersCount = data?.papersCount || data?.papers_count || 0
      const projectName = data?.projectName || data?.project_name || data?.name
      const searchParams = data?.searchParams || data?.search_params || data?.query

      if (projectName && searchParams) {
        return `Web search completed for "${projectName}". Found ${papersCount} academic papers matching "${searchParams}". Click to review your research results.`
      } else if (projectName) {
        return `Web search completed for project "${projectName}". Discovered ${papersCount} relevant research papers. Review your findings now.`
      } else {
        return `Academic paper search completed. Found ${papersCount} papers matching your search criteria. Explore the results to advance your research.`
      }
    }
    case 'SUMMARIZATION_COMPLETED': {
      const paperTitle = data?.paperTitle || data?.paper_title || data?.title
      const summaryConfidence = data?.summaryConfidence || data?.summary_confidence
      const confidencePart = summaryConfidence ? ` with ${summaryConfidence} confidence` : ''

      if (paperTitle) {
        return `AI-powered summary generated for "${paperTitle}"${confidencePart}. Access key insights and findings now.`
      } else {
        return `Research paper summary has been generated using advanced AI analysis. Review the extracted insights and conclusions.`
      }
    }
    case 'PROJECT_DELETED': {
      const deletedProjectName = data?.projectName || data?.project_name || data?.name
      const deletedPapersCount = data?.papersCount || data?.papers_count || 0
      const notesCount = data?.notesCount || data?.notes_count || 0
      const notesPart = notesCount ? `, ${notesCount} notes` : ''

      return `Project "${deletedProjectName || 'Unnamed Project'}" has been permanently deleted. Removed ${deletedPapersCount} papers${notesPart}, and all associated research data.`
    }
    case 'GAP_ANALYSIS_COMPLETED': {
      const gapsCount = data?.gapsCount || data?.gaps_count || data?.totalGaps || data?.total_gaps || 0
      const analyzedPaperTitle = data?.paperTitle || data?.paper_title || data?.title
      const gapNames = data?.gapNames || data?.gap_names || []

      if (analyzedPaperTitle) {
        let gapNamesPart = ''
        if (gapNames.length > 0) {
          const displayGaps = gapNames.slice(0, 2).join(', ')
          const morePart = gapNames.length > 2 ? '...' : ''
          gapNamesPart = `: ${displayGaps}${morePart}`
        }
        return `Research gap analysis completed for "${analyzedPaperTitle}". Identified ${gapsCount} potential research opportunities${gapNamesPart}. Review detailed findings.`
      } else {
        return `Academic gap analysis has been completed. Discovered ${gapsCount} research opportunities in your field. Explore these insights to guide your next research direction.`
      }
    }
    default:
      console.warn('⚠️ Unknown notification type for message creation:', notificationType)
      return `New ${notificationType.toLowerCase().replace(/_/g, ' ')} notification from ScholarAI. Check your account for details.`
  }
}

// Map backend priority to frontend priority
const mapPriority = (p?: string): Notification['priority'] => {
  switch ((p || '').toLowerCase()) {
    case 'urgent': return 'urgent'
    case 'high': return 'high'
    case 'medium': return 'medium'
    case 'low': return 'low'
    default: return 'low'
  }
}

// Transform backend app-notification to frontend Notification type
const mapAppRecordToNotification = (record: any): Notification => {
  const type = (record.type || '').toLowerCase() === 'system' ? 'system' as const : 'service' as const
  const category = record.category || 'general'
  const metadata = record.metadataJson ? JSON.parse(record.metadataJson) : undefined

  return {
    id: record.id,
    type,
    category,
    title: record.title || createNotificationTitle(record.category || record.type, record.metadataJson),
    message: record.message || createNotificationMessage(record.category || record.type, record.metadataJson),
    priority: mapPriority(record.priority),
    status: (record.status || 'UNREAD').toLowerCase() === 'read' ? 'read' : 'unread',
    created_at: record.createdAt,
    updated_at: record.updatedAt || record.createdAt,
    read_at: record.readAt,
    action_url: record.actionUrl || determineActionUrl(record.category || record.type, record.metadataJson),
    action_text: record.actionText || determineActionText(record.category || record.type),
    related_project_id: record.relatedProjectId,
    related_paper_id: record.relatedPaperId,
    metadata,
  }
}

export const notificationsApi = {
  // Get all notifications for the authenticated user
  getNotifications: async (filters?: NotificationFilters): Promise<{ notifications: Notification[], summary: NotificationSummary }> => {
    try {
      const userData = getUserData()
      if (!userData?.id) {
        throw new Error('User not authenticated')
      }

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

      const url = getMicroserviceUrl("notification-service", `/api/v1/app-notifications/user/${userData.id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
      const response = await authenticatedFetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      // Handle the app-notifications from the backend
      const appNotificationRecords = await response.json()

      console.log('📦 Raw app notifications from backend:', appNotificationRecords)

      // Transform to frontend format
      const notifications: Notification[] = (appNotificationRecords as any[])
        .map(mapAppRecordToNotification)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Calculate summary
      const summary: NotificationSummary = {
        total: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        by_type: {
          service: {
            total: notifications.filter(n => n.type === 'service').length,
            unread: notifications.filter(n => n.type === 'service' && n.status === 'unread').length,
            urgent: notifications.filter(n => n.type === 'service' && n.priority === 'urgent').length
          },
          academic: { total: 0, unread: 0, urgent: 0 },
          system: {
            total: notifications.filter(n => n.type === 'system').length,
            unread: notifications.filter(n => n.type === 'system' && n.status === 'unread').length,
            urgent: notifications.filter(n => n.type === 'system' && n.priority === 'urgent').length
          }
        },
        by_priority: {
          urgent: notifications.filter(n => n.priority === 'urgent').length,
          high: notifications.filter(n => n.priority === 'high').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          low: notifications.filter(n => n.priority === 'low').length
        }
      }

      return { notifications, summary }
    } catch (error) {
      console.error("Get notifications error:", error)
      return {
        notifications: [],
        summary: {
          total: 0,
          unread: 0,
          by_type: {
            service: { total: 0, unread: 0, urgent: 0 },
            academic: { total: 0, unread: 0, urgent: 0 },
            system: { total: 0, unread: 0, urgent: 0 }
          },
          by_priority: { urgent: 0, high: 0, medium: 0, low: 0 }
        }
      }
    }
  },

  // Mark notification as read (backend persistence)
  markAsRead: async (notificationId: string): Promise<{ success: boolean, message?: string }> => {
    try {
      const url = getMicroserviceUrl("notification-service", `/api/v1/app-notifications/${notificationId}/read`)
      const response = await authenticatedFetch(url, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to mark as read')
      return { success: true, message: "Notification marked as read" }
    } catch (error) {
      console.error("Mark as read error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to mark notification as read"
      }
    }
  },

  // Mark multiple notifications as read
  markMultipleAsRead: async (notificationIds: string[]): Promise<{ success: boolean, message?: string }> => {
    try {
      const url = getMicroserviceUrl("notification-service", `/api/v1/app-notifications/read`)
      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationIds)
      })
      if (!response.ok) throw new Error('Failed to mark notifications as read')
      return { success: true, message: `${notificationIds.length} notifications marked as read` }
    } catch (error) {
      console.error("Bulk mark as read error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to mark notifications as read"
      }
    }
  },

  // Delete notification (hide from local view)
  deleteNotification: async (notificationId: string): Promise<{ success: boolean, message?: string }> => {
    try {
      const url = getMicroserviceUrl("notification-service", `/api/v1/app-notifications/${notificationId}`)
      const response = await authenticatedFetch(url, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete notification')
      return { success: true, message: "Notification deleted" }
    } catch (error) {
      console.error("Delete notification error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete notification"
      }
    }
  },

  // Create an app notification (e.g., from frontend for system events)
  createAppNotification: async (payload: any): Promise<{ success: boolean, id?: string, message?: string }> => {
    try {
      const userData = getUserData()
      if (!userData?.id) throw new Error('User not authenticated')
      const url = getMicroserviceUrl("notification-service", `/api/v1/app-notifications`)
      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to create app notification')
      const data = await response.json()
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Create app notification error:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create app notification' }
    }
  },

  // Get notification settings (stored in localStorage for now)
  getSettings: async (): Promise<NotificationSettings | null> => {
    try {
      const defaultSettings: NotificationSettings = {
        email_enabled: true,
        push_enabled: true,
        service_notifications: {
          welcome_messages: true,
          password_reset: true,
          email_verification: true,
          web_search_completed: true,
          summarization_completed: true,
          project_deleted: true,
          gap_analysis_completed: true
        },
        academic_notifications: {
          conference_deadlines: true,
          workshop_alerts: true,
          journal_deadlines: true,
          paper_updates: true
        },
        system_notifications: {
          account_updates: true,
          settings_changes: true,
          collaboration_invites: true,
          deadline_reminders: true,
          todo_alerts: true,
          system_alerts: true
        }
      }

      const settings = localStorage.getItem('notificationSettings')
      return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings
    } catch (error) {
      console.error("Get notification settings error:", error)
      return null
    }
  },

  // Update notification settings (store in localStorage for now)
  updateSettings: async (settings: Partial<NotificationSettings>): Promise<{ success: boolean, data?: NotificationSettings, message?: string }> => {
    try {
      const currentSettings = await notificationsApi.getSettings()
      if (!currentSettings) {
        throw new Error("Failed to load current settings")
      }
      const updatedSettings: NotificationSettings = { ...currentSettings, ...settings }
      localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings))

      return {
        success: true,
        data: updatedSettings,
        message: "Notification settings updated successfully"
      }
    } catch (error) {
      console.error("Update notification settings error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update notification settings"
      }
    }
  },

  // Get notification count for header
  getNotificationCount: async (): Promise<number> => {
    try {
      const { summary } = await notificationsApi.getNotifications()
      return summary.unread
    } catch (error) {
      console.error("Get notification count error:", error)
      return 0
    }
  }
} 