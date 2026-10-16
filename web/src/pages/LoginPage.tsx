import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Feedback";
import { Field } from "../components/Form";
import { useSubmit } from "../hooks/useAsync";

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
      <form className="card login-card stack" onSubmit={handleSubmit}>
        <img className="logo" src="/icon.svg" alt="" />
        <h1>Apartman Yönetimi</h1>
        {error && <Alert kind="error">{error.message}</Alert>}
        <Field label="Kullanıcı adı">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </Field>
        <Field label="Şifre">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <button className="btn block" disabled={submitting}>
          {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </div>
  );
}
