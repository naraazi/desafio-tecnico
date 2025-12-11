import styles from "../page.module.css";
import type { PaymentType } from "../../types/payment";

interface FiltersPanelProps {
  paymentTypes: PaymentType[];
  filterTypeId: string;
  filterTransactionType: string;
  filterStartDate: string;
  filterEndDate: string;
  searchTerm: string;
  onTypeChange: (value: string) => void;
  onTransactionTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onApply?: (e: React.FormEvent) => void;
  onReport?: (e?: React.FormEvent) => void;
}

export function FiltersPanel({
  paymentTypes,
  filterTypeId,
  filterTransactionType,
  filterStartDate,
  filterEndDate,
  searchTerm,
  onTypeChange,
  onTransactionTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onApply,
  onReport,
}: FiltersPanelProps) {
  function handleSubmit(e: React.FormEvent) {
    onApply?.(e);
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault();
    onReport?.(e);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Explorar</p>
          <h2>Filtros</h2>
        </div>
        <span className={styles.badgeLight}>Busca refinada</span>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`${styles.formGrid} ${styles.filters}`}
      >
        <div className={styles.field}>
          <label className={styles.label}>Buscar</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Descrição ou tipo de pagamento"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo de lançamento</label>
          <select
            className={styles.input}
            value={filterTransactionType}
            onChange={(e) => onTransactionTypeChange(e.target.value)}
          >
            <option value="">Pagamentos e transferências</option>
            <option value="payment">Apenas pagamentos</option>
            <option value="transfer">Apenas transferências</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo</label>
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
          {onApply && (
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Aplicar
            </button>
          )}
          {onReport && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleReport}
            >
              Gerar relatório
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
