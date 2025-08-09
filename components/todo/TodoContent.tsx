"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import {
  CheckSquare,
  Plus,
  MoreVertical,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Filter,
  SortAsc,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  Play,
  Square,
  AlertTriangle,
  Target,
  Flag,
  Brain,
  User,
  Users,
  Search,
  X,
  Timer,
  BookOpen,
  FileText,
  Lightbulb,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react"
import { format, formatDistance, isAfter, isBefore, isToday, isThisWeek, parseISO, startOfDay } from "date-fns"
import { cn } from "@/lib/utils/cn"
import { todosApi } from "@/lib/api/todos"
import { Todo, TodoFilters, TodoSortOptions, TodoSummary, TodoForm } from "@/types/todo"
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG, SORT_OPTIONS, MOCK_TODOS } from "@/constants/todos"

export function TodoContent() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [summary, setSummary] = useState<TodoSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTodos, setSelectedTodos] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(true)

  // Filters and sorting
  const [filters, setFilters] = useState<TodoFilters>({})
  const [sort, setSort] = useState<TodoSortOptions>({ field: 'created_at', direction: 'desc' })
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  // Form state
  const [form, setForm] = useState<TodoForm>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'research',
    due_date: '',
    estimated_time: 60,
    related_project_id: '',
    tags: [],
    subtasks: [],
    reminders: []
  })

  // Add time state for due date
  const [dueTime, setDueTime] = useState<string>("12:00")

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date | undefined, time: string): string => {
    if (!date || isNaN(date.getTime()) || typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return ""
    const [hours, minutes] = time.split(":")
    const newDate = new Date(date)
    newDate.setHours(parseInt(hours), parseInt(minutes))
    if (isNaN(newDate.getTime())) return ""
    // Return ISO string without milliseconds to match backend expectations
    return newDate.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }

  // Helper function to format date for display in todo card
  const formatDateForCard = (dateString: string | undefined): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy 'at' h:mm a") // e.g., "Apr 29, 2024 at 2:00 PM"
    } catch (error) {
      return ""
    }
  }

  // Load todos and summary
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Load todos and summary from API
        const [todosResult, summaryResult] = await Promise.all([
          todosApi.getTodos(filters, sort),
          todosApi.getSummary()
        ])

        console.log("Todos loaded:", todosResult.todos.length)
        console.log("Summary loaded:", summaryResult)

        setTodos(todosResult.todos)
        setSummary(summaryResult)
      } catch (error) {
        console.error("Failed to load todos:", error)
        toast.error("Failed to load todos from server, using mock data")

        // Fallback to mock data for development
        setTodos(MOCK_TODOS)
        const mockSummary: TodoSummary = {
          total: MOCK_TODOS.length,
          by_status: {
            pending: MOCK_TODOS.filter(t => t.status === 'pending').length,
            in_progress: MOCK_TODOS.filter(t => t.status === 'in_progress').length,
            completed: MOCK_TODOS.filter(t => t.status === 'completed').length,
            cancelled: MOCK_TODOS.filter(t => t.status === 'cancelled').length
          },
          by_priority: {
            urgent: MOCK_TODOS.filter(t => t.priority === 'urgent').length,
            high: MOCK_TODOS.filter(t => t.priority === 'high').length,
            medium: MOCK_TODOS.filter(t => t.priority === 'medium').length,
            low: MOCK_TODOS.filter(t => t.priority === 'low').length
          },
          overdue: MOCK_TODOS.filter(t =>
            t.due_date && t.status !== 'completed' &&
            isBefore(parseISO(t.due_date), startOfDay(new Date()))
          ).length,
          due_today: MOCK_TODOS.filter(t =>
            t.due_date && isToday(parseISO(t.due_date))
          ).length,
          due_this_week: MOCK_TODOS.filter(t =>
            t.due_date && isThisWeek(parseISO(t.due_date))
          ).length
        }
        setSummary(mockSummary)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [filters, sort])

  // Filter and sort todos
  const filteredTodos = useMemo(() => {
    let filtered = todos.filter(todo => {
      // Search filter
      if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !todo.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (filters.status && !filters.status.includes(todo.status)) {
        return false
      }

      // Priority filter
      if (filters.priority && !filters.priority.includes(todo.priority)) {
        return false
      }

      // Category filter
      if (filters.category && !filters.category.includes(todo.category)) {
        return false
      }

      // Show completed filter
      if (!showCompleted && todo.status === 'completed') {
        return false
      }

      return true
    })

    // Sort
    return filtered.sort((a, b) => {
      let aValue: any = a[sort.field]
      let bValue: any = b[sort.field]

      if (sort.field === 'due_date') {
        aValue = a.due_date ? new Date(a.due_date).getTime() : 0
        bValue = b.due_date ? new Date(b.due_date).getTime() : 0
      } else if (sort.field === 'priority') {
        aValue = PRIORITY_CONFIG[a.priority].order
        bValue = PRIORITY_CONFIG[b.priority].order
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [todos, filters, sort, searchQuery, showCompleted])

  // Handle todo status update
  const handleStatusUpdate = async (todoId: string, status: Todo['status']) => {
    try {
      // Update local state immediately
      setTodos(prev =>
        prev.map(t =>
          t.id === todoId
            ? {
              ...t,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString()
            }
            : t
        )
      )

      // API call
      const result = await todosApi.updateTodoStatus(todoId, status)
      if (!result.success) {
        toast.error(result.message || "Failed to update todo status")
      } else {
        toast.success(`Todo marked as ${status.replace('_', ' ')}`)
        // Refresh summary after status update
        const summaryResult = await todosApi.getSummary()
        setSummary(summaryResult)
      }
    } catch (error) {
      console.error("Failed to update todo status:", error)
      toast.error("Failed to update todo status")
    }
  }

  // Handle create todo
  const handleCreateTodo = async () => {
    try {
      if (!form.title.trim()) {
        toast.error("Title is required")
        return
      }

      // Debug authentication
      const token = localStorage.getItem("scholarai_token");
      const userData = localStorage.getItem("scholarai_user");
      console.log("Auth token exists:", !!token);
      console.log("User data:", userData ? JSON.parse(userData) : null);

      if (!token) {
        toast.error("You must be logged in to create todos");
        return;
      }

      console.log("Creating todo with form data:", form);

      const result = await todosApi.createTodo(form)

      if (result.success && result.data) {
        setTodos(prev => [result.data!, ...prev])
        setShowCreateDialog(false)
        resetForm()
        setDueTime("12:00") // Reset time input

        // Refresh summary
        const summaryResult = await todosApi.getSummary()
        setSummary(summaryResult)

        toast.success("Todo created successfully")
      } else {
        toast.error(result.message || "Failed to create todo")
      }
    } catch (error) {
      console.error("Failed to create todo:", error)
      toast.error("Failed to create todo")
    }
  }

  // Handle delete todo
  const handleDeleteTodo = async (todoId: string) => {
    try {
      const result = await todosApi.deleteTodo(todoId)

      if (result.success) {
        setTodos(prev => prev.filter(t => t.id !== todoId))

        // Refresh summary
        const summaryResult = await todosApi.getSummary()
        setSummary(summaryResult)

        toast.success("Todo deleted successfully")
      } else {
        toast.error(result.message || "Failed to delete todo")
      }
    } catch (error) {
      console.error("Failed to delete todo:", error)
      toast.error("Failed to delete todo")
    }
  }

  // Reset form
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      category: 'research',
      due_date: '',
      estimated_time: 60,
      related_project_id: '',
      tags: [],
      subtasks: [],
      reminders: []
    })
  }

  // Get todo styling
  const getTodoStyling = (todo: Todo) => {
    const status = STATUS_CONFIG[todo.status]
    const priority = PRIORITY_CONFIG[todo.priority]
    const category = CATEGORY_CONFIG[todo.category]

    return { status, priority, category }
  }

  // Check if todo is overdue
  const isOverdue = (todo: Todo) => {
    return todo.due_date && todo.status !== 'completed' &&
      isBefore(parseISO(todo.due_date), startOfDay(new Date()))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-primary/10 bg-background/40 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                <CheckSquare className="h-8 w-8 text-primary" />
                Todo Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Organize tasks and track progress efficiently
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary-to-accent text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Todo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Todo</DialogTitle>
                    <DialogDescription>
                      Add a new task to your todo list
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter todo title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter todo description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={form.priority} onValueChange={(value: any) => setForm(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <config.icon className={cn("h-4 w-4", config.color)} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={form.category} onValueChange={(value: any) => setForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <config.icon className={cn("h-4 w-4", config.color)} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="due_date">Due Date & Time</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !form.due_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.due_date ? formatDateForCard(form.due_date) : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form.due_date ? new Date(form.due_date) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setForm(prev => ({
                                    ...prev,
                                    due_date: combineDateAndTime(date, dueTime)
                                  }))
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <Input
                          type="time"
                          value={dueTime}
                          onChange={(e) => {
                            setDueTime(e.target.value)
                            if (form.due_date) {
                              setForm(prev => ({
                                ...prev,
                                due_date: combineDateAndTime(new Date(form.due_date), e.target.value)
                              }))
                            }
                          }}
                          className="w-[150px]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="estimated_time">Estimated Time (minutes)</Label>
                      <Input
                        id="estimated_time"
                        type="number"
                        value={form.estimated_time}
                        onChange={(e) => setForm(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTodo}>
                      Create Todo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card className="bg-background/40 backdrop-blur-xl border border-primary/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{summary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{summary.by_status.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500">{summary.by_status.in_progress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-green-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{summary.by_status.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-red-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">{summary.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{summary.due_today}</div>
                  <div className="text-xs text-muted-foreground">Due Today</div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-xl border border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500">{summary.due_this_week}</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search todos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={`${sort.field}-${sort.direction}`} onValueChange={(value) => {
              const option = SORT_OPTIONS.find(o => o.value === value)
              if (option) {
                setSort({ field: option.field, direction: option.direction })
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                !showCompleted && "bg-primary/10 border-primary/20"
              )}
            >
              {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="relative z-10 container mx-auto px-6 py-6">
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
              <CardContent className="p-12 text-center">
                <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Todos Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No todos match your search criteria." : "Create your first todo to get started."}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-4 gradient-primary-to-accent text-white"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Todo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map((todo) => {
              const { status, priority, category } = getTodoStyling(todo)
              const overdue = isOverdue(todo)

              return (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "bg-background/40 backdrop-blur-xl border shadow-lg cursor-pointer transition-all hover:shadow-xl",
                      status.borderColor,
                      overdue && "border-red-500/30 bg-red-500/5",
                      todo.status === 'completed' && "opacity-75"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Status Toggle */}
                        <div
                          className="mt-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
                            handleStatusUpdate(todo.id, newStatus)
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            {todo.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            )}
                          </Button>
                        </div>

                        {/* Todo Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className={cn(
                                "font-semibold",
                                todo.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {todo.title}
                              </h4>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Dropdown */}
                              <Select
                                value={todo.status}
                                onValueChange={(value: Todo['status']) => handleStatusUpdate(todo.id, value)}
                              >
                                <SelectTrigger className="h-7 w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <config.icon className={cn("h-4 w-4", config.color)} />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingTodo(todo)
                                  setForm({
                                    title: todo.title,
                                    description: todo.description || '',
                                    priority: todo.priority,
                                    category: todo.category,
                                    due_date: todo.due_date || '',
                                    estimated_time: todo.estimated_time || 60,
                                    related_project_id: todo.related_project_id || '',
                                    tags: todo.tags,
                                    subtasks: todo.subtasks.map(s => ({ title: s.title })),
                                    reminders: []
                                  })
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTodo(todo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <Badge
                                variant="outline"
                                className={cn("text-xs", priority.color, priority.borderColor)}
                              >
                                {priority.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {category.label}
                              </Badge>
                            </div>
                          </div>

                          {todo.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {todo.description}
                            </p>
                          )}

                          {/* Subtasks Section */}
                          {todo.subtasks.length > 0 && (
                            <div className="mb-3 space-y-2">
                              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                                <span>Subtasks</span>
                                <span>{todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}</span>
                              </div>
                              <div className="space-y-1.5">
                                {todo.subtasks.map((subtask) => (
                                  <div
                                    key={subtask.id}
                                    className="flex items-center gap-2 text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Update local state immediately for better UX
                                      setTodos(prev => prev.map(t =>
                                        t.id === todo.id
                                          ? {
                                            ...t,
                                            subtasks: t.subtasks.map(s =>
                                              s.id === subtask.id
                                                ? { ...s, completed: !s.completed }
                                                : s
                                            )
                                          }
                                          : t
                                      ))
                                      // API call
                                      todosApi.toggleSubtask(todo.id, subtask.id)
                                    }}
                                  >
                                    <div className={cn(
                                      "w-4 h-4 border rounded-sm cursor-pointer transition-colors flex items-center justify-center",
                                      subtask.completed
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/30 hover:border-primary/50"
                                    )}>
                                      {subtask.completed && (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <span className={cn(
                                      "flex-1 cursor-pointer",
                                      subtask.completed && "line-through text-muted-foreground"
                                    )}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Meta Information */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              {todo.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due {formatDateForCard(todo.due_date)}
                                </div>
                              )}

                              {todo.estimated_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.round(todo.estimated_time / 60)}h {todo.estimated_time % 60}m
                                </div>
                              )}

                              {todo.subtasks.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <CheckSquare className="h-3 w-3" />
                                  {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} subtasks
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", status.color, status.borderColor)}
                              >
                                {status.label}
                              </Badge>
                              <span>
                                {todo.created_at && !isNaN(new Date(todo.created_at).getTime())
                                  ? formatDistance(parseISO(todo.created_at), new Date(), { addSuffix: true })
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {/* Tags */}
                          {todo.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-3">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              {todo.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Edit Todo Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogDescription>
              Modify the todo details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter todo title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter todo description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={form.priority} onValueChange={(value: any) => setForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(value: any) => setForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.due_date ? formatDateForCard(form.due_date) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.due_date ? new Date(form.due_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setForm(prev => ({
                            ...prev,
                            due_date: combineDateAndTime(date, dueTime)
                          }))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => {
                    setDueTime(e.target.value)
                    if (form.due_date) {
                      setForm(prev => ({
                        ...prev,
                        due_date: combineDateAndTime(new Date(form.due_date), e.target.value)
                      }))
                    }
                  }}
                  className="w-[150px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_time">Estimated Time (minutes)</Label>
              <Input
                id="estimated_time"
                type="number"
                value={form.estimated_time}
                onChange={(e) => setForm(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            {/* Subtasks Section */}
            <div>
              <Label className="flex items-center justify-between">
                <span>Subtasks</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    subtasks: [...prev.subtasks, { title: '' }]
                  }))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subtask
                </Button>
              </Label>
              <div className="space-y-2 mt-2">
                {form.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={subtask.title}
                      onChange={(e) => {
                        const newSubtasks = [...form.subtasks]
                        newSubtasks[index].title = e.target.value
                        setForm(prev => ({ ...prev, subtasks: newSubtasks }))
                      }}
                      placeholder="Subtask title"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-red-500 hover:text-red-600"
                      onClick={() => {
                        const newSubtasks = form.subtasks.filter((_, i) => i !== index)
                        setForm(prev => ({ ...prev, subtasks: newSubtasks }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (editingTodo) {
                const result = await todosApi.updateTodo(editingTodo.id, form)

                if (result.success && result.data) {
                  // Update local state
                  setTodos(prev => prev.map(todo =>
                    todo.id === editingTodo.id ? result.data! : todo
                  ))

                  setShowEditDialog(false)
                  resetForm()
                  setEditingTodo(null)
                  toast.success("Todo updated successfully")
                } else {
                  toast.error(result.message || "Failed to update todo")
                }
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 