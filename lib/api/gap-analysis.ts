import { getAiApiUrl } from "@/lib/config/ai-api-config";

// Types for gap analysis API
export interface GapAnalysisRequest {
    url: string;
    max_papers?: number;
    validation_threshold?: number;
}

export interface GapAnalysisJob {
    job_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
    estimated_time_minutes?: number;
    created_at?: string;
    progress_message?: string;
    started_at?: string;
    completed_at?: string;
    processing_time_seconds?: number;
    error?: string;
    result_file?: string;
}

export interface GapAnalysisResult {
    request_id: string;
    seed_paper_url: string;
    validated_gaps: ValidatedGap[];
    executive_summary: ExecutiveSummary;
    process_metadata: ProcessMetadata;
    research_intelligence: ResearchIntelligence;
    timestamp: string;
    analysis_version: string;
    ai_models_used: string[];
    visualization_data: VisualizationData;
    quality_metrics: QualityMetrics;
    next_steps: string[];
}

export interface ValidatedGap {
    gap_id: string;
    gap_title: string;
    description: string;
    source_paper: string;
    source_paper_title: string;
    validation_evidence: string;
    potential_impact: string;
    suggested_approaches: string[];
    category: string;
    gap_metrics: GapMetrics;
    research_context: ResearchContext;
    validation_attempts: number;
    papers_checked_against: number;
    confidence_score: number;
    opportunity_tags: string[];
    interdisciplinary_connections: string[];
    industry_relevance: string[];
    estimated_researcher_years: number;
    recommended_team_size: string;
    key_milestones: string[];
    success_metrics: string[];
}

export interface GapMetrics {
    difficulty_score: number;
    innovation_potential: number;
    commercial_viability: number;
    time_to_solution: string;
    funding_likelihood: number;
    collaboration_score: number;
    ethical_considerations: number;
}

export interface ResearchContext {
    related_gaps: string[];
    prerequisite_technologies: string[];
    competitive_landscape: string;
    key_researchers: string[];
    active_research_groups: string[];
    recent_breakthroughs: string[];
}

export interface ExecutiveSummary {
    frontier_overview: string;
    key_insights: string[];
    research_priorities: string[];
    investment_opportunities: string[];
    competitive_advantages: string[];
    risk_assessment: string;
}

export interface ProcessMetadata {
    request_id: string;
    total_papers_analyzed: number;
    processing_time_seconds: number;
    gaps_discovered: number;
    gaps_validated: number;
    gaps_eliminated: number;
    search_queries_executed: number;
    validation_attempts: number;
    seed_paper_url: string;
    analysis_date: string;
    frontier_stats: FrontierStats;
    research_landscape: ResearchLandscape;
    avg_paper_analysis_time: number;
    successful_paper_extractions: number;
    failed_extractions: number;
    gemini_api_calls: number;
    llm_tokens_processed: number;
    ai_confidence_score: number;
    citation_potential_score: number;
    novelty_index: number;
    impact_factor_projection: number;
}

export interface FrontierStats {
    frontier_expansions: number;
    research_domains_explored: number;
    cross_domain_connections: number;
    breakthrough_potential_score: number;
    research_velocity: number;
    gap_discovery_rate: number;
    elimination_effectiveness: number;
    frontier_coverage: number;
}

export interface ResearchLandscape {
    dominant_research_areas: string[];
    emerging_trends: string[];
    research_clusters: Record<string, number>;
    interdisciplinary_bridges: string[];
    hottest_research_areas: HottestResearchArea[];
}

export interface HottestResearchArea {
    area: string;
    activity_score: number;
    funding_growth: string;
}

export interface ResearchIntelligence {
    eliminated_gaps: EliminatedGap[];
    research_momentum: Record<string, number>;
    emerging_collaborations: string[];
    technology_readiness: Record<string, number>;
    patent_landscape: Record<string, number>;
    funding_trends: Record<string, string>;
}

export interface EliminatedGap {
    gap_title: string;
    elimination_reason: string;
    solved_by_paper: string;
    elimination_confidence: number;
}

export interface VisualizationData {
    network_graph: {
        nodes: number;
        edges: number;
    };
    research_timeline: {
        start: number;
        major_discoveries: number;
    };
    impact_heatmap: {
        high_impact_areas: string[];
    };
    frontier_expansion: {
        expansion_points: number;
    };
}

export interface QualityMetrics {
    analysis_completeness: number;
    validation_rigor: number;
    frontier_coverage: number;
    ai_confidence: number;
}

export interface GapAnalysisHealth {
    status: string;
    service: string;
    version: string;
    running_jobs: number;
    max_concurrent_jobs: number;
    total_jobs: number;
    results_directory: string;
    features: string[];
}

export interface GapAnalysisServiceInfo {
    service_name: string;
    description: string;
    new_features: string[];
    workflow: Record<string, string>;
    supported_domains: string[];
    processing_phases: string[];
}

// API functions
export const gapAnalysisApi = {
    // Submit a new gap analysis job
    async submitGapAnalysis(request: GapAnalysisRequest): Promise<GapAnalysisJob> {
        const response = await fetch(getAiApiUrl('/api/v1/gap-analysis/submit'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Failed to submit gap analysis: ${response.statusText}`);
        }

        return response.json();
    },

    // Get job status
    async getJobStatus(jobId: string): Promise<GapAnalysisJob> {
        const response = await fetch(getAiApiUrl(`/api/v1/gap-analysis/status/${jobId}`), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get job status: ${response.statusText}`);
        }

        return response.json();
    },

    // Get job result
    async getJobResult(jobId: string): Promise<GapAnalysisResult> {
        const response = await fetch(getAiApiUrl(`/api/v1/gap-analysis/result/${jobId}`), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get job result: ${response.statusText}`);
        }

        return response.json();
    },

    // List recent jobs
    async listRecentJobs(limit: number = 20): Promise<GapAnalysisJob[]> {
        const response = await fetch(getAiApiUrl(`/api/v1/gap-analysis/jobs?limit=${limit}`), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to list recent jobs: ${response.statusText}`);
        }

        return response.json();
    },

    // Cancel a job
    async cancelJob(jobId: string): Promise<string> {
        const response = await fetch(getAiApiUrl(`/api/v1/gap-analysis/job/${jobId}`), {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to cancel job: ${response.statusText}`);
        }

        return response.text();
    },

    // Health check
    async getHealth(): Promise<GapAnalysisHealth> {
        const response = await fetch(getAiApiUrl('/api/v1/gap-analysis/health'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get health status: ${response.statusText}`);
        }

        return response.json();
    },

    // Get service info
    async getServiceInfo(): Promise<GapAnalysisServiceInfo> {
        const response = await fetch(getAiApiUrl('/api/v1/gap-analysis/info'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get service info: ${response.statusText}`);
        }

        return response.json();
    },
};

// Helper function to poll job status
export const pollJobStatus = async (
    jobId: string,
    onProgress?: (status: GapAnalysisJob) => void,
    maxAttempts: number = 60, // 5 minutes with 5-second intervals
    intervalMs: number = 5000
): Promise<GapAnalysisJob> => {
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const status = await gapAnalysisApi.getJobStatus(jobId);

            if (onProgress) {
                onProgress(status);
            }

            if (status.status === 'completed') {
                return status;
            }

            if (status.status === 'failed') {
                throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        } catch (error) {
            console.error(`Error polling job status (attempt ${attempts + 1}):`, error);
            attempts++;

            if (attempts >= maxAttempts) {
                throw new Error(`Max polling attempts reached: ${error}`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    throw new Error('Max polling attempts reached');
};

// Helper function to run complete gap analysis workflow
export const runGapAnalysis = async (
    request: GapAnalysisRequest,
    onProgress?: (status: GapAnalysisJob) => void
): Promise<GapAnalysisResult> => {
    // Step 1: Submit the job
    const job = await gapAnalysisApi.submitGapAnalysis(request);

    if (onProgress) {
        onProgress(job);
    }

    // Step 2: Poll for completion
    await pollJobStatus(job.job_id, onProgress);

    // Step 3: Get the result
    return await gapAnalysisApi.getJobResult(job.job_id);
}; 