/* research-data.ts
 * Robust domain/topic/tag suggestions with:
 * - deduped data & canonical slugs
 * - diacritic-insensitive normalization (NFKD)
 * - abbreviations & alias mapping (NLP, CV, HCI, IR, OR, BCI…)
 * - layered ranking: exact > prefix > word-start > contains > fuzzy
 * - lightweight Damerau–Levenshtein with early-exit threshold
 * - structured Suggestion results (type, path, score)
 * - deterministic, locale-aware sort fallback
 */

export type SuggestionType = 'domain' | 'topic' | 'tag';
export interface Suggestion {
    label: string;
    type: SuggestionType;
    /** For topics: [domain, topic]. For tags: [tag]. For domains: [domain]. */
    path: string[];
    /** 0..1 (higher is better) */
    score: number;
}

///////////////////////////////
// 1) Data (deduped + sorted) //
///////////////////////////////

// Keep your original lists but dedupe & sort to avoid accidental repeats.
const RAW_RESEARCH_DOMAINS = [
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
    // (Biomedical Engineering already included above)
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
    "Mathematical Modeling",
] as const;

export const RESEARCH_DOMAINS: string[] = Array.from(new Set(RAW_RESEARCH_DOMAINS))
    .sort(new Intl.Collator('en', { sensitivity: 'base' }).compare); // stable, locale-aware

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
    ],
};

export const COMMON_RESEARCH_TAGS = [
    // General
    "research", "academic", "publication", "peer-reviewed", "open-access", "preprint",
    "reproducible research", "open science", "collaborative research", "interdisciplinary",
    // Methods
    "experimental", "theoretical", "computational", "empirical", "simulation", "modeling",
    "statistical analysis", "qualitative", "quantitative", "systematic review", "meta-analysis",
    "case study", "longitudinal study", "cross-sectional", "randomized controlled trial",
    // Tech
    "AI", "ML", "deep learning", "big data", "cloud computing", "edge computing",
    "IoT", "blockchain", "distributed systems", "real-time", "scalable", "high-performance",
    // Domains
    "healthcare", "medicine", "education", "finance", "automotive", "aerospace", "energy",
    "environment", "agriculture", "manufacturing", "telecommunications", "entertainment",
    "social media", "e-commerce", "smart cities", "sustainability",
    // Data types
    "text", "images", "video", "audio", "time-series", "graph data", "sensor data",
    "genomic data", "medical records", "social networks", "geospatial data",
    // Quality
    "novel", "innovative", "breakthrough", "state-of-the-art", "benchmark", "evaluation",
    "performance", "accuracy", "efficiency", "robustness", "scalability", "interpretability",
];

// Abbreviation & alias helpers (do NOT collapse distinct domains like Bioinformatics vs Computational Biology)
const DOMAIN_ALIASES: Record<string, string[]> = {
    "Artificial Intelligence": ["AI", "A.I.", "Intelligent Systems", "AGI (broad)"],
    "Machine Learning": ["ML"],
    "Computer Vision": ["CV", "Vision", "Image Understanding", "Visual Recognition"],
    "Natural Language Processing": ["NLP", "Language Tech"],
    "Human-Computer Interaction": ["HCI", "UX", "User Experience"],
    "Information Retrieval": ["IR", "Search"],
    "Operations Research": ["OR"],
    "Computer Networks": ["Networking", "Networks"],
    "Cybersecurity": ["Security", "InfoSec"],
    "Neuroscience": ["Neuro"],
    "Biomedical Engineering": ["BME"],
    "Materials Science": ["MatSci"],
    "Electrical Engineering": ["EE"],
    "Computer Graphics": ["CG", "Graphics"],
    "Quantum Computing": ["QC"],
};

const TOPIC_ALIASES: Record<string, string[]> = {
    "brain-computer interfaces": ["BCI"],
    "graph neural networks": ["GNNs", "GNN"],
    "generative adversarial networks": ["GANs", "GAN"],
    "variational autoencoders": ["VAE", "VAEs"],
    "vision transformers": ["ViT"],
    "natural language processing": ["NLP"],
    "information retrieval": ["IR"],
};

// General topics appended to any domain
const GENERAL_TOPICS = [
    "data analysis", "statistical methods", "experimental design", "literature review",
    "survey", "comparison study", "performance evaluation", "optimization",
    "algorithm development", "framework development", "tool development",
];

///////////////////////////////
// 2) Normalization helpers  //
///////////////////////////////

const collator = new Intl.Collator('en', { sensitivity: 'base', ignorePunctuation: true });

function stripDiacritics(s: string): string {
    // NFKD + remove combining marks (simplified for ES5 compatibility)
    return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function norm(s: string): string {
    return stripDiacritics(s).toLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenizeWords(s: string): string[] {
    return norm(s).split(/[\s/_-]+/).filter(Boolean);
}

function slug(s: string): string {
    return stripDiacritics(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

///////////////////////////////
// 3) Fuzzy distance (DL)    //
///////////////////////////////

/** Damerau–Levenshtein distance with optional early-exit limit. */
function damerauLevenshtein(a: string, b: string, max = 3): number {
    if (a === b) return 0;
    const n = a.length, m = b.length;
    if (Math.abs(n - m) > max) return max + 1;
    if (n === 0) return m <= max ? m : max + 1;
    if (m === 0) return n <= max ? n : max + 1;

    const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1));
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;

    for (let i = 1; i <= n; i++) {
        let rowMin = Infinity;
        for (let j = 1; j <= m; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let val = Math.min(
                dp[i - 1][j] + 1,      // deletion
                dp[i][j - 1] + 1,      // insertion
                dp[i - 1][j - 1] + cost
            );
            // transposition
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                val = Math.min(val, dp[i - 2][j - 2] + 1);
            }
            dp[i][j] = val;
            if (val < rowMin) rowMin = val;
        }
        // Early exit: if the best value in this row already exceeds max
        if (rowMin > max) return max + 1;
    }
    return dp[n][m];
}

///////////////////////////////
// 4) Index & search         //
///////////////////////////////

type Item = { label: string; type: SuggestionType; path: string[]; normLabel: string; words: string[]; canonicalDomain?: string; };

function buildIndex() {
    const items: Item[] = [];

    // Domains
    for (const d of RESEARCH_DOMAINS) {
        items.push({
            label: d,
            type: 'domain',
            path: [d],
            normLabel: norm(d),
            words: tokenizeWords(d),
        });
        // domain aliases
        const aliases = DOMAIN_ALIASES[d] || [];
        for (const alias of aliases) {
            items.push({
                label: alias, // show the alias as label to match user input
                type: 'domain',
                path: [d],    // but path points to canonical
                normLabel: norm(alias),
                words: tokenizeWords(alias),
                canonicalDomain: d,
            });
        }
    }

    // Topics per domain + aliases
    for (const domain of Object.keys(RESEARCH_TOPICS_BY_DOMAIN)) {
        const topics = RESEARCH_TOPICS_BY_DOMAIN[domain] || [];
        for (const t of [...topics, ...GENERAL_TOPICS]) {
            items.push({
                label: t,
                type: 'topic',
                path: [domain, t],
                normLabel: norm(t),
                words: tokenizeWords(t),
            });
            const aliases = TOPIC_ALIASES[t.toLowerCase()] || TOPIC_ALIASES[t] || [];
            for (const alias of aliases) {
                items.push({
                    label: alias,
                    type: 'topic',
                    path: [domain, t],
                    normLabel: norm(alias),
                    words: tokenizeWords(alias),
                });
            }
        }
    }

    // Tags
    for (const tag of COMMON_RESEARCH_TAGS) {
        items.push({
            label: tag,
            type: 'tag',
            path: [tag],
            normLabel: norm(tag),
            words: tokenizeWords(tag),
        });
    }

    return items;
}

const INDEX: Item[] = buildIndex();

/** Core scoring logic. Higher is better (0..1). */
function scoreItem(q: string, item: Item): number {
    if (!q) return 0.0001; // tiny score to allow empty-query fallback

    const L = item.normLabel;
    if (L === q) return 1.0; // exact match

    // Prefix & word-start bonuses
    if (L.startsWith(q)) return 0.96;
    if (item.words.some(w => w.startsWith(q))) return 0.9;

    // Contains
    if (L.includes(q)) return 0.82;

    // Alias bonus: (canonicalDomain present means item label is alias)
    let base = 0.0;
    if (item.canonicalDomain) base += 0.03;

    // Lightweight fuzzy: distance up to 2 or 3 depending on length
    const maxDist = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    const d = damerauLevenshtein(L, q, maxDist);
    if (d <= maxDist) {
        // Convert distance to score; shorter strings penalize less
        const denom = Math.max(L.length, q.length);
        const fuzzy = 0.72 + (1 - d / Math.max(1, Math.min(denom, 10))) * 0.12; // 0.72..0.84
        base = Math.max(base, fuzzy);
    }

    // Tiny bump if any word has all chars of q in order (subsequence)
    const qChars = q.split(''); // ES5 compatible string to array conversion
    if (item.words.some(w => {
        let i = 0;
        for (let j = 0; j < w.length; j++) {
            if (w[j] === qChars[i]) i++;
        }
        return i === qChars.length;
    })) base = Math.max(base, 0.78);

    return base;
}

/** Public API: fetch suggestions, optionally filtered by kind & by domain context. */
export function searchSuggestions(
    query: string,
    options?: { limit?: number; kinds?: SuggestionType[]; withinDomain?: string }
): Suggestion[] {
    const limit = options?.limit ?? 8;
    const kinds = options?.kinds;
    const withinDomain = options?.withinDomain ? norm(options.withinDomain) : null;

    const q = norm(query);
    const candidates = INDEX.filter(it => {
        if (kinds && !kinds.includes(it.type)) return false;
        if (withinDomain && it.type === 'topic') {
            // keep only topics under the selected domain (match canonical path[0])
            const dom = norm(it.path[0] || '');
            return dom === withinDomain;
        }
        return true;
    });

    const scored = candidates
        .map(it => ({ it, s: scoreItem(q, it) }))
        .filter(x => x.s > 0) // remove zeros
        .sort((a, b) => {
            // Desc by score, then locale-aware by label
            if (b.s !== a.s) return b.s - a.s;
            return collator.compare(a.it.label, b.it.label);
        });

    // Deduplicate by canonical path + type
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const { it, s } of scored) {
        const key = `${it.type}|${it.path.join('>')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ label: it.label, type: it.type, path: it.path, score: Math.min(1, Math.max(0, s)) });
        if (out.length >= limit) break;
    }
    return out;
}

///////////////////////////////////////////////
// 5) Convenience helpers to match your API  //
///////////////////////////////////////////////

export function getTopicSuggestions(domain: string): string[] {
    const topics = (RESEARCH_TOPICS_BY_DOMAIN[domain] ?? []).slice();
    for (const t of GENERAL_TOPICS) topics.push(t);
    // Return unique, nicely sorted
    const set = new Set(topics.map(t => t.trim()).filter(Boolean));
    return Array.from(set).sort(collator.compare);
}

export function getTagSuggestions(domain?: string, topics?: string[]): string[] {
    const suggestions = new Set<string>(COMMON_RESEARCH_TAGS);

    const dl = (domain ?? '').toLowerCase();
    const add = (...xs: string[]) => xs.forEach(x => suggestions.add(x));

    // Domain-specific hints
    if (dl.includes('artificial intelligence') || /\bai\b/.test(dl)) add("artificial intelligence", "intelligent systems", "automation");
    if (dl.includes('machine learning') || /\bml\b/.test(dl)) add("machine learning", "predictive modeling", "pattern recognition");
    if (dl.includes('computer vision') || /\bcv\b/.test(dl)) add("image processing", "visual recognition", "computer graphics");
    if (dl.includes('natural language') || /\bnlp\b/.test(dl)) add("text processing", "language understanding", "computational linguistics");
    if (/(bio|medical|genomic|clinical)/.test(dl)) add("biomedical", "clinical", "diagnostic", "therapeutic");

    // Topic-sensitive hints
    (topics ?? []).forEach(t => {
        const tl = t.toLowerCase();
        if (tl.includes('deep learning')) add("neural networks", "deep neural networks", "end-to-end learning");
        if (tl.includes('reinforcement learning')) add("agent-based", "reward optimization", "policy learning");
        if (/(security|cybersecurity)/.test(tl)) add("security", "privacy", "cryptography", "vulnerability");
    });

    return Array.from(suggestions).sort(collator.compare);
}

/** Lightweight string[] facade for your existing UI, with the new engine under the hood. */
export function searchStringsFacade(query: string, pool: string[], limit = 8): string[] {
    const q = norm(query);
    const items: Item[] = pool.map(label => ({
        label,
        type: 'tag',
        path: [label],
        normLabel: norm(label),
        words: tokenizeWords(label),
    }));
    const scored = items
        .map(it => ({ it, s: scoreItem(q, it) }))
        .sort((a, b) => (b.s - a.s) || collator.compare(a.it.label, b.it.label))
        .slice(0, limit)
        .map(x => x.it.label);
    return scored;
}

/** Helper function for SmartComboBox compatibility - returns string[] instead of Suggestion[] */
export function searchSuggestionsAsStrings(
    query: string,
    options?: { limit?: number; kinds?: SuggestionType[]; withinDomain?: string }
): string[] {
    const suggestions = searchSuggestions(query, options);
    return suggestions.map(s => s.label);
}
