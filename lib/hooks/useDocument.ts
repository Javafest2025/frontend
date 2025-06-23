"use client"

import { useState, useEffect } from "react"
import type { Document } from "@/types/document"

// Sample documents
const sampleDocuments: Document[] = [
  {
    id: "1",
    title: "Research Paper.pdf",
    type: "pdf",
    url: "https://arxiv.org/pdf/2303.08774.pdf",
    updatedAt: "2023-04-15",
  },
  {
    id: "2",
    title: "Meeting Notes.md",
    type: "md",
    content:
      "# Meeting Notes\n\n## Agenda\n\n1. Project Status\n2. Timeline Review\n3. Next Steps\n\n## Action Items\n\n- [ ] Complete research phase\n- [ ] Prepare presentation\n- [ ] Schedule follow-up",
    updatedAt: "2023-04-10",
  },
  {
    id: "3",
    title: "Project Proposal.pdf",
    type: "pdf",
    url: "https://www.africau.edu/images/default/sample.pdf",
    updatedAt: "2023-04-05",
  },
  {
    id: "4",
    title: "Literature Review.md",
    type: "md",
    content:
      "# Literature Review\n\n## Introduction\n\nThis document provides a comprehensive review of the existing literature on the topic.\n\n## Key Findings\n\n1. Finding one with details\n2. Finding two with details\n3. Finding three with details\n\n## Conclusion\n\nBased on the literature review, we can conclude that...",
    updatedAt: "2023-03-28",
  },
  {
    id: "5",
    title: "Data Analysis.txt",
    type: "text",
    content:
      "Data Analysis Results\n\nSample Size: 1000\nMean: 45.6\nMedian: 42.0\nStandard Deviation: 12.3\n\nConclusion: The data shows a normal distribution with slight positive skew.",
    updatedAt: "2023-03-20",
  },
]

export function useDocument(docId?: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [documents] = useState<Document[]>(sampleDocuments)

  useEffect(() => {
    // If no docId is provided, just return all documents
    if (!docId) {
      setIsLoading(false)
      return
    }

    // Simulate API call
    const fetchDocument = async () => {
      setIsLoading(true)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const doc = sampleDocuments.find((d) => d.id === docId) || null
      setDocument(doc)
      setIsLoading(false)
    }

    fetchDocument()
  }, [docId])

  return {
    document,
    documents,
    isLoading,
  }
}
