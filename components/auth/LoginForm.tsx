"use client"

import type React from "react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { InputField } from "@/components/form/InputField"
import { PasswordField } from "@/components/form/PasswordField"
import { Checkbox } from "@/components/form/Checkbox"
import { AUTH_CONSTANTS } from "@/constants/auth"
import { login, type SocialLoginResponse } from "@/lib/api/user-service"
import type { LoginFormData } from "@/types/auth"
import SocialLogin from "./SocialLogin"
import { useAuth } from "@/hooks/useAuth"
import { useNavigationWithLoading } from "@/components/ui/RouteTransition"
import { Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"



export function LoginForm() {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    })

    const [errors, setErrors] = useState({ email: "", password: "" })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const searchParams = useSearchParams()
    const { updateAuthState } = useAuth()
    const { navigateWithLoading } = useNavigationWithLoading()
    const { toast } = useToast()

    /* ────────────────────────────────────────────────────────── */
    /*  Handlers                                                 */
    /* ────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (searchParams.get("session") === "expired") {
            toast({
                title: "Session Expired",
                description: "Your session has expired. Please log in again to continue.",
                variant: "destructive",
            })
            // Clear the URL parameter to prevent showing again on reload
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("session")
            window.history.replaceState({}, "", newUrl.toString())
        }
        if (searchParams.get("signup") === "success") {
            toast({
                title: "Account Created Successfully!",
                description: "Please log in with your credentials.",
                variant: "success",
            })
            // Clear the URL parameter to prevent showing again on reload
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("signup")
            window.history.replaceState({}, "", newUrl.toString())
        }
        if (searchParams.get("reset") === "success") {
            toast({
                title: "Password Reset Successfully!",
                description: "Please log in with your new password.",
                variant: "success",
            })
            // Clear the URL parameter to prevent showing again on reload
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("reset")
            window.history.replaceState({}, "", newUrl.toString())
        }
    }, [searchParams, toast])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
        if (errors[name as keyof typeof errors]) setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    const toggleShowPassword = () => setShowPassword((prev) => !prev)

    const validateForm = (): boolean => {
        let valid = true
        const newErrors = { ...errors }

        if (!formData.email) {
            newErrors.email = "Email is required"
            valid = false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email"
            valid = false
        }

        if (!formData.password) {
            newErrors.password = "Password is required"
            valid = false
        }

        setErrors(newErrors)
        return valid
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        console.log('Form submission started')
        console.log('Submitting with email:', formData.email)
        console.log('Submitting with password length:', formData.password.length)

        try {
            const response = await login(formData)
            console.log('Login response received:', response)

            if (response.success && response.token && response.user) {
                console.log('Login successful, storing token and redirecting')

                localStorage.setItem("scholarai_token", response.token)
                localStorage.setItem("scholarai_user", JSON.stringify(response.user))
                // Update auth state
                updateAuthState(response.token, response.user)
                toast({
                    title: "Login Successful!",
                    description: "Redirecting to dashboard...",
                    variant: "success",
                })
                
                // Check if user is admin and redirect accordingly
                const userRole = response.user.roles?.[0];
                if (userRole === 'ADMIN') {
                    console.log('Admin user detected, redirecting to admin dashboard')
                    navigateWithLoading("/admin", "Accessing admin dashboard...")
                } else {
                    navigateWithLoading("/interface/home", "Accessing neural network...")
                }
            }
            else if (response.requiresEmailVerification) {
                console.log('Email verification required, redirecting to verification page')
                toast({
                    title: "Email Verification Required",
                    description: response.message || "Please verify your email before logging in.",
                    variant: "destructive",
                })
                // Redirect to email verification page
                setTimeout(() => {
                    navigateWithLoading(`/verify-email?email=${encodeURIComponent(response.email || formData.email)}`, "Redirecting to email verification...")
                }, 1000)
            }
            else {
                console.error('Login failed:', response)
                // Set password error for form validation
                setErrors(prev => ({ ...prev, password: response.message || "Invalid email or password" }))
                toast({
                    title: "Login Failed",
                    description: response.message || "Invalid email or password. Please check your credentials and try again.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Login error:", error)
            // Set password error for network errors
            setErrors(prev => ({ ...prev, password: "An error occurred. Please check your internet connection and try again." }))
            toast({
                title: "Login Failed",
                description: "An error occurred. Please check your internet connection and try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialLoginSuccess = (data: SocialLoginResponse) => {
        console.log("Social login success in LoginForm:", data)
        if (data.success && data.token && data.user) {
            console.log("Setting localStorage and updating auth state......")
            localStorage.setItem("scholarai_token", data.token)
            localStorage.setItem("scholarai_user", JSON.stringify(data.user))
            updateAuthState(data.token, data.user)
            toast({
                title: "Login Successful!",
                description: "Redirecting to dashboard...",
                variant: "success",
            })

            // Add a small delay to ensure auth state is updated before navigation
            setTimeout(() => {
                console.log("Navigating...")
                // Check if user is admin and redirect accordingly
                const userRole = data.user?.roles?.[0];
                if (userRole === 'ADMIN') {
                    console.log('Admin user detected, redirecting to admin dashboard')
                    navigateWithLoading('/admin', "Accessing admin dashboard...")
                } else {
                    navigateWithLoading('/interface/home', "Accessing neural network...")
                }
            }, 100)
        } else {
            // Handle cases where social login API might return success:false but was handled as success by SocialLogin
            toast({
                title: "Login Failed",
                description: data.message || "Social login failed. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleSocialLoginError = (message: string) => {
        console.error("Social login error in LoginForm:", message)
        toast({
            title: "Login Failed",
            description: message || "An error occurred during social login. Please try again.",
            variant: "destructive",
        })
    }

    /* ────────────────────────────────────────────────────────── */
    /*  JSX                                                      */
    /* ────────────────────────────────────────────────────────── */
    return (
        <div className="w-full min-h-screen flex flex-col px-4 sm:px-6 md:px-8 font-['Segoe_UI']">
            {/* Logo in top left corner */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                <button
                    type="button"
                    className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:scale-105 transition-transform duration-200 bg-transparent border-none p-0"
                    onClick={() => navigateWithLoading("/")}
                    aria-label="Go to home page"
                >
                    <div className="relative">
                        <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        <div className="absolute inset-0 h-6 w-6 sm:h-8 sm:w-8 bg-primary/20 rounded-full blur-md animate-pulse" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        ScholarAI
                    </span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center py-8 sm:py-12">
                <div className="max-w-[450px] w-full">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 sm:mb-8 text-foreground drop-shadow-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent px-4">
                        {AUTH_CONSTANTS.loginTitle}
                    </h1>





                    {/* ----------  ENHANCED GLASS CARD ---------- */}
                    <div
                        className="rounded-2xl p-6 sm:p-8 md:p-10 w-full sm:w-[450px] min-h-[450px] sm:min-h-[500px] flex flex-col shadow-2xl backdrop-blur-2xl border-2 border-primary/50 bg-gradient-to-br from-background/80 via-background/70 to-background/60 hover:shadow-primary/40 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Enhanced background overlay for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/30 to-background/20 rounded-2xl"></div>

                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 rounded-2xl"></div>

                        {/* Content with higher z-index */}
                        <div className="relative z-10">
                            <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                                <div className="space-y-4 sm:space-y-5">
                                    <InputField
                                        id="email"
                                        name="email"
                                        label="Email"
                                        type="email"
                                        placeholder="youremail@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email}
                                        required
                                    />

                                    <PasswordField
                                        id="password"
                                        name="password"
                                        label="Password"
                                        placeholder="••••••••••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={errors.password}
                                        required
                                        showPassword={showPassword}
                                        toggleShowPassword={toggleShowPassword}
                                    />

                                    <div className="flex items-center justify-between text-sm sm:text-base text-foreground mb-6 sm:mb-8">
                                        <Checkbox
                                            id="rememberMe"
                                            name="rememberMe"
                                            label={AUTH_CONSTANTS.rememberMe}
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                        />

                                        <Link
                                            href="/forgot-password"
                                            className="text-foreground hover:text-primary/80 transition-colors font-['Segoe_UI'] underline underline-offset-2 text-xs sm:text-sm whitespace-nowrap"
                                        >
                                            {AUTH_CONSTANTS.forgotPassword}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex-grow"></div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-[56px] sm:h-[64px] md:h-[70px] px-4 rounded-xl sm:rounded-2xl font-['Segoe_UI'] font-semibold text-base sm:text-lg text-white shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-6 sm:mt-8"
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
                                            <span className="font-['Segoe_UI']">Logging in...</span>
                                        </>
                                    ) : (
                                        <span className="font-['Segoe_UI']">{AUTH_CONSTANTS.loginButton}</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12 text-center">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                            <div className="h-[1px] bg-foreground/30 flex-1 max-w-[100px] sm:max-w-[160px]"></div>
                            <span className="text-foreground text-sm sm:text-base font-['Segoe_UI'] whitespace-nowrap px-2">or connect with</span>
                            <div className="h-[1px] bg-foreground/30 flex-1 max-w-[100px] sm:max-w-[160px]"></div>
                        </div>
                        <SocialLogin onLoginSuccess={handleSocialLoginSuccess} onLoginError={handleSocialLoginError} />
                    </div>

                    <p className="text-center text-foreground text-sm sm:text-base mt-6 sm:mt-8 font-['Segoe_UI'] px-4">
                        {AUTH_CONSTANTS.noAccount}{" "}
                        <Link
                            href="/signup"
                            className="relative inline-block text-foreground hover:text-primary transition-colors font-medium cursor-pointer underline decoration-foreground/50 hover:decoration-primary underline-offset-2"
                        >
                            {AUTH_CONSTANTS.signUpLink}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

const styles = `
@keyframes glitery {
    0% {
        text-shadow: 0 0 4px #7CE495, 0 0 8px #7CE495;
    }
    25% {
        text-shadow: 0 0 8px #7CE495, 0 0 16px #7CE495;
    }
    50% {
        text-shadow: 0 0 4px #7CE495, 0 0 8px #7CE495;
    }
    75% {
        text-shadow: 0 0 8px #7CE495, 0 0 16px #7CE495;
    }
    100% {
        text-shadow: 0 0 4px #7CE495, 0 0 8px #7CE495;
    }
}

.glitery-text {
    animation: glitery 2s infinite;
    position: relative;
}

.glitery-text::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, transparent, rgba(124, 228, 149, 0.2), transparent);
    animation: glitery 2s infinite;
    z-index: -1;
    border-radius: 4px;
}

@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}

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
