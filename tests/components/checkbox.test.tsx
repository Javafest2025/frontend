import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Checkbox } from "@/components/ui/checkbox"

describe("Checkbox", () => {
    it("can be checked and unchecked", () => {
        const { getByRole } = render(<Checkbox id="test-checkbox" />)
        const checkbox = getByRole("checkbox")

        expect(checkbox).not.toBeChecked()
        fireEvent.click(checkbox)
        expect(checkbox).toBeChecked()
        fireEvent.click(checkbox)
        expect(checkbox).not.toBeChecked()
    })

    it("is disabled when prop is passed", () => {
        render(<Checkbox id="test-checkbox-disabled" disabled />)
        const checkbox = screen.getByRole("checkbox")
        expect(checkbox).toBeDisabled()
    })
}) 