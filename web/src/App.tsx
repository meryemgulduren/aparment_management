import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useAuth } from "./auth/AuthContext";
import { Loading } from "./components/Feedback";
import { Layout } from "./components/Layout";
import { ApartmentDetailPage } from "./pages/apartments/ApartmentDetailPage";
import { ApartmentFormPage } from "./pages/apartments/ApartmentFormPage";
import { ApartmentsPage } from "./pages/apartments/ApartmentsPage";
import { ChargeFormPage } from "./pages/apartments/ChargeFormPage";
import { ResidentFormPage } from "./pages/apartments/ResidentFormPage";
import { CashPage } from "./pages/cash/CashPage";
import { IncomeFormPage } from "./pages/cash/IncomeFormPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BulkChargePage } from "./pages/dues/BulkChargePage";
import { DuesPage } from "./pages/dues/DuesPage";
import { ExpenseFormPage } from "./pages/expenses/ExpenseFormPage";
import { ExpensesPage } from "./pages/expenses/ExpensesPage";
import { LoginPage } from "./pages/LoginPage";
import { PaymentFormPage } from "./pages/payments/PaymentFormPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";

/** Giriş yapılmamışsa giriş sayfasına gönderir; girişten sonra kaldığı yere döner. */
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <Loading />;
  if (user === null) return <Navigate to="/giris" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route path="/giris" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />

          <Route path="daireler" element={<ApartmentsPage />} />
          <Route path="daireler/yeni" element={<ApartmentFormPage />} />
          <Route path="daireler/:id" element={<ApartmentDetailPage />} />
          <Route path="daireler/:id/duzenle" element={<ApartmentFormPage />} />
          <Route path="daireler/:id/sakin-ekle" element={<ResidentFormPage />} />
          <Route path="daireler/:id/sakinler/:residentId" element={<ResidentFormPage />} />
          <Route path="daireler/:id/borc-ekle" element={<ChargeFormPage />} />

          <Route path="aidat" element={<DuesPage />} />
          <Route path="aidat/borclandir" element={<BulkChargePage />} />

          <Route path="tahsilat" element={<PaymentsPage />} />
          <Route path="tahsilat/yeni" element={<PaymentFormPage />} />

          <Route path="giderler" element={<ExpensesPage />} />
          <Route path="giderler/yeni" element={<ExpenseFormPage />} />

          <Route path="kasa" element={<CashPage />} />
          <Route path="kasa/para-ekle" element={<IncomeFormPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
