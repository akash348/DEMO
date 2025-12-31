import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Courses from "./pages/Courses.jsx";
import Fees from "./pages/Fees.jsx";
import Expenses from "./pages/Expenses.jsx";
import Exams from "./pages/Exams.jsx";
import Certificates from "./pages/Certificates.jsx";
import Gallery from "./pages/Gallery.jsx";
import Enquiries from "./pages/Enquiries.jsx";
import Trades from "./pages/Trades.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="trades" element={<Trades />} />
          <Route path="students" element={<Students />} />
          <Route path="courses" element={<Courses />} />
          <Route path="fees" element={<Fees />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="exams" element={<Exams />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="enquiries" element={<Enquiries />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
