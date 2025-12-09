// Utilidades de formatacao de datas e valores usados na UI

// formata "2025-12-05" -> "05/12/2025"
export function formatDate(date: string): string {
  const onlyDate = date.substring(0, 10); // garante YYYY-MM-DD
  const [year, month, day] = onlyDate.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

// Mantem input no formato DD/MM/YYYY enquanto digita
export function sanitizeDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8); // DDMMYYYY
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

export function displayToIso(date: string): string | null {
  const [day, month, year] = date.split("/");
  if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
    return `${year}-${month}-${day}`;
  }
  return null;
}

export function isoToDisplay(iso: string): string {
  const onlyDate = iso.substring(0, 10);
  const [year, month, day] = onlyDate.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return iso;
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function formatCurrencyFromNumber(value: number): string {
  if (typeof value !== "number") return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
