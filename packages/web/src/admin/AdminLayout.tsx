import { type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAdminAuth } from './AdminAuthContext.js';
import styles from './AdminLayout.module.scss';

function navClassName({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${styles.link} ${styles.linkActive}`;
  }
  return styles.link ?? '';
}

export function AdminLayout(): ReactNode {
  const { clearAdminToken } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearAdminToken();
    void navigate('/admin/login', { replace: true });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>Квест · организатор</div>
        <nav className={styles.nav} aria-label="Разделы админки">
          <NavLink to="/admin/teams" className={navClassName}>
            Команды
          </NavLink>
          <NavLink to="/admin/routes" className={navClassName}>
            Маршруты
          </NavLink>
          <NavLink to="/admin/questions" className={navClassName}>
            Вопросы
          </NavLink>
          <NavLink to="/admin/bindings" className={navClassName}>
            Коды
          </NavLink>
          <NavLink to="/admin/cells" className={navClassName}>
            Сапёр
          </NavLink>
        </nav>
        <button type="button" className="btn btn--secondary btn--small" onClick={handleLogout}>
          Выйти
        </button>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
