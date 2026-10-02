import { demoCnpjs } from "@/utils/demo-cnpj";

export function normalizeCnpjDigits(raw: string): string {
    return raw.replace(/\D/g, "");
}

export function formatCnpj(digits: string): string {
    const d = normalizeCnpjDigits(digits);
    if (d.length !== 14) return digits.trim();
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function calcDigit(numbers: number[], weights: number[]): number {
    const total = numbers.reduce((sum, n, i) => sum + n * weights[i], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(raw: string): boolean {
    const digits = normalizeCnpjDigits(raw);
    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
    const nums = digits.split("").map(Number);
    const first = calcDigit(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (first !== nums[12]) return false;
    const second = calcDigit(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return second === nums[13];
}

function legacyDemoCnpjIndex(raw: string): number | null {
    const digits = normalizeCnpjDigits(raw);
    if (digits.length !== 14 || digits.slice(2, 8) !== "345678" || digits.slice(8, 12) !== "0001") return null;
    const prefix = Number(digits.slice(0, 2));
    if (prefix < 12 || prefix > 29) return null;
    return prefix - 12;
}

/** Corrige CNPJs da demo com dígitos verificadores antigos (ex.: …/0001-89 → …/0001-58). */
export function normalizeCnpjForSave(raw: string): string {
    const digits = normalizeCnpjDigits(raw);
    if (digits.length === 14 && isValidCnpj(digits)) return formatCnpj(digits);
    const idx = legacyDemoCnpjIndex(raw);
    if (idx !== null && demoCnpjs[idx]) return demoCnpjs[idx];
    return maskCnpjInput(raw);
}

export function validateCnpj(raw: string): string | null {
    const normalized = normalizeCnpjForSave(raw);
    const digits = normalizeCnpjDigits(normalized);
    if (digits.length !== 14) return "CNPJ deve ter 14 dígitos.";
    if (!isValidCnpj(digits)) return "CNPJ inválido. Verifique os dígitos.";
    return null;
}

export function cnpjForSubmit(raw: string): string {
    return normalizeCnpjForSave(raw);
}

export function maskCnpjInput(raw: string): string {
    const d = normalizeCnpjDigits(raw).slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return formatCnpj(d);
}
