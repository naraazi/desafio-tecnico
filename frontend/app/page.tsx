"use client";

import { useEffect, useState } from "react";
import type React from "react";
import type { Payment, PaymentType } from "../types/payment";

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
  const [loading, setLoading] = useState(false);
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
    <main style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
        Controle de Pagamentos / Transferências
      </h1>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: 4,
            background: "#ffe5e5",
            color: "#a30000",
          }}
        >
          {error}
        </div>
      )}

      {/* Formulário */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>
          {editingId ? "Editar pagamento" : "Novo pagamento"}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Data</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Tipo de pagamento
            </label>
            <select
              value={formTypeId}
              onChange={(e) => setFormTypeId(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            >
              <option value="">Selecione...</option>
              {paymentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Descrição
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{ width: "100%", padding: 6 }}
              placeholder="Ex: Pagamento de folha - janeiro/2025"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Valor</label>
            <input
              type="number"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              style={{ width: "100%", padding: 6 }}
              placeholder="15000.50"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="submit"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "#fff",
              }}
            >
              {editingId ? "Salvar edição" : "Criar pagamento"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 4,
                  border: "1px solid #aaa",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Gerenciar Tipos */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>Gerenciar tipos de pagamento</h2>

        <form
          onSubmit={handlePaymentTypeSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Nome</label>
            <input
              type="text"
              value={paymentTypeName}
              onChange={(e) => setPaymentTypeName(e.target.value)}
              style={{ width: "100%", padding: 6 }}
              placeholder="Ex: Manutencao predial"
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="submit"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "#fff",
              }}
            >
              {paymentTypeEditingId ? "Salvar tipo" : "Criar tipo"}
            </button>
            {paymentTypeEditingId && (
              <button
                type="button"
                onClick={resetPaymentTypeForm}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 4,
                  border: "1px solid #aaa",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {loadingPaymentTypes ? (
          <p>Carregando tipos...</p>
        ) : paymentTypes.length === 0 ? (
          <p>Nenhum tipo cadastrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.95rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {paymentTypes.map((type) => (
                  <tr key={type.id}>
                    <td style={tdStyle}>{type.name}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handlePaymentTypeEdit(type)}
                        style={smallBtn("#2563eb", "#fff")}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handlePaymentTypeDelete(type.id)}
                        style={smallBtn("#dc2626", "#fff")}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Filtros */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>Filtros</h2>
        <form
          onSubmit={handleApplyFilters}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Tipo de pagamento
            </label>
            <select
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            >
              <option value="">Todos</option>
              {paymentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Data inicial
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              Data final
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="submit"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#16a34a",
                color: "#fff",
              }}
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      {/* Tabela */}
      <section>
        <h2 style={{ marginBottom: "0.75rem" }}>Pagamentos</h2>

        {loadingPayments ? (
          <p>Carregando pagamentos...</p>
        ) : payments.length === 0 ? (
          <p>Nenhum pagamento encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.95rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Descrição</th>
                  <th style={thStyle}>Valor</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={tdStyle}>{formatDate(p.date)}</td>
                    <td style={tdStyle}>
                      {p.paymentType?.name ||
                        paymentTypes.find((t) => t.id === p.paymentTypeId)
                          ?.name ||
                        "-"}
                    </td>
                    <td style={tdStyle}>{p.description}</td>
                    <td style={tdStyle}>
                      {Number(p.amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleEdit(p)}
                        style={smallBtn("#2563eb", "#fff")}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={smallBtn("#dc2626", "#fff")}
                      >
                        Excluir
                      </button>
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

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  padding: "0.5rem",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "0.5rem",
};

function smallBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: "0.25rem 0.5rem",
    marginRight: "0.25rem",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    background: bg,
    color,
  };
}
