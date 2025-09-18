export type NotificationType = 'service' | 'academic' | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface BaseNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  created_at: string
  updated_at: string
  read_at?: string
  action_url?: string
  action_text?: string
}

// Service Notifications (from backend microservices)
export interface ServiceNotification extends BaseNotification {
  type: 'service'
  category: 'welcome_email' | 'password_reset' | 'email_verification' | 'web_search_completed' | 'summarization_completed' | 'project_deleted' | 'gap_analysis_completed'
  related_project_id?: string
  related_paper_id?: string
  metadata?: Record<string, any> // For storing additional service-specific data
}

// Academic/Research Notifications
export interface AcademicNotification extends BaseNotification {
  type: 'academic'
  category: 'conference_deadline' | 'workshop' | 'journal_deadline' | 'paper_acceptance' | 'review_due' | 'call_for_papers' | 'research_update'
  event_date?: string
  venue?: string
  submission_deadline?: string
  conference_name?: string
  journal_name?: string
}

// System Notifications (frontend generated)
export interface SystemNotification extends BaseNotification {
  type: 'system'
  category: 'account_update' | 'settings_changed' | 'preferences_updated' | 'profile_updated' | 'data_sync' | 'backup_complete' | 'collaboration_invite' | 'deadline_missed' | 'todo_overdue'
  related_project_id?: string
  related_task_id?: string
  user_action_required?: boolean
}

export type Notification = ServiceNotification | AcademicNotification | SystemNotification

export interface NotificationFilters {
  type?: NotificationType
  priority?: NotificationPriority
  status?: NotificationStatus
  category?: string
  date_range?: {
    start: string
    end: string
  }
}

export interface NotificationSummary {
  total: number
  unread: number
  by_type: {
    service: {
      total: number
      unread: number
      urgent: number
    }
    academic: {
      total: number
      unread: number
      urgent: number
    }
    system: {
      total: number
      unread: number
      urgent: number
    }
  }
  by_priority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
}

export interface NotificationSettings {
  email_enabled: boolean
  push_enabled: boolean
  service_notifications: {
    welcome_messages: boolean
    password_reset: boolean
    email_verification: boolean
    web_search_completed: boolean
    summarization_completed: boolean
    project_deleted: boolean
    gap_analysis_completed: boolean
  }
  academic_notifications: {
    conference_deadlines: boolean
    workshop_alerts: boolean
    journal_deadlines: boolean
    paper_updates: boolean
  }
  system_notifications: {
    account_updates: boolean
    settings_changes: boolean
    collaboration_invites: boolean
    deadline_reminders: boolean
    todo_alerts: boolean
    system_alerts: boolean
  }
} 