import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { GithubIcon } from '@/components/icons/GithubIcon'
import { initiateGithubLogin, handleGoogleSocialLogin, type SocialLoginResponse } from '@/lib/api/user-service'
import { useEffect, useRef } from 'react'

interface SocialLoginProps {
    className?: string
    onLoginSuccess?: (data: SocialLoginResponse) => void
    onLoginError?: (message: string) => void
}

export default function SocialLogin({ className = '', onLoginSuccess, onLoginError }: SocialLoginProps) {
    const googleButtonRef = useRef<HTMLDivElement>(null)
    const scriptLoaded = useRef(false)

    const handleGoogleCallback = async (response: any) => {
        console.log("Google credential response:", response)
        if (response.credential) {
            try {
                const result = await handleGoogleSocialLogin(response.credential)
                if (result.success) {
                    console.log('Google Login Successful', result)
                    if (onLoginSuccess) {
                        onLoginSuccess(result)
                    }
                } else {
                    console.error('Google Login Failed via API', result.message)
                    if (onLoginError) {
                        onLoginError(result.message || 'Google login failed')
                    }
                }
            } catch (error: any) {
                console.error('Google Login Exception', error)
                if (onLoginError) {
                    onLoginError(error.message || 'An unexpected error occurred during Google login')
                }
            }
        } else {
            console.error('Google Sign-In did not return a credential.')
            if (onLoginError) {
                onLoginError('Google Sign-In did not return a credential.')
            }
        }
    }

    useEffect(() => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

        if (!googleClientId) {
            console.error("Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.")
            if (onLoginError) onLoginError("Google login is not configured.")
            return
        }

        if (scriptLoaded.current) {
            return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
            scriptLoaded.current = true
            if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleCallback,
                        auto_select: false,
                        cancel_on_tap_outside: true,
                        context: 'signin',
                        ux_mode: 'popup'
                    })

                    // Render the hidden Google button
                    if (googleButtonRef.current) {
                        window.google.accounts.id.renderButton(googleButtonRef.current, {
                            theme: 'outline',
                            size: 'large',
                            type: 'standard',
                            shape: 'rectangular',
                            text: 'continue_with',
                            logo_alignment: 'left'
                        })
                    }
                } catch (error) {
                    console.error('Error initializing Google Sign-In:', error)
                    if (onLoginError) onLoginError("Failed to initialize Google Sign-In")
                }
            } else {
                console.error('Google GSI script loaded but window.google.accounts.id not available.')
                if (onLoginError) onLoginError("Failed to initialize Google Login.")
            }
        }
        script.onerror = () => {
            console.error("Failed to load Google GSI script.")
            if (onLoginError) onLoginError("Failed to load Google Sign-In script.")
        }
        document.head.appendChild(script)
    }, [onLoginError])

    const handleGithubLogin = async () => {
        await initiateGithubLogin()
    }

    const handleCustomGoogleLogin = () => {
        if (googleButtonRef.current) {
            // Find and click the hidden Google button
            const googleButton = googleButtonRef.current.querySelector('div[role="button"]') as HTMLElement
            if (googleButton) {
                googleButton.click()
            } else {
                console.error('Google button not found')
                if (onLoginError) onLoginError("Google Sign-In button not available")
            }
        } else {
            console.error('Google Sign-In not initialized')
            if (onLoginError) onLoginError("Google Sign-In not available")
        }
    }

    return (
        <div className={`flex flex-col items-center gap-y-4 ${className}`}>
            {/* Hidden Google button */}
            <div ref={googleButtonRef} className="hidden" />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-4 w-full px-4 sm:px-0">
                {/* Custom Google Button */}
                <button
                    onClick={handleCustomGoogleLogin}
                    aria-label="Continue with Google"
                    className="group relative w-full sm:w-[190px] max-w-[280px] h-[46px] sm:h-[46px] flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl text-white transition-all duration-300 overflow-hidden"
                >
                    {/* Subtle hover gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <GoogleIcon className="w-5 h-5 text-white relative z-10" />
                    <span className="font-semibold text-sm relative z-10">Google</span>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>

                {/* GitHub Button */}
                <button
                    onClick={handleGithubLogin}
                    aria-label="Continue with GitHub"
                    className="group relative w-full sm:w-[190px] max-w-[280px] h-[46px] sm:h-[46px] flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 border border-primary/40 shadow-lg shadow-primary/25 hover:shadow-xl text-white transition-all duration-300 overflow-hidden"
                >
                    {/* Subtle hover gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <GithubIcon className="w-5 h-5 text-white relative z-10" />
                    <span className="font-semibold text-sm relative z-10">GitHub</span>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
            </div>
        </div>
    )
}

declare global {
    interface Window {
        google: any
        handleGoogleCredentialResponse?: (response: any) => void
    }
}
