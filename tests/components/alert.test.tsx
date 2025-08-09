import React from "react"
import { render, screen } from "@testing-library/react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

describe("Alert", () => {
    it("renders with title and description", () => {
        render(
            <Alert>
                <AlertTitle>Test Title</AlertTitle>
                <AlertDescription>Test description.</AlertDescription>
            </Alert>
        )

        expect(screen.getByText("Test Title")).toBeInTheDocument()
        expect(screen.getByText("Test description.")).toBeInTheDocument()
    })

    it("applies destructive variant styles", () => {
        const { container } = render(
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
            </Alert>
        )
        expect(container.firstChild).toHaveClass("border-destructive/50")
    })
}) 