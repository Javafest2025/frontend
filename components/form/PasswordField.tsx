"use client"

import type { PasswordFieldProps } from "@/types/form"
import { Eye, EyeOff } from "lucide-react"

export function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  showPassword,
  toggleShowPassword,
}: PasswordFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-foreground font-['Segoe_UI'] text-sm pl-8 mb-2 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full h-16 border border-primary/30 rounded-2xl px-8 pr-14 text-foreground text-xl
                   placeholder:text-foreground/80 focus:outline-none focus:border-primary/60 font-['Segoe_UI']
                   backdrop-blur-md shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.10) 50%, rgba(168, 85, 247, 0.15) 100%)',
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 4px 32px 0 rgba(99, 102, 241, 0.15)'
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => toggleShowPassword?.()} // <-- call the function safely
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-primary/70 hover:text-primary transition-colors duration-200"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-400 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

