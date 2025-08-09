"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    if (!email) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">
                        Invalid Verification Link
                    </h1>
                    <p className="text-foreground">
                        Please use the verification link sent to your email.
                    </p>
                </div>
            </div>
        )
    }

    return <EmailVerificationForm email={email} />
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">
                        Loading...
                    </h1>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
