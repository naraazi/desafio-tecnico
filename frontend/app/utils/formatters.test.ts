import {
  displayToIso,
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatDate,
  isoToDisplay,
  parseCurrency,
  sanitizeDateInput,
} from "./formatters";

describe("formatters", () => {
  it("formata datas para display e iso", () => {
    expect(formatDate("2025-12-05")).toBe("05/12/2025");
    expect(isoToDisplay("2025-01-02")).toBe("02/01/2025");
    expect(displayToIso("02/01/2025")).toBe("2025-01-02");
    expect(displayToIso("02/01/25")).toBeNull();
  });

  it("sanitizeDateInput mantém máscara enquanto digita", () => {
    expect(sanitizeDateInput("1")).toBe("1");
    expect(sanitizeDateInput("1203")).toBe("12/03");
    expect(sanitizeDateInput("12032025")).toBe("12/03/2025");
    expect(sanitizeDateInput("12/03/2025 extra")).toBe("12/03/2025");
  });

  it("formata moeda para input e parseia para número", () => {
    expect(formatCurrencyInput("1234")).toBe("12,34");
    expect(formatCurrencyInput("123456")).toBe("1.234,56");
    expect(formatCurrencyInput("")).toBe("");
    expect(parseCurrency("1.234,56")).toBe(1234.56);
    expect(parseCurrency("10,00")).toBe(10);
  });

  it("formata número para moeda pt-BR", () => {
    expect(formatCurrencyFromNumber(1500)).toBe("1.500,00");
    expect(formatCurrencyFromNumber(0)).toBe("0,00");
    expect(formatCurrencyFromNumber(Number.NaN as unknown as number)).toBe("");
  });
});
