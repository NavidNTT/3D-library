import { useEffect, useState } from "react";
import useBookStore from "../../store/useBookStore";

const STORAGE_KEY = "reader:drag-hint-seen";

export default function GestureHint() {
  const isOpen = useBookStore((state) => state.isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) { setVisible(false); return undefined; }
    let seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === "1"; } catch { /* private mode */ }
    if (seen) return undefined;
    setVisible(true);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
    const timeout = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!visible) return null;
  return (
    <div className="gesture-hint" onPointerDown={() => setVisible(false)}>
      <span className="gesture-hint__hand">👆</span>
      <p>Drag to turn the page</p>
    </div>
  );
}
