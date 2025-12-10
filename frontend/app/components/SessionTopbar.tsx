import styles from "../page.module.css";
import type { User } from "../../types/user";

export type NavKey = "home" | "lancamentos" | "tipos" | "relatorio";

interface SessionTopbarProps {
  user: User;
  navItems: { id: NavKey; label: string }[];
  activeNav: NavKey;
  onNavigate: (id: NavKey) => void;
  onLogout: () => void | Promise<void>;
  loggingOut: boolean;
}

export function SessionTopbar({
  user,
  navItems,
  activeNav,
  onNavigate,
  onLogout,
  loggingOut,
}: SessionTopbarProps) {
  return (
    <header className={styles.navShell}>
      <div className={styles.logoBlock}>
        <div className={styles.logoBadge}>
          <img
            src="/logo.png"
            alt="Logo do cartorio"
            width={68}
            height={68}
            className={styles.logoImage}
            loading="lazy"
          />
        </div>
        <div className={styles.sessionDetails}>
          <p className={styles.helperText}>Sessao ativa</p>
          <h2>{user.name}</h2>
          <p className={styles.muted}>{user.email}</p>
        </div>
      </div>

      <nav className={styles.navLinks} aria-label="Navegacao principal">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`${styles.navButton} ${
              activeNav === item.id ? styles.navButtonActive : ""
            }`.trim()}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.sessionActions}>
        <span className={styles.rolePill}>
          {user.role === "admin" ? "Admin" : "Operador"}
        </span>
        <button
          onClick={onLogout}
          className={`${styles.btn} ${styles.btnSecondary}`}
          disabled={loggingOut}
        >
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </header>
  );
}
