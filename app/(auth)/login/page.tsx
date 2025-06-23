'use client';

import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
            {/* Foreground content */}
            <div className="relative z-10 flex items-center justify-center w-full">
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
