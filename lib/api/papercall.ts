import { getApiUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/auth";

// GET /api/v1/papercall/all
export async function getAllPaperCalls() {
    const url = getApiUrl("/api/v1/papercall/all");
    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized - Please log in');
        }
        throw new Error(`Failed to fetch paper calls: ${response.status}`);
    }
    return response.json();
}

// POST /api/v1/papercall/sync
export async function syncPaperCalls(domain: string) {
    const url = getApiUrl(`/api/v1/papercall/sync?domain=${encodeURIComponent(domain)}`);
    const response = await authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Unauthorized - Please log in');
        }
        throw new Error(`Failed to sync paper calls: ${response.status}`);
    }
    return response.json();
} 