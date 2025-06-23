import { PDFViewer } from "@/components/document/PdfViewer"

export default function DashboardPage() {
  return (
    <div className="h-full">
      <PDFViewer
        documentName="Research Paper.pdf"
        documentUrl="/sample-research-paper.pdf"
      />
    </div>
  )
}
