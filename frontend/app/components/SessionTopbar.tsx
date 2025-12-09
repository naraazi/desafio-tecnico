import styles from "../page.module.css";
import type { User } from "../../types/user";

interface SessionTopbarProps {
  user: User;
  onLogout: () => void | Promise<void>;
  loggingOut: boolean;
}

export function SessionTopbar({
  user,
  onLogout,
  loggingOut,
}: SessionTopbarProps) {
  return (
    <section className={styles.topbar}>
      <div className={styles.sessionInfo}>
        <div className={styles.sessionDetails}>
          <p className={styles.helperText}>Sessao ativa</p>
          <h2>{user.name}</h2>
          <p className={styles.muted}>{user.email}</p>
        </div>
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
      </div>
    </section>
  );
}
