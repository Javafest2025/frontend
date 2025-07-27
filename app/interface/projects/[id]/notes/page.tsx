"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    MessageSquare,
    Plus,
    FileText,
    Search,
    Edit3,
    Trash2,
    Save,
    X,
    Calendar,
    Clock,
    User,
    MoreHorizontal,
    FolderOpen,
    File,
    Star,
    StarOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils/cn"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { projectsApi } from "@/lib/api/projects"

interface ProjectNotesPageProps {
    params: Promise<{
        id: string
    }>
}

interface Note {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
    isFavorite: boolean
    tags?: string[]
}

export default function ProjectNotesPage({ params }: ProjectNotesPageProps) {
    const [projectId, setProjectId] = useState<string>("")
    const [notes, setNotes] = useState<Note[]>([])
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFavorites, setShowFavorites] = useState(false)
    const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([])
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
    const { toast } = useToast()

    // Form states
    const [noteTitle, setNoteTitle] = useState("")
    const [noteContent, setNoteContent] = useState("")

    // Load notes data
    useEffect(() => {
        const loadData = async () => {
            try {
                const resolvedParams = await params
                console.log('Resolved params:', resolvedParams) // Debug log
                setProjectId(resolvedParams.id)

                const [response, favoritesResponse] = await Promise.all([
                    projectsApi.getNotes(resolvedParams.id),
                    projectsApi.getFavoriteNotes(resolvedParams.id)
                ])

                console.log('Notes response:', response) // Debug log
                console.log('Favorites response:', favoritesResponse) // Debug log

                // Handle the API response structure
                const notesData = Array.isArray(response) ? response : []
                const favoritesData = Array.isArray(favoritesResponse) ? favoritesResponse : []

                setNotes(notesData)
                setFavoriteNotes(favoritesData)

                if (notesData.length > 0) {
                    setSelectedNote(notesData[0])
                }
            } catch (error) {
                console.error('Error loading notes:', error)
                setNotes([])
                setFavoriteNotes([])
                toast({
                    title: "Error",
                    description: "Failed to load notes. Please try again.",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [params, toast])

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const filteredNotes = useMemo(() => {
        const notesToFilter = showFavorites ? favoriteNotes : notes
        return notesToFilter.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            return matchesSearch
        })
    }, [notes, favoriteNotes, showFavorites, debouncedSearchQuery])

    const handleCreateNote = () => {
        console.log('Creating new note - current state:', { isCreating, isEditing, selectedNote })
        setIsCreating(true)
        setIsEditing(false)
        setSelectedNote(null)
        setNoteTitle("")
        setNoteContent("")
        console.log('After create note setup:', { isCreating: true, isEditing: false })
    }

    const handleSaveNote = async () => {
        console.log('Save note called with:', {
            projectId,
            noteTitle,
            noteContent,
            isCreating,
            isEditing,
            selectedNote
        }) // Debug log

        // Validate inputs
        if (!noteTitle.trim()) {
            toast({
                title: "Error",
                description: "Note title is required",
                variant: "destructive"
            })
            return
        }

        if (!projectId) {
            toast({
                title: "Error",
                description: "Project ID not available. Please refresh the page.",
                variant: "destructive"
            })
            return
        }

        setIsSaving(true)
        try {
            if (isCreating) {
                console.log('Creating new note with data:', { projectId, title: noteTitle, content: noteContent })

                // Add a pre-request log to see if we reach this point
                console.log('About to call projectsApi.createNote...')

                const response = await projectsApi.createNote(projectId, {
                    title: noteTitle,
                    content: noteContent
                })

                console.log('Create note response received:', response)

                const newNote = response
                console.log('Setting new note in state:', newNote)

                setNotes(prev => {
                    console.log('Previous notes:', prev)
                    const updatedNotes = [newNote, ...prev]
                    console.log('Updated notes:', updatedNotes)
                    return updatedNotes
                })

                setSelectedNote(newNote)
                setIsCreating(false)

                // Don't clear form yet - wait for success
                toast({
                    title: "Success",
                    description: "Note created successfully!",
                })

                // Clear form only after successful creation
                setNoteTitle("")
                setNoteContent("")

            } else if (selectedNote && isEditing) {
                console.log('Updating existing note with data:', {
                    projectId,
                    noteId: selectedNote.id,
                    title: noteTitle,
                    content: noteContent
                })
                const response = await projectsApi.updateNote(projectId, selectedNote.id, {
                    title: noteTitle,
                    content: noteContent
                })
                console.log('Update note response:', response)

                const updatedNote = response
                setNotes(prev => prev.map(note => note.id === selectedNote.id ? updatedNote : note))
                setSelectedNote(updatedNote)
                setIsEditing(false)

                toast({
                    title: "Success",
                    description: "Note updated successfully!",
                })

                // Don't clear form for editing - keep the updated content
            } else {
                console.log('No valid operation found:', { isCreating, isEditing, selectedNote })
                toast({
                    title: "Error",
                    description: "Invalid operation state. Please try again.",
                    variant: "destructive"
                })
                return
            }

        } catch (error) {
            console.error('Error saving note:', error)
            toast({
                title: "Error",
                description: `Failed to save note: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteNote = async (noteId: string) => {
        if (!projectId) return

        try {
            await projectsApi.deleteNote(projectId, noteId)
            setNotes(prev => prev.filter(note => note.id !== noteId))
            if (selectedNote?.id === noteId) {
                const remainingNotes = notes.filter(note => note.id !== noteId)
                setSelectedNote(remainingNotes.length > 0 ? remainingNotes[0] : null)
            }
            toast({
                title: "Success",
                description: "Note deleted successfully!",
            })
        } catch (error) {
            console.error('Error deleting note:', error)
            toast({
                title: "Error",
                description: "Failed to delete note. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleToggleFavorite = async (noteId: string) => {
        if (!projectId) return

        try {
            const response = await projectsApi.toggleNoteFavorite(projectId, noteId)
            const updatedNote = response
            setNotes(prev => prev.map(note =>
                note.id === noteId ? updatedNote : note
            ))
            if (selectedNote?.id === noteId) {
                setSelectedNote(updatedNote)
            }

            // Update favorites list
            if (updatedNote.isFavorite) {
                setFavoriteNotes(prev => [...prev, updatedNote])
            } else {
                setFavoriteNotes(prev => prev.filter(note => note.id !== noteId))
            }

        } catch (error) {
            console.error('Error toggling favorite:', error)
            toast({
                title: "Error",
                description: "Failed to update favorite status.",
                variant: "destructive"
            })
        }
    }

    const handleEditNote = () => {
        if (selectedNote) {
            setIsEditing(true)
            setIsCreating(false) // Ensure we're not in create mode
            setNoteTitle(selectedNote.title)
            setNoteContent(selectedNote.content)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setIsCreating(false)
        setNoteTitle("")
        setNoteContent("")

        // If we were editing, reset to the selected note's content
        if (selectedNote) {
            setNoteTitle(selectedNote.title)
            setNoteContent(selectedNote.content)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <MessageSquare className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading notes...</p>
                    </div>
                </div>
            </div>
        )
    }

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
                                <MessageSquare className="h-8 w-8 text-primary" />
                                Quick Notes
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Capture ideas, meeting notes, and research insights
                            </p>
                        </div>
                        <Button
                            onClick={handleCreateNote}
                            className="gradient-primary-to-accent text-primary-foreground border-0 transition-all duration-300 hover:scale-[1.02]"
                            style={{
                                boxShadow: `
                                    0 0 15px hsl(var(--primary) / 0.4),
                                    0 0 30px hsl(var(--accent) / 0.2),
                                    inset 0 1px 0 hsl(var(--primary-foreground) / 0.1)
                                `
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Note
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                    {/* File Explorer - Left Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5 h-full"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                    Notes Explorer
                                </CardTitle>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search notes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-background/40 border-border placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFavorites(!showFavorites)}
                                        className={cn(
                                            "w-full justify-start",
                                            showFavorites && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <Star className="mr-2 h-4 w-4" />
                                        Favorites Only
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ScrollArea className="h-[calc(100vh-400px)]">
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {filteredNotes.map((note) => (
                                                <motion.div
                                                    key={note.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 group",
                                                        selectedNote?.id === note.id
                                                            ? "bg-primary/10 border-primary/30 text-primary"
                                                            : "bg-background/20 border-border hover:bg-background/30 hover:border-primary/20"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedNote(note)
                                                        setIsEditing(false)
                                                        setIsCreating(false)
                                                    }}
                                                >
                                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm truncate">
                                                                {note.title}
                                                            </span>
                                                            {note.isFavorite && (
                                                                <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {new Date(note.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {filteredNotes.length === 0 && (
                                            <div className="text-center py-8">
                                                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    {searchQuery ? "No notes found" : "No notes yet"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Note Editor/Viewer - Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-3"
                    >
                        <Card className="bg-background/40 backdrop-blur-xl border-border shadow-lg transition-all duration-300 hover:shadow-primary/5 h-full"
                            style={{
                                boxShadow: `
                                    0 0 20px hsl(var(--primary) / 0.1),
                                    0 0 40px hsl(var(--accent) / 0.06)
                                `
                            }}
                        >
                            {selectedNote && !isCreating && !isEditing ? (
                                <>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    {selectedNote.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-4 mt-2">
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Calendar className="h-3 w-3" />
                                                        Created {new Date(selectedNote.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Clock className="h-3 w-3" />
                                                        Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleFavorite(selectedNote.id)}
                                                    className="h-8 w-8 p-0 hover:bg-yellow-500/10 hover:text-yellow-500"
                                                >
                                                    {selectedNote.isFavorite ? (
                                                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                    ) : (
                                                        <StarOff className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleEditNote}
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteNote(selectedNote.id)}
                                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <ScrollArea className="h-[calc(100vh-400px)]">
                                            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mb-4">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-lg font-medium text-foreground mb-2 mt-4">{children}</h3>,
                                                        p: ({ children }) => <p className="text-muted-foreground mb-3 leading-relaxed">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc list-inside text-muted-foreground mb-3 space-y-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal list-inside text-muted-foreground mb-3 space-y-1">{children}</ol>,
                                                        li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                                        em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                                                        code: ({ children }) => <code className="bg-muted/50 text-primary px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                                                        pre: ({ children }) => <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto mb-3">{children}</pre>,
                                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-3">{children}</blockquote>,
                                                        a: ({ children, href }) => <a href={href} className="text-primary hover:underline">{children}</a>,
                                                        table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border border-border rounded-lg">{children}</table></div>,
                                                        th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold text-foreground bg-muted/30">{children}</th>,
                                                        td: ({ children }) => <td className="border border-border px-3 py-2 text-muted-foreground">{children}</td>,
                                                        input: ({ checked, ...props }) => <input type="checkbox" checked={checked} className="mr-2" {...props} />
                                                    }}
                                                    remarkPlugins={[remarkGfm as any]}
                                                >
                                                    {selectedNote.content}
                                                </ReactMarkdown>
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </>
                            ) : !selectedNote && !isCreating && !isEditing ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No Note Selected</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Select a note from the explorer or create a new one to get started
                                        </p>
                                        <Button
                                            onClick={handleCreateNote}
                                            className="gradient-primary-to-accent text-primary-foreground border-0"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create First Note
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-primary" />
                                                {isCreating ? "Create New Note" : "Edit Note"}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                    className="bg-background/40 border-border hover:bg-accent"
                                                    disabled={isSaving}
                                                >
                                                    <X className="mr-2 h-4 w-4" />
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleSaveNote}
                                                    className="gradient-primary-to-accent text-primary-foreground border-0"
                                                    style={{
                                                        boxShadow: `
                                                            0 0 15px hsl(var(--primary) / 0.4),
                                                            0 0 30px hsl(var(--accent) / 0.2)
                                                        `
                                                    }}
                                                    disabled={isSaving || !noteTitle.trim()}
                                                >
                                                    {isSaving ? (
                                                        <svg className="animate-spin h-4 w-4 text-primary-foreground mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isSaving ? "Saving..." : "Save"}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-foreground mb-2 block">
                                                Title *
                                            </label>
                                            <Input
                                                value={noteTitle}
                                                onChange={(e) => setNoteTitle(e.target.value)}
                                                placeholder="Enter note title..."
                                                className="bg-background/40 border-border placeholder:text-muted-foreground"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-foreground mb-2 block">
                                                Content (Markdown supported)
                                            </label>
                                            <Textarea
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                placeholder="Write your note here... (Markdown supported)"
                                                className="h-[calc(100vh-500px)] resize-none bg-background/40 border-border placeholder:text-muted-foreground font-mono"
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}