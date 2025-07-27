"use client"

import { useState } from "react"
import { PDFViewer } from "@/components/document/PdfViewer"
import { MarkdownViewer } from "@/components/document/MarkdownViewer"
import { TextViewer } from "@/components/document/TextViewer"
import type { Document } from "@/types/document"

type Props = {
  document: Document
}

export function DocumentViewer({ document }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)

  const renderContent = () => {
    switch (document.type) {
      case "pdf":
        return (
          <PDFViewer
            documentUrl={document.url}
            documentName={document.title}
            paperId={document.id}
          />
        )
      case "md":
        return <MarkdownViewer content={document.content} />
      case "text":
        return <TextViewer content={document.content} />
      default:
        return <div>Unsupported document type</div>
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
    </div>
  )
}
