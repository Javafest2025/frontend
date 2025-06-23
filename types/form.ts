import { ChangeEvent } from "react"

export interface PasswordFieldProps {
    id: string
    name: string
    label: string
    placeholder?: string
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    error?: string
    required?: boolean
    showPassword?: boolean
    toggleShowPassword?: () => void
}

export interface CheckboxProps {
    id: string
    name: string
    label: string
    checked: boolean
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export interface InputFieldProps {
    id: string
    name: string
    label: string
    type?: string
    placeholder?: string
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    error?: string
    required?: boolean
} 