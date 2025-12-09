import styles from "../page.module.css";
import type { Payment, PaymentType } from "../../types/payment";
import { formatDate } from "../utils/formatters";

interface PaymentsTableProps {
  payments: Payment[];
  paymentTypes: PaymentType[];
  isAdmin: boolean;
  loadingPayments: boolean;
  uploadingId: number | null;
  deletingReceiptId: number | null;
  onEdit: (payment: Payment) => void;
  onDelete: (id: number) => void;
  onUpload: (paymentId: number, file?: File | null) => void;
  onDeleteReceipt: (paymentId: number) => void;
}

export function PaymentsTable({
  payments,
  paymentTypes,
  isAdmin,
  loadingPayments,
  uploadingId,
  deletingReceiptId,
  onEdit,
  onDelete,
  onUpload,
  onDeleteReceipt,
}: PaymentsTableProps) {
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
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Visao geral</p>
          <h2>Pagamentos e transferencias</h2>
        </div>
        <span className={styles.badgeLight}>Dados listados</span>
      </div>

      {payments.length === 0 ? (
        <p className={styles.empty}>Nenhum lancamento encontrado.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Natureza</th>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>Valor</th>
                <th>Acoes</th>
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
                  <td>
                    {Number(p.amount).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {isAdmin && (
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
                      {p.receiptUrl && (
                        <>
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          >
                            Ver comprovante
                          </a>
                          {isAdmin && (
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
                      )}
                      {!isAdmin && !p.receiptUrl && (
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
    </section>
  );
}
