import type React from "react";
import styles from "../page.module.css";
import type { PaymentType } from "../../types/payment";

interface PaymentFormProps {
  title: string;
  transactionType: "payment" | "transfer";
  onTransactionTypeChange?: (value: "payment" | "transfer") => void;
  isAdmin: boolean;
  paymentTypes: PaymentType[];
  editingId: number | null;
  formDate: string;
  formTypeId: string;
  formDescription: string;
  formAmount: string;
  onDateChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onAttachReceipt?: (file: File | null) => void;
  hasAttachedReceipt?: boolean;
  accent?: boolean;
}

export function PaymentForm({
  title,
  transactionType,
  onTransactionTypeChange,
  isAdmin,
  paymentTypes,
  editingId,
  formDate,
  formTypeId,
  formDescription,
  formAmount,
  onDateChange,
  onTypeChange,
  onDescriptionChange,
  onAmountChange,
  onSubmit,
  onCancel,
  onAttachReceipt,
  hasAttachedReceipt = false,
  accent = false,
}: PaymentFormProps) {
  const isTransfer = transactionType === "transfer";
  const sectionTitle = editingId
    ? `Editar ${isTransfer ? "transferencia" : "pagamento"}`
    : title;

  const submitLabel = editingId
    ? "Salvar edicao"
    : isTransfer
    ? "Criar registro"
    : "Criar pagamento";

  return (
    <section
      className={`${styles.panel} ${accent ? styles.panelAccent : ""}`.trim()}
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Lancamentos</p>
          <h2>{sectionTitle}</h2>
        </div>
        <span className={styles.badgeLight}>
          {isAdmin
            ? editingId
              ? "Editando registro"
              : isTransfer
              ? "Nova transferencia"
              : "Cadastro rapido"
            : "Apenas admin altera"}
        </span>
      </div>

      {!isAdmin && (
        <div className={styles.lockedMessage}>
          Apenas administradores podem criar ou editar pagamentos ou
          transferencias.
        </div>
      )}

      <form onSubmit={onSubmit} className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Natureza do lancamento</label>
          <select
            className={styles.input}
            value={transactionType}
            disabled={!isAdmin || !onTransactionTypeChange}
            onChange={(e) =>
              onTransactionTypeChange?.(
                e.target.value === "transfer" ? "transfer" : "payment"
              )
            }
          >
            <option value="payment">Pagamento</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Data</label>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={formDate}
            disabled={!isAdmin}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo</label>
          <select
            className={styles.input}
            value={formTypeId}
            disabled={!isAdmin}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Selecione...</option>
            {paymentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descricao</label>
          <input
            className={styles.input}
            type="text"
            value={formDescription}
            disabled={!isAdmin}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ex: Pagamento de folha - janeiro/2025"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Valor</label>
          <input
            className={styles.input}
            type="text"
            value={formAmount}
            disabled={!isAdmin}
            onChange={(e) => onAmountChange(e.target.value)}
            inputMode="decimal"
            placeholder={isTransfer ? "0,00" : "0,00"}
          />
        </div>

        <div className={styles.actions}>
          <label
            className={`${styles.btn} ${styles.btnSecondary}`}
            aria-label="Anexar comprovante"
          >
            Anexar comprovante
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className={styles.fileInput}
              disabled={!isAdmin}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onAttachReceipt?.(file);
                e.target.value = "";
              }}
            />
          </label>

          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!isAdmin}
          >
            {submitLabel}
          </button>

          <span
            className={`${styles.btn} ${
              hasAttachedReceipt ? styles.btnSuccess : styles.btnDanger
            }`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            onClick={(e) => e.preventDefault()}
            tabIndex={-1}
          >
            {hasAttachedReceipt ? "Comprovante pronto" : "Sem comprovante"}
          </span>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={!isAdmin}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
