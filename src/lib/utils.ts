import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert inches to a display string */
export function formatInches(value: number, precision = 2): string {
  return `${value.toFixed(precision)}"`;
}

/** Simple unique id generator for components */
export function createId(prefix = "c"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
