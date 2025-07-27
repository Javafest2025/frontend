import React from "react"
import { render, screen } from "@testing-library/react"
import { useIsMobile } from "@/hooks/use-mobile"

function TestComponent() {
    const isMobile = useIsMobile()
    return <span data-testid="status">{isMobile ? "mobile" : "desktop"}</span>
}

describe("useIsMobile", () => {
    const originalMatchMedia = window.matchMedia

    beforeAll(() => {
        // polyfill matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (query: string) => {
                return {
                    matches: window.innerWidth < 768,
                    media: query,
                    onchange: null,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    addListener: jest.fn(), // deprecated
                    removeListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                }
            },
        })
    })

    afterAll(() => {
        window.matchMedia = originalMatchMedia
    })

    it("returns true when window width is below breakpoint", () => {
        Object.defineProperty(window, "innerWidth", { writable: true, value: 500 })
        render(<TestComponent />)
        expect(screen.getByTestId("status").textContent).toBe("mobile")
    })

    it("returns false when window width is above breakpoint", () => {
        Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 })
        render(<TestComponent />)
        expect(screen.getByTestId("status").textContent).toBe("desktop")
    })
}) 