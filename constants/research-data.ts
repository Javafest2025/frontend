export const RESEARCH_DOMAINS = [
    // Computer Science & AI
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Reinforcement Learning",
    "Neural Networks",
    "Data Science",
    "Computer Graphics",
    "Human-Computer Interaction",
    "Robotics",
    "Cybersecurity",
    "Software Engineering",
    "Database Systems",
    "Distributed Systems",
    "Computer Networks",
    "Quantum Computing",
    "Information Retrieval",
    "Knowledge Representation",
    "Computational Linguistics",

    // Life Sciences & Medicine
    "Biomedical Engineering",
    "Bioinformatics",
    "Computational Biology",
    "Genetics",
    "Genomics",
    "Proteomics",
    "Neuroscience",
    "Pharmacology",
    "Clinical Medicine",
    "Public Health",
    "Epidemiology",
    "Medical Imaging",
    "Drug Discovery",
    "Personalized Medicine",
    "Systems Biology",
    "Molecular Biology",
    "Cell Biology",
    "Microbiology",
    "Immunology",
    "Cancer Research",

    // Physical Sciences
    "Physics",
    "Chemistry",
    "Materials Science",
    "Nanotechnology",
    "Quantum Physics",
    "Condensed Matter Physics",
    "Particle Physics",
    "Astrophysics",
    "Environmental Science",
    "Climate Science",
    "Earth Sciences",
    "Energy Research",
    "Renewable Energy",
    "Nuclear Engineering",
    "Chemical Engineering",

    // Engineering
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Environmental Engineering",
    "Industrial Engineering",
    "Control Systems",
    "Signal Processing",
    "Power Systems",
    "Structural Engineering",
    "Transportation Engineering",

    // Social Sciences & Humanities
    "Psychology",
    "Cognitive Science",
    "Economics",
    "Political Science",
    "Sociology",
    "Anthropology",
    "Education",
    "Linguistics",
    "Philosophy",
    "History",
    "Digital Humanities",
    "Social Computing",
    "Behavioral Economics",

    // Mathematics & Statistics
    "Mathematics",
    "Statistics",
    "Applied Mathematics",
    "Computational Mathematics",
    "Operations Research",
    "Optimization",
    "Game Theory",
    "Graph Theory",
    "Probability Theory",
    "Mathematical Modeling"
];

export const RESEARCH_TOPICS_BY_DOMAIN: { [key: string]: string[] } = {
    "Artificial Intelligence": [
        "expert systems", "knowledge-based systems", "automated reasoning", "planning and scheduling",
        "multi-agent systems", "AI ethics", "explainable AI", "artificial general intelligence",
        "symbolic AI", "cognitive architectures", "automated theorem proving", "constraint satisfaction"
    ],

    "Machine Learning": [
        "supervised learning", "unsupervised learning", "semi-supervised learning", "transfer learning",
        "meta-learning", "few-shot learning", "online learning", "active learning", "ensemble methods",
        "feature selection", "dimensionality reduction", "model selection", "hyperparameter optimization",
        "federated learning", "continual learning", "adversarial training", "interpretable ML"
    ],

    "Deep Learning": [
        "convolutional neural networks", "recurrent neural networks", "transformer models", "attention mechanisms",
        "generative adversarial networks", "variational autoencoders", "graph neural networks",
        "neural architecture search", "knowledge distillation", "pruning", "quantization",
        "self-supervised learning", "contrastive learning", "diffusion models", "vision transformers"
    ],

    "Computer Vision": [
        "image classification", "object detection", "semantic segmentation", "instance segmentation",
        "image generation", "face recognition", "pose estimation", "optical flow", "stereo vision",
        "3D reconstruction", "SLAM", "medical imaging", "remote sensing", "video analysis",
        "scene understanding", "visual question answering", "image captioning"
    ],

    "Natural Language Processing": [
        "language models", "text classification", "named entity recognition", "sentiment analysis",
        "machine translation", "text summarization", "question answering", "dialogue systems",
        "information extraction", "text generation", "speech recognition", "text-to-speech",
        "multilingual NLP", "low-resource languages", "computational semantics", "discourse analysis"
    ],

    "Bioinformatics": [
        "sequence analysis", "phylogenetics", "protein structure prediction", "gene expression analysis",
        "genome assembly", "variant calling", "comparative genomics", "systems biology modeling",
        "drug-target interaction", "biomarker discovery", "personalized medicine", "metagenomics"
    ],

    "Neuroscience": [
        "brain imaging", "neural decoding", "brain-computer interfaces", "computational neuroscience",
        "cognitive neuroscience", "neural plasticity", "neurodegenerative diseases", "neural networks",
        "synaptic transmission", "neural development", "consciousness studies", "memory and learning"
    ],

    "Climate Science": [
        "climate modeling", "global warming", "carbon cycle", "extreme weather", "sea level rise",
        "climate change impacts", "climate adaptation", "mitigation strategies", "paleoclimatology",
        "atmospheric dynamics", "ocean circulation", "ecosystem responses"
    ],

    "Materials Science": [
        "nanomaterials", "biomaterials", "smart materials", "2D materials", "semiconductors",
        "superconductors", "polymers", "composites", "thin films", "surface science",
        "materials characterization", "computational materials science"
    ],

    "Robotics": [
        "autonomous navigation", "manipulation", "human-robot interaction", "swarm robotics",
        "medical robotics", "service robotics", "industrial automation", "robot learning",
        "path planning", "sensor fusion", "robot perception", "soft robotics"
    ]
};

export const COMMON_RESEARCH_TAGS = [
    // General research tags
    "research", "academic", "publication", "peer-reviewed", "open-access", "preprint",
    "reproducible research", "open science", "collaborative research", "interdisciplinary",

    // Methodology tags
    "experimental", "theoretical", "computational", "empirical", "simulation", "modeling",
    "statistical analysis", "qualitative", "quantitative", "systematic review", "meta-analysis",
    "case study", "longitudinal study", "cross-sectional", "randomized controlled trial",

    // Technology tags
    "AI", "ML", "deep learning", "big data", "cloud computing", "edge computing",
    "IoT", "blockchain", "distributed systems", "real-time", "scalable", "high-performance",

    // Application domains
    "healthcare", "medicine", "education", "finance", "automotive", "aerospace", "energy",
    "environment", "agriculture", "manufacturing", "telecommunications", "entertainment",
    "social media", "e-commerce", "smart cities", "sustainability",

    // Data types
    "text", "images", "video", "audio", "time-series", "graph data", "sensor data",
    "genomic data", "medical records", "social networks", "geospatial data",

    // Quality indicators
    "novel", "innovative", "breakthrough", "state-of-the-art", "benchmark", "evaluation",
    "performance", "accuracy", "efficiency", "robustness", "scalability", "interpretability"
];

// Function to get topic suggestions based on domain
export function getTopicSuggestions(domain: string): string[] {
    const domainTopics = RESEARCH_TOPICS_BY_DOMAIN[domain] || [];

    // Add some general topics that apply to most domains
    const generalTopics = [
        "data analysis", "statistical methods", "experimental design", "literature review",
        "survey", "comparison study", "performance evaluation", "optimization",
        "algorithm development", "framework development", "tool development"
    ];

    return [...domainTopics, ...generalTopics];
}

// Function to get tag suggestions based on domain and topics
export function getTagSuggestions(domain?: string, topics?: string[]): string[] {
    let suggestions = [...COMMON_RESEARCH_TAGS];

    // Add domain-specific tags
    if (domain) {
        const domainLower = domain.toLowerCase();
        if (domainLower.includes("ai") || domainLower.includes("artificial intelligence")) {
            suggestions.push("artificial intelligence", "intelligent systems", "automation");
        }
        if (domainLower.includes("machine learning") || domainLower.includes("ml")) {
            suggestions.push("machine learning", "predictive modeling", "pattern recognition");
        }
        if (domainLower.includes("computer vision")) {
            suggestions.push("image processing", "visual recognition", "computer graphics");
        }
        if (domainLower.includes("nlp") || domainLower.includes("natural language")) {
            suggestions.push("text processing", "language understanding", "computational linguistics");
        }
        if (domainLower.includes("bio") || domainLower.includes("medical")) {
            suggestions.push("biomedical", "clinical", "diagnostic", "therapeutic");
        }
    }

    // Add topic-specific tags
    if (topics) {
        topics.forEach(topic => {
            const topicLower = topic.toLowerCase();
            if (topicLower.includes("deep learning")) {
                suggestions.push("neural networks", "deep neural networks", "end-to-end learning");
            }
            if (topicLower.includes("reinforcement learning")) {
                suggestions.push("agent-based", "reward optimization", "policy learning");
            }
            if (topicLower.includes("security") || topicLower.includes("cybersecurity")) {
                suggestions.push("security", "privacy", "cryptography", "vulnerability");
            }
        });
    }

    return Array.from(new Set(suggestions)); // Remove duplicates
}

// Function to search and filter suggestions
export function searchSuggestions(query: string, suggestions: string[]): string[] {
    if (!query.trim()) return suggestions.slice(0, 10); // Return top 10 if no query

    const queryLower = query.toLowerCase();
    const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(queryLower)
    );

    // Sort by relevance (exact matches first, then starts with, then contains)
    return filtered.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        if (aLower === queryLower) return -1;
        if (bLower === queryLower) return 1;
        if (aLower.startsWith(queryLower)) return -1;
        if (bLower.startsWith(queryLower)) return 1;
        return 0;
    }).slice(0, 8); // Limit to 8 suggestions
} 