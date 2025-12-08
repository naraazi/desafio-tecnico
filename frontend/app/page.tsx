"use client";

import { useEffect, useState } from "react";
import type React from "react";
import type {
  Payment,
  PaymentReportResponse,
  PaymentType,
} from "../types/payment";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// formata "2025-12-05" -> "05/12/2025"
function formatDate(date: string): string {
  const onlyDate = date.substring(0, 10); // garante YYYY-MM-DD
  const [year, month, day] = onlyDate.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

// Mantém input no formato DD/MM/YYYY enquanto digita
function sanitizeDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8); // DDMMYYYY
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

function displayToIso(date: string): string | null {
  const [day, month, year] = date.split("/");
  if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
    return `${year}-${month}-${day}`;
  }
  return null;
}

function isoToDisplay(iso: string): string {
  const onlyDate = iso.substring(0, 10);
  const [year, month, day] = onlyDate.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return iso;
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function formatCurrencyFromNumber(value: number): string {
  if (typeof value !== "number") return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PaymentsPage() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [deletingReceiptId, setDeletingReceiptId] = useState<number | null>(
    null
  );

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
  const [reportTotal, setReportTotal] = useState<number | null>(null);
  const [reportPayments, setReportPayments] = useState<Payment[]>([]);

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
      const startIso = displayToIso(filterStartDate);
      const endIso = displayToIso(filterEndDate);
      if (startIso) params.append("startDate", startIso);
      if (endIso) params.append("endDate", endIso);

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
    if (!displayToIso(formDate)) {
      alert("Data invalida. Use DD/MM/AAAA.");
      return;
    }

    try {
      setError(null);

      const amountValue = parseCurrency(formAmount);
      if (Number.isNaN(amountValue)) {
        throw new Error("Valor invalido.");
      }

      const body = {
        date: displayToIso(formDate) || "",
        paymentTypeId: Number(formTypeId),
        description: formDescription,
        amount: amountValue,
      };

      if (!displayToIso(formDate)) {
        throw new Error("Data invalida. Use DD/MM/AAAA.");
      }

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
      // Atualiza listagem para refletir flag de uso sem precisar de refresh manual
      await fetchPaymentTypes();
      await fetchPayments();
    }
  }

  function handleEdit(payment: Payment) {
    setEditingId(payment.id);
    setFormDate(isoToDisplay(payment.date)); // mostra DD/MM/YYYY
    setFormTypeId(String(payment.paymentTypeId));
    setFormDescription(payment.description);
    setFormAmount(formatCurrencyFromNumber(Number(payment.amount)));
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

async function handleUploadReceipt(paymentId: number, file?: File | null) {
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo nao suportado. Use PDF, JPG ou PNG.");
      return;
    }

    try {
      setUploadingId(paymentId);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/payments/${paymentId}/receipt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || "Erro ao enviar comprovante (PDF/JPG/PNG)"
        );
      }

      const data = await res.json();

      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                receiptPath: data.payment?.receiptPath ?? p.receiptPath,
                receiptUrl: data.receiptUrl ?? p.receiptUrl,
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao enviar comprovante");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDeleteReceipt(paymentId: number) {
    if (!confirm("Remover comprovante deste pagamento?")) return;
    try {
      setDeletingReceiptId(paymentId);
      setError(null);
      const res = await fetch(`${API_URL}/payments/${paymentId}/receipt`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao remover comprovante");
      }
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, receiptPath: undefined, receiptUrl: undefined }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao remover comprovante");
    } finally {
      setDeletingReceiptId(null);
    }
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    fetchPayments();
  }

  async function fetchReport(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setLoadingReport(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterTypeId) params.append("paymentTypeId", filterTypeId);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const url =
        params.toString().length > 0
          ? `${API_URL}/payments/report?${params.toString()}`
          : `${API_URL}/payments/report`;

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao gerar relatorio");
      }

      const data: PaymentReportResponse = await res.json();
      setReportTotal(data.total);
      setReportPayments(data.payments);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao gerar relatorio");
    } finally {
      setLoadingReport(false);
    }
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
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                value={formDate}
                onChange={(e) => setFormDate(sanitizeDateInput(e.target.value))}
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
                type="text"
                value={formAmount}
                onChange={(e) =>
                  setFormAmount(formatCurrencyInput(e.target.value))
                }
                inputMode="decimal"
                placeholder="0,00"
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
                        <div className={styles.actions}>
                          <button
                            onClick={() => handlePaymentTypeEdit(type)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                            disabled={!!type.inUse}
                            title={
                              type.inUse
                                ? "Tipo em uso por pagamentos, nao pode ser editado."
                                : undefined
                            }
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handlePaymentTypeDelete(type.id)}
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                            disabled={!!type.inUse}
                            title={
                              type.inUse
                                ? "Tipo em uso por pagamentos, nao pode ser excluido."
                                : undefined
                            }
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
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              value={filterStartDate}
              onChange={(e) =>
                setFilterStartDate(sanitizeDateInput(e.target.value))
              }
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
              onChange={(e) =>
                setFilterEndDate(sanitizeDateInput(e.target.value))
              }
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
              onClick={() => fetchReport()}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Gerar relatorio
            </button>
          </div>
        </form>
      </section>

      {/* Relatorio */}
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.helperText}>Resumo</p>
            <h2>Relatorio por periodo</h2>
          </div>
          <span className={styles.badgeLight}>
            {loadingReport ? "Calculando" : "Total e lista"}
          </span>
        </div>

        {reportTotal === null && reportPayments.length === 0 ? (
          <p className={styles.muted}>
            Use os filtros e clique em "Gerar relatorio".
          </p>
        ) : (
          <>
            <div className={styles.reportSummary}>
              <div className={styles.reportCard}>
                <span className={styles.reportLabel}>Total no periodo</span>
                <strong className={styles.reportValue}>
                  {Number(reportTotal || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            </div>

            {loadingReport ? (
              <p className={styles.loading}>Gerando relatorio...</p>
            ) : reportPayments.length === 0 ? (
              <p className={styles.empty}>
                Nenhum pagamento no periodo selecionado.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Descricao</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPayments.map((p) => (
                      <tr key={`report-${p.id}`}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
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
                              handleUploadReceipt(p.id, file);
                              e.target.value = "";
                            }}
                            disabled={uploadingId === p.id}
                          />
                        </label>
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
                            <button
                              onClick={() => handleDeleteReceipt(p.id)}
                              className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                              disabled={deletingReceiptId === p.id}
                            >
                              {deletingReceiptId === p.id
                                ? "Removendo..."
                                : "Remover comprovante"}
                            </button>
                          </>
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
    </main>
  );
}
