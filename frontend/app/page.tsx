"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  Payment,
  PaymentReportResponse,
  PaymentType,
} from "../types/payment";
import type { User } from "../types/user";
import { SessionTopbar } from "./components/SessionTopbar";
import { PaymentForm } from "./components/PaymentForm";
import { PaymentTypeManager } from "./components/PaymentTypeManager";
import { FiltersPanel } from "./components/FiltersPanel";
import { ReportPanel } from "./components/ReportPanel";
import { PaymentsTable } from "./components/PaymentsTable";
import {
  displayToIso,
  formatCurrencyFromNumber,
  formatCurrencyInput,
  isoToDisplay,
  parseCurrency,
  sanitizeDateInput,
} from "./utils/formatters";
import styles from "./page.module.css";

type TransactionKind = "payment" | "transfer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

function isUnauthorizedStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
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
  const [filterTransactionType, setFilterTransactionType] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // formularios de lancamentos
  const emptyForm = {
    date: "",
    typeId: "",
    description: "",
    amount: "",
  };

  const [formState, setFormState] = useState<
    Record<TransactionKind, typeof emptyForm>
  >({
    payment: { ...emptyForm },
    transfer: { ...emptyForm },
  });

  const [editing, setEditing] = useState<{
    id: number;
    kind: TransactionKind;
  } | null>(null);
  const [paymentTypeEditingId, setPaymentTypeEditingId] = useState<
    number | null
  >(null);
  const [paymentTypeName, setPaymentTypeName] = useState<string>("");
  const [reportTotal, setReportTotal] = useState<number | null>(null);
  const [reportPayments, setReportPayments] = useState<Payment[]>([]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPaymentTypes();
      fetchPayments();
    }
  }, [user]);

  async function fetchCurrentUser() {
    if (!API_URL) {
      setError("API URL nao configurada.");
      setLoadingUser(false);
      return;
    }
    try {
      setLoadingUser(true);
      setError(null);
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error("Erro ao carregar usuario autenticado.");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao carregar usuario.");
    } finally {
      setLoadingUser(false);
    }
  }

  async function fetchPaymentTypes() {
    if (!API_URL) {
      setError("API URL nao configurada.");
      return;
    }
    try {
      setLoadingPaymentTypes(true);
      setError(null);
      const res = await fetch(`${API_URL}/payment-types`, {
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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
    if (!API_URL) {
      setError("API URL nao configurada.");
      return;
    }
    try {
      setLoadingPayments(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterTypeId) params.append("paymentTypeId", filterTypeId);
      if (filterTransactionType)
        params.append("transactionType", filterTransactionType);
      const startIso = displayToIso(filterStartDate);
      const endIso = displayToIso(filterEndDate);
      if (startIso) params.append("startDate", startIso);
      if (endIso) params.append("endDate", endIso);

      const url =
        params.toString().length > 0
          ? `${API_URL}/payments?${params.toString()}`
          : `${API_URL}/payments`;

      const res = await fetch(url, { credentials: "include" });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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

  function resetForm(kind: TransactionKind) {
    setFormState((prev) => ({
      ...prev,
      [kind]: { ...emptyForm },
    }));
    if (editing?.kind === kind) {
      setEditing(null);
    }
  }

  function updateFormField(
    kind: TransactionKind,
    field: keyof typeof emptyForm,
    value: string
  ) {
    setFormState((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        [field]: value,
      },
    }));
  }

  function resetPaymentTypeForm() {
    setPaymentTypeName("");
    setPaymentTypeEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent, kind: TransactionKind) {
    e.preventDefault();
    if (!isAdmin) {
      alert("Apenas administradores podem criar ou editar pagamentos/transferencias.");
      return;
    }
    const { date, typeId, description, amount } = formState[kind];
    if (!date || !typeId || !description || !amount) {
      alert("Preencha todos os campos");
      return;
    }
    if (!displayToIso(date)) {
      alert("Data invalida. Use DD/MM/AAAA.");
      return;
    }

    try {
      setError(null);

      const amountValue = parseCurrency(amount);
      if (Number.isNaN(amountValue)) {
        throw new Error("Valor invalido.");
      }

      const body = {
        date: displayToIso(date) || "",
        paymentTypeId: Number(typeId),
        description,
        amount: amountValue,
        transactionType: kind,
      };

      const isEditing = editing?.kind === kind;
      const url = isEditing
        ? `${API_URL}/payments/${editing?.id}`
        : `${API_URL}/payments`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message ||
            (isEditing
              ? "Erro ao atualizar lancamento"
              : "Erro ao criar lancamento")
        );
      }

      await fetchPayments();
      resetForm(kind);
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao salvar lancamento");
    }
  }

  async function handlePaymentTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) {
      alert("Apenas administradores podem criar ou editar tipos.");
      return;
    }
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
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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
    if (!isAdmin) return;
    setPaymentTypeEditingId(type.id);
    setPaymentTypeName(type.name);
  }

  async function handlePaymentTypeDelete(id: number) {
    if (!isAdmin) return;
    if (!confirm("Excluir este tipo de pagamento?")) return;

    try {
      const res = await fetch(`${API_URL}/payment-types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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
      await fetchPaymentTypes();
      await fetchPayments();
    }
  }

  function handleEdit(payment: Payment) {
    if (!isAdmin) return;
    const kind: TransactionKind = payment.transactionType || "payment";
    setEditing({ id: payment.id, kind });
    setFormState((prev) => ({
      ...prev,
      [kind]: {
        date: isoToDisplay(payment.date),
        typeId: String(payment.paymentTypeId),
        description: payment.description,
        amount: formatCurrencyFromNumber(Number(payment.amount)),
      },
    }));
  }

  async function handleDelete(id: number) {
    if (!isAdmin) return;
    if (!confirm("Tem certeza que deseja excluir este lancamento?")) return;

    try {
      const res = await fetch(`${API_URL}/payments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao excluir lancamento");
      }
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao excluir lancamento");
    }
  }

  async function handleUploadReceipt(paymentId: number, file?: File | null) {
    if (!isAdmin) return;
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
        credentials: "include",
      });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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
    if (!isAdmin) return;
    if (!confirm("Remover comprovante deste lancamento?")) return;
    try {
      setDeletingReceiptId(paymentId);
      setError(null);
      const res = await fetch(`${API_URL}/payments/${paymentId}/receipt`, {
        method: "DELETE",
        credentials: "include",
      });
      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }
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
    if (!API_URL) {
      setError("API URL nao configurada.");
      return;
    }
    try {
      setLoadingReport(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterTypeId) params.append("paymentTypeId", filterTypeId);
      if (filterTransactionType)
        params.append("transactionType", filterTransactionType);
      const startIso = displayToIso(filterStartDate);
      const endIso = displayToIso(filterEndDate);
      if (startIso) params.append("startDate", startIso);
      if (endIso) params.append("endDate", endIso);

      const url =
        params.toString().length > 0
          ? `${API_URL}/payments/report?${params.toString()}`
          : `${API_URL}/payments/report`;

      const res = await fetch(url, { credentials: "include" });

      if (isUnauthorizedStatus(res.status)) {
        redirectToLogin();
        return;
      }

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

  async function handleLogout() {
    if (!API_URL) return;
    try {
      setLoggingOut(true);
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err: any) {
      setError(err.message || "Erro ao encerrar sessao");
    } finally {
      setLoggingOut(false);
      redirectToLogin();
    }
  }

  if (loadingUser) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Carregando sessao...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <div className={styles.errorBanner}>
          Sessao expirada ou usuario nao encontrado. Faca login novamente.
        </div>
        <div className={styles.actions}>
          <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
            Ir para login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <SessionTopbar user={user} onLogout={handleLogout} loggingOut={loggingOut} />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Financeiro</p>
          <h1 className={styles.heroTitle}>
            Controle de pagamentos e transferencias
          </h1>
          <p className={styles.heroSubtitle}>
            Cartorio 1o Oficio de Notas e Registros de Imoveis de Santarem - PA
          </p>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Tipos cadastrados</span>
            <span className={styles.heroStatValue}>{paymentTypes.length}</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Lancamentos listados</span>
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
                [
                  filterTypeId,
                  filterTransactionType,
                  filterStartDate,
                  filterEndDate,
                ].filter(Boolean).length
              }
            </span>
          </div>
        </div>
      </section>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <section className={styles.split}>
        <div className={styles.stack}>
          <PaymentForm
            title="Novo pagamento"
            transactionType="payment"
            isAdmin={isAdmin}
            paymentTypes={paymentTypes}
            editingId={editing?.kind === "payment" ? editing.id : null}
            formDate={formState.payment.date}
            formTypeId={formState.payment.typeId}
            formDescription={formState.payment.description}
            formAmount={formState.payment.amount}
            onDateChange={(value) =>
              updateFormField("payment", "date", sanitizeDateInput(value))
            }
            onTypeChange={(value) => updateFormField("payment", "typeId", value)}
            onDescriptionChange={(value) =>
              updateFormField("payment", "description", value)
            }
            onAmountChange={(value) =>
              updateFormField("payment", "amount", formatCurrencyInput(value))
            }
            onSubmit={(e) => handleSubmit(e, "payment")}
            onCancel={() => resetForm("payment")}
            accent
          />

          <PaymentForm
            title="Nova transferencia"
            transactionType="transfer"
            isAdmin={isAdmin}
            paymentTypes={paymentTypes}
            editingId={editing?.kind === "transfer" ? editing.id : null}
            formDate={formState.transfer.date}
            formTypeId={formState.transfer.typeId}
            formDescription={formState.transfer.description}
            formAmount={formState.transfer.amount}
            onDateChange={(value) =>
              updateFormField("transfer", "date", sanitizeDateInput(value))
            }
            onTypeChange={(value) =>
              updateFormField("transfer", "typeId", value)
            }
            onDescriptionChange={(value) =>
              updateFormField("transfer", "description", value)
            }
            onAmountChange={(value) =>
              updateFormField("transfer", "amount", formatCurrencyInput(value))
            }
            onSubmit={(e) => handleSubmit(e, "transfer")}
            onCancel={() => resetForm("transfer")}
          />
        </div>

        <PaymentTypeManager
          isAdmin={isAdmin}
          paymentTypes={paymentTypes}
          paymentTypeName={paymentTypeName}
          paymentTypeEditingId={paymentTypeEditingId}
          loadingPaymentTypes={loadingPaymentTypes}
          onNameChange={setPaymentTypeName}
          onSubmit={handlePaymentTypeSubmit}
          onCancel={resetPaymentTypeForm}
          onEdit={handlePaymentTypeEdit}
          onDelete={handlePaymentTypeDelete}
        />
      </section>

      <FiltersPanel
        paymentTypes={paymentTypes}
        filterTypeId={filterTypeId}
        filterTransactionType={filterTransactionType}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onTypeChange={setFilterTypeId}
        onTransactionTypeChange={setFilterTransactionType}
        onStartDateChange={(value) => setFilterStartDate(sanitizeDateInput(value))}
        onEndDateChange={(value) => setFilterEndDate(sanitizeDateInput(value))}
        onApply={handleApplyFilters}
        onReport={fetchReport}
      />

      <ReportPanel
        loadingReport={loadingReport}
        reportTotal={reportTotal}
        reportPayments={reportPayments}
        paymentTypes={paymentTypes}
      />

      <PaymentsTable
        payments={payments}
        paymentTypes={paymentTypes}
        isAdmin={isAdmin}
        loadingPayments={loadingPayments}
        uploadingId={uploadingId}
        deletingReceiptId={deletingReceiptId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpload={handleUploadReceipt}
        onDeleteReceipt={handleDeleteReceipt}
      />
    </main>
  );
}
