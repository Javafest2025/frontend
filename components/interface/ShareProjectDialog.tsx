"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectsApi } from "@/lib/api/project-service"
import { AddCollaboratorRequest } from "@/types/project"
import { Share2, X, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareProjectDialogProps {
    isOpen: boolean
    projectId: string
    projectName: string
    onClose: () => void
    onCollaboratorAdded?: () => void
}

interface ShareFormData {
    collaboratorEmail: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
}

export function ShareProjectDialog({
    isOpen,
    projectId,
    projectName,
    onClose,
    onCollaboratorAdded
}: ShareProjectDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<ShareFormData>({
        defaultValues: {
            collaboratorEmail: '',
            role: 'EDITOR'
        }
    })

    const selectedRole = watch('role')

    const onSubmit = async (data: ShareFormData) => {
        setIsLoading(true)
        try {
            const collaboratorData: AddCollaboratorRequest = {
                collaboratorEmail: data.collaboratorEmail,
                role: data.role
            }

            await projectsApi.addCollaborator(projectId, collaboratorData)

            setIsSuccess(true)
            toast({
                title: "Invitation sent!",
                description: `Successfully invited ${data.collaboratorEmail} to collaborate on "${projectName}"`,
            })

            reset()
            onCollaboratorAdded?.()

            // Close dialog after a short delay
            setTimeout(() => {
                setIsSuccess(false)
                onClose()
            }, 2000)

        } catch (error) {
            console.error('Error adding collaborator:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to invite collaborator",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            reset()
            setIsSuccess(false)
            onClose()
        }
    }

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'VIEWER':
                return 'Can view project content and research'
            case 'EDITOR':
                return 'Can view and edit project content'
            case 'ADMIN':
                return 'Full access including project settings'
            default:
                return ''
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Card className="bg-background/95 backdrop-blur-xl border border-primary/20 shadow-2xl">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Share2 className="h-5 w-5 text-primary" />
                                        Share Project
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="h-8 w-8 p-0 hover:bg-primary/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Invite collaborators to work on "{projectName}"
                                </p>
                            </CardHeader>

                            <CardContent>
                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">Invitation Sent!</h3>
                                        <p className="text-muted-foreground">
                                            The collaborator will receive an email invitation to join the project.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="collaboratorEmail">Email Address</Label>
                                            <Input
                                                id="collaboratorEmail"
                                                type="email"
                                                placeholder="collaborator@example.com"
                                                {...register('collaboratorEmail', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Please enter a valid email address'
                                                    }
                                                })}
                                                className="bg-background/50 border-primary/20 focus:border-primary/50"
                                            />
                                            {errors.collaboratorEmail && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.collaboratorEmail.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={selectedRole}
                                                onValueChange={(value: 'VIEWER' | 'EDITOR' | 'ADMIN') =>
                                                    setValue('role', value)
                                                }
                                            >
                                                <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="VIEWER">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">Viewer</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Can view project content
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="EDITOR">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">Editor</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Can view and edit content
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ADMIN">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">Admin</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Full access and settings
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {getRoleDescription(selectedRole)}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleClose}
                                                disabled={isLoading}
                                                className="flex-1 border-primary/20 hover:bg-primary/5"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Share2 className="mr-2 h-4 w-4" />
                                                        Send Invitation
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 