import { useId, useRef } from "react";
import { formatDateForDisplay, parseDateForApi } from "../utils/date.js";

export default function DateInput({ value, onChange, required = false, placeholder = "DD-MM-YYYY", name }) {
  const pickerRef = useRef(null);
  const pickerId = useId();
  const pickerValue = parseDateForApi(value) || "";

  const openPicker = () => {
    if (pickerRef.current?.showPicker) {
      pickerRef.current.showPicker();
      return;
    }
    pickerRef.current?.focus();
  };

  return (
    <div className="date-input-wrap">
      <input
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
      <button className="date-picker-button" type="button" onClick={openPicker} aria-label="Open calendar">
        Calendar
      </button>
      <input
        id={pickerId}
        ref={pickerRef}
        className="date-native-picker"
        type="date"
        tabIndex={-1}
        value={pickerValue}
        onChange={(event) => onChange(formatDateForDisplay(event.target.value))}
        aria-hidden="true"
      />
    </div>
  );
}
