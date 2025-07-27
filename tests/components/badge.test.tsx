import React from "react"
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"

describe("Badge", () => {
    it("renders its children", () => {
        render(<Badge>New</Badge>)
        expect(screen.getByText("New")).toBeInTheDocument()
    })

    it("applies secondary variant styles", () => {
        const { container } = render(<Badge variant="secondary">Beta</Badge>)
        expect(container.firstChild).toHaveClass("bg-secondary")
    })

    it("applies destructive variant styles", () => {
        const { container } = render(<Badge variant="destructive">Warning</Badge>)
        expect(container.firstChild).toHaveClass("bg-destructive")
    })

    it("applies outline variant styles", () => {
        const { container } = render(<Badge variant="outline">Info</Badge>)
        expect(container.firstChild).toHaveClass("text-foreground")
    })
}) 