import { getPageTitle } from "@/lib/utils/navigation"

describe("getPageTitle", () => {
    it("maps known paths to titles", () => {
        expect(getPageTitle("/interface/dashboard")).toBe("Dashboard")
        expect(getPageTitle("/interface/library/doc123")).toBe("Library")
    })

    it("returns 'Home' for root path", () => {
        expect(getPageTitle("/")).toBe("Home")
    })

    it("returns default title for unknown path", () => {
        expect(getPageTitle("/some/unknown/path")).toBe("ScholarAI")
    })
}) 