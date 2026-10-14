import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client.js";
import CustomSelect from "../components/CustomSelect.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { resolveMediaUrl } from "../utils/media.js";

export default function CourseNotes() {
  const [searchParams] = useSearchParams();
  const initialCourse = searchParams.get("courseId") || "";
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [loading, setLoading] = useState(true);

  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course.title])),
    [courses]
  );

  const fetchNotes = async (courseId = "") => {
    setLoading(true);
    try {
      const params = {};
      if (courseId) params.course_id = courseId;
      const response = await api.get("/notes", { params });
      setNotes(response.data);
    } catch (err) {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get("/courses", { params: { active_only: true } })
      .then((response) => {
        if (!active) return;
        setCourses(response.data);
      })
      .catch(() => {
        if (!active) return;
        setCourses([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetchNotes(selectedCourse);
  }, [selectedCourse]);

  const courseOptions = [
    { value: "", label: "All Courses" },
    ...courses.map((course) => ({ value: String(course.id), label: course.title }))
  ];

  return (
    <div className="page">
      <PageHeader
        title="Notes"
        description="Download notes shared by the institute and filter by course."
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Course Notes</h2>
            <p>Browse course notes shared by the institute and filter by course.</p>
          </div>
          <div className="panel-card">
            <div className="notes-head">
              <div>
                <h3>Available Notes</h3>
                <p className="helper-text">Filter notes by course to find the right material.</p>
              </div>
              <div className="form-group notes-filter">
                <label htmlFor="filterCourse">Filter by Course</label>
                <CustomSelect
                  id="filterCourse"
                  value={selectedCourse}
                  options={courseOptions}
                  placeholder="All Courses"
                  onChange={setSelectedCourse}
                />
              </div>
            </div>
            {loading ? (
              <div className="status">Loading notes...</div>
            ) : notes.length ? (
              <div className="notes-grid">
                {notes.map((note) => {
                  const courseTitle = courseMap.get(String(note.course_id)) || "General";
                  const fileUrl = resolveMediaUrl(note.file_url);
                  return (
                    <article className="note-card" key={note.id}>
                      <div className="note-meta">
                        <span className="detail-pill">{courseTitle}</span>
                        <span className="note-date">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4>{note.title}</h4>
                      <p className="helper-text">{note.description || "Course material notes."}</p>
                      <div className="note-actions">
                        <a className="btn btn-ghost" href={fileUrl} target="_blank" rel="noreferrer">
                          Download
                        </a>
                        <span className="helper-text">{note.original_filename}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="status warning">No notes uploaded yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
