"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Eye,
  Archive
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'
  researchDomain: string
  updatedAt: string
  documentCount: number
}

interface RecentActivity {
  id: string
  type: 'document_created' | 'document_updated' | 'project_created'
  title: string
  description: string
  timestamp: string
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ARCHIVED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
}

export default function ResearchDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Mock data for development
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Deep Learning Research',
        description: 'Comprehensive analysis of neural network architectures and their applications in computer vision.',
        status: 'IN_PROGRESS',
        researchDomain: 'Computer Science',
        updatedAt: '2025-01-15T10:30:00Z',
        documentCount: 5
      },
      {
        id: '2',
        title: 'Quantum Computing Algorithms',
        description: 'Investigation of quantum algorithms for optimization problems.',
        status: 'DRAFT',
        researchDomain: 'Physics',
        updatedAt: '2025-01-14T15:45:00Z',
        documentCount: 2
      },
      {
        id: '3',
        title: 'Blockchain Security Analysis',
        description: 'Security vulnerabilities in blockchain networks and proposed solutions.',
        status: 'REVIEW',
        researchDomain: 'Cybersecurity',
        updatedAt: '2025-01-13T09:20:00Z',
        documentCount: 8
      },
      {
        id: '4',
        title: 'Machine Learning Ethics',
        description: 'Ethical considerations in AI and machine learning applications.',
        status: 'COMPLETED',
        researchDomain: 'Ethics',
        updatedAt: '2025-01-10T14:15:00Z',
        documentCount: 12
      }
    ]

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'document_updated',
        title: 'Updated main.tex',
        description: 'Modified methodology section in Deep Learning Research',
        timestamp: '2025-01-15T10:30:00Z'
      },
      {
        id: '2',
        type: 'document_created',
        title: 'Created abstract.tex',
        description: 'Added abstract for Quantum Computing Algorithms',
        timestamp: '2025-01-14T15:45:00Z'
      },
      {
        id: '3',
        type: 'project_created',
        title: 'New Project Created',
        description: 'Started Blockchain Security Analysis project',
        timestamp: '2025-01-13T09:20:00Z'
      }
    ]

    setProjects(mockProjects)
    setRecentActivity(mockActivity)
  }, [])

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.researchDomain.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_created':
      case 'document_updated':
        return <FileText className="h-4 w-4" />
      case 'project_created':
        return <Plus className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Research Dashboard</h1>
              <p className="text-muted-foreground">Manage your ongoing research projects</p>
            </div>
            <Link href="/editor">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'IN_PROGRESS').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'COMPLETED').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {projects.reduce((sum, p) => sum + p.documentCount, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Projects Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={cn("text-xs", statusColors[project.status])}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-muted-foreground">{project.documentCount} documents</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{project.researchDomain}</span>
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center space-x-2">
                        <Link href={`/editor?project=${project.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No projects found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters"
                      : "Start your research journey by creating your first project"
                    }
                  </p>
                  <Link href="/editor">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Recent Activity */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="mt-1 text-muted-foreground">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/editor" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Import Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
