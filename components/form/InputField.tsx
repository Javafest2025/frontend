"use client"

import type { InputFieldProps } from "@/types/form"

export function InputField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
}: InputFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-foreground font-['Segoe_UI'] text-sm pl-8 mb-2 font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-16 border border-primary/30 rounded-2xl px-8 text-foreground text-xl
                 placeholder:text-foreground/80 focus:outline-none focus:border-primary/60 font-['Segoe_UI']
                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                 autofill:bg-none dark:autofill:bg-none
                 [-webkit-background-clip:text] [background-clip:text]
                 [&:-webkit-autofill]:[-webkit-background-clip:text] 
                 [&:-webkit-autofill]:[-webkit-text-fill-color:currentColor]
                 [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]
                 [&:-webkit-autofill]:border-primary/60
                 dark:[color-scheme:dark] backdrop-blur-md shadow-lg"
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
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-400 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

