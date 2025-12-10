import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const filteredTypes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return paymentTypes;
    return paymentTypes.filter((type) =>
      type.name.toLowerCase().includes(term)
    );
  }, [paymentTypes, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, paymentTypes.length]);

  const totalPages =
    filteredTypes.length === 0 ? 1 : Math.max(1, Math.ceil(filteredTypes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTypes = filteredTypes.slice(startIndex, startIndex + pageSize);

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.helperText}>Tipos de pagamento</p>
          <h2>Gerenciar tipos</h2>
          <p className={styles.muted}>
            {filteredTypes.length} tipo(s) encontrado(s)
          </p>
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

      <div className={styles.filters}>
        <div className={styles.field}>
          <label className={styles.label}>Buscar tipos</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: Pix, Combustivel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Itens por pagina</label>
          <select
            className={styles.input}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingPaymentTypes ? (
        <p className={styles.loading}>Carregando tipos...</p>
      ) : filteredTypes.length === 0 ? (
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
              {currentTypes.map((type) => (
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

      {filteredTypes.length > 0 && (
        <div className={styles.tableControls}>
          <div className={styles.pagination}>
            <button
              className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span className={styles.paginationInfo}>
              Pag. {currentPage} / {totalPages}
            </span>
            <button
              className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Proxima
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
