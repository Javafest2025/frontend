"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { InputField } from "@/components/form/InputField"
import { PasswordField } from "@/components/form/PasswordField"
import { sendResetCode, submitNewPassword, clearAuthData } from "@/lib/api/user-service"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"
import { Brain } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { CountdownTimer } from "@/components/ui/countdown-timer"




export function ForgotPasswordForm() {
    const [step, setStep] = useState<'enterEmail' | 'resetPassword'>('enterEmail')
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState({ email: "", code: "", password: "", confirmPassword: "", form: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showTimer, setShowTimer] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const { navigateWithLoading } = useNavigationWithLoading()
    const { toast } = useToast()

    const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrors({ email: "", code: "", password: "", confirmPassword: "", form: "" })
        if (!email) {
            setErrors(prev => ({ ...prev, email: "Email is required" }))
            return
        }
        setIsLoading(true)
        try {
            // This API call should trigger the email sending
            await sendResetCode(email)
            toast({
                title: "Reset Code Sent!",
                description: "Please check your email for the reset code.",
                variant: "success",
            })
            setStep('resetPassword')
            setShowTimer(true) // Start timer when code is sent
        } catch (error: any) {
            toast({
                title: "Failed to Send Reset Code",
                description: error.message || "Failed to send reset code. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        let valid = true
        const newErrors = { email: "", code: "", password: "", confirmPassword: "", form: "" }

        if (!code) {
            newErrors.code = "Reset code is required"
            valid = false
        } else if (code.length !== 6) {
            newErrors.code = "Please enter the complete 6-digit code"
            valid = false
        }
        if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters"
            valid = false
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
            valid = false
        }

        if (!valid) {
            setErrors(newErrors)
            return
        }

        setIsLoading(true)
        try {
            await submitNewPassword(email, code, password)
            // Clear old auth data from local storage
            clearAuthData()
            // Show success toaster and redirect to login
            toast({
                title: "Password Reset Successfully!",
                description: "Please log in with your new password.",
                variant: "success",
            })
            // Add a small delay to ensure toaster is shown before redirect
            setTimeout(() => {
                navigateWithLoading("/login", "Redirecting to login...")
            }, 1000)
        } catch (error: any) {
            toast({
                title: "Password Reset Failed",
                description: error.message || "Failed to reset password. Please check your code and try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendCode = async () => {
        setIsResending(true)
        try {
            await sendResetCode(email)
            toast({
                title: "Reset Code Sent!",
                description: "A new reset code has been sent to your email.",
                variant: "success",
            })
            setShowTimer(true) // Reset timer when resending
        } catch (error: any) {
            toast({
                title: "Failed to Send Reset Code",
                description: error.message || "Failed to send reset code. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsResending(false)
        }
    }

    const handleTimerExpire = () => {
        setShowTimer(false)
        toast({
            title: "Code Expired",
            description: "The reset code has expired. Please request a new one.",
            variant: "destructive",
        })
    }

    return (
        <div className="w-full min-h-screen flex flex-col px-4 font-['Segoe_UI']">
            {/* Logo in top left corner */}
            <div className="absolute top-6 left-6 z-10">
                <div
                    className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => navigateWithLoading("/")}
                >
                    <div className="relative">
                        <Brain className="h-8 w-8 text-primary" />
                        <div className="absolute inset-0 h-8 w-8 bg-primary/20 rounded-full blur-md animate-pulse" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        ScholarAI
                    </span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-[450px] w-full">
                    <h1 className="text-3xl font-extrabold text-center mb-8 text-foreground drop-shadow-lg">
                        {step === 'enterEmail' ? "Forgot Password" : "Reset Your Password"}
                    </h1>
                    <div className="rounded-2xl p-8 w-[450px] flex flex-col shadow-2xl backdrop-blur-2xl border border-primary/30 bg-gradient-to-br from-background/20 via-background/10 to-primary/5 hover:shadow-primary/30 transition-shadow duration-300">
                        {step === 'enterEmail' ? (
                            <form onSubmit={handleEmailSubmit} className="flex flex-col flex-grow">
                                <p className="text-center text-foreground text-base mb-6">
                                    Enter your email and we'll send you a code to reset your password.
                                </p>
                                <InputField
                                    id="email"
                                    name="email"
                                    label="Email"
                                    type="email"
                                    placeholder="youremail@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={errors.email}
                                    required
                                />
                                {errors.form && <p className="text-red-400 text-sm mt-2">{errors.form}</p>}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-[60px] px-4 rounded-2xl font-['Segoe_UI'] font-semibold text-lg text-white shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                                >
                                    {isLoading ? "Sending Code..." : "Send Reset Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetSubmit} className="flex flex-col flex-grow space-y-4">
                                <p className="text-center text-foreground text-base mb-2">
                                    A reset code was sent to <strong>{email}</strong>. Please enter it below along with your new password.
                                </p>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-foreground mb-3 text-center">
                                        Reset Code
                                    </label>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            value={code}
                                            onChange={setCode}
                                            maxLength={6}
                                        />
                                    </div>
                                    {errors.code && (
                                        <p className="text-red-400 text-sm mt-2 text-center">{errors.code}</p>
                                    )}
                                </div>

                                {showTimer && (
                                    <div className="flex justify-center mb-4">
                                        <CountdownTimer
                                            initialMinutes={10}
                                            onExpire={handleTimerExpire}
                                            onResend={handleResendCode}
                                            isResending={isResending}
                                        />
                                    </div>
                                )}
                                <PasswordField
                                    id="password"
                                    name="password"
                                    label="New Password"
                                    placeholder="••••••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={errors.password}
                                    required
                                    showPassword={showPassword}
                                    toggleShowPassword={() => setShowPassword(p => !p)}
                                />
                                <PasswordField
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    placeholder="••••••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={errors.confirmPassword}
                                    required
                                    showPassword={showConfirmPassword}
                                    toggleShowPassword={() => setShowConfirmPassword(p => !p)}
                                />
                                {errors.form && <p className="text-red-400 text-sm mt-1">{errors.form}</p>}
                                <button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6 || password.length < 8 || password !== confirmPassword}
                                    className="w-full h-[60px] px-4 rounded-2xl font-['Segoe_UI'] font-semibold text-lg text-white shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                    <p className="text-center text-foreground text-base mt-6 font-['Segoe_UI']">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="relative inline-block text-foreground hover:text-primary transition-colors font-medium cursor-pointer underline decoration-foreground/50 hover:decoration-primary underline-offset-2"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

const styles = `
@keyframes fadeOut {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
}
`

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
}
