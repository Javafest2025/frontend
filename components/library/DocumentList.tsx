"use client"

import type React from "react"

import { formatDate } from "@/lib/utils/date"

type Props = {
  documents: Array<{
    id: string
    title: string
    type: string
    updatedAt: string
  }>
  getIcon: (type: string) => React.ReactNode
}

export function DocumentList({ documents, getIcon }: Props) {
  return (
    <div className="rounded-md border border-[#3e3e42] bg-[#252526]">
      <div className="grid grid-cols-12 gap-4 border-b border-[#3e3e42] bg-[#2d2d30] px-4 py-2 text-sm font-medium text-gray-300">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-4">Last Modified</div>
      </div>

      <div className="divide-y divide-[#3e3e42]">
        {documents.map((doc) => (
          <div key={doc.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#2d2d30] text-white">
            <div className="col-span-6 flex items-center gap-2">
              {getIcon(doc.type)}
              <span className="truncate">{doc.title}</span>
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-400">{doc.type.toUpperCase()}</div>
            <div className="col-span-4 flex items-center text-sm text-gray-400">
              {formatDate(doc.updatedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
