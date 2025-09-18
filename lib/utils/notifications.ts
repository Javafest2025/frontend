import { SystemNotification } from "@/types/notification"

// Simple UUID generator (no external dependency needed)
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// Helper function to create system notifications for frontend actions
export const createSystemNotification = (
    category: SystemNotification['category'],
    title: string,
    message: string,
    options?: {
        priority?: SystemNotification['priority']
        actionUrl?: string
        actionText?: string
        relatedProjectId?: string
        relatedTaskId?: string
        userActionRequired?: boolean
    }
): SystemNotification => {
    const now = new Date().toISOString()

    return {
        id: generateUUID(),
        type: 'system',
        category,
        title,
        message,
        priority: options?.priority || 'medium',
        status: 'unread',
        created_at: now,
        updated_at: now,
        action_url: options?.actionUrl,
        action_text: options?.actionText,
        related_project_id: options?.relatedProjectId,
        related_task_id: options?.relatedTaskId,
        user_action_required: options?.userActionRequired || false
    }
}

// Helper function to save system notification locally
export const saveSystemNotification = (notification: SystemNotification) => {
    try {
        const existingNotifications = JSON.parse(localStorage.getItem('systemNotifications') || '[]')
        const updatedNotifications = [notification, ...existingNotifications].slice(0, 50) // Keep only last 50
        localStorage.setItem('systemNotifications', JSON.stringify(updatedNotifications))

        // Trigger a custom event to notify components about new notification
        window.dispatchEvent(new CustomEvent('newSystemNotification', { detail: notification }))

        console.log('📢 System notification created:', notification)
    } catch (error) {
        console.error('Failed to save system notification:', error)
    }
}

// Helper function to get system notifications
export const getSystemNotifications = (): SystemNotification[] => {
    try {
        return JSON.parse(localStorage.getItem('systemNotifications') || '[]')
    } catch (error) {
        console.error('Failed to get system notifications:', error)
        return []
    }
}

// Predefined notification creators for common actions
export const notificationHelpers = {
    accountUpdated: (message: string = "Your account information has been updated successfully.") => {
        const notification = createSystemNotification(
            'account_update',
            'Account Updated',
            message,
            { priority: 'low', actionUrl: '/interface/account', actionText: 'View Account' }
        )
        saveSystemNotification(notification)
    },

    settingsChanged: (settingName: string) => {
        const notification = createSystemNotification(
            'settings_changed',
            'Settings Updated',
            `Your ${settingName} settings have been saved.`,
            { priority: 'low', actionUrl: '/interface/settings', actionText: 'View Settings' }
        )
        saveSystemNotification(notification)
    },

    profileUpdated: (message: string = "Your profile has been updated successfully.") => {
        const notification = createSystemNotification(
            'profile_updated',
            'Profile Updated',
            message,
            { priority: 'low', actionUrl: '/interface/account', actionText: 'View Profile' }
        )
        saveSystemNotification(notification)
    },

    collaborationInvite: (projectName: string, inviterName: string, projectId: string) => {
        const notification = createSystemNotification(
            'collaboration_invite',
            'Collaboration Invitation',
            `${inviterName} has invited you to collaborate on "${projectName}".`,
            {
                priority: 'high',
                actionUrl: `/interface/projects/${projectId}/collaboration`,
                actionText: 'Accept Invitation',
                relatedProjectId: projectId,
                userActionRequired: true
            }
        )
        saveSystemNotification(notification)
    },

    deadlineMissed: (projectName: string, projectId: string) => {
        const notification = createSystemNotification(
            'deadline_missed',
            'Deadline Missed',
            `The deadline for "${projectName}" project has passed. Please review and update the timeline.`,
            {
                priority: 'urgent',
                actionUrl: `/interface/projects/${projectId}`,
                actionText: 'View Project',
                relatedProjectId: projectId,
                userActionRequired: true
            }
        )
        saveSystemNotification(notification)
    },

    todoOverdue: (count: number) => {
        const notification = createSystemNotification(
            'todo_overdue',
            `${count} Tasks Overdue`,
            `You have ${count} tasks that are past their due date. Please review and update them.`,
            {
                priority: 'high',
                actionUrl: '/interface/todo',
                actionText: 'View Tasks',
                userActionRequired: true
            }
        )
        saveSystemNotification(notification)
    },

    dataSync: (message: string = "Your data has been synchronized successfully.") => {
        const notification = createSystemNotification(
            'data_sync',
            'Data Synchronized',
            message,
            { priority: 'low' }
        )
        saveSystemNotification(notification)
    },

    backupComplete: (message: string = "Your data backup has been completed successfully.") => {
        const notification = createSystemNotification(
            'backup_complete',
            'Backup Complete',
            message,
            { priority: 'low' }
        )
        saveSystemNotification(notification)
    }
}
