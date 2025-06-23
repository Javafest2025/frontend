"use client"

import type React from "react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/date"

type Props = {
  document: {
    id: string
    title: string
    type: string
    updatedAt: string
  }
  icon: React.ReactNode
}

export function DocumentCard({ document, icon }: Props) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md bg-[#252526] border-[#3e3e42] text-white hover:bg-[#2d2d30]">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 rounded-md bg-[#2d2d30] p-2">{icon}</div>
          <h3 className="font-medium line-clamp-1">{document.title}</h3>
        </div>
      </CardContent>
      <CardFooter className="border-t border-[#3e3e42] bg-[#1e1e1e] px-4 py-2">
        <div className="flex w-full items-center justify-between text-xs text-gray-400">
          <span>{document.type.toUpperCase()}</span>
          <span>{formatDate(document.updatedAt)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
