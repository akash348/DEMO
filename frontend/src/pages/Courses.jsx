import { useEffect, useState } from "react";
import api from "../api/client.js";
import CourseCard from "../components/CourseCard.jsx";
import fallbackCourses from "../data/courses.js";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/courses", { params: { active_only: false } })
      .then((response) => {
        if (!active) return;
        setCourses(response.data);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setCourses(fallbackCourses);
        setError("Showing sample courses until the API is ready.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/trades", { params: { active_only: false } })
      .then((response) => {
        if (!active) return;
        setTrades(response.data);
      })
      .catch(() => {
        if (!active) return;
        setTrades([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const tradeMap = new Map(trades.map((trade) => [trade.id, trade.name]));

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>All Courses</h2>
            <p>Detailed course tracks with duration, fees, and outcomes.</p>
          </div>
          {loading ? (
            <div className="status">Loading courses...</div>
          ) : (
            <>
              {error && <div className="status warning">{error}</div>}
              {courses.length ? (
                <div className="grid-3">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      tradeLabel={tradeMap.get(course.trade_id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="status">Courses will be updated soon.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
