"use client"

import { useState } from "react"
import { FileText, File, FileCode, Grid, List, Search, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DocumentCard } from "@/components/library/DocumentCard"
import { DocumentList } from "@/components/library/DocumentList"
import { cn } from "@/lib/utils/cn"

// Sample data
const documents = [
  { id: "1", title: "Research Paper.pdf", type: "pdf", updatedAt: "2023-04-15" },
  { id: "2", title: "Meeting Notes.md", type: "md", updatedAt: "2023-04-10" },
  { id: "3", title: "Project Proposal.pdf", type: "pdf", updatedAt: "2023-04-05" },
  { id: "4", title: "Literature Review.md", type: "md", updatedAt: "2023-03-28" },
  { id: "5", title: "Data Analysis.txt", type: "text", updatedAt: "2023-03-20" },
  { id: "6", title: "Conference Paper.pdf", type: "pdf", updatedAt: "2023-03-15" },
]

export function LibraryContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime()
    const dateB = new Date(b.updatedAt).getTime()
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA
  })

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-6 w-6" />
      case "md":
        return <FileCode className="h-6 w-6" />
      default:
        return <File className="h-6 w-6" />
    }
  }

  return (
    <div className="h-full bg-[#1e1e1e] text-white overflow-auto">
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents..."
              className="pl-8 bg-[#2d2d30] border-[#3e3e42] text-white placeholder:text-gray-400 focus:border-[#007acc]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#2d2d30] border-[#3e3e42] text-white hover:bg-[#3e3e42]">
                  {sortOrder === "desc" ? <SortDesc className="mr-2 h-4 w-4" /> : <SortAsc className="mr-2 h-4 w-4" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#252526] border-[#3e3e42] text-white">
                <DropdownMenuItem onClick={() => setSortOrder("desc")} className="hover:bg-[#3e3e42]">Newest first</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("asc")} className="hover:bg-[#3e3e42]">Oldest first</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center rounded-md border border-[#3e3e42] bg-[#252526]">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none text-gray-300 hover:bg-[#3e3e42] hover:text-white",
                  viewMode === "grid" && "bg-[#1e1e1e] text-white"
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none text-gray-300 hover:bg-[#3e3e42] hover:text-white",
                  viewMode === "list" && "bg-[#1e1e1e] text-white"
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} icon={getDocumentIcon(doc.type)} />
            ))}
          </div>
        ) : (
          <DocumentList documents={sortedDocuments} getIcon={getDocumentIcon} />
        )}
      </div>
    </div>
  )
}
