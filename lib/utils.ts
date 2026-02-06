import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkIfDataIsApplied(): boolean {
  // Placeholder implementation
  // Replace this with the actual logic to check if data is applied
  return false;
}
