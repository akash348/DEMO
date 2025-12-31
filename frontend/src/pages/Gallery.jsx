import { useEffect, useState } from "react";
import api from "../api/client.js";

const fallbackGallery = [
  { id: 1, title: "Workshop Session", media_type: "photo", url: "" },
  { id: 2, title: "Student Lab Work", media_type: "photo", url: "" },
  { id: 3, title: "Certification Day", media_type: "video", url: "" }
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";
  const mediaBase = apiBase.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${mediaBase}${url}`;
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/gallery")
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setItems(fallbackGallery);
        setError("Showing sample gallery items until the API is ready.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Gallery</h2>
            <p>Moments from classrooms, labs, and student achievements.</p>
          </div>
          {loading ? (
            <div className="status">Loading gallery...</div>
          ) : (
            <>
              {error && <div className="status warning">{error}</div>}
              {items.length ? (
                <div className="gallery-grid">
                  {items.map((item) => (
                    <div key={item.id} className="gallery-card">
                      <div className="gallery-media">
                        {item.url ? (
                          item.media_type === "video" ? (
                            <video
                              className="gallery-media-item"
                              src={resolveMediaUrl(item.url)}
                              controls
                              preload="metadata"
                            />
                          ) : (
                            <img
                              className="gallery-media-item"
                              src={resolveMediaUrl(item.url)}
                              alt={item.title || "Gallery"}
                            />
                          )
                        ) : (
                          <div className="gallery-placeholder">
                            <span>{(item.media_type || "media").toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <h4>{item.title || "Untitled"}</h4>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="status">Gallery updates will be added soon.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
