"use client"

import type { CheckboxProps } from "@/types/form"

export function Checkbox({ id, name, label, checked, onChange }: CheckboxProps) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded-md border-2 border-primary/60 bg-transparent appearance-none checked:bg-none
                  focus:ring-0 focus:ring-offset-0 cursor-pointer relative
                  before:content-[''] before:block before:w-full before:h-full
                  checked:before:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjk5NjUgMS4wNzY2NkwzLjk5NjQ4IDguMDc2NjZMMC45OTY0ODQgNS4wNzY2NiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] dark:checked:before:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjk5NjUgMS4wNzY2NkwzLjk5NjQ4IDguMDc2NjZMMC45OTY0ODQgNS4wNzY2NiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] 
                  checked:before:bg-no-repeat checked:before:bg-center"
      />
      <label htmlFor={id} className="ml-3 text-base text-foreground font-['Segoe_UI'] font-normal">
        {label}
      </label>
    </div>
  )
}

