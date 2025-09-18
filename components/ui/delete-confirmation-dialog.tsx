"use client"

import { motion } from "framer-motion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, X } from "lucide-react"

interface DeleteConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    projectName: string
    isLoading?: boolean
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    projectName,
    isLoading = false
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-2 border-red-500/30 shadow-2xl shadow-red-500/20">
                {/* Custom Red Alert Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                >
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent rounded-t-lg" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/20 to-transparent rounded-full blur-2xl" />

                    <AlertDialogHeader className="relative z-10 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                className="flex items-center justify-center w-12 h-12 bg-red-500/20 border-2 border-red-500/40 rounded-full"
                            >
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </motion.div>
                            <div>
                                <AlertDialogTitle className="text-xl font-bold text-red-400">
                                    Delete Project
                                </AlertDialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 mb-6"
                    >
                        <AlertDialogDescription className="text-base text-foreground/90 leading-relaxed">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                "{projectName}"
                            </span>?
                        </AlertDialogDescription>

                        <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-red-400 mb-1">This will permanently delete:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• All research papers and documents</li>
                                        <li>• Notes and annotations</li>
                                        <li>• Reading lists and bookmarks</li>
                                        <li>• Project settings and metadata</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <AlertDialogFooter className="relative z-10 gap-3">
                        <AlertDialogCancel asChild>
                            <Button
                                variant="outline"
                                className="bg-background/80 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Project
                                    </>
                                )}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </motion.div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
