import styles from "../page.module.css";
import type {
  Payment,
  PaymentSortField,
  PaymentType,
} from "../../types/payment";
import { formatDate } from "../utils/formatters";

interface PaymentsTableProps {
  payments: Payment[];
  paymentTypes: PaymentType[];
  isAdmin: boolean;
  loadingPayments: boolean;
  uploadingId: number | null;
  deletingReceiptId: number | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  totals: {
    pageAmount: number;
    overallAmount: number;
  };
  sortBy: PaymentSortField;
  sortOrder: "asc" | "desc";
  actionsMode?: "full" | "view";
  hideMainTitle?: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (id: number) => void;
  onUpload: (paymentId: number, file?: File | null) => void;
  onDeleteReceipt: (paymentId: number) => void;
  onSort: (field: PaymentSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PaymentsTable({
  payments,
  paymentTypes,
  isAdmin,
  loadingPayments,
  uploadingId,
  deletingReceiptId,
  pagination,
  totals,
  sortBy,
  sortOrder,
  actionsMode = "full",
  hideMainTitle = false,
  onEdit,
  onDelete,
  onUpload,
  onDeleteReceipt,
  onSort,
  onPageChange,
  onPageSizeChange,
}: PaymentsTableProps) {
  const { page, pageSize, totalItems, totalPages } = pagination;
  const viewOnly = actionsMode === "view";
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;
  const pageLabel = totalItems === 0 ? 0 : page;
  const totalPagesLabel = totalItems === 0 ? 0 : Math.max(totalPages, 1);

  function renderSortable(label: string, field: PaymentSortField) {
    const active = sortBy === field;
    const indicator = !active ? "↕" : sortOrder === "asc" ? "↑" : "↓";

    return (
      <button
        type="button"
        className={`${styles.sortButton} ${active ? styles.sortButtonActive : ""}`}
        onClick={() => onSort(field)}
      >
        {label}
        <span className={styles.sortIndicator}>{indicator}</span>
      </button>
    );
  }

  if (loadingPayments) {
    return (
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.helperText}>Visao geral</p>
            <h2>Pagamentos e transferencias</h2>
          </div>
          <span className={styles.badgeLight}>Atualizando</span>
        </div>
        <p className={styles.loading}>Carregando lancamentos...</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      {!hideMainTitle && (
        <div className={styles.sectionHeader}>
          <div />
        </div>
      )}

      {payments.length === 0 ? (
        <p className={styles.empty}>Nenhum lancamento encontrado.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{renderSortable("Data", "date")}</th>
                <th>{renderSortable("Natureza", "transactionType")}</th>
                <th>{renderSortable("Tipo", "paymentType")}</th>
                <th>{renderSortable("Descricao", "description")}</th>
                <th>{renderSortable("Valor", "amount")}</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.date)}</td>
                  <td>
                    <span className={styles.status}>
                      {p.transactionType === "transfer"
                        ? "Transferencia"
                        : "Pagamento"}
                    </span>
                  </td>
                  <td>
                    {p.paymentType?.name ||
                      paymentTypes.find((t) => t.id === p.paymentTypeId)?.name ||
                      "-"}
                  </td>
                  <td>{p.description}</td>
                  <td>{formatCurrency(Number(p.amount))}</td>
                  <td>
                    <div className={styles.actions}>
                      {isAdmin && !viewOnly && (
                        <>
                          <button
                            onClick={() => onEdit(p)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          >
                            Excluir
                          </button>
                          <label
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
                          >
                            {uploadingId === p.id
                              ? "Enviando..."
                              : p.receiptUrl
                              ? "Alterar comprovante"
                              : "Enviar comprovante"}
                            <input
                              type="file"
                              accept="application/pdf,image/png,image/jpeg"
                              className={styles.fileInput}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                onUpload(p.id, file);
                                e.target.value = "";
                              }}
                              disabled={uploadingId === p.id || !isAdmin}
                            />
                          </label>
                        </>
                      )}
                      {p.receiptUrl ? (
                        <>
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          >
                            Ver comprovante
                          </a>
                          {isAdmin && !viewOnly && (
                            <button
                              onClick={() => onDeleteReceipt(p.id)}
                              className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                              disabled={deletingReceiptId === p.id}
                            >
                              {deletingReceiptId === p.id
                                ? "Removendo..."
                                : "Remover comprovante"}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className={styles.muted}>Sem comprovante</span>
                      )}
                      {!isAdmin && !p.receiptUrl && !viewOnly && (
                        <span className={styles.muted}>Apenas admin altera</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.tableControls}>
        <label className={styles.pageSizeSelector}>
          Itens por pagina
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={styles.input}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.pagination}>
          <button
            className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
          >
            Anterior
          </button>
          <span className={styles.paginationInfo}>
            Pag. {pageLabel} / {totalPagesLabel}
          </span>
          <button
            className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
          >
            Proxima
          </button>
        </div>
      </div>
    </section>
  );
}
