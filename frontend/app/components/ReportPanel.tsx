import styles from "../page.module.css";
import type { Payment, PaymentType } from "../../types/payment";
import { formatDate } from "../utils/formatters";

interface ReportPanelProps {
  loadingReport: boolean;
  reportTotal: number | null;
  reportPayments: Payment[];
  paymentTypes: PaymentType[];
}

export function ReportPanel({
  loadingReport,
  reportTotal,
  reportPayments,
  paymentTypes,
}: ReportPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Resumo</p>
          <h2>Relatório por período</h2>
        </div>
        <span className={styles.badgeLight}>
          {loadingReport ? "Calculando" : "Total e lista"}
        </span>
      </div>

      {reportTotal === null && reportPayments.length === 0 ? (
        <p className={styles.muted}>
          Use os filtros e clique em "Gerar relatório".
        </p>
      ) : (
        <>
          <div className={styles.reportSummary}>
            <div className={styles.reportCard}>
              <span className={styles.reportLabel}>Total no período</span>
              <strong className={styles.reportValue}>
                {Number(reportTotal || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
          </div>

          {loadingReport ? (
            <p className={styles.loading}>Gerando relatório...</p>
          ) : reportPayments.length === 0 ? (
            <p className={styles.empty}>
              Nenhum lançamento no período selecionado.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Natureza</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {reportPayments.map((p) => (
                    <tr key={`report-${p.id}`}>
                      <td>{formatDate(p.date)}</td>
                      <td>
                        <span className={styles.status}>
                          {p.transactionType === "transfer"
                            ? "Transferência"
                            : "Pagamento"}
                        </span>
                      </td>
                      <td>
                        {p.paymentType?.name ||
                          paymentTypes.find((t) => t.id === p.paymentTypeId)
                            ?.name ||
                          "-"}
                      </td>
                      <td>{p.description}</td>
                      <td>
                        {Number(p.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
