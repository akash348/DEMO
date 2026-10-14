import { useEffect, useState } from "react";
import api from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { resolveMediaUrl } from "../utils/media.js";

const fallbackGallery = [
  { id: 1, title: "Workshop Session", media_type: "photo", url: "/banners/banner1.jpeg" },
  { id: 2, title: "Student Lab Work", media_type: "photo", url: "/banners/banner2.jpeg" },
  { id: 3, title: "Certification Day", media_type: "photo", url: "/banners/banner3.jpeg" },
  { id: 4, title: "Classroom Activity", media_type: "photo", url: "/banners/banner5.jpeg" }
];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/gallery")
      .then((response) => {
        if (!active) return;
        const galleryItems = Array.isArray(response.data) ? response.data : [];
        setItems(galleryItems.length ? galleryItems : fallbackGallery);
        setError(galleryItems.length ? "" : "Showing sample gallery items until media is added.");
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
      <PageHeader
        title="Gallery"
        description="Photos and moments from classrooms, labs, and workshops."
      />
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
                  {items.map((item, index) => (
                    <div key={item.id} className="gallery-card">
                      <div className="gallery-media">
                        {item.url ? (
                          <button
                            className="gallery-media-button"
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                          >
                            {item.media_type === "video" ? (
                              <video
                                className="gallery-media-item"
                                src={resolveMediaUrl(item.url)}
                                preload="metadata"
                              />
                            ) : (
                              <img
                                className="gallery-media-item"
                                src={resolveMediaUrl(item.url)}
                                alt={item.title || "Gallery"}
                              />
                            )}
                          </button>
                        ) : (
                          <div className="gallery-placeholder">
                            <span>{(item.media_type || "media").toUpperCase()}</span>
                          </div>
                        )}

                        
                      </div>
                      <h4>{item.title || " "}</h4>
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
      {lightboxIndex !== null && items[lightboxIndex] && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true">
          <button
            className="gallery-lightbox-backdrop"
            type="button"
            aria-label="Close preview"
            onClick={() => setLightboxIndex(null)}
          />
          <div className="gallery-lightbox-content">
            <button
              className="gallery-lightbox-close"
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close preview"
            >
              ×
            </button>
            <button
              className="gallery-lightbox-nav"
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === null ? prev : (prev - 1 + items.length) % items.length
                )
              }
              aria-label="Previous"
            >
              ‹
            </button>
            <div className="gallery-lightbox-media">
              {items[lightboxIndex].media_type === "video" ? (
                <video src={resolveMediaUrl(items[lightboxIndex].url)} controls autoPlay />
              ) : (
                <img
                  src={resolveMediaUrl(items[lightboxIndex].url)}
                  alt={items[lightboxIndex].title || "Gallery"}
                />
              )}
              <div className="gallery-lightbox-caption">
                {items[lightboxIndex].title || "Untitled"}
              </div>
            </div>
            <button
              className="gallery-lightbox-nav"
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === null ? prev : (prev + 1) % items.length
                )
              }
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
