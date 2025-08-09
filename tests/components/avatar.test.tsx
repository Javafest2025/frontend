import React from "react";
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

describe("Avatar", () => {
    it("renders an avatar with fallback", () => {
        render(
            <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        );
        const fallback = screen.getByText("CN");
        expect(fallback).toBeInTheDocument();
    });

    it("renders an avatar with only fallback", () => {
        render(
            <Avatar>
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
        );
        const fallback = screen.getByText("JD");
        expect(fallback).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const { container } = render(
            <Avatar className="custom-class">
                <AvatarFallback>Test</AvatarFallback>
            </Avatar>
        );
        expect(container.firstChild).toHaveClass("custom-class");
    });
}); 