import { Todo } from "@/types/todo"
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Users,
  Calendar,
  User,
  BookOpen,
  PenTool,
  Search,
  MessageSquare,
  Flag,
  Circle,
  FlaskConical,
  Database,
  BarChart3,
  Cpu,
  Send,
  Presentation,
  DollarSign,
  ClipboardList,
  HelpCircle
} from "lucide-react"

// Status configurations
export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20"
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  }
}

// Priority configurations
export const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    order: 1
  },
  high: {
    label: "High",
    icon: Flag,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    order: 2
  },
  medium: {
    label: "Medium",
    icon: Target,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    order: 3
  },
  low: {
    label: "Low",
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    order: 4
  }
}

// Category configurations
export const CATEGORY_CONFIG = {
  // Research Lifecycle
  literature_review: {
    label: "Literature Review",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-500"
  },
  experiment: {
    label: "Experiment",
    icon: FlaskConical,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    iconColor: "text-green-500"
  },
  data_collection: {
    label: "Data Collection",
    icon: Database,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-500"
  },
  data_analysis: {
    label: "Data Analysis",
    icon: BarChart3,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    iconColor: "text-indigo-500"
  },
  modeling: {
    label: "Modeling",
    icon: Cpu,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-500"
  },
  writing: {
    label: "Writing",
    icon: PenTool,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-500"
  },
  review: {
    label: "Review",
    icon: Search,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    iconColor: "text-amber-500"
  },
  submission: {
    label: "Submission",
    icon: Send,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    iconColor: "text-rose-500"
  },
  presentation: {
    label: "Presentation",
    icon: Presentation,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    iconColor: "text-violet-500"
  },

  // Project & Collaboration
  collaboration: {
    label: "Collaboration",
    icon: MessageSquare,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    iconColor: "text-teal-500"
  },
  meeting: {
    label: "Meeting",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    iconColor: "text-orange-500"
  },
  deadline: {
    label: "Deadline",
    icon: Calendar,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    iconColor: "text-red-500"
  },
  funding: {
    label: "Funding",
    icon: DollarSign,
    color: "text-lime-600",
    bgColor: "bg-lime-500/10",
    borderColor: "border-lime-500/20",
    iconColor: "text-lime-500"
  },
  administrative: {
    label: "Administrative",
    icon: ClipboardList,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    iconColor: "text-slate-500"
  },

  // Personal Productivity
  personal: {
    label: "Personal",
    icon: User,
    color: "text-gray-600",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    iconColor: "text-gray-500"
  },
  misc: {
    label: "Miscellaneous",
    icon: HelpCircle,
    color: "text-neutral-600",
    bgColor: "bg-neutral-500/10",
    borderColor: "border-neutral-500/20",
    iconColor: "text-neutral-500"
  }
}

// Sort options
export const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Newest First', field: 'created_at' as const, direction: 'desc' as const },
  { value: 'created_at-asc', label: 'Oldest First', field: 'created_at' as const, direction: 'asc' as const },
  { value: 'due_date-asc', label: 'Due Date (Soon)', field: 'due_date' as const, direction: 'asc' as const },
  { value: 'due_date-desc', label: 'Due Date (Later)', field: 'due_date' as const, direction: 'desc' as const },
  { value: 'priority-asc', label: 'Priority (High)', field: 'priority' as const, direction: 'asc' as const },
  { value: 'priority-desc', label: 'Priority (Low)', field: 'priority' as const, direction: 'desc' as const },
  { value: 'title-asc', label: 'Title (A-Z)', field: 'title' as const, direction: 'asc' as const },
  { value: 'title-desc', label: 'Title (Z-A)', field: 'title' as const, direction: 'desc' as const },
  { value: 'estimated_time-asc', label: 'Time (Short)', field: 'estimated_time' as const, direction: 'asc' as const },
  { value: 'estimated_time-desc', label: 'Time (Long)', field: 'estimated_time' as const, direction: 'desc' as const }
]

// Mock todos for development
export const MOCK_TODOS: Todo[] = [
  {
    id: "1",
    title: "Complete Literature Review for ML Paper",
    description: "Review 15 recent papers on transformer architectures for the machine learning survey",
    status: "in_progress",
    priority: "high",
    category: "literature_review",
    due_date: "2024-01-20T17:00:00Z",
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    estimated_time: 480, // 8 hours
    actual_time: 180, // 3 hours so far
    related_project_id: "proj_123",
    tags: ["literature", "transformers", "ml"],
    subtasks: [
      { id: "sub_1", title: "Search for recent papers (2023-2024)", completed: true, created_at: "2024-01-10T10:00:00Z" },
      { id: "sub_2", title: "Read and summarize 15 papers", completed: false, created_at: "2024-01-10T10:00:00Z" },
      { id: "sub_3", title: "Create comparison table", completed: false, created_at: "2024-01-10T10:00:00Z" }
    ],
    reminders: [
      { id: "rem_1", remind_at: "2024-01-18T09:00:00Z", message: "Literature review due in 2 days", sent: false }
    ]
  },
  {
    id: "2",
    title: "Draft Introduction Section",
    description: "Write the introduction section for the quantum computing research paper",
    status: "pending",
    priority: "urgent",
    category: "writing",
    due_date: "2024-01-18T23:59:00Z",
    created_at: "2024-01-12T09:00:00Z",
    updated_at: "2024-01-12T09:00:00Z",
    estimated_time: 240, // 4 hours
    related_project_id: "proj_456",
    tags: ["writing", "quantum", "introduction"],
    subtasks: [
      { id: "sub_4", title: "Outline key points", completed: false, created_at: "2024-01-12T09:00:00Z" },
      { id: "sub_5", title: "Write first draft", completed: false, created_at: "2024-01-12T09:00:00Z" },
      { id: "sub_6", title: "Review and edit", completed: false, created_at: "2024-01-12T09:00:00Z" }
    ],
    reminders: []
  },
  {
    id: "3",
    title: "Review Paper for Nature AI",
    description: "Peer review for 'Neural Networks in Climate Modeling' submitted to Nature AI",
    status: "pending",
    priority: "high",
    category: "review",
    due_date: "2024-01-25T23:59:00Z",
    created_at: "2024-01-14T11:00:00Z",
    updated_at: "2024-01-14T11:00:00Z",
    estimated_time: 300, // 5 hours
    tags: ["review", "climate", "neural-networks"],
    subtasks: [
      { id: "sub_7", title: "Read paper thoroughly", completed: false, created_at: "2024-01-14T11:00:00Z" },
      { id: "sub_8", title: "Check methodology", completed: false, created_at: "2024-01-14T11:00:00Z" },
      { id: "sub_9", title: "Write detailed review", completed: false, created_at: "2024-01-14T11:00:00Z" }
    ],
    reminders: [
      { id: "rem_2", remind_at: "2024-01-22T10:00:00Z", message: "Review deadline in 3 days", sent: false }
    ]
  },
  {
    id: "4",
    title: "Prepare Conference Presentation",
    description: "Create slides for ICML 2024 presentation on efficient transformers",
    status: "pending",
    priority: "medium",
    category: "meeting",
    due_date: "2024-02-01T10:00:00Z",
    created_at: "2024-01-13T15:00:00Z",
    updated_at: "2024-01-13T15:00:00Z",
    estimated_time: 360, // 6 hours
    related_project_id: "proj_123",
    tags: ["presentation", "icml", "transformers"],
    subtasks: [
      { id: "sub_10", title: "Outline presentation structure", completed: false, created_at: "2024-01-13T15:00:00Z" },
      { id: "sub_11", title: "Create slide templates", completed: false, created_at: "2024-01-13T15:00:00Z" },
      { id: "sub_12", title: "Add content and figures", completed: false, created_at: "2024-01-13T15:00:00Z" },
      { id: "sub_13", title: "Practice presentation", completed: false, created_at: "2024-01-13T15:00:00Z" }
    ],
    reminders: []
  },
  {
    id: "5",
    title: "Data Analysis for Experiment 2",
    description: "Analyze results from the second round of transformer efficiency experiments",
    status: "completed",
    priority: "medium",
    category: "data_analysis",
    due_date: "2024-01-15T17:00:00Z",
    created_at: "2024-01-08T14:00:00Z",
    updated_at: "2024-01-15T16:30:00Z",
    completed_at: "2024-01-15T16:30:00Z",
    estimated_time: 480, // 8 hours
    actual_time: 420, // 7 hours
    related_project_id: "proj_123",
    tags: ["analysis", "experiments", "data"],
    subtasks: [
      { id: "sub_14", title: "Clean and preprocess data", completed: true, created_at: "2024-01-08T14:00:00Z" },
      { id: "sub_15", title: "Run statistical analysis", completed: true, created_at: "2024-01-08T14:00:00Z" },
      { id: "sub_16", title: "Generate visualizations", completed: true, created_at: "2024-01-08T14:00:00Z" },
      { id: "sub_17", title: "Write analysis summary", completed: true, created_at: "2024-01-08T14:00:00Z" }
    ],
    reminders: []
  },
  {
    id: "6",
    title: "Team Meeting - Weekly Sync",
    description: "Weekly research team meeting to discuss progress and next steps",
    status: "pending",
    priority: "low",
    category: "meeting",
    due_date: "2024-01-17T15:00:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    estimated_time: 60, // 1 hour
    tags: ["meeting", "team", "sync"],
    subtasks: [
      { id: "sub_18", title: "Prepare progress update", completed: false, created_at: "2024-01-15T10:00:00Z" },
      { id: "sub_19", title: "Review team agenda", completed: false, created_at: "2024-01-15T10:00:00Z" }
    ],
    reminders: [
      { id: "rem_3", remind_at: "2024-01-17T14:00:00Z", message: "Team meeting in 1 hour", sent: false }
    ]
  }
] 