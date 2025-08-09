import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
    it("renders with a placeholder", () => {
        render(<Textarea placeholder="Test placeholder" />);
        const textarea = screen.getByPlaceholderText("Test placeholder");
        expect(textarea).toBeInTheDocument();
    });

    it("allows typing", () => {
        render(<Textarea placeholder="Test placeholder" />);
        const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>("Test placeholder");
        fireEvent.change(textarea, { target: { value: "Hello, world!" } });
        expect(textarea.value).toBe("Hello, world!");
    });

    it("applies custom className", () => {
        const { container } = render(<Textarea className="custom-class" />);
        expect(container.querySelector("textarea")).toHaveClass("custom-class");
    });

    it("is disabled when the disabled prop is true", () => {
        render(<Textarea disabled />);
        const textarea = screen.getByRole("textbox");
        expect(textarea).toBeDisabled();
    });
}); 