"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleGitHubAuthCallback, type SocialLoginResponse } from '@/lib/api/user-service';
import { useAuth } from '@/hooks/useAuth';

function CallbackPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updateAuthState } = useAuth();

    const [message, setMessage] = useState<string | null>('Processing login...');
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false); // New state to track processing

    useEffect(() => {
        const code = searchParams.get('code');
        const githubError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (githubError) {
            setError(`GitHub login error: ${errorDescription || githubError}`);
            setMessage(null);
            setIsProcessing(false); // Ensure processing stops
            // Optionally, redirect to login page with error
            router.push('/login?error=' + encodeURIComponent(errorDescription || githubError));
            return;
        }

        if (code && !isProcessing) { // Only process if code exists and not already processing
            setIsProcessing(true);
            setMessage('Verifying GitHub authorization...');
            setError(null);

            handleGitHubAuthCallback(code)
                .then((result: SocialLoginResponse) => {
                    if (result.success && result.token && result.user) {
                        updateAuthState(result.token, result.user);
                        setMessage('Login successful! Redirecting to dashboard...');
                        router.push('/interface/home'); // Redirect to dashboard on success
                    } else {
                        setError(result.message || 'Failed to complete GitHub login.');
                        setMessage(null);
                        //Optionally, redirect to login page with error
                        router.push('/login?error=' + encodeURIComponent(result.message || 'Failed to complete GitHub login.'));
                    }
                })
                .catch((err: any) => {
                    console.error("Callback handling error:", err);
                    setError(err.message || 'An unexpected error occurred during GitHub login processing.');
                    setMessage(null);
                })
                .finally(() => {
                });
        } else if (!code && !githubError) {
            setMessage('Waiting for GitHub authorization code...');
            // This state might be brief or indicate an issue if code is never received.
        }
        // Intentionally not adding isProcessing to dependencies to prevent re-triggering on its change.
        // We want this effect to run when searchParams change, and then guard processing internally.
    }, [searchParams, router, updateAuthState]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-2">
                <p className="text-red-500">Error: {error}</p>
                <button onClick={() => router.push('/login')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <p>{message || "Loading..."}</p>
            {/* Basic loading spinner */}
            {isProcessing && (
                <div className="mt-4 border-gray-300 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600" />
            )}
            {!isProcessing && !error && message === 'Waiting for GitHub authorization code...' && (
                <p className="mt-2 text-sm text-gray-500">If you are not redirected automatically, please <a href="/login" className="text-blue-500 hover:underline">try logging in again</a>.</p>
            )}
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <p>Loading...</p>
            <div className="mt-4 border-gray-300 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600" />
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CallbackPageContent />
        </Suspense>
    );
} 