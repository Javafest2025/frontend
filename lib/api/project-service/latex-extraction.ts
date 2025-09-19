import { getMicroserviceUrl } from "@/lib/config/api-config";
import { authenticatedFetch } from "@/lib/api/user-service/auth";

export interface BatchExtractionItemResult {
  paperId: string;
  action: "TRIGGERED" | "SKIPPED_ALREADY_EXTRACTED" | "SKIPPED_IN_PROGRESS" | "ERROR";
  status: string;
  jobId?: string;
  message?: string;
}

export interface BatchExtractionResponse {
  total: number;
  triggered: number;
  skippedAlreadyExtracted: number;
  skippedInProgress: number;
  errors: number;
  results: BatchExtractionItemResult[];
}

export async function triggerBatchExtraction(paperIds: string[], asyncProcessing: boolean = true): Promise<BatchExtractionResponse> {
  const url = getMicroserviceUrl("project-service", "/api/v1/latex/context/extraction/trigger");
  const response = await authenticatedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paperIds, asyncProcessing }),
  });

  if (!response.ok) {
    let details = await response.text().catch(() => "");
    throw new Error(`Batch extraction failed: ${response.status} ${response.statusText} ${details}`);
  }

  const data = await response.json();
  return data.data as BatchExtractionResponse;
}
