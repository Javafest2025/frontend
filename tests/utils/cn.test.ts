import { cn } from "@/lib/utils/cn"

describe("cn utility", () => {
    it("merges class names into a single string", () => {
        expect(cn("foo", "bar")).toBe("foo bar")
    })

    it("ignores falsy values", () => {
        expect(cn("foo", null as any, undefined as any, false as any, "bar")).toBe(
            "foo bar"
        )
    })

    it("deduplicates tailwind classes, preferring the last occurrence", () => {
        expect(cn("p-2", "p-4")).toBe("p-4")
    })
}) 