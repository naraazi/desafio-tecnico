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
    if (!isAdmin) {
      alert("Apenas administradores podem criar ou editar pagamentos.");
      return;
    }
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
    setEditingId(payment.id);
    setFormDate(isoToDisplay(payment.date));
    setFormTypeId(String(payment.paymentTypeId));
    setFormDescription(payment.description);
    setFormAmount(formatCurrencyFromNumber(Number(payment.amount)));
  }

  async function handleDelete(id: number) {
    if (!isAdmin) return;
    if (!confirm("Tem certeza que deseja excluir este pagamento?")) return;

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
        throw new Error(data?.message || "Erro ao excluir pagamento");
      }
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao excluir pagamento");
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
    if (!confirm("Remover comprovante deste pagamento?")) return;
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
        <PaymentForm
          isAdmin={isAdmin}
          paymentTypes={paymentTypes}
          editingId={editingId}
          formDate={formDate}
          formTypeId={formTypeId}
          formDescription={formDescription}
          formAmount={formAmount}
          onDateChange={(value) => setFormDate(sanitizeDateInput(value))}
          onTypeChange={(value) => setFormTypeId(value)}
          onDescriptionChange={(value) => setFormDescription(value)}
          onAmountChange={(value) => setFormAmount(formatCurrencyInput(value))}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />

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
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onTypeChange={setFilterTypeId}
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
