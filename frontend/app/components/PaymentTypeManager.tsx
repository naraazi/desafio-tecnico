import type React from "react";
import styles from "../page.module.css";
import type { PaymentType } from "../../types/payment";

interface PaymentTypeManagerProps {
  isAdmin: boolean;
  paymentTypes: PaymentType[];
  paymentTypeName: string;
  paymentTypeEditingId: number | null;
  loadingPaymentTypes: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onEdit: (type: PaymentType) => void;
  onDelete: (id: number) => void;
}

export function PaymentTypeManager({
  isAdmin,
  paymentTypes,
  paymentTypeName,
  paymentTypeEditingId,
  loadingPaymentTypes,
  onNameChange,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
}: PaymentTypeManagerProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Tipos de pagamento</p>
          <h2>Gerenciar tipos</h2>
        </div>
        <span className={styles.badgeLight}>Auxiliar</span>
      </div>

      {!isAdmin && (
        <div className={styles.lockedMessage}>
          Apenas administradores podem criar, editar ou remover tipos.
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={`${styles.formGrid} ${styles.filters}`}
      >
        <div className={styles.field}>
          <label className={styles.label}>Nome</label>
          <input
            className={styles.input}
            type="text"
            value={paymentTypeName}
            disabled={!isAdmin}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Manutencao predial"
          />
        </div>
        <div className={styles.actions}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!isAdmin}
          >
            {paymentTypeEditingId ? "Salvar tipo" : "Criar tipo"}
          </button>
          {paymentTypeEditingId && (
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

      {loadingPaymentTypes ? (
        <p className={styles.loading}>Carregando tipos...</p>
      ) : paymentTypes.length === 0 ? (
        <p className={styles.empty}>Nenhum tipo cadastrado.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {paymentTypes.map((type) => (
                <tr key={type.id}>
                  <td>
                    {type.name}
                    {type.inUse ? (
                      <>
                        {" "}
                        <span className={styles.badgeLight}>Em uso</span>
                      </>
                    ) : null}
                  </td>
                  <td>
                    {isAdmin ? (
                      <div className={styles.actions}>
                        <button
                          onClick={() => onEdit(type)}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          disabled={!isAdmin || !!type.inUse}
                          title={
                            type.inUse
                              ? "Tipo em uso por pagamentos, nao pode ser editado."
                              : undefined
                          }
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(type.id)}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          disabled={!isAdmin || !!type.inUse}
                          title={
                            type.inUse
                              ? "Tipo em uso por pagamentos, nao pode ser excluido."
                              : undefined
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <span className={styles.muted}>Restrito a admin</span>
                    )}
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
