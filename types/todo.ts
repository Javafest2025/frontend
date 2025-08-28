export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TodoCategory = 'literature_review' | 'experiment' | 'data_collection' | 'data_analysis' | 'modeling' | 'writing' | 'review' | 'submission' | 'presentation' | 'collaboration' | 'meeting' | 'deadline' | 'funding' | 'administrative' | 'personal' | 'misc'

export interface Todo {
  id: string
  title: string
  description?: string
  status: TodoStatus
  priority: TodoPriority
  category: TodoCategory
  due_date?: string
  created_at: string
  updated_at: string
  completed_at?: string
  estimated_time?: number // in minutes
  actual_time?: number // in minutes
  related_project_id?: string
  related_paper_id?: string
  tags: string[]
  subtasks: Subtask[]
  reminders: TodoReminder[]
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  created_at: string
}

export interface TodoReminder {
  id: string
  remind_at: string
  message: string
  sent: boolean
}

export interface TodoFilters {
  status?: TodoStatus[]
  priority?: TodoPriority[]
  category?: TodoCategory[]
  due_date_range?: {
    start: string
    end: string
  }
  search?: string
  tags?: string[]
  project_id?: string
}

export interface TodoSortOptions {
  field: 'created_at' | 'due_date' | 'priority' | 'title' | 'status' | 'estimated_time'
  direction: 'asc' | 'desc'
}

export interface TodoSummary {
  total: number
  by_status: {
    pending: number
    in_progress: number
    completed: number
    cancelled: number
  }
  by_priority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  overdue: number
  due_today: number
  due_this_week: number
}

export interface TodoForm {
  title: string
  description: string
  priority: TodoPriority
  category: TodoCategory
  due_date: string
  estimated_time: number
  related_project_id: string
  tags: string[]
  subtasks: { title: string }[]
  reminders: { remind_at: string; message: string }[]
} 