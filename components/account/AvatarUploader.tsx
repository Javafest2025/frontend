"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Camera,
    Upload,
    Trash2,
    Loader2,
    User,
    Crop
} from "lucide-react"
import { accountApi } from "@/lib/api/user-service"
import { cn } from "@/lib/utils/cn"
import { ImageCropper } from "./ImageCropper"

interface AvatarUploaderProps {
    readonly currentAvatarUrl?: string
    readonly onAvatarUpdate?: (newUrl: string) => void
    readonly onAvatarDelete?: () => void
    readonly onLoadingChange?: (isLoading: boolean) => void
    readonly className?: string
}

export function AvatarUploader({
    currentAvatarUrl,
    onAvatarUpdate,
    onAvatarDelete,
    onLoadingChange,
    className
}: AvatarUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showCropper, setShowCropper] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (file: File) => {
        console.log("AvatarUploader: File selected:", file)
        console.log("File type:", file.type)
        console.log("File size:", file.size)

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, or WebP)")
            return
        }

        // Validate file size (3MB)
        const maxSize = 3 * 1024 * 1024 // 3MB
        if (file.size > maxSize) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(1)
            toast.error(`Image size (${sizeInMB}MB) exceeds the maximum limit of 3MB. Please choose a smaller image.`)
            return
        }

        // Show cropper instead of immediate upload
        console.log("AvatarUploader: Setting selected file and showing cropper")
        setSelectedFile(file)
        setShowCropper(true)
    }

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        setIsUploading(true)
        setShowCropper(false)
        onLoadingChange?.(true) // Notify parent component

        try {
            // Convert blob to file with proper metadata
            const croppedFile = new File([croppedImageBlob], 'profile-picture.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            })

            console.log("Cropped file created:", croppedFile)
            console.log("File size:", croppedFile.size)
            console.log("File type:", croppedFile.type)

            const result = await accountApi.uploadProfileImage(croppedFile)

            if (result.success && result.url) {
                toast.success("Avatar updated successfully!")
                onAvatarUpdate?.(result.url)
                setSelectedFile(null)
            } else {
                toast.error(result.message || "Failed to upload avatar")
                setSelectedFile(null)
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload avatar")
            setSelectedFile(null)
        } finally {
            setIsUploading(false)
            onLoadingChange?.(false) // Notify parent component
        }
    }

    const handleCropCancel = () => {
        setShowCropper(false)
        setSelectedFile(null)
    }



    const handleDelete = async () => {
        setIsUploading(true)
        try {
            const result = await accountApi.deleteProfileImage()

            if (result.success) {
                toast.success("Avatar removed successfully!")
                onAvatarDelete?.()
            } else {
                toast.error(result.message || "Failed to remove avatar")
            }
        } catch (error) {
            console.error("Delete error:", error)
            toast.error("Failed to remove avatar")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const displayUrl = previewUrl || currentAvatarUrl

    // Show cropper if file is selected
    console.log("AvatarUploader: Render state - showCropper:", showCropper, "selectedFile:", selectedFile)

    // Show the container when cropper is active
    React.useEffect(() => {
        const container = document.getElementById('avatar-uploader-container')
        if (container) {
            if (showCropper && selectedFile) {
                container.classList.remove('hidden')
                container.classList.add('flex', 'items-center', 'justify-center', 'bg-black/50', 'backdrop-blur-sm')
            } else {
                container.classList.add('hidden')
                container.classList.remove('flex', 'items-center', 'justify-center', 'bg-black/50', 'backdrop-blur-sm')
            }
        }
    }, [showCropper, selectedFile])

    if (showCropper && selectedFile) {
        console.log("AvatarUploader: Rendering ImageCropper")
        return (
            <ImageCropper
                imageFile={selectedFile}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                className={className}
            />
        )
    }

    return (
        <Card className={cn("w-full max-w-md", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Profile Picture
                </CardTitle>
                <CardDescription>
                    Upload a profile picture and crop it to a perfect circle (JPEG, PNG, or WebP, max 3MB)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Avatar Display */}
                <div className="flex justify-center">
                    <div className="relative">
                        <Avatar className="h-24 w-24">
                            <AvatarImage
                                src={displayUrl || ""}
                                alt="Profile picture"
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-muted">
                                <User className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                        isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden avatar-uploader-input"
                        disabled={isUploading}
                    />

                    <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {isDragging ? "Drop your image here" : "Drag and drop an image here"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                or{" "}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-primary hover:underline"
                                    disabled={isUploading}
                                >
                                    browse files
                                </button>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                You'll be able to crop and adjust your image
                            </p>
                        </div>
                        <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">JPEG</Badge>
                            <Badge variant="secondary">PNG</Badge>
                            <Badge variant="secondary">WebP</Badge>
                            <Badge variant="secondary">Max 3MB</Badge>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1"
                        variant="outline"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Crop className="h-4 w-4 mr-2" />
                                Choose & Crop
                            </>
                        )}
                    </Button>

                    {currentAvatarUrl && (
                        <Button
                            onClick={handleDelete}
                            disabled={isUploading}
                            variant="destructive"
                            size="icon"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing your avatar...
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
