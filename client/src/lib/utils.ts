import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// clsx is used for merging class names conditionally

// standard utility function for merging class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
