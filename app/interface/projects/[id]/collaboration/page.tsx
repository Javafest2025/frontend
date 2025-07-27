"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { projectsApi } from "@/lib/api/projects"
import { Collaborator, AddCollaboratorRequest, Project } from "@/types/project"
import { useAuth } from "@/hooks/useAuth"
import {
    Users,
    Share2,
    UserPlus,
    Mail,
    Clock,
    CheckCircle,
    X,
    AlertCircle,
    Edit3,
    Trash2,
    Crown,
    Shield,
    Eye,
    Loader2,
    Plus,
    Settings,
    Lock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"

interface ProjectCollaborationPageProps {
    params: Promise<{
        id: string
    }>
}

interface AddCollaboratorFormData {
    collaboratorEmail: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
}

export default function ProjectCollaborationPage({ params }: ProjectCollaborationPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [project, setProject] = useState<Project | null>(null)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const { user } = useAuth()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<AddCollaboratorFormData>({
        defaultValues: {
            collaboratorEmail: '',
            role: 'EDITOR'
        }
    })

    const selectedRole = watch('role')

    // Check if current user can manage collaborators
    const canManageCollaborators = () => {
        if (!user || !project) return false

        // Only project owner can manage collaborators
        return project.userId === user.id
    }

    // Check if current user is project owner
    const isProjectOwner = () => {
        if (!user || !project) return false
        return project.userId === user.id
    }

    // Load project and collaborators data
    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            setProjectId(resolvedParams.id)
            try {
                // Load project data first
                const projectData = await projectsApi.getProject(resolvedParams.id)
                setProject(projectData)

                // Then load collaborators
                const collaboratorsData = await projectsApi.getCollaborators(resolvedParams.id)
                setCollaborators(collaboratorsData)
            } catch (error) {
                console.error('Error loading data:', error)
                setCollaborators([])
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params])

    const handleAddCollaborator = async (data: AddCollaboratorFormData) => {
        if (!canManageCollaborators()) {
            toast({
                title: "Access Denied",
                description: "You don't have permission to add collaborators to this project.",
                variant: "destructive"
            })
            return
        }

        try {
            const collaboratorData: AddCollaboratorRequest = {
                collaboratorEmail: data.collaboratorEmail,
                role: data.role
            }

            await projectsApi.addCollaborator(projectId, collaboratorData)

            // Refresh collaborators list
            const updatedCollaborators = await projectsApi.getCollaborators(projectId)
            setCollaborators(updatedCollaborators)

            setShowAddDialog(false)
            reset()

            toast({
                title: "Invitation sent!",
                description: `Successfully invited ${data.collaboratorEmail} to collaborate on this project.`,
            })
        } catch (error) {
            console.error('Error adding collaborator:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to invite collaborator",
                variant: "destructive"
            })
        }
    }

    const handleUpdateCollaborator = async (collaboratorEmail: string, newRole: 'VIEWER' | 'EDITOR' | 'ADMIN') => {
        if (!canManageCollaborators()) {
            toast({
                title: "Access Denied",
                description: "You don't have permission to update collaborator roles.",
                variant: "destructive"
            })
            return
        }

        setIsUpdating(true)
        try {
            await projectsApi.updateCollaborator(projectId, collaboratorEmail, newRole)

            // Update local state
            setCollaborators(prev => prev.map(c =>
                c.collaboratorEmail === collaboratorEmail ? { ...c, role: newRole } : c
            ))

            setEditingCollaborator(null)

            toast({
                title: "Role updated",
                description: "Collaborator role has been successfully updated.",
            })
        } catch (error) {
            console.error('Error updating collaborator:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update collaborator role",
                variant: "destructive"
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRemoveCollaborator = async (collaboratorEmail: string) => {
        if (!canManageCollaborators()) {
            toast({
                title: "Access Denied",
                description: "You don't have permission to remove collaborators from this project.",
                variant: "destructive"
            })
            return
        }

        try {
            await projectsApi.removeCollaborator(projectId, collaboratorEmail)
            setCollaborators(prev => prev.filter(c => c.collaboratorEmail !== collaboratorEmail))
            toast({
                title: "Collaborator removed",
                description: "The collaborator has been removed from the project.",
            })
        } catch (error) {
            console.error('Error removing collaborator:', error)
            toast({
                title: "Error",
                description: "Failed to remove collaborator. Please try again.",
                variant: "destructive"
            })
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'PENDING':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'DECLINED':
                return <X className="h-4 w-4 text-red-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/30 backdrop-blur-sm'
            case 'PENDING':
                return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-500/30 backdrop-blur-sm'
            case 'DECLINED':
                return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-red-400/40 shadow-sm shadow-red-500/30 backdrop-blur-sm'
            default:
                return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-400/40 shadow-sm shadow-slate-500/30 backdrop-blur-sm'
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-red-400/40 shadow-sm shadow-red-500/30 backdrop-blur-sm'
            case 'EDITOR':
                return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-400/40 shadow-sm shadow-blue-500/30 backdrop-blur-sm'
            case 'VIEWER':
                return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/30 backdrop-blur-sm'
            default:
                return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-400/40 shadow-sm shadow-slate-500/30 backdrop-blur-sm'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <Crown className="h-4 w-4" />
            case 'EDITOR':
                return <Edit3 className="h-4 w-4" />
            case 'VIEWER':
                return <Eye className="h-4 w-4" />
            default:
                return <Shield className="h-4 w-4" />
        }
    }

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Full access to project settings and management'
            case 'EDITOR':
                return 'Can edit project content and add collaborators'
            case 'VIEWER':
                return 'Can view project content and read-only access'
            default:
                return 'Limited access to project'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Users className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading collaborators...</p>
                    </div>
                </div>
            </div>
        )
    }

    const hasManagePermission = canManageCollaborators()

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 container mx-auto px-6 py-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gradient-primary flex items-center gap-3">
                                <Users className="h-8 w-8 text-primary" />
                                Collaboration
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage team members and their access levels
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            disabled={!hasManagePermission}
                            className={`transition-all duration-300 ${hasManagePermission
                                ? "gradient-primary-to-accent text-primary-foreground border-0 hover:scale-[1.02]"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                }`}
                            style={hasManagePermission ? {
                                boxShadow: `
                                    0 0 15px hsl(var(--primary) / 0.4),
                                    0 0 30px hsl(var(--accent) / 0.2),
                                    inset 0 1px 0 hsl(var(--primary-foreground) / 0.1)
                                `
                            } : {}}
                        >
                            {!hasManagePermission && <Lock className="mr-2 h-4 w-4" />}
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Collaborator
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Collaborators */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Share2 className="h-5 w-5 text-primary" />
                                    Team Members ({collaborators.length + 1})
                                </CardTitle>
                                <CardDescription>
                                    Manage collaborators and their access levels
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {collaborators.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">No collaborators yet</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Invite team members to collaborate on this research project.
                                        </p>
                                        <Button
                                            onClick={() => setShowAddDialog(true)}
                                            disabled={!hasManagePermission}
                                            className={`transition-all duration-300 ${hasManagePermission
                                                ? "gradient-primary-to-accent text-primary-foreground border-0 hover:scale-[1.02]"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                                }`}
                                            style={hasManagePermission ? {
                                                boxShadow: `
                                                    0 0 15px hsl(var(--primary) / 0.4),
                                                    0 0 30px hsl(var(--accent) / 0.2),
                                                    inset 0 1px 0 hsl(var(--primary-foreground) / 0.1)
                                                `
                                            } : {}}
                                        >
                                            {!hasManagePermission && <Lock className="mr-2 h-4 w-4" />}
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite First Collaborator
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Project Owner Section */}
                                        {collaborators.length > 0 && collaborators[0]?.ownerEmail && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                                                            {collaborators[0].ownerEmail.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-primary">
                                                                {collaborators[0].ownerEmail}
                                                            </span>
                                                            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 text-xs flex items-center gap-1">
                                                                <Crown className="h-3 w-3" />
                                                                Project Owner
                                                            </Badge>
                                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs flex items-center gap-1">
                                                                <CheckCircle className="h-3 w-3" />
                                                                ACTIVE
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {collaborators[0].ownerEmail}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Project Creator
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Collaborators Section */}
                                        <div className="space-y-2">
                                            {collaborators.length > 0 && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Separator className="flex-1" />
                                                    <span className="text-xs font-medium text-muted-foreground px-2">Collaborators</span>
                                                    <Separator className="flex-1" />
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {collaborators.map((collaborator, index) => (
                                                    <motion.div
                                                        key={collaborator.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ delay: (index + 1) * 0.1 }}
                                                        className="flex items-center justify-between p-4 bg-background/20 rounded-lg border border-border hover:bg-background/30 transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                                    {collaborator.collaboratorEmail ? collaborator.collaboratorEmail.charAt(0).toUpperCase() : '?'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium">
                                                                        {collaborator.collaboratorName || collaborator.collaboratorEmail || 'Unknown User'}
                                                                    </span>
                                                                    <Badge variant="status" className={`${getRoleColor(collaborator.role)} text-xs flex items-center gap-1`}>
                                                                        {getRoleIcon(collaborator.role)}
                                                                        {collaborator.role}
                                                                    </Badge>
                                                                    <Badge variant="status" className={`${getStatusColor(collaborator.status)} text-xs flex items-center gap-1`}>
                                                                        {getStatusIcon(collaborator.status)}
                                                                        {collaborator.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Mail className="h-3 w-3" />
                                                                        {collaborator.collaboratorEmail}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        Added {new Date(collaborator.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    {collaborator.joinedAt && (
                                                                        <span className="flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3" />
                                                                            Joined {new Date(collaborator.joinedAt).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {hasManagePermission && (
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setEditingCollaborator(collaborator)}
                                                                    className={`h-8 w-8 p-0 transition-all duration-300 ${isProjectOwner()
                                                                        ? "hover:bg-primary/10 hover:text-primary"
                                                                        : "opacity-30 blur-[0.5px] cursor-not-allowed"
                                                                        }`}
                                                                    disabled={isUpdating || !isProjectOwner()}
                                                                >
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveCollaborator(collaborator.collaboratorEmail)}
                                                                    className={`h-8 w-8 p-0 transition-all duration-300 ${isProjectOwner()
                                                                        ? "hover:bg-destructive/10 hover:text-destructive"
                                                                        : "opacity-30 blur-[0.5px] cursor-not-allowed"
                                                                        }`}
                                                                    disabled={isUpdating || !isProjectOwner()}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Role Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Access Levels
                                </CardTitle>
                                <CardDescription>
                                    Understanding collaborator permissions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Crown className="h-4 w-4 text-red-500" />
                                            <span className="font-medium text-sm">Admin</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Full access to project settings and management
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Edit3 className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium text-sm">Editor</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Can edit project content and add collaborators
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Eye className="h-4 w-4 text-green-500" />
                                            <span className="font-medium text-sm">Viewer</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Can view project content and read-only access
                                        </p>
                                    </div>
                                </div>

                                {!hasManagePermission && (
                                    <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Lock className="h-4 w-4 text-yellow-500" />
                                            <span className="font-medium text-sm">Limited Access</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Only project owners can manage collaborators
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Add Collaborator Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="bg-background/95 backdrop-blur-xl border-border"
                    style={{
                        boxShadow: `
                            0 0 40px hsl(var(--primary) / 0.1),
                            0 0 80px hsl(var(--accent) / 0.06)
                        `
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Add Collaborator
                        </DialogTitle>
                        <DialogDescription>
                            Invite a new team member to collaborate on this project
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleAddCollaborator)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="collaborator@example.com"
                                {...register("collaboratorEmail", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                                className="bg-background/40 border-border placeholder:text-muted-foreground"
                            />
                            {errors.collaboratorEmail && (
                                <p className="text-sm text-destructive">{errors.collaboratorEmail.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Access Level</Label>
                            <Select value={selectedRole} onValueChange={(value) => setValue("role", value as 'VIEWER' | 'EDITOR' | 'ADMIN')}>
                                <SelectTrigger className="bg-background/40 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {getRoleDescription(selectedRole)}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddDialog(false)}
                                className="flex-1 bg-background/40 border-border hover:bg-accent"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 gradient-primary-to-accent text-primary-foreground border-0"
                                style={{
                                    boxShadow: `
                                        0 0 15px hsl(var(--primary) / 0.4),
                                        0 0 30px hsl(var(--accent) / 0.2)
                                    `
                                }}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Send Invitation
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Collaborator Dialog */}
            <Dialog open={!!editingCollaborator} onOpenChange={() => setEditingCollaborator(null)}>
                <DialogContent className="bg-background/95 backdrop-blur-xl border-border"
                    style={{
                        boxShadow: `
                            0 0 40px hsl(var(--primary) / 0.1),
                            0 0 80px hsl(var(--accent) / 0.06)
                        `
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Update Collaborator
                        </DialogTitle>
                        <DialogDescription>
                            Change the access level for {editingCollaborator?.collaboratorName || editingCollaborator?.collaboratorEmail || 'Unknown User'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Role</Label>
                            <div className="flex items-center gap-2 p-3 bg-background/20 rounded-lg border border-border">
                                {getRoleIcon(editingCollaborator?.role || 'VIEWER')}
                                <span className="font-medium">{editingCollaborator?.role}</span>
                                <Badge className={`${getRoleColor(editingCollaborator?.role || 'VIEWER')} text-xs`}>
                                    {getRoleDescription(editingCollaborator?.role || 'VIEWER')}
                                </Badge>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>New Role</Label>
                            <Select
                                value={editingCollaborator?.role}
                                onValueChange={(value) => {
                                    if (editingCollaborator) {
                                        setEditingCollaborator({ ...editingCollaborator, role: value as 'VIEWER' | 'EDITOR' | 'ADMIN' })
                                    }
                                }}
                            >
                                <SelectTrigger className="bg-background/40 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingCollaborator(null)}
                                className="flex-1 bg-background/40 border-border hover:bg-accent"
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (editingCollaborator) {
                                        handleUpdateCollaborator(editingCollaborator.collaboratorEmail, editingCollaborator.role)
                                    }
                                }}
                                className="flex-1 gradient-primary-to-accent text-primary-foreground border-0"
                                disabled={isUpdating}
                                style={{
                                    boxShadow: `
                                        0 0 15px hsl(var(--primary) / 0.4),
                                        0 0 30px hsl(var(--accent) / 0.2)
                                    `
                                }}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Update Role
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 