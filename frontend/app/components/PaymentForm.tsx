import type React from "react";
import styles from "../page.module.css";
import type { PaymentType } from "../../types/payment";

interface PaymentFormProps {
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
}

export function PaymentForm({
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
}: PaymentFormProps) {
  return (
    <section className={`${styles.panel} ${styles.panelAccent}`}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Lancamentos</p>
          <h2>{editingId ? "Editar pagamento" : "Novo pagamento"}</h2>
        </div>
        <span className={styles.badgeLight}>
          {isAdmin
            ? editingId
              ? "Editando registro"
              : "Cadastro rapido"
            : "Apenas admin altera"}
        </span>
      </div>

      {!isAdmin && (
        <div className={styles.lockedMessage}>
          Apenas administradores podem criar ou editar pagamentos.
        </div>
      )}

      <form onSubmit={onSubmit} className={styles.formGrid}>
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
          <label className={styles.label}>Tipo de pagamento</label>
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
            placeholder="0,00"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!isAdmin}
          >
            {editingId ? "Salvar edicao" : "Criar pagamento"}
          </button>

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
