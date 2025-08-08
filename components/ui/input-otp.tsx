"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, value, onChange, maxLength = 6, ...props }, ref) => {
  // Create a custom render function that doesn't rely on slots
  const customRender = ({ slots }: { slots: any[] }) => {
    const inputValue = value || ""
    const digits = inputValue.split("").slice(0, maxLength)

    return (
      <div className={cn("flex items-center gap-3", containerClassName)}>
        {Array.from({ length: maxLength }, (_, index) => {
          const digit = digits[index] || ""
          const isActive = index === inputValue.length

          return (
            <div
              key={index}
              className={cn(
                "relative flex h-14 w-12 items-center justify-center border-2 border-primary/30 bg-gradient-to-br from-background/40 via-background/20 to-primary/10 backdrop-blur-sm text-lg font-semibold text-foreground shadow-lg shadow-primary/10 transition-all duration-300 rounded-xl hover:border-primary/50 hover:shadow-primary/20 cursor-text",
                isActive && "z-10 border-primary shadow-primary/30 ring-2 ring-primary/20 animate-otp-pulse",
                digit && "border-primary bg-primary/10"
              )}
              onClick={() => {
                if (ref && typeof ref === 'object' && ref.current) {
                  ref.current.focus()
                }
              }}
            >
              {digit && (
                <span className="text-lg font-semibold text-foreground">{digit}</span>
              )}
              {!digit && isActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-px animate-caret-blink bg-primary duration-1000" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-3 has-[:disabled]:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      render={customRender}
      {...props}
    />
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-3", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    index: number;
    char?: string;
    hasFakeCaret?: boolean;
    isActive?: boolean;
    placeholderChar?: string;
  }
>(({
  index,
  className,
  char: propChar,
  hasFakeCaret: propHasFakeCaret,
  isActive: propIsActive,
  placeholderChar,
  ...props
}, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)

  if (!inputOTPContext || !inputOTPContext.slots || !inputOTPContext.slots[index]) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-14 w-12 items-center justify-center border-2 border-primary/30 bg-gradient-to-br from-background/40 via-background/20 to-primary/10 backdrop-blur-sm text-lg font-semibold text-foreground shadow-lg shadow-primary/10 transition-all duration-300 rounded-xl",
          className
        )}
        {...props}
      />
    )
  }

  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  // Get the character from the context value directly
  const contextValue = inputOTPContext.value || ""
  const displayChar = contextValue[index] || char

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-14 w-12 items-center justify-center border-2 border-primary/30 bg-gradient-to-br from-background/40 via-background/20 to-primary/10 backdrop-blur-sm text-lg font-semibold text-foreground shadow-lg shadow-primary/10 transition-all duration-300 rounded-xl hover:border-primary/50 hover:shadow-primary/20 cursor-text",
        isActive && "z-10 border-primary shadow-primary/30 ring-2 ring-primary/20 animate-otp-pulse",
        displayChar && "border-primary bg-primary/10",
        className
      )}
      onClick={() => {
        if (inputOTPContext?.focus) {
          inputOTPContext.focus()
        }
      }}
      {...props}
    >
      {displayChar && (
        <span className="text-lg font-semibold text-foreground">{displayChar}</span>
      )}
      {!displayChar && isActive && hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-primary duration-1000" />
        </div>
      )}
      {!displayChar && !isActive && placeholderChar && (
        <span className="text-foreground/30">{placeholderChar}</span>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
