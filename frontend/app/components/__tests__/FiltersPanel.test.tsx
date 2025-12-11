import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { FiltersPanel } from "../FiltersPanel";
import type { PaymentType } from "../../../types/payment";

const paymentTypes: PaymentType[] = [
  { id: 1, name: "Folha" },
  { id: 2, name: "Combustível" },
];

describe("FiltersPanel", () => {
  it("propaga busca e dispara aplicar/relatório", () => {
    const onApply = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onReport = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <FiltersPanel
        paymentTypes={paymentTypes}
        filterTypeId=""
        filterTransactionType=""
        filterStartDate=""
        filterEndDate=""
        searchTerm=""
        onTypeChange={vi.fn()}
        onTransactionTypeChange={vi.fn()}
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        onSearchChange={onSearchChange}
        onApply={onApply}
        onReport={onReport}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Descrição ou tipo de pagamento/i),
      {
        target: { value: "Folha" },
      }
    );
    expect(onSearchChange).toHaveBeenCalledWith("Folha");

    fireEvent.click(screen.getByRole("button", { name: /Aplicar/i }));
    expect(onApply).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /Gerar relatório/i })
    );
    expect(onReport).toHaveBeenCalled();
  });

  it("não exibe Aplicar quando onApply não é fornecido", () => {
    const onReport = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <FiltersPanel
        paymentTypes={paymentTypes}
        filterTypeId=""
        filterTransactionType=""
        filterStartDate=""
        filterEndDate=""
        searchTerm=""
        onTypeChange={vi.fn()}
        onTransactionTypeChange={vi.fn()}
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        onSearchChange={onSearchChange}
        onApply={undefined}
        onReport={onReport}
      />
    );

    expect(screen.queryByRole("button", { name: /Aplicar/i })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /Gerar relatório/i })
    );
    expect(onReport).toHaveBeenCalled();
  });
});
