"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { InputField } from "@/components/form/InputField"
import { PasswordField } from "@/components/form/PasswordField"
import { sendResetCode, submitNewPassword, clearAuthData } from "@/lib/api"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"
import Link from "next/link"

// Reusing MouseGlitter and styles from other auth forms for consistency
const MouseGlitter = () => {
    const [particles, setParticles] = useState<Array<{ x: number; y: number; id: string }>>([])
    const handleMouseMove = useCallback((e: MouseEvent) => {
        setParticles(prev => {
            const newParticles = [...prev, {
                x: e.clientX,
                y: e.clientY,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }]
            return newParticles.slice(-20)
        })
    }, [])
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [handleMouseMove])
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-600"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        transform: 'translate(-50%, -50%)',
                        animation: 'fadeOut 1s forwards',
                        boxShadow: '0 0 12px hsl(var(--primary) / 0.6), 0 0 24px hsl(var(--primary) / 0.3)',
                    }}
                />
            ))}
        </div>
    )
}

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
    const { navigateWithLoading } = useNavigationWithLoading()

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
            setStep('resetPassword')
        } catch (error: any) {
            setErrors(prev => ({ ...prev, form: error.message || "Failed to send reset code. Please try again." }))
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
            // On success, redirect to login with a success message
            navigateWithLoading("/login?reset=success", "Redirecting to login...")
        } catch (error: any) {
            setErrors(prev => ({ ...prev, form: error.message || "Failed to reset password. Please check your code and try again." }))
        } finally {
            setIsLoading(false)
        }
    }
    
    return (
        <div className="w-full min-h-screen flex flex-col px-4 font-['Segoe_UI']">
            <MouseGlitter />
            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-[450px] w-full">
                     <h1 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent drop-shadow-lg">
                        {step === 'enterEmail' ? "Forgot Password" : "Reset Your Password"}
                    </h1>
                    <div className="rounded-2xl p-8 w-[450px] flex flex-col shadow-2xl backdrop-blur-2xl border border-primary/30 bg-gradient-to-br from-background/20 via-background/10 to-primary/5 hover:shadow-primary/30 transition-shadow duration-300">
                        {step === 'enterEmail' ? (
                            <form onSubmit={handleEmailSubmit} className="flex flex-col flex-grow">
                                <p className="text-center text-primary/50 text-base mb-6">
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
                                <p className="text-center text-primary/50 text-base mb-2">
                                    A reset code was sent to <strong>{email}</strong>. Please enter it below along with your new password.
                                </p>
                                <InputField
                                    id="code"
                                    name="code"
                                    label="Reset Code"
                                    type="text"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    error={errors.code}
                                    required
                                />
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
                                    disabled={isLoading}
                                    className="w-full h-[60px] px-4 rounded-2xl font-['Segoe_UI'] font-semibold text-lg text-white shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                     <p className="text-center text-primary/50 text-base mt-6 font-['Segoe_UI']">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="relative inline-block text-primary/80 hover:text-primary transition-colors font-medium cursor-pointer underline decoration-primary/50 hover:decoration-primary underline-offset-2"
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
