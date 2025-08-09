import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
    it("renders its children", () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole("button", { name: /click me/i })
        expect(button).toBeInTheDocument()
    })

    it("calls onClick when clicked", () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Press</Button>)
        fireEvent.click(screen.getByRole("button", { name: /press/i }))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })
}) 