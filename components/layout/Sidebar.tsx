"use client"

import { usePathname } from "next/navigation"
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
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LogoutButton } from "@/components/auth/LogoutButton"

type Props = {
  collapsed: boolean
  onToggle: () => void
}

const NAV_ITEMS = [
  {
    name: "Home",
    href: "/interface/home",
    icon: Home,
    description: "Project dashboard and overview"
  },
  {
    name: "Library",
    href: "/interface/library",
    icon: BookOpen,
    description: "Research paper library"
  },
  {
    name: "AI Assistant",
    href: "/interface/ai",
    icon: Brain,
    description: "AI-powered research assistant"
  },
  {
    name: "Workflows",
    href: "/interface/workflows",
    icon: Workflow,
    description: "Automated research workflows"
  },
  {
    name: "Search",
    href: "/interface/search",
    icon: Search,
    description: "Global search across papers"
  },
  {
    name: "Notifications",
    href: "/interface/notifications",
    icon: Bell,
    description: "Recent notifications and alerts"
  }
]

const BOTTOM_ITEMS = [
  {
    name: "Settings",
    href: "/interface/settings",
    icon: Settings,
    description: "Application settings"
  },
  {
    name: "Account",
    href: "/interface/account",
    icon: User,
    description: "User profile and preferences"
  }
]

export function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()

  const SidebarItem = ({ item, isBottom = false }: { item: typeof NAV_ITEMS[0], isBottom?: boolean }) => {
    const isActive = pathname.startsWith(item.href)

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border",
          "hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
          isActive
            ? "bg-gradient-to-r from-primary/20 to-purple-500/10 text-primary border-primary/30 shadow-lg shadow-primary/20"
            : "text-foreground/80 hover:text-foreground border-transparent bg-background/20",
          collapsed && "justify-center px-2"
        )}
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
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-background/90 backdrop-blur-xl border-primary/20 text-foreground shadow-2xl">
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-screen flex-col bg-background/40 backdrop-blur-xl border-r border-primary/10 transition-all duration-300 relative overflow-hidden",
        collapsed ? "w-16" : "w-72"
      )}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/50 to-purple-500/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl" />

        {/* Header */}
        <div className={cn(
          "flex h-16 items-center justify-between px-4 border-b border-primary/10 relative z-10",
          collapsed && "px-2"
        )}>
          {!collapsed && (
            <Link href="/interface/home" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-xl shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300 group-hover:scale-105">
                <Sparkles className="h-6 w-6 text-white drop-shadow-glow" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  ScholarAI
                </span>
                <span className="text-xs text-muted-foreground">Research Assistant</span>
              </div>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 p-0 text-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-lg",
              collapsed && "mx-auto"
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
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-primary/10 p-3 space-y-2 relative z-10">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <LogoutButton className="flex items-center justify-center gap-3 rounded-xl px-2 py-3 text-sm font-medium transition-all duration-300 group relative backdrop-blur-sm border border-transparent hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 text-foreground/80 hover:text-red-500 bg-background/20">
                  <div className="relative p-1.5 rounded-lg transition-all duration-300 group-hover:bg-red-500/10">
                    <LogOut className="h-4 w-4 text-foreground/70 group-hover:text-red-500 transition-all duration-300" />
                  </div>
                </LogoutButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-background/90 backdrop-blur-xl border-primary/20 text-foreground shadow-2xl">
                <p className="font-medium">Logout</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  )
}
