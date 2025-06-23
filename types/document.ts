export type Document = {
  id: string
  title: string
  type: "pdf" | "md" | "text"
  url?: string
  content?: string
  updatedAt: string
}
