import { DocumentPage } from "@/components/library/DocumentPage"

export default function DocumentViewPage({ params }: { params: { docId: string } }) {
  return <DocumentPage docId={params.docId} />
}
