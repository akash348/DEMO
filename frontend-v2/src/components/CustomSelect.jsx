import { useEffect, useMemo, useRef, useState } from "react";

export default function CustomSelect({
  id,
  value,
  options,
  placeholder = "Select",
  onChange,
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  const optionList = useMemo(
    () => options.map((option) => ({ ...option, value: String(option.value) })),
    [options]
  );

  const selected = optionList.find((option) => option.value === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  useEffect(() => {
    if (!open) return;
    const index = selected ? optionList.findIndex((option) => option.value === selected.value) : 0;
    setHighlightIndex(index >= 0 ? index : 0);
  }, [open, optionList, selected]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const moveHighlight = (direction) => {
    if (!optionList.length) return;
    setHighlightIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return optionList.length - 1;
      if (next >= optionList.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      moveHighlight(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      moveHighlight(-1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (optionList[highlightIndex]) {
        handleSelect(optionList[highlightIndex]);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={`custom-select ${open ? "open" : ""} ${className}`.trim()} ref={containerRef}>
      <button
        className="custom-select-trigger"
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? "custom-select-value" : "custom-select-placeholder"}>
          {displayLabel}
        </span>
        <span className="custom-select-caret" aria-hidden="true" />
      </button>
      <ul className="custom-select-menu" role="listbox">
        {optionList.map((option, index) => (
          <li
            key={option.value}
            role="option"
            aria-selected={selected?.value === option.value}
            className={`custom-select-option ${
              selected?.value === option.value ? "selected" : ""
            } ${highlightIndex === index ? "highlighted" : ""}`.trim()}
            onMouseEnter={() => setHighlightIndex(index)}
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </li>
        ))}
        {!optionList.length && (
          <li className="custom-select-option empty" aria-disabled="true">
            No options
          </li>
        )}
      </ul>
    </div>
  );
}
