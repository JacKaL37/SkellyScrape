"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: string[]
  setTags: (tags: string[]) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  badgeClassName?: string
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, tags, setTags, placeholder, inputClassName, badgeClassName, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Add tag on Enter or comma
      if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
        e.preventDefault()
        
        // Clean the input value (remove commas, multiple spaces)
        const cleanedValue = inputValue.trim().replace(/,/g, "").replace(/\s+/g, " ")
        
        // Check if tag already exists
        if (!tags.includes(cleanedValue) && cleanedValue) {
          setTags([...tags, cleanedValue])
          setInputValue("")
        }
      }
      
      // Remove last tag on Backspace if input is empty
      if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        e.preventDefault()
        const newTags = [...tags]
        newTags.pop()
        setTags(newTags)
      }
    }

    const removeTag = (indexToRemove: number) => {
      setTags(tags.filter((_, index) => index !== indexToRemove))
    }
    
    // Handle paste events with multiple items
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text")
      if (!pastedText) return
      
      // Check if pasted text has commas or newlines
      if (pastedText.includes(",") || pastedText.includes("\n")) {
        e.preventDefault()
        
        const newTags = pastedText
          .split(/[,\n]/)
          .map(tag => tag.trim())
          .filter(tag => tag && !tags.includes(tag))
        
        if (newTags.length > 0) {
          setTags([...tags, ...newTags])
        }
      }
    }

    return (
      <div 
        className={cn(
          "flex flex-wrap gap-2 rounded-md border border-input bg-background p-1 items-center",
          className
        )}
      >
        {tags.map((tag, index) => (
          <Badge 
            key={`${tag}-${index}`}
            variant="secondary"
            className={cn("flex items-center gap-1 text-lg", badgeClassName)}
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(index)}
              className="text-muted-foreground hover:text-foreground rounded-full"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : undefined}
          className={cn("flex-1 border-0 p-0 placeholder:text-muted-foreground focus-visible:ring-0", inputClassName)}
          {...props}
        />
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }