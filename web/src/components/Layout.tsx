import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/AuthContext";

// Basit çizgi ikonlar (ek paket gerektirmesin diye satır içi).
const icons = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  building: "M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  calendar: "M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 3v4M16 3v4M8 14l2 2 4-4",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h1",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Özet", icon: icons.home, end: true },
  { to: "/daireler", label: "Daireler", icon: icons.building },
  { to: "/aidat", label: "Aidat", icon: icons.calendar },
  { to: "/tahsilat", label: "Tahsilat", icon: icons.wallet },
  { to: "/giderler", label: "Giderler", icon: icons.receipt },
];

export function Layout() {
  const { logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <Link to="/" className="brand">Apartman Yönetimi</Link>
        <button type="button" onClick={() => logout()}>Çıkış</button>
      </header>
      <main>
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Ana menü">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon path={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
