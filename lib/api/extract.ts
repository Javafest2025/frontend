import { getApiUrl } from "@/lib/config/api-config";

export async function extractPaper(paperId: string) {
    const url = getApiUrl(`/api/test/extraction/papers/${paperId}/extract`);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to extract paper: ${response.status}`);
    }
    return response.json();
}

export async function getStructuredFacts(paperId: string) {
    const url = getApiUrl(`/api/papers/${paperId}/structured-facts`);
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get structured facts: ${response.status}`);
    }
    return response.json();
}

// New: Check if paper has structured facts
export async function hasStructuredFacts(paperId: string) {
    const url = getApiUrl(`/api/papers/${paperId}/has-structured-data`);
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to check structured facts: ${response.status}`);
    }
    return response.json();
} 