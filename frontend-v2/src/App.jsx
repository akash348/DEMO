import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Admission from "./pages/Admission.jsx";
import Faculty from "./pages/Faculty.jsx";
import Gallery from "./pages/Gallery.jsx";
import Verify from "./pages/Verify.jsx";
import Contact from "./pages/Contact.jsx";
import StudentAuth from "./pages/StudentAuth.jsx";
import StudentExams from "./pages/StudentExams.jsx";
import StudentPanel from "./pages/StudentPanel.jsx";
import "./styles/student-portal.css";
import Testimonials from "./pages/Testimonials.jsx";
import CourseNotes from "./pages/CourseNotes.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/notes" element={<CourseNotes />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/student" element={<StudentPanel />} />
          <Route path="/student/dashboard" element={<StudentPanel />} />
          <Route path="/student/login" element={<StudentAuth />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
