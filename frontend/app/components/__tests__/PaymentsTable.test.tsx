import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { PaymentsTable } from "../PaymentsTable";
import type { Payment, PaymentType, PaymentSortField } from "../../../types/payment";

const paymentTypes: PaymentType[] = [
  { id: 1, name: "Folha" },
  { id: 2, name: "Combustivel" },
];

const payments: Payment[] = [
  {
    id: 1,
    date: "2025-01-01",
    paymentTypeId: 1,
    description: "Folha Janeiro",
    amount: 12.34,
    transactionType: "payment",
  },
  {
    id: 2,
    date: "2025-01-02",
    paymentTypeId: 2,
    description: "Abastecimento",
    amount: 18.06,
    transactionType: "transfer",
  },
];

const defaultPagination = {
  page: 1,
  pageSize: 2,
  totalItems: 3,
  totalPages: 2,
};

function renderTable(overrides?: Partial<React.ComponentProps<typeof PaymentsTable>>) {
  const props: React.ComponentProps<typeof PaymentsTable> = {
    payments,
    paymentTypes,
    isAdmin: true,
    loadingPayments: false,
    uploadingId: null,
    deletingReceiptId: null,
    pagination: defaultPagination,
    totals: { pageAmount: 30.4, overallAmount: 60.4 },
    sortBy: "date",
    sortOrder: "desc",
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpload: vi.fn(),
    onDeleteReceipt: vi.fn(),
    onSort: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };

  render(<PaymentsTable {...props} />);
  return props;
}

describe("PaymentsTable", () => {
  it("renderiza tabela e controles de paginacao sem totalizadores", () => {
    renderTable();

    expect(screen.queryByText(/Mostrando/i)).toBeNull();
    expect(screen.queryByText(/Filtrado/i)).toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(1 + payments.length); // header + linhas
    expect(screen.getByLabelText(/Itens por pagina/i)).toBeInTheDocument();
  });

  it("aciona ordenacao ao clicar no cabecalho", () => {
    const props = renderTable();

    const valorHeader = screen.getByRole("button", { name: /Valor/i });
    fireEvent.click(valorHeader);

    expect(props.onSort).toHaveBeenCalledWith("amount" satisfies PaymentSortField);
  });

  it("aciona navegacao entre paginas e respeita disabled", () => {
    const props = renderTable();

    const prev = screen.getByRole("button", { name: /Anterior/i });
    const next = screen.getByRole("button", { name: /Proxima/i });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it("altera quantidade por pagina", () => {
    const props = renderTable();
    const select = screen.getByLabelText(/Itens por pagina/i);

    fireEvent.change(select, { target: { value: "20" } });

    expect(props.onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
