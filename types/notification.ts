export type NotificationType = 'academic' | 'general'

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

// General/System Notifications  
export interface GeneralNotification extends BaseNotification {
  type: 'general'
  category: 'deadline_missed' | 'todo_overdue' | 'project_update' | 'collaboration_invite' | 'system_alert' | 'account_update' | 'data_sync' | 'backup_complete'
  related_project_id?: string
  related_task_id?: string
  user_action_required?: boolean
}

export type Notification = AcademicNotification | GeneralNotification

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
    academic: {
      total: number
      unread: number
      urgent: number
    }
    general: {
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
  academic_notifications: {
    conference_deadlines: boolean
    workshop_alerts: boolean
    journal_deadlines: boolean
    paper_updates: boolean
  }
  general_notifications: {
    deadline_reminders: boolean
    todo_alerts: boolean
    project_updates: boolean
    collaboration_invites: boolean
    system_alerts: boolean
  }
} 