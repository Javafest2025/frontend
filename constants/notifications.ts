import { AcademicNotification, SystemNotification, ServiceNotification, NotificationPriority } from "@/types/notification"
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  FileText,
  Users,
  Settings,
  Target,
  BookOpen,
  Bell,
  Mail,
  Zap,
  Shield,
  Database,
  RefreshCw,
  Search,
  Brain,
  Trash2,
  UserCheck,
  Key,
  Heart
} from "lucide-react"

// Service notification categories (from backend microservices)
export const SERVICE_CATEGORIES = {
  welcome_email: {
    label: "Welcome Messages",
    icon: Heart,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  password_reset: {
    label: "Password Reset",
    icon: Key,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  email_verification: {
    label: "Email Verification",
    icon: UserCheck,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  web_search_completed: {
    label: "Web Search Completed",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  summarization_completed: {
    label: "Summary Ready",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  project_deleted: {
    label: "Project Deleted",
    icon: Trash2,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  gap_analysis_completed: {
    label: "Gap Analysis Complete",
    icon: Target,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10"
  }
}

// Academic notification categories
export const ACADEMIC_CATEGORIES = {
  conference_deadline: {
    label: "Conference Deadlines",
    icon: Calendar,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  workshop: {
    label: "Workshops",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  journal_deadline: {
    label: "Journal Deadlines",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  paper_acceptance: {
    label: "Paper Updates",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  review_due: {
    label: "Review Due",
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  call_for_papers: {
    label: "Call for Papers",
    icon: BookOpen,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10"
  },
  research_update: {
    label: "Research Updates",
    icon: GraduationCap,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10"
  }
}

// System notification categories (frontend generated)
export const SYSTEM_CATEGORIES = {
  deadline_missed: {
    label: "Missed Deadlines",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  todo_overdue: {
    label: "Overdue Tasks",
    icon: Target,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  project_update: {
    label: "Project Updates",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  collaboration_invite: {
    label: "Collaboration Invites",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  system_alert: {
    label: "System Alerts",
    icon: Shield,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  account_update: {
    label: "Account Updates",
    icon: Settings,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  data_sync: {
    label: "Data Sync",
    icon: RefreshCw,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10"
  },
  backup_complete: {
    label: "Backup Complete",
    icon: Database,
    color: "text-green-600",
    bgColor: "bg-green-600/10"
  }
}

// Priority configurations
export const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  high: {
    label: "High",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  medium: {
    label: "Medium",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  low: {
    label: "Low",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20"
  }
}

// Mock notifications for development
export const MOCK_ACADEMIC_NOTIFICATIONS: AcademicNotification[] = [
  {
    id: "1",
    type: "academic",
    category: "conference_deadline",
    title: "ICML 2024 Submission Deadline",
    message: "The submission deadline for ICML 2024 is approaching in 3 days. Don't forget to submit your paper on machine learning advancements.",
    priority: "urgent",
    status: "unread",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    conference_name: "International Conference on Machine Learning",
    submission_deadline: "2024-01-18T23:59:00Z",
    venue: "Vienna, Austria",
    action_url: "https://icml.cc/submit",
    action_text: "Submit Paper"
  },
  {
    id: "2",
    type: "academic",
    category: "workshop",
    title: "AI in Healthcare Workshop",
    message: "Registration is now open for the AI in Healthcare Workshop at NeurIPS 2024. Early bird pricing ends soon.",
    priority: "medium",
    status: "unread",
    created_at: "2024-01-14T15:30:00Z",
    updated_at: "2024-01-14T15:30:00Z",
    conference_name: "NeurIPS Workshop on AI in Healthcare",
    event_date: "2024-12-15T09:00:00Z",
    venue: "New Orleans, LA",
    action_url: "https://neurips.cc/workshop-register",
    action_text: "Register Now"
  },
  {
    id: "3",
    type: "academic",
    category: "journal_deadline",
    title: "Nature Machine Intelligence Review Due",
    message: "Your review for the paper 'Advanced Neural Networks in Quantum Computing' is due in 5 days.",
    priority: "high",
    status: "read",
    created_at: "2024-01-12T09:15:00Z",
    updated_at: "2024-01-12T09:15:00Z",
    read_at: "2024-01-13T14:20:00Z",
    journal_name: "Nature Machine Intelligence",
    submission_deadline: "2024-01-20T23:59:00Z",
    action_url: "#",
    action_text: "Submit Review"
  },
  {
    id: "4",
    type: "academic",
    category: "paper_acceptance",
    title: "Paper Accepted at ICLR 2024",
    message: "Congratulations! Your paper 'Efficient Transformers for Scientific Text Processing' has been accepted at ICLR 2024.",
    priority: "high",
    status: "read",
    created_at: "2024-01-10T16:45:00Z",
    updated_at: "2024-01-10T16:45:00Z",
    read_at: "2024-01-10T17:00:00Z",
    conference_name: "International Conference on Learning Representations",
    event_date: "2024-05-07T09:00:00Z",
    venue: "Vienna, Austria"
  }
]

export const MOCK_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "5",
    type: "system",
    category: "deadline_missed",
    title: "Project Deadline Missed",
    message: "The deadline for 'Quantum ML Research' project milestone was missed. Please update the project timeline.",
    priority: "urgent",
    status: "unread",
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
    related_project_id: "proj_123",
    user_action_required: true,
    action_url: "/interface/projects/proj_123",
    action_text: "View Project"
  },
  {
    id: "6",
    type: "system",
    category: "todo_overdue",
    title: "3 Tasks Overdue",
    message: "You have 3 tasks that are past their due date: 'Literature Review', 'Data Analysis', and 'Draft Introduction'.",
    priority: "high",
    status: "unread",
    created_at: "2024-01-14T20:00:00Z",
    updated_at: "2024-01-14T20:00:00Z",
    user_action_required: true,
    action_url: "/interface/tasks",
    action_text: "View Tasks"
  },
  {
    id: "7",
    type: "system",
    category: "collaboration_invite",
    title: "Collaboration Invitation",
    message: "Dr. Sarah Chen has invited you to collaborate on the 'Neural Network Optimization' research project.",
    priority: "medium",
    status: "unread",
    created_at: "2024-01-13T11:30:00Z",
    updated_at: "2024-01-13T11:30:00Z",
    related_project_id: "proj_456",
    user_action_required: true,
    action_url: "/interface/projects/proj_456/collaboration",
    action_text: "Accept Invitation"
  },
  {
    id: "8",
    type: "system",
    category: "backup_complete",
    title: "Data Backup Completed",
    message: "Your weekly data backup has been completed successfully. All your research data and projects are safely backed up.",
    priority: "low",
    status: "read",
    created_at: "2024-01-12T02:00:00Z",
    updated_at: "2024-01-12T02:00:00Z",
    read_at: "2024-01-12T09:00:00Z"
  },
  {
    id: "9",
    type: "system",
    category: "account_update",
    title: "AI Agent Analysis Complete",
    message: "The AI agent has finished analyzing 15 new papers related to your 'Deep Learning Research' project.",
    priority: "medium",
    status: "read",
    created_at: "2024-01-11T14:20:00Z",
    updated_at: "2024-01-11T14:20:00Z",
    read_at: "2024-01-11T15:00:00Z",
    related_project_id: "proj_789",
    action_url: "/interface/projects/proj_789/insights",
    action_text: "View Insights"
  }
] 