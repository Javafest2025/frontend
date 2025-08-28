"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
    Crop,
    RotateCcw,
    ZoomIn,
    Check,
    X,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ImageCropperProps {
    readonly imageFile: File
    readonly onCropComplete: (croppedImageBlob: Blob) => void
    readonly onCancel: () => void
    readonly className?: string
}

interface CropArea {
    x: number
    y: number
    size: number
}

export function ImageCropper({
    imageFile,
    onCropComplete,
    onCancel,
    className
}: ImageCropperProps) {
    const [imageUrl, setImageUrl] = useState<string>("")
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, size: 80 })
    const [scale, setScale] = useState(1)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isImageLoading, setIsImageLoading] = useState(true)
    const [imageLoadError, setImageLoadError] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Load image when component mounts
    useEffect(() => {
        console.log("ImageCropper: Loading image file:", imageFile)

        if (!imageFile) {
            console.error("ImageCropper: No image file provided")
            return
        }

        let url: string | null = null
        let img: HTMLImageElement | null = null

        try {
            url = URL.createObjectURL(imageFile)
            console.log("ImageCropper: Created URL:", url)
            setImageUrl(url)

            img = new Image()
            img.crossOrigin = 'anonymous' // Handle CORS issues

            img.onload = () => {
                console.log("ImageCropper: Image loaded successfully, size:", img!.width, "x", img!.height)
                setImageSize({ width: img!.width, height: img!.height })
                setIsImageLoading(false)
                setImageLoadError(false)
                // Initialize crop area to center with reasonable size
                const minDimension = Math.min(img!.width, img!.height)
                const cropSize = Math.min(80, (minDimension / Math.max(img!.width, img!.height)) * 100)
                setCropArea({
                    x: 50,
                    y: 50,
                    size: cropSize
                })
            }

            img.onerror = (error) => {
                console.error("ImageCropper: Failed to load image:", error)
                console.error("ImageCropper: Error details:", {
                    error: error,
                    target: error.target,
                    type: error.type,
                    message: error.message
                })
                setIsImageLoading(false)
                setImageLoadError(true)
                // Don't show toast error if the image actually loads successfully later
                // toast.error("Failed to load image for cropping")
            }

            // Set the source immediately without delay
            img.src = url

            return () => {
                console.log("ImageCropper: Cleaning up URL:", url)
                if (img) {
                    img.onload = null
                    img.onerror = null
                }
                if (url) {
                    try {
                        URL.revokeObjectURL(url)
                    } catch (e) {
                        console.warn("ImageCropper: Error revoking URL:", e)
                    }
                }
            }
        } catch (error) {
            console.error("ImageCropper: Error creating object URL:", error)
            toast.error("Failed to process image")
        }
    }, [imageFile])

    // Handle crop area dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Check if click is within crop area
        const distance = Math.sqrt(
            Math.pow(x - cropArea.x, 2) + Math.pow(y - cropArea.y, 2)
        )

        if (distance <= cropArea.size / 2) {
            setIsDragging(true)
            setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
        }
    }, [cropArea])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const newX = Math.max(cropArea.size / 2, Math.min(100 - cropArea.size / 2, x - dragStart.x))
        const newY = Math.max(cropArea.size / 2, Math.min(100 - cropArea.size / 2, y - dragStart.y))

        console.log("ImageCropper: Dragging to position:", { x: newX, y: newY, size: cropArea.size })
        setCropArea(prev => ({ ...prev, x: newX, y: newY }))
    }, [isDragging, cropArea.size, dragStart])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Handle crop area resizing
    const handleSizeChange = useCallback((value: number[]) => {
        const newSize = value[0]
        console.log("ImageCropper: Size change requested to:", newSize)

        setCropArea(prev => {
            // Calculate maximum size based on current position
            const maxSizeX = Math.min(prev.x * 2, (100 - prev.x) * 2)
            const maxSizeY = Math.min(prev.y * 2, (100 - prev.y) * 2)
            const maxSize = Math.min(maxSizeX, maxSizeY, 90)

            const finalSize = Math.max(20, Math.min(newSize, maxSize))
            console.log("ImageCropper: Setting crop size to:", finalSize, "max allowed:", maxSize)

            return { ...prev, size: finalSize }
        })
    }, [])

    // Handle zoom
    const handleZoomChange = useCallback((value: number[]) => {
        setScale(value[0])
    }, [])

    // Reset crop area to center
    const handleReset = useCallback(() => {
        setCropArea({ x: 50, y: 50, size: 80 })
        setScale(1)
    }, [])

    // Process and crop the image
    const handleCrop = useCallback(async () => {
        if (!canvasRef.current || !imageRef.current) return

        setIsProcessing(true)

        try {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error("Could not get canvas context")

            // Set canvas size for output (256x256 for profile picture)
            const outputSize = 256
            canvas.width = outputSize
            canvas.height = outputSize

            // Calculate crop dimensions
            const cropSizePercent = cropArea.size / 100
            const cropXPercent = (cropArea.x - cropArea.size / 2) / 100
            const cropYPercent = (cropArea.y - cropArea.size / 2) / 100

            // Clear canvas
            ctx.clearRect(0, 0, outputSize, outputSize)

            // Create circular clipping path
            ctx.beginPath()
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI)
            ctx.clip()

            // Draw cropped and scaled image
            const sourceWidth = imageSize.width * cropSizePercent
            const sourceHeight = imageSize.height * cropSizePercent
            const sourceX = imageSize.width * cropXPercent
            const sourceY = imageSize.height * cropYPercent

            ctx.drawImage(
                imageRef.current,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, outputSize, outputSize
            )

            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    onCropComplete(blob)
                } else {
                    throw new Error("Failed to create cropped image")
                }
            }, 'image/jpeg', 0.9)

        } catch (error) {
            console.error("Crop error:", error)
            toast.error("Failed to crop image")
        } finally {
            setIsProcessing(false)
        }
    }, [cropArea, imageSize, onCropComplete])

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crop className="h-5 w-5" />
                    Crop Profile Picture
                </CardTitle>
                <CardDescription>
                    Select the circular area you want to use as your profile picture
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Image Cropping Area */}
                <div className="flex justify-center">
                    <div
                        ref={containerRef}
                        className="relative w-80 h-80 bg-muted rounded-lg overflow-hidden cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Loading State */}
                        {isImageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading image...</p>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {imageLoadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <div className="text-center">
                                    <p className="text-sm text-destructive mb-2">Failed to load image</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.reload()}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Background Image */}
                        {imageUrl && !isImageLoading && !imageLoadError && (
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Crop preview"
                                className="w-full h-full object-cover"
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'center'
                                }}
                            />
                        )}

                        {/* Crop Overlay - Only show when image is loaded */}
                        {!isImageLoading && !imageLoadError && (
                            <div className="absolute inset-0 bg-black/50" />
                        )}

                        {/* Crop Circle - Only show when image is loaded */}
                        {!isImageLoading && !imageLoadError && (
                            <div
                                className="absolute rounded-full border-2 border-white shadow-lg"
                                style={{
                                    left: `${cropArea.x - cropArea.size / 2}%`,
                                    top: `${cropArea.y - cropArea.size / 2}%`,
                                    width: `${cropArea.size}%`,
                                    height: `${cropArea.size}%`,
                                    background: 'transparent',
                                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)'
                                }}
                            >
                                {/* Clear circle area */}
                                <div className="w-full h-full rounded-full bg-transparent" />
                            </div>
                        )}

                        {/* Crop Area Border - Only show when image is loaded */}
                        {!isImageLoading && !imageLoadError && (
                            <div
                                className="absolute rounded-full border-2 border-white"
                                style={{
                                    left: `${cropArea.x - cropArea.size / 2}%`,
                                    top: `${cropArea.y - cropArea.size / 2}%`,
                                    width: `${cropArea.size}%`,
                                    height: `${cropArea.size}%`,
                                    pointerEvents: 'none'
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {/* Crop Size Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <ZoomIn className="h-4 w-4" />
                                Crop Size
                            </span>
                            <span className="text-muted-foreground font-bold">{Math.round(cropArea.size)}%</span>
                        </div>
                        <div className="relative">
                            <Slider
                                value={[cropArea.size]}
                                onValueChange={handleSizeChange}
                                onValueCommit={handleSizeChange}
                                max={90}
                                min={20}
                                step={1}
                                className="w-full cursor-pointer"
                                disabled={false}
                            />
                            <div className="mt-1 text-xs text-muted-foreground text-center">
                                Drag slider to adjust crop area size (20% - 90%)
                            </div>
                        </div>
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <ZoomIn className="h-4 w-4" />
                                Zoom
                            </span>
                            <span className="text-muted-foreground">{Math.round(scale * 100)}%</span>
                        </div>
                        <Slider
                            value={[scale]}
                            onValueChange={handleZoomChange}
                            max={3}
                            min={0.5}
                            step={0.1}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>

                    <Button
                        onClick={onCancel}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>

                    <Button
                        onClick={handleCrop}
                        disabled={isProcessing}
                        className="flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Apply Crop
                            </>
                        )}
                    </Button>
                </div>

                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />
            </CardContent>
        </Card>
    )
}
