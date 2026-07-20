import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * FormSelect — custom dropdown to replace native HTML <select>.
 * Renders cleanly and consistently on mobile (iOS-like) and desktop.
 *
 * options: [{ value: string, label: string }]
 */
export default function FormSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecionar...",
  triggerClassName = "",
  contentClassName = "",
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={`z-[12050] ${contentClassName}`}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}