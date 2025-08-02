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
  GraduationCap
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
    loadingMessage: "Loading home dashboard..."
  },
  {
    name: "Projects",
    href: "/interface/projects",
    icon: BookOpen,
    description: "Research project management",
    loadingMessage: "Loading research projects..."
  },
  {
    name: "ToDo",
    href: "/interface/todo",
    icon: CheckSquare,
    description: "Task management and planning",
    loadingMessage: "Loading task management..."
  },
  {
    name: "Call4Papper",
    href: "/interface/papercall",
    icon: GraduationCap,
    description: "Academic deadlines and research opportunities",
    loadingMessage: "Loading academic notifications..."
  },
  // {
  //   name: "Notifications",
  //   href: "/interface/notifications",
  //   icon: Bell,
  //   description: "System notifications and alerts",
  //   loadingMessage: "Loading notifications..."
  // },
  {
    name: "Settings",
    href: "/interface/settings",
    icon: Settings,
    description: "Application preferences and customization",
    loadingMessage: "Loading settings..."
  }
]

const BOTTOM_ITEMS = [
  {
    name: "Account",
    href: "/interface/account",
    icon: User,
    description: "User profile and preferences",
    loadingMessage: "Loading account settings..."
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

  const SidebarItem = ({ item, isBottom = false }: { item: typeof NAV_ITEMS[0] | typeof BOTTOM_ITEMS[0], isBottom?: boolean }) => {
    const isActive = pathname.startsWith(item.href)

    const content = (
      <button
        onClick={() => handleNavigation(item.href, item.loadingMessage)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border-2 w-full text-left",
          "hover:bg-primary/10 hover:border-primary/50",
          isActive
            ? "bg-gradient-to-r from-primary/20 to-purple-500/10 text-primary border-primary/50"
            : "text-foreground/80 hover:text-foreground border-primary/20 bg-background/20",
          collapsed && "justify-center px-2"
        )}
        style={isActive ? {
          boxShadow: `
            0 0 25px hsl(var(--accent-1) / 0.3),
            0 0 50px hsl(var(--accent-2) / 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 6px 25px hsl(var(--accent-1) / 0.2),
            0 0 0 1px rgba(99, 102, 241, 0.2)
          `
        } : {
          boxShadow: `
            0 0 10px hsl(var(--accent-1) / 0.1),
            0 2px 8px rgba(0, 0, 0, 0.05),
            0 0 0 1px rgba(99, 102, 241, 0.05)
          `
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.boxShadow = `
              0 0 20px hsl(var(--accent-1) / 0.2),
              0 0 40px hsl(var(--accent-2) / 0.1),
              0 4px 20px hsl(var(--accent-1) / 0.15),
              0 0 0 1px rgba(99, 102, 241, 0.15)
            `
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.boxShadow = `
              0 0 10px hsl(var(--accent-1) / 0.1),
              0 2px 8px rgba(0, 0, 0, 0.05),
              0 0 0 1px rgba(99, 102, 241, 0.05)
            `
          }
        }}
      >
        <div className={cn(
          "relative p-1.5 rounded-lg transition-all duration-300",
          isActive
            ? "bg-gradient-to-r from-primary/30 to-purple-500/20"
            : "group-hover:bg-primary/10"
        )}>
          <item.icon className={cn(
            "h-4 w-4 transition-all duration-300",
            isActive
              ? "text-primary drop-shadow-glow"
              : "text-foreground/70 group-hover:text-primary"
          )} />
        </div>
        {!collapsed && (
          <span className="truncate font-medium">{item.name}</span>
        )}
        {isActive && !collapsed && (
          <div className="absolute right-3 w-2 h-2 bg-gradient-to-r from-primary to-purple-500 rounded-full shadow-lg shadow-primary/50" />
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
      "flex h-screen flex-col bg-background/60 backdrop-blur-xl border-r border-primary/30 transition-all duration-300 relative z-10",
      collapsed ? "w-16" : "w-72",
      className
    )}
      style={{
        boxShadow: `
            inset -2px 0 0 0 rgba(99, 102, 241, 0.4),
            4px 0 20px rgba(99, 102, 241, 0.2),
            8px 0 40px rgba(139, 92, 246, 0.1),
            0 0 60px rgba(99, 102, 241, 0.05),
            0 0 0 1px rgba(99, 102, 241, 0.1)
          `
      }}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background/30 to-purple-500/3" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/8 to-transparent rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/8 to-transparent rounded-full blur-2xl animate-pulse" />
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-pulse duration-3000" />

      {/* Header */}
      <div className={cn(
        "flex h-16 items-center justify-between px-4 border-b border-primary/30 relative z-10",
        collapsed && "px-2"
      )}
        style={{
          boxShadow: `
              0 2px 0 0 rgba(99, 102, 241, 0.4),
              0 4px 15px rgba(99, 102, 241, 0.15),
              0 8px 30px rgba(139, 92, 246, 0.08),
              0 0 0 1px rgba(99, 102, 241, 0.1)
            `
        }}>
        {!collapsed && (
          <button
            onClick={() => handleNavigation("/interface/home", "Loading home dashboard...")}
            className="flex items-center gap-3 group"
          >
            <div className="flex items-center justify-center w-10 h-10 gradient-radial-accent rounded-xl shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-6 w-6 text-white drop-shadow-glow" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gradient-primary">
                ScholarAI
              </span>
              <span className="text-xs text-muted-foreground">Research Assistant</span>
            </div>
          </button>
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
      <nav className="flex-1 space-y-2 p-3 relative z-10 overflow-y-auto custom-scrollbar">
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
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-primary/30 p-3 space-y-2 relative z-10"
        style={{
          boxShadow: `
              0 -2px 0 0 rgba(99, 102, 241, 0.4),
              0 -4px 15px rgba(99, 102, 241, 0.15),
              0 -8px 30px rgba(139, 92, 246, 0.08),
              0 0 0 1px rgba(99, 102, 241, 0.1)
            `
        }}>
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
            <LogoutButton className="flex items-center justify-center gap-3 rounded-xl px-2 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border border-transparent hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 text-foreground/80 hover:text-red-500 bg-background/20">
              <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-red-500/10">
                <LogOut className="h-4 w-4 text-foreground/70 group-hover:text-red-500 transition-all duration-300" />
              </div>
            </LogoutButton>
          </EnhancedTooltip>
        ) : (
          <LogoutButton className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border border-transparent hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 text-foreground/80 hover:text-red-500 bg-background/20 w-full">
            <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-red-500/10">
              <LogOut className="h-4 w-4 text-foreground/70 group-hover:text-red-500 transition-all duration-300" />
            </div>
            <span className="truncate font-medium">Logout</span>
          </LogoutButton>
        )}
      </div>
    </div>
  )
}
