"use client"

type Props = {
  content: string
}

export function TextViewer({ content }: Props) {
  return (
    <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
      <code>{content}</code>
    </pre>
  )
}
