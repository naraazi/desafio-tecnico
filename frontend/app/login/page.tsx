"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!API_URL) {
      setError("API URL nao configurada.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Credenciais invalidas");
      }

      const from = searchParams.get("from") || "/";
      router.push(from);
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <p className={styles.kicker}>Acesso restrito</p>
        <h1 className={styles.title}>Financeiro Cartorio</h1>
        <p className={styles.subtitle}>
          Entre para gerenciar pagamentos e comprovantes.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
              autoComplete="email"
            />
          </label>
          <label className={styles.label}>
            Senha
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.hint}>
          Crie usuarios admin/operator com o script{" "}
          <code>npm run user:create</code> no backend.
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
