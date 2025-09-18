"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Settings,
  Home,
  Bell,
  User,
  Workflow,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Folder,
  GitBranch,
  Bug,
  Zap,
  Brain,
  Sparkles,
  LogOut,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { useLoading } from "@/contexts/LoadingContext"

type Props = {
  collapsed: boolean
  onToggle: () => void
  className?: string
}

const NAV_ITEMS = [
  {
    name: "Home",
    href: "/interface/home",
    icon: Home,
    description: "Welcome guide and getting started",
    loadingMessage: "Loading home dashboard...",
    animationClass: "group-hover:animate-bounce"
  },
  {
    name: "Projects",
    href: "/interface/projects",
    icon: BookOpen,
    description: "Research project management",
    loadingMessage: "Loading research projects...",
    animationClass: "group-hover:animate-pulse group-hover:scale-110"
  },
  {
    name: "ToDo",
    href: "/interface/todo",
    icon: CheckSquare,
    description: "Task management and planning",
    loadingMessage: "Loading task management...",
    animationClass: "group-hover:scale-110 group-hover:rotate-12"
  },
  {
    name: "Notifications",
    href: "/interface/notifications",
    icon: Bell,
    description: "System notifications and alerts",
    loadingMessage: "Loading notifications...",
    animationClass: "group-hover:animate-bounce group-hover:scale-110"
  }
]

const SETTINGS_ITEMS = [
  {
    name: "Settings",
    href: "/interface/settings",
    icon: Settings,
    description: "Application preferences and customization",
    loadingMessage: "Loading settings...",
    animationClass: "group-hover:animate-slow-spin"
  }
]

const BOTTOM_ITEMS = [
  {
    name: "Account",
    href: "/interface/account",
    icon: User,
    description: "User profile and preferences",
    loadingMessage: "Loading account settings...",
    animationClass: "group-hover:animate-pulse group-hover:scale-110"
  }
]

export function Sidebar({ collapsed, onToggle, className }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { showPageLoading, hidePageLoading } = useLoading()

  const handleNavigation = (href: string, loadingMessage: string) => {
    // Don't show loading if we're already on the same page
    if (pathname === href) return

    showPageLoading(loadingMessage)

    // Add a small delay to ensure the loading indicator shows
    setTimeout(() => {
      router.push(href)
      // Hide loading after navigation completes
      setTimeout(() => {
        hidePageLoading()
      }, 500)
    }, 100)
  }

  const SidebarItem = ({ item, isBottom = false }: { item: typeof NAV_ITEMS[0] | typeof SETTINGS_ITEMS[0] | typeof BOTTOM_ITEMS[0], isBottom?: boolean }) => {
    const isActive = pathname.startsWith(item.href)

    const content = (
      <button
        onClick={() => handleNavigation(item.href, item.loadingMessage)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left",
          "hover:bg-primary/10 hover:border-primary/50",
          isActive
            ? "bg-gradient-to-r from-primary/20 to-accent/10 text-primary border-primary/50"
            : "text-foreground/80 hover:text-foreground border-primary/20 bg-background/20",
          collapsed && "justify-center px-3"
        )}
        style={isActive ? {
          boxShadow: `
            0 0 25px hsl(var(--accent-1) / 0.3),
            0 0 50px hsl(var(--accent-2) / 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 6px 25px hsl(var(--accent-1) / 0.2),
            0 0 0 1px hsl(var(--accent-1) / 0.2)
          `
        } : {
          boxShadow: `
            0 0 10px hsl(var(--accent-1) / 0.1),
            0 2px 8px rgba(0, 0, 0, 0.05),
            0 0 0 1px hsl(var(--accent-1) / 0.05)
          `
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.boxShadow = `
              0 0 20px hsl(var(--accent-1) / 0.2),
              0 0 40px hsl(var(--accent-2) / 0.1),
              0 4px 20px hsl(var(--accent-1) / 0.15),
              0 0 0 1px hsl(var(--accent-1) / 0.15)
            `
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.boxShadow = `
              0 0 10px hsl(var(--accent-1) / 0.1),
              0 2px 8px rgba(0, 0, 0, 0.05),
              0 0 0 1px hsl(var(--accent-1) / 0.05)
            `
          }
        }}
      >
        <div className={cn(
          "relative rounded-lg transition-all duration-300",
          collapsed ? "p-2" : "p-1.5",
          isActive
            ? "bg-gradient-to-r from-primary/30 to-accent/20"
            : "group-hover:bg-primary/10"
        )}>
          <item.icon className={cn(
            "transition-all duration-300",
            collapsed ? "h-5 w-5" : "h-4 w-4",
            isActive
              ? "text-primary drop-shadow-glow"
              : "text-foreground/70 group-hover:text-primary",
            item.animationClass
          )} />
        </div>
        {!collapsed && (
          <span className="truncate font-medium">{item.name}</span>
        )}
        {isActive && !collapsed && (
          <div className="absolute right-3 w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/50" />
        )}
      </button>
    )

    if (collapsed) {
      return (
        <EnhancedTooltip content={`${item.name}: ${item.description}`} side="right">
          {content}
        </EnhancedTooltip>
      )
    }

    return content
  }

  return (
    <div className={cn(
      "flex h-screen flex-col bg-background/80 backdrop-blur-xl border-r border-primary/30 transition-all duration-300 relative z-10",
      collapsed ? "w-16" : "w-64",
      className
    )}
      style={{
        boxShadow: `
            inset -2px 0 0 0 hsl(var(--accent-1) / 0.2),
            4px 0 20px hsl(var(--accent-1) / 0.1),
            8px 0 40px hsl(var(--accent-2) / 0.05),
            0 0 0 1px hsl(var(--accent-1) / 0.05)
          `
      }}>
      {/* Background Effects - Simplified to match auth pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/10 to-primary/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-2xl animate-pulse" />

      {/* Header */}
      <div className={cn(
        "flex h-16 items-center justify-between px-4 border-b border-primary/30 relative z-10",
        collapsed && "px-3"
      )}
        style={{
          boxShadow: `
              0 2px 0 0 hsl(var(--accent-1) / 0.2),
              0 4px 15px hsl(var(--accent-1) / 0.1),
              0 0 0 1px hsl(var(--accent-1) / 0.05)
            `
        }}>
        {!collapsed && (
          <button
            onClick={() => handleNavigation("/interface/home", "Loading home dashboard...")}
            className="flex items-center gap-3 group"
          >
            <div className="relative group-hover:animate-pulse">
              <Brain className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 h-8 w-8 bg-primary/20 rounded-full blur-md" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gradient-primary">
                ScholarAI
              </span>
              <span className="text-xs text-gradient-accent font-medium tracking-wide">
                Research Assistant
              </span>
            </div>
          </button>
        )}

        {collapsed && (
          <EnhancedTooltip content="ScholarAI: Research Assistant" side="right">
            <button
              onClick={() => handleNavigation("/interface/home", "Loading home dashboard...")}
              className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group hover:scale-105"
            >
              <div className="relative group-hover:animate-pulse">
                <Brain className="h-7 w-7 text-primary" />
                <div className="absolute inset-0 h-7 w-7 bg-primary/20 rounded-full blur-md" />
              </div>
            </button>
          </EnhancedTooltip>
        )}

        {/* Collapse/Expand Button - Hidden on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg",
            collapsed && "mx-auto",
            "hidden md:flex" // Hide on mobile
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 relative z-10 overflow-y-auto custom-scrollbar",
        collapsed ? "p-2" : "p-3"
      )}>
        {!collapsed && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Navigation
            </h3>
          </div>
        )}
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.name} item={item} />
        ))}

        {/* Separator */}
        <div className="my-4 px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        {/* NEW Separator (horizontal bar) */}
        <div className="my-4 px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>
      </nav>

      {/* Bottom Section */}
      <div className={cn(
        "border-t border-primary/30 space-y-2 relative z-10",
        collapsed ? "p-2" : "p-3"
      )}
        style={{
          boxShadow: `
              0 -2px 0 0 hsl(var(--accent-1) / 0.2),
              0 -4px 15px hsl(var(--accent-1) / 0.1),
              0 0 0 1px hsl(var(--accent-1) / 0.05)
            `
        }}>
        {/* Settings Section */}
        {!collapsed && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Settings
            </h3>
          </div>
        )}
        {SETTINGS_ITEMS.map((item) => (
          <SidebarItem key={item.name} item={item} />
        ))}

        {/* Separator */}
        <div className="my-3 px-3">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </div>

        {!collapsed && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Account
            </h3>
          </div>
        )}
        {BOTTOM_ITEMS.map((item) => (
          <SidebarItem key={item.name} item={item} isBottom />
        ))}

        {/* Logout Button */}
        {collapsed ? (
          <EnhancedTooltip content="Logout: Sign out of your account" side="right">
            <LogoutButton className="flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 text-foreground/80 hover:text-red-500 bg-background/20 border-red-500/20">
              <div className="relative p-2 rounded-lg transition-all duration-300 group-hover:bg-red-500/10 group-hover:translate-x-1">
                <LogOut className="h-5 w-5 text-foreground/70 group-hover:text-red-500 transition-all duration-300" />
              </div>
            </LogoutButton>
          </EnhancedTooltip>
        ) : (
          <LogoutButton className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 text-foreground/80 hover:text-red-500 bg-background/20 border-red-500/20">
            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-red-500/10 group-hover:translate-x-1">
              <LogOut className="h-4 w-4 text-foreground/70 group-hover:text-red-500 transition-all duration-300" />
            </div>
            <span className="truncate font-medium">Logout</span>
          </LogoutButton>
        )}
      </div>
    </div>
  )
}
