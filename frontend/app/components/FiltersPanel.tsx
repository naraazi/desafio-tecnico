import styles from "../page.module.css";
import type { PaymentType } from "../../types/payment";

interface FiltersPanelProps {
  paymentTypes: PaymentType[];
  filterTypeId: string;
  filterTransactionType: string;
  filterStartDate: string;
  filterEndDate: string;
  onTypeChange: (value: string) => void;
  onTransactionTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: (e: React.FormEvent) => void;
  onReport: (e?: React.FormEvent) => void;
}

export function FiltersPanel({
  paymentTypes,
  filterTypeId,
  filterTransactionType,
  filterStartDate,
  filterEndDate,
  onTypeChange,
  onTransactionTypeChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReport,
}: FiltersPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Explorar</p>
          <h2>Filtros</h2>
        </div>
        <span className={styles.badgeLight}>Busca refinada</span>
      </div>
      <form onSubmit={onApply} className={`${styles.formGrid} ${styles.filters}`}>
        <div className={styles.field}>
          <label className={styles.label}>Tipo de lancamento</label>
          <select
            className={styles.input}
            value={filterTransactionType}
            onChange={(e) => onTransactionTypeChange(e.target.value)}
          >
            <option value="">Pagamentos e transferencias</option>
            <option value="payment">Apenas pagamentos</option>
            <option value="transfer">Apenas transferencias</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo de pagamento</label>
          <select
            className={styles.input}
            value={filterTypeId}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Todos</option>
            {paymentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Data inicial</label>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={filterStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Data final</label>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="DD/MM/AAAA"
            value={filterEndDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <div className={styles.actionsInline}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => onReport()}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Gerar relatorio
          </button>
        </div>
      </form>
    </section>
  );
}
