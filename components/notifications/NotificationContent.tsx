"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Bell,
  GraduationCap,
  Settings,
  MoreVertical,
  ExternalLink,
  Check,
  X,
  Clock,
  Filter,
  Loader2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Users,
  Eye,
  EyeOff
} from "lucide-react"
import { notificationsApi } from "@/lib/api/notifications"
import { Notification, NotificationSummary, AcademicNotification, GeneralNotification } from "@/types/notification"
import { ACADEMIC_CATEGORIES, GENERAL_CATEGORIES, PRIORITY_CONFIG, MOCK_ACADEMIC_NOTIFICATIONS, MOCK_GENERAL_NOTIFICATIONS } from "@/constants/notifications"
import { cn } from "@/lib/utils/cn"
import { format, formatDistance } from "date-fns"

type NotificationTab = 'academic' | 'general'

export function NotificationContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [activeTab, setActiveTab] = useState<NotificationTab>('academic')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // For now, using mock data - replace with API call when backend is ready
        const mockData = [
          ...MOCK_ACADEMIC_NOTIFICATIONS,
          ...MOCK_GENERAL_NOTIFICATIONS
        ]

        setNotifications(mockData)

        // Calculate summary from mock data
        const academicNotifications = mockData.filter(n => n.type === 'academic')
        const generalNotifications = mockData.filter(n => n.type === 'general')

        const mockSummary: NotificationSummary = {
          total: mockData.length,
          unread: mockData.filter(n => n.status === 'unread').length,
          by_type: {
            academic: {
              total: academicNotifications.length,
              unread: academicNotifications.filter(n => n.status === 'unread').length,
              urgent: academicNotifications.filter(n => n.priority === 'urgent').length
            },
            general: {
              total: generalNotifications.length,
              unread: generalNotifications.filter(n => n.status === 'unread').length,
              urgent: generalNotifications.filter(n => n.priority === 'urgent').length
            }
          },
          by_priority: {
            urgent: mockData.filter(n => n.priority === 'urgent').length,
            high: mockData.filter(n => n.priority === 'high').length,
            medium: mockData.filter(n => n.priority === 'medium').length,
            low: mockData.filter(n => n.priority === 'low').length
          }
        }

        setSummary(mockSummary)

        // Uncomment when API is ready:
        // const result = await notificationsApi.getNotifications()
        // setNotifications(result.notifications)
        // setSummary(result.summary)
      } catch (error) {
        console.error("Failed to load notifications:", error)
        toast.error("Failed to load notifications")
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [])

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      )

      // Update summary
      if (summary) {
        setSummary(prev => ({
          ...prev!,
          unread: prev!.unread - 1,
          by_type: {
            ...prev!.by_type,
            [activeTab]: {
              ...prev!.by_type[activeTab],
              unread: prev!.by_type[activeTab].unread - 1
            }
          }
        }))
      }

      // Make API call (uncomment when ready)
      // await notificationsApi.markAsRead(notificationId)

      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  // Handle bulk mark as read
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return

    try {
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          selectedNotifications.includes(n.id)
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      )

      setSelectedNotifications([])

      // Make API call (uncomment when ready)
      // await notificationsApi.markMultipleAsRead(selectedNotifications)

      toast.success(`${selectedNotifications.length} notifications marked as read`)
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
      toast.error("Failed to mark notifications as read")
    }
  }

  // Get filtered notifications
  const getFilteredNotifications = () => {
    const filtered = notifications.filter(n => {
      const typeMatch = n.type === activeTab
      const statusMatch = showUnreadOnly ? n.status === 'unread' : true
      return typeMatch && statusMatch
    })

    return filtered.sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  // Get notification icon and styling
  const getNotificationStyling = (notification: Notification) => {
    if (notification.type === 'academic') {
      const category = ACADEMIC_CATEGORIES[notification.category as keyof typeof ACADEMIC_CATEGORIES]
      const priority = PRIORITY_CONFIG[notification.priority]
      return { category, priority }
    } else {
      const category = GENERAL_CATEGORIES[notification.category as keyof typeof GENERAL_CATEGORIES]
      const priority = PRIORITY_CONFIG[notification.priority]
      return { category, priority }
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id)
    }

    if (notification.action_url) {
      if (notification.action_url.startsWith('http')) {
        window.open(notification.action_url, '_blank')
      } else {
        window.location.href = notification.action_url
      }
    }
  }

  const filteredNotifications = getFilteredNotifications()

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                Stay updated with academic deadlines and system alerts
              </p>
            </div>

            {/* Summary Stats */}
            {summary && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{summary.unread}</div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{summary.by_priority.urgent}</div>
                  <div className="text-xs text-muted-foreground">Urgent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{summary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'academic' ? 'default' : 'outline'}
                onClick={() => setActiveTab('academic')}
                className={cn(
                  "flex items-center gap-2",
                  activeTab === 'academic'
                    ? "gradient-primary-to-accent text-white"
                    : "border-primary/20 hover:bg-primary/5"
                )}
              >
                <GraduationCap className="h-4 w-4" />
                Academic & Research
                {summary && summary.by_type.academic.unread > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {summary.by_type.academic.unread}
                  </Badge>
                )}
              </Button>

              <Button
                variant={activeTab === 'general' ? 'default' : 'outline'}
                onClick={() => setActiveTab('general')}
                className={cn(
                  "flex items-center gap-2",
                  activeTab === 'general'
                    ? "gradient-primary-to-accent text-white"
                    : "border-primary/20 hover:bg-primary/5"
                )}
              >
                <Settings className="h-4 w-4" />
                General & System
                {summary && summary.by_type.general.unread > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {summary.by_type.general.unread}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={cn(
                  showUnreadOnly && "bg-primary/10 border-primary/20"
                )}
              >
                {showUnreadOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
              </Button>

              {selectedNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark {selectedNotifications.length} as Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="relative z-10 container mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {filteredNotifications.length === 0 ? (
              <Card className="bg-background/40 backdrop-blur-xl border border-primary/10 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {showUnreadOnly
                      ? `No unread ${activeTab} notifications at the moment.`
                      : `No ${activeTab} notifications to show.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const { category, priority } = getNotificationStyling(notification)
                const Icon = category.icon
                const isSelected = selectedNotifications.includes(notification.id)

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={cn(
                        "bg-background/40 backdrop-blur-xl border shadow-lg cursor-pointer transition-all hover:shadow-xl",
                        notification.status === 'unread'
                          ? "border-primary/20 bg-primary/5"
                          : "border-primary/10",
                        priority.borderColor,
                        isSelected && "ring-2 ring-primary/50"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Selection Checkbox */}
                          <div
                            className="mt-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedNotifications(prev =>
                                prev.includes(notification.id)
                                  ? prev.filter(id => id !== notification.id)
                                  : [...prev, notification.id]
                              )
                            }}
                          >
                            <div className={cn(
                              "w-4 h-4 border rounded cursor-pointer transition-colors",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30 hover:border-primary/50"
                            )}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white m-0.5" />
                              )}
                            </div>
                          </div>

                          {/* Notification Icon */}
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg",
                            category.bgColor
                          )}>
                            <Icon className={cn("h-5 w-5", category.color)} />
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">
                                  {notification.title}
                                </h4>
                                {notification.status === 'unread' && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", priority.color, priority.borderColor)}
                                >
                                  {priority.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistance(new Date(notification.created_at), new Date(), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            <p className="text-muted-foreground text-sm mb-3">
                              {notification.message}
                            </p>

                            {/* Academic-specific info */}
                            {notification.type === 'academic' && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                {(notification as AcademicNotification).venue && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {(notification as AcademicNotification).venue}
                                  </div>
                                )}
                                {(notification as AcademicNotification).submission_deadline && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due: {format(new Date((notification as AcademicNotification).submission_deadline!), 'MMM dd, yyyy')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* General-specific info */}
                            {notification.type === 'general' && (notification as GeneralNotification).user_action_required && (
                              <div className="flex items-center gap-1 text-xs text-orange-500 mb-3">
                                <AlertTriangle className="h-3 w-3" />
                                Action Required
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {category.label}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {notification.status === 'unread' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark Read
                                  </Button>
                                )}

                                {notification.action_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleNotificationClick(notification)}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    {notification.action_text || 'View'}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 