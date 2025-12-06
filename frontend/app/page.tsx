"use client";

import { useEffect, useState } from "react";
import type React from "react";
import type { Payment, PaymentType } from "../types/payment";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// formata "2025-12-05" -> "05/12/2025"
function formatDate(date: string): string {
  const onlyDate = date.substring(0, 10); // garante YYYY-MM-DD
  const [year, month, day] = onlyDate.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

export default function PaymentsPage() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);

  // filtros
  const [filterTypeId, setFilterTypeId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // form
  const [formDate, setFormDate] = useState<string>("");
  const [formTypeId, setFormTypeId] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [paymentTypeEditingId, setPaymentTypeEditingId] = useState<
    number | null
  >(null);
  const [paymentTypeName, setPaymentTypeName] = useState<string>("");

  useEffect(() => {
    fetchPaymentTypes();
    fetchPayments();
  }, []);

  async function fetchPaymentTypes() {
    try {
      setLoadingPaymentTypes(true);
      setError(null);
      const res = await fetch(`${API_URL}/payment-types`);
      if (!res.ok) {
        throw new Error("Erro ao buscar tipos de pagamento");
      }
      const data: PaymentType[] = await res.json();
      setPaymentTypes(data);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao buscar tipos de pagamento");
    } finally {
      setLoadingPaymentTypes(false);
    }
  }

  async function fetchPayments() {
    try {
      setLoadingPayments(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterTypeId) params.append("paymentTypeId", filterTypeId);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const url =
        params.toString().length > 0
          ? `${API_URL}/payments?${params.toString()}`
          : `${API_URL}/payments`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Erro ao buscar pagamentos");
      }
      const data: Payment[] = await res.json();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao buscar pagamentos");
    } finally {
      setLoadingPayments(false);
    }
  }

  function resetForm() {
    setFormDate("");
    setFormTypeId("");
    setFormDescription("");
    setFormAmount("");
    setEditingId(null);
  }

  function resetPaymentTypeForm() {
    setPaymentTypeName("");
    setPaymentTypeEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formDate || !formTypeId || !formDescription || !formAmount) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      setError(null);

      const body = {
        date: formDate,
        paymentTypeId: Number(formTypeId),
        description: formDescription,
        amount: Number(formAmount.replace(",", ".")),
      };

      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/payments/${editingId}`
        : `${API_URL}/payments`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message ||
            (isEditing
              ? "Erro ao atualizar pagamento"
              : "Erro ao criar pagamento")
        );
      }

      await fetchPayments();
      resetForm();
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao salvar pagamento");
    }
  }

  async function handlePaymentTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTypeName.trim()) {
      alert("Informe o nome do tipo");
      return;
    }

    try {
      setError(null);
      const isEditing = paymentTypeEditingId !== null;
      const url = isEditing
        ? `${API_URL}/payment-types/${paymentTypeEditingId}`
        : `${API_URL}/payment-types`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: paymentTypeName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message ||
            (isEditing
              ? "Erro ao atualizar tipo de pagamento"
              : "Erro ao criar tipo de pagamento")
        );
      }

      await fetchPaymentTypes();
      if (isEditing) {
        await fetchPayments(); // garante select atualizado em pagamentos
      }
      resetPaymentTypeForm();
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao salvar tipo");
    }
  }

  function handlePaymentTypeEdit(type: PaymentType) {
    setPaymentTypeEditingId(type.id);
    setPaymentTypeName(type.name);
  }

  async function handlePaymentTypeDelete(id: number) {
    if (!confirm("Excluir este tipo de pagamento?")) return;

    try {
      const res = await fetch(`${API_URL}/payment-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao excluir tipo de pagamento");
      }

      await fetchPaymentTypes();
      await fetchPayments(); // atualiza selects e listagem
      if (paymentTypeEditingId === id) {
        resetPaymentTypeForm();
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao excluir tipo");
    }
  }

  function handleEdit(payment: Payment) {
    setEditingId(payment.id);
    setFormDate(payment.date.substring(0, 10)); // garante formato YYYY-MM-DD
    setFormTypeId(String(payment.paymentTypeId));
    setFormDescription(payment.description);
    setFormAmount(String(payment.amount));
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este pagamento?")) return;

    try {
      const res = await fetch(`${API_URL}/payments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao excluir pagamento");
      }
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao excluir pagamento");
    }
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    fetchPayments();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Financeiro</p>
          <h1 className={styles.heroTitle}>
            Controle de pagamentos e transferências
          </h1>
          <p className={styles.heroSubtitle}>
            Cartório 1º Ofício de Notas e Registros de Imóveis de Santarém - PA
          </p>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Tipos cadastrados</span>
            <span className={styles.heroStatValue}>{paymentTypes.length}</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Pagamentos listados</span>
            <span className={styles.heroStatValue}>{payments.length}</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>
              Filtros
              <br />
              ativos
            </span>
            <span className={styles.heroStatValue}>
              {
                [filterTypeId, filterStartDate, filterEndDate].filter(Boolean)
                  .length
              }
            </span>
          </div>
        </div>
      </section>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <section className={styles.split}>
        <section className={`${styles.panel} ${styles.panelAccent}`}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.helperText}>Lançamentos</p>
              <h2>{editingId ? "Editar pagamento" : "Novo pagamento"}</h2>
            </div>
            <span className={styles.badgeLight}>
              {editingId ? "Editando registro" : "Cadastro rápido"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Data</label>
              <input
                className={styles.input}
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tipo de pagamento</label>
              <select
                className={styles.input}
                value={formTypeId}
                onChange={(e) => setFormTypeId(e.target.value)}
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
              <label className={styles.label}>Descrição</label>
              <input
                className={styles.input}
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Pagamento de folha - janeiro/2025"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Valor</label>
              <input
                className={styles.input}
                type="number"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="3,500"
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {editingId ? "Salvar edição" : "Criar pagamento"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Gerenciar Tipos */}
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.helperText}>Tipos de pagamento</p>
              <h2>Gerenciar tipos</h2>
            </div>
            <span className={styles.badgeLight}>Auxiliar</span>
          </div>

          <form
            onSubmit={handlePaymentTypeSubmit}
            className={`${styles.formGrid} ${styles.filters}`}
          >
            <div className={styles.field}>
              <label className={styles.label}>Nome</label>
              <input
                className={styles.input}
                type="text"
                value={paymentTypeName}
                onChange={(e) => setPaymentTypeName(e.target.value)}
                placeholder="Ex: Manutenção predial"
              />
            </div>
            <div className={styles.actions}>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {paymentTypeEditingId ? "Salvar tipo" : "Criar tipo"}
              </button>
              {paymentTypeEditingId && (
                <button
                  type="button"
                  onClick={resetPaymentTypeForm}
                  className={`${styles.btn} ${styles.btnSecondary}`}
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
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTypes.map((type) => (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            onClick={() => handlePaymentTypeEdit(type)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handlePaymentTypeDelete(type.id)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {/* Filtros */}
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.helperText}>Explorar</p>
            <h2>Filtros</h2>
          </div>
          <span className={styles.badgeLight}>Busca refinada</span>
        </div>
        <form onSubmit={handleApplyFilters} className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Tipo de pagamento</label>
            <select
              className={styles.input}
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
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
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Data final</label>
            <input
              className={styles.input}
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      {/* Tabela */}
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.helperText}>Visão geral</p>
            <h2>Pagamentos</h2>
          </div>
          <span className={styles.badgeLight}>
            {loadingPayments ? "Atualizando" : "Dados listados"}
          </span>
        </div>

        {loadingPayments ? (
          <p className={styles.loading}>Carregando pagamentos...</p>
        ) : payments.length === 0 ? (
          <p className={styles.empty}>Nenhum pagamento encontrado.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
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
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(p)}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
