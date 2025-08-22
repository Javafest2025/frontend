"use client"

import { useDocument } from "@/lib/hooks/useDocument"
import { Skeleton } from "@/components/ui/skeleton"

type Props = {
  docId: string
}

export function DocumentPage({ docId }: Props) {
  const { document, isLoading } = useDocument(docId)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">{document.title}</h1>
      <div className="flex items-center justify-center h-[600px] border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">Document viewer temporarily unavailable</p>
        </div>
      </div>
    </div>
  )
}
