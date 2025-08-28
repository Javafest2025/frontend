import { ScholarBotChat } from "@/components/chat/ScholarBotChat"

export default function ScholarBotPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4">ScholarBot Demo</h1>
                    <p className="text-muted-foreground">
                        Try asking ScholarBot to help you with your research tasks!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ScholarBotChat />
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Example Commands</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• "Create todo for meeting today at 6 pm"</li>
                                <li>• "Summarize all todos due this week"</li>
                                <li>• "Search todos about research"</li>
                                <li>• "Find papers on machine learning"</li>
                                <li>• "What's the weather like?"</li>
                            </ul>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">Features</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li>✅ Natural language processing</li>
                                <li>✅ Todo management</li>
                                <li>✅ Task summarization</li>
                                <li>✅ Paper search (coming soon)</li>
                                <li>✅ General Q&A</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
