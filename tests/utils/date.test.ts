import { formatDate } from "@/lib/utils/date"

describe("formatDate", () => {
    it("formats ISO date strings to a readable US date", () => {
        const result = formatDate("2020-04-15T12:00:00Z")
        expect(result).toBe("Apr 15, 2020")
    })
}) 