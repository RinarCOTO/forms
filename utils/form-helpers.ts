// Utility functions for form logic

export type FormattableValue = string | number | undefined | null;

/**
 * Generate an array of years from startYear to current year (descending).
 */
export function generateYears(startYear = 1900): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
}

/**
 * Generate ascending effectivity years from a fixed start year through a future offset.
 */
export function generateEffectivityYears(startYear = 2001, futureYears = 10): number[] {
  const endYear = new Date().getFullYear() + futureYears;
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Calculate age based on input year.
 */
export function calculateAge(year: number): number | string {
  const currentYear = new Date().getFullYear();
  if (!year || year > currentYear) return 0;
  if (year === currentYear) return "NEW";
  return currentYear - year;
}

/**
 * Sum an array of numbers (ignores non-numeric values).
 */
export function calculateTotalFloorArea(areas: (number | string)[]): number {
  const sum = areas.reduce((acc: number, val) => {
    const num = typeof val === "number" ? val : parseFloat(val);
    return !isNaN(num) ? acc + num : acc;
  }, 0);
  return Math.round(sum * 100) / 100;
}

export function formatDisplayValue(value: FormattableValue): string {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

export function hasDisplayValue(value: FormattableValue): boolean {
  return formatDisplayValue(value).trim().length > 0;
}

export function formatValueWhenPresent(value: FormattableValue, requiredValue: FormattableValue): string {
  return hasDisplayValue(requiredValue) ? formatDisplayValue(value) : "";
}

export function formatNumberWithCommas(value: FormattableValue): string {
  if (value === undefined || value === null || value === "") return "";
  const raw = String(value).replace(/,/g, "");
  const number = Number(raw);
  if (!Number.isFinite(number)) return String(value);
  const decimals = raw.includes(".") ? raw.split(".")[1]?.length ?? 0 : 0;
  return number.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrencyAmount(value: FormattableValue): string {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) return "";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAssessmentLevel(value: FormattableValue): string {
  const text = formatDisplayValue(value);
  if (!text) return "";
  return text.includes("%") ? text : `${text}%`;
}

export function formatTaxDeclarationDate(value: string | undefined | null): string {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const month = date.getMonth() + 1;
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function formatBuildingActualUse(value: FormattableValue): string {
  const text = formatDisplayValue(value).trim();
  if (!text) return "";
  if (text === "Residential Houses") return "Residential";
  if (text.startsWith("Commercial - ")) return "Commercial";
  return text;
}

export function numberToWords(value: number): string {
  let num = Math.floor(Math.abs(value));
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertHundreds(n: number): string {
    let result = "";
    if (n >= 100) {
      result += `${ones[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      result += `${teens[n - 10]} `;
    } else {
      if (n >= 20) {
        result += `${tens[Math.floor(n / 10)]} `;
        n %= 10;
      }
      if (n > 0) result += `${ones[n]} `;
    }
    return result.trim();
  }

  let words = "";
  let scale = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertHundreds(chunk);
      words = chunkWords + (thousands[scale] ? ` ${thousands[scale]}` : "") + (words ? ` ${words}` : "");
    }
    num = Math.floor(num / 1000);
    scale++;
  }

  return words.trim();
}
