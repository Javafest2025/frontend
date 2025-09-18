import { SignupForm } from "@/components/auth/SignupForm"

export default function SignupPage() {
    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
            {/* Foreground content */}
            <div className="relative z-10 flex items-center justify-center w-full">
                <SignupForm />
            </div>
        </div>
    )
}
