import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn class-merge helper used by the ui/* components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
