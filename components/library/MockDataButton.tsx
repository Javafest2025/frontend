"use client"

import { Button } from "@/components/ui/button"
import { TestTube } from "lucide-react"

interface MockDataButtonProps {
    onAddMockData: (papers: any[]) => void
}

export function MockDataButton({ onAddMockData }: MockDataButtonProps) {
    const mockPapers = [
        {
            title: "A Microarchitecture Implementation Framework for Online Learning with Temporal Neural Networks",
            abstractText: "This paper presents a novel microarchitecture framework designed for implementing online learning algorithms with temporal neural networks.",
            authors: [
                { name: "Harideep Nair", authorId: null, orcid: null, affiliation: "Stanford University" },
                { name: "John Paul Shen", authorId: null, orcid: null, affiliation: "Carnegie Mellon University" }
            ],
            publicationDate: "2021-05-27",
            doi: "10.1109/ISVLSI51109.2021.00056",
            source: "arXiv",
            pdfUrl: "http://arxiv.org/pdf/2105.13262v2.pdf",
            isOpenAccess: true,
            paperUrl: "http://arxiv.org/abs/2105.13262v2",
            venueName: "2021 IEEE International Symposium on Very Large Scale Integration",
            publisher: "IEEE",
            citationCount: 15,
            referenceCount: 42,
            influentialCitationCount: 3,
            fieldsOfStudy: ["Computer Science", "Machine Learning", "Neural Networks"]
        },
        {
            title: "Deep Reinforcement Learning for Autonomous Vehicle Navigation",
            abstractText: "This research presents a comprehensive framework for autonomous vehicle navigation using deep reinforcement learning algorithms.",
            authors: [
                { name: "Sarah Chen", authorId: null, orcid: "0000-0001-2345-6789", affiliation: "MIT" },
                { name: "David Rodriguez", authorId: null, orcid: null, affiliation: "Stanford University" }
            ],
            publicationDate: "2023-03-15",
            doi: "10.1038/s41586-023-12345-6",
            source: "Semantic Scholar",
            pdfUrl: "https://example.com/autonomous-nav.pdf",
            isOpenAccess: false,
            paperUrl: "https://nature.com/articles/example",
            venueName: "Nature Machine Intelligence",
            publisher: "Nature Publishing Group",
            citationCount: 157,
            referenceCount: 89,
            influentialCitationCount: 42,
            fieldsOfStudy: ["Computer Science", "Artificial Intelligence", "Autonomous Systems"]
        },
        {
            title: "Transformer Models for Natural Language Understanding: A Comprehensive Analysis",
            abstractText: "We present a thorough analysis of transformer architectures for natural language understanding tasks.",
            authors: [
                { name: "Emma Wilson", authorId: null, orcid: null, affiliation: "OpenAI" },
                { name: "James Taylor", authorId: null, orcid: null, affiliation: "Harvard University" }
            ],
            publicationDate: "2023-09-12",
            doi: "10.18653/v1/2023.acl-long.123",
            source: "ACL Anthology",
            pdfUrl: "https://aclanthology.org/2023.acl-long.123.pdf",
            isOpenAccess: true,
            paperUrl: "https://aclanthology.org/2023.acl-long.123/",
            venueName: "61st Annual Meeting of the Association for Computational Linguistics",
            publisher: "Association for Computational Linguistics",
            citationCount: 203,
            referenceCount: 67,
            influentialCitationCount: 78,
            fieldsOfStudy: ["Natural Language Processing", "Deep Learning", "Transformers"]
        }
    ]

    return (
        <Button
            onClick={() => onAddMockData(mockPapers)}
            variant="outline"
            size="sm"
            className="bg-orange-500/10 border-orange-500/20 text-orange-600 hover:bg-orange-500/20"
        >
            <TestTube className="mr-2 h-4 w-4" />
            Add Mock Data
        </Button>
    )
} 