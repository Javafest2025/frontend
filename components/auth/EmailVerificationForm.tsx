"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { InputField } from "@/components/form/InputField"
import { verifyEmailWithCode, sendEmailVerificationCode } from "@/lib/api/user-service"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"
import { Brain } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { useEffect, useRef } from "react"

interface EmailVerificationFormProps {
    email: string;
}

export function EmailVerificationForm({ email }: EmailVerificationFormProps) {
    const [code, setCode] = useState("")
    const [errors, setErrors] = useState({ code: "", form: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [showTimer, setShowTimer] = useState(true)
    const otpRef = useRef<any>(null)
    const { navigateWithLoading } = useNavigationWithLoading()
    const { toast } = useToast()

    // Auto-focus the OTP input when component mounts
    useEffect(() => {
        if (otpRef.current) {
            setTimeout(() => {
                otpRef.current?.focus()
            }, 100)
        }
    }, [])

    const handleOTPChange = (value: string) => {
        setCode(value)
        setErrors(prev => ({ ...prev, code: "" }))
    }

    const handleOTPContainerClick = () => {
        if (otpRef.current) {
            otpRef.current.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrors({ code: "", form: "" })

        if (!code) {
            setErrors(prev => ({ ...prev, code: "Verification code is required" }))
            return
        }

        if (code.length !== 6) {
            setErrors(prev => ({ ...prev, code: "Please enter the complete 6-digit code" }))
            return
        }

        setIsLoading(true)
        try {
            await verifyEmailWithCode(email, code)
            toast({
                title: "Email Verified Successfully!",
                description: "Your account has been verified. You can now log in.",
                variant: "success",
            })
            // Add a small delay to ensure toaster is shown before redirect
            setTimeout(() => {
                navigateWithLoading("/login", "Redirecting to login...")
            }, 1000)
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message || "Failed to verify email. Please check your code and try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendCode = async () => {
        setIsResending(true)
        try {
            await sendEmailVerificationCode(email)
            toast({
                title: "Verification Code Sent!",
                description: "A new verification code has been sent to your email.",
                variant: "success",
            })
            setShowTimer(true) // Reset timer when resending
        } catch (error: any) {
            toast({
                title: "Failed to Send Code",
                description: error.message || "Failed to send verification code. Please try again.",
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
            description: "The verification code has expired. Please request a new one.",
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
                        Verify Your Email
                    </h1>
                    <div className="rounded-2xl p-8 w-[450px] flex flex-col shadow-2xl backdrop-blur-2xl border border-primary/30 bg-gradient-to-br from-background/20 via-background/10 to-primary/5 hover:shadow-primary/30 transition-shadow duration-300">
                        <p className="text-center text-foreground text-base mb-6">
                            We've sent a verification code to <strong>{email}</strong>. Please enter it below to verify your account.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground mb-3 text-center">
                                    Verification Code
                                </label>
                                <div
                                    className="flex justify-center cursor-text"
                                    onClick={handleOTPContainerClick}
                                >
                                    <InputOTP
                                        ref={otpRef}
                                        value={code}
                                        onChange={handleOTPChange}
                                        maxLength={6}
                                    />
                                </div>
                                {errors.code && (
                                    <p className="text-red-400 text-sm mt-2 text-center">{errors.code}</p>
                                )}
                            </div>

                            {errors.form && <p className="text-red-400 text-sm mt-2 text-center">{errors.form}</p>}

                            <button
                                type="submit"
                                disabled={isLoading || code.length !== 6}
                                className="w-full h-[60px] px-4 rounded-2xl font-['Segoe_UI'] font-semibold text-lg text-white shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-6 w-6 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        <span className="font-['Segoe_UI']">Verifying...</span>
                                    </>
                                ) : (
                                    <span className="font-['Segoe_UI']">Verify Email</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            {showTimer && (
                                <div className="mb-4">
                                    <CountdownTimer
                                        initialMinutes={10}
                                        onExpire={handleTimerExpire}
                                        onResend={handleResendCode}
                                        isResending={isResending}
                                    />
                                </div>
                            )}
                            {!showTimer && (
                                <div className="mb-4">
                                    <p className="text-foreground text-sm mb-4">
                                        Didn't receive the code?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={isResending}
                                        className="text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer underline decoration-primary/50 hover:decoration-primary underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isResending ? "Sending..." : "Resend Code"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-foreground text-base mt-6 font-['Segoe_UI']">
                        Already verified?{" "}
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
