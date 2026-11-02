import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { BRAND } from "../lib/brand";
import { Icon, type IconName } from "./Icon";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

// Telefonda alt menü: en sık kullanılan beş ekran.
const mobileNav: NavItem[] = [
  { to: "/", label: "Özet", icon: "home", end: true },
  { to: "/daireler", label: "Daireler", icon: "building" },
  { to: "/aidat", label: "Aidat", icon: "calendar" },
  { to: "/tahsilat", label: "Tahsilat", icon: "wallet" },
  { to: "/giderler", label: "Giderler", icon: "receipt" },
];

const generalNav: NavItem[] = [
  { to: "/", label: "Genel bakış", icon: "home", end: true },
  { to: "/daireler", label: "Daireler", icon: "building" },
  { to: "/aidat", label: "Aidat takibi", icon: "calendar" },
];

const financeNav: NavItem[] = [
  { to: "/tahsilat", label: "Tahsilatlar", icon: "wallet" },
  { to: "/giderler", label: "Giderler", icon: "receipt" },
  { to: "/kasa", label: "Kasa", icon: "vault" },
];

function pageTitle(pathname: string) {
  if (pathname.startsWith("/daireler")) return "Daireler ve sakinler";
  if (pathname.startsWith("/aidat")) return "Aidat yönetimi";
  if (pathname.startsWith("/tahsilat")) return "Tahsilatlar";
  if (pathname.startsWith("/giderler")) return "Giderler";
  if (pathname.startsWith("/kasa")) return "Kasa";
  return "Yönetim özeti";
}

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label={`${BRAND.name} ana sayfa`}>
      <span className="brand-mark"><Icon name="logo" /></span>
      <span className="brand-copy">
        <strong>{BRAND.name}</strong>
        <small>{BRAND.tagline}</small>
      </span>
    </Link>
  );
}

function SideLink({ to, label, icon, end }: NavItem) {
  return (
    <NavLink to={to} end={end} className="side-link">
      <span className="side-link-icon"><Icon name={icon} /></span>
      <span>{label}</span>
    </NavLink>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initial = user?.username.trim().charAt(0).toLocaleUpperCase("tr") || "Y";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />

        <nav className="side-navigation" aria-label="Yönetim menüsü">
          <p className="nav-section-label">Genel</p>
          {generalNav.map((item) => <SideLink key={item.to} {...item} />)}
          <p className="nav-section-label">Finans</p>
          {financeNav.map((item) => <SideLink key={item.to} {...item} />)}
        </nav>

        <div className="sidebar-quick-card">
          <span className="sidebar-quick-icon"><Icon name="plus" /></span>
          <strong>Ödeme mi geldi?</strong>
          <span>Tahsilatı kaydedin, borç ve kasa anında güncellensin.</span>
          <Link to="/tahsilat/yeni">Ödeme al</Link>
        </div>

        <div className="sidebar-user">
          <span className="user-avatar">{initial}</span>
          <span className="sidebar-user-copy">
            <strong>{user?.username}</strong>
            <small>Yönetici hesabı</small>
          </span>
          <button type="button" onClick={() => logout()} aria-label="Çıkış yap" title="Çıkış yap">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <div className="app-stage">
        <header className="app-header">
          <div className="mobile-brand"><Brand /></div>
          <div className="desktop-page-context">
            <span>{BRAND.name}</span>
            <strong>{pageTitle(location.pathname)}</strong>
          </div>
          <div className="header-user">
            <span className="header-user-copy">
              <strong>{user?.username}</strong>
              <small>Yönetici</small>
            </span>
            <span className="user-avatar">{initial}</span>
            <button type="button" className="header-action" onClick={() => logout()} aria-label="Çıkış yap">
              <Icon name="logout" />
              <span>Çıkış</span>
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Ana menü">
        {mobileNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <span className="nav-icon"><Icon name={item.icon} /></span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
