import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Feedback";
import { Field } from "../components/Form";
import { Icon } from "../components/Icon";
import { useSubmit } from "../hooks/useAsync";
import { BRAND } from "../lib/brand";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { submitting, error, run } = useSubmit();

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (user) return <Navigate to={from} replace />;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      await login(username, password);
      navigate(from, { replace: true });
    });
  }

  return (
    <div className="login-page">
      <section className="login-showcase" aria-hidden="true">
        <div className="login-brand">
          <span className="brand-mark"><Icon name="logo" /></span>
          <span><strong>{BRAND.name}</strong><small>{BRAND.tagline}</small></span>
        </div>
        <div className="login-message">
          <span className="login-kicker">{BRAND.name}</span>
          <h1>Aidattan kasaya, apartmanın tüm hesabı <em>tek yerde.</em></h1>
          <p>Kim ödedi, kimin borcu var, kasada ne kadar para kaldı; hepsi telefonunuzda.</p>
          <ul>
            <li><span><Icon name="check" /></span> Her ayın aidatını tek dokunuşla yazın</li>
            <li><span><Icon name="check" /></span> Borçlu daireleri anında görün</li>
            <li><span><Icon name="check" /></span> Gelir ve giderleri şeffafça izleyin</li>
          </ul>
        </div>
        <div className="login-security"><Icon name="shield" /> Bilgilere yalnızca yönetici hesabıyla erişilebilir.</div>
      </section>

      <section className="login-form-wrap">
        <form className="login-card stack" onSubmit={handleSubmit}>
          <div className="login-mobile-logo">
            <span className="brand-mark"><Icon name="logo" /></span>
          </div>
          <div className="login-heading">
            <span className="eyebrow">{BRAND.name} · Yönetici girişi</span>
            <h2>Tekrar hoş geldiniz</h2>
            <p>Devam etmek için kullanıcı adınızı ve şifrenizi girin.</p>
          </div>
          {error && <Alert kind="error">{error.message}</Alert>}
          <Field label="Kullanıcı adı">
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              autoFocus
            />
          </Field>
          <Field label="Şifre">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <button className="btn block login-submit" disabled={submitting}>
            {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
            {!submitting && <Icon name="arrow" />}
          </button>
          <p className="login-help">Şifrenizi unuttuysanız sistemi kuran kişiden yenilemesini isteyin.</p>
        </form>
      </section>
    </div>
  );
}
