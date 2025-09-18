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
import { notificationsApi } from "@/lib/api/notification-service/notifications"
import { Notification, NotificationSummary, ServiceNotification, SystemNotification } from "@/types/notification"
import { SERVICE_CATEGORIES, SYSTEM_CATEGORIES, PRIORITY_CONFIG } from "@/constants/notifications"
import { cn } from "@/lib/utils/cn"
import { format, formatDistance } from "date-fns"

export function NotificationContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        console.log("🔔 Loading notifications from backend...")
        const result = await notificationsApi.getNotifications()
        console.log("✅ Notifications loaded:", result)

        setNotifications(result.notifications)
        setSummary(result.summary)
      } catch (error) {
        console.error("❌ Failed to load notifications:", error)
        toast.error("Failed to load notifications")

        // Fallback to empty state
        setNotifications([])
        setSummary({
          total: 0,
          unread: 0,
          by_type: {
            service: { total: 0, unread: 0, urgent: 0 },
            academic: { total: 0, unread: 0, urgent: 0 },
            system: { total: 0, unread: 0, urgent: 0 }
          },
          by_priority: { urgent: 0, high: 0, medium: 0, low: 0 }
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [])

  // Manual refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      const result = await notificationsApi.getNotifications()
      setNotifications(result.notifications)
      setSummary(result.summary)
      toast.success("Notifications refreshed")
    } catch (e) {
      toast.error("Failed to refresh notifications")
    } finally {
      setIsRefreshing(false)
    }
  }

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
        const notification = notifications.find(n => n.id === notificationId)
        if (notification) {
          setSummary(prev => ({
            ...prev!,
            unread: prev!.unread - 1,
            by_type: {
              ...prev!.by_type,
              [notification.type]: {
                ...prev!.by_type[notification.type],
                unread: prev!.by_type[notification.type].unread - 1
              }
            }
          }))
        }
      }

      // Make API call
      await notificationsApi.markAsRead(notificationId)

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

      // Make API call
      await notificationsApi.markMultipleAsRead(selectedNotifications)

      toast.success(`${selectedNotifications.length} notifications marked as read`)
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
      toast.error("Failed to mark notifications as read")
    }
  }

  // Get filtered notifications
  const getFilteredNotifications = () => {
    const filtered = notifications.filter(n => {
      const statusMatch = showUnreadOnly ? n.status === 'unread' : true
      return statusMatch
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
    let category

    if (notification.type === 'service') {
      category = SERVICE_CATEGORIES[notification.category as keyof typeof SERVICE_CATEGORIES]
    } else if (notification.type === 'system') {
      category = SYSTEM_CATEGORIES[notification.category as keyof typeof SYSTEM_CATEGORIES]
    } else {
      // Fallback for unknown categories
      category = {
        label: notification.category,
        icon: Bell,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
      }
    }

    const priority = PRIORITY_CONFIG[notification.priority]
    return { category, priority }
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
                System notifications and alerts
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end mt-6">

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="relative"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
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
                      ? "No unread notifications at the moment."
                      : "No notifications to show."
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
                        "backdrop-blur-xl border cursor-pointer transition-all duration-300",
                        notification.status === 'unread'
                          ? "bg-background/40 border-primary/20 bg-primary/5 shadow-lg hover:shadow-xl hover:bg-primary/8"
                          : "bg-background/20 border-muted/30 shadow-sm hover:shadow-md opacity-75 hover:opacity-85",
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
                            "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                            notification.status === 'unread'
                              ? category.bgColor
                              : "bg-muted/20"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5 transition-colors",
                              notification.status === 'unread'
                                ? category.color
                                : "text-muted-foreground/60"
                            )} />
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className={cn(
                                  "font-semibold transition-colors",
                                  notification.status === 'unread'
                                    ? "text-foreground"
                                    : "text-muted-foreground/80"
                                )}>
                                  {notification.title}
                                </h4>
                                {notification.status === 'unread' && (
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
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

                            <p className={cn(
                              "text-sm mb-3 transition-colors",
                              notification.status === 'unread'
                                ? "text-muted-foreground"
                                : "text-muted-foreground/60"
                            )}>
                              {notification.message}
                            </p>

                            {/* System-specific info */}
                            {notification.type === 'system' && (notification as SystemNotification).user_action_required && (
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