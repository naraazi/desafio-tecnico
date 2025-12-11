import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PaymentForm } from "../PaymentForm";
import type { PaymentType } from "../../../types/payment";

const paymentTypes: PaymentType[] = [{ id: 1, name: "Folha" }];

function baseProps(): React.ComponentProps<typeof PaymentForm> {
  return {
    title: "Novo lançamento",
    transactionType: "payment",
    isAdmin: true,
    paymentTypes,
    editingId: null,
    formDate: "01/02/2025",
    formTypeId: "1",
    formDescription: "Desc",
    formAmount: "100,00",
    onDateChange: vi.fn(),
    onTypeChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onAmountChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    onAttachReceipt: vi.fn(),
  };
}

describe("PaymentForm", () => {
  it("exibe indicador vermelho quando sem comprovante", () => {
    const props = baseProps();
    render(<PaymentForm {...props} hasAttachedReceipt={false} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Sem comprovante/i);
    expect(status.className).toMatch(/btnDanger/);
    expect(status).toHaveAttribute("tabindex", "-1");

    // clicar no selo nao deve disparar submit
    fireEvent.click(status);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("exibe indicador verde quando há comprovante", () => {
    const props = baseProps();
    render(<PaymentForm {...props} hasAttachedReceipt />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Comprovante pronto/i);
    expect(status.className).toMatch(/btnSuccess/);
  });
});
