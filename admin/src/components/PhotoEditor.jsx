import { useEffect, useState } from "react";

export default function PhotoEditor({ file, onChange, onBusyChange }) {
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rotate = async (degrees) => {
    setBusy(true);
    setError("");
    try {
      const image = new Image();
      image.src = preview;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalHeight;
      canvas.height = image.naturalWidth;
      const context = canvas.getContext("2d");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(degrees * Math.PI / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) throw new Error("Unable to rotate photo");
      onChange(new File([blob], "student-photo.jpg", { type: "image/jpeg" }));
    } catch {
      setError("Unable to rotate this photo. Please choose a JPG or PNG image.");
    } finally { setBusy(false); }
  };

  if (!preview) return null;
  return <div className="photo-editor">
    <img src={preview} alt="Student photo preview" style={{ width: 140, height: 170, objectFit: "contain" }} />
    <div className="table-actions">
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => rotate(-90)}>Rotate Left ↶</button>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => rotate(90)}>Rotate Right ↷</button>
    </div>
    {error && <div role="alert">{error}</div>}
    <small>Rotate the photo until it is upright. Save will upload this photo as shown.</small>
  </div>;
}
