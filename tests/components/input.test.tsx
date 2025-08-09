import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Input } from "@/components/ui/input"

describe("Input", () => {
  it("renders and accepts text", () => {
    render(<Input data-testid="test-input" />)
    const inputElement = screen.getByTestId("test-input") as HTMLInputElement
    
    fireEvent.change(inputElement, { target: { value: "Hello, world!" } })
    
    expect(inputElement.value).toBe("Hello, world!")
  })

  it("can be disabled", () => {
    render(<Input data-testid="test-input-disabled" disabled />)
    const inputElement = screen.getByTestId("test-input-disabled")
    
    expect(inputElement).toBeDisabled()
  })
}) 