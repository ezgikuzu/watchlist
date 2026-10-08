import { useEffect, useRef } from 'react';

// Yerel <dialog> sarmalayıcısı: Esc ve arka plana tıklama onClose'u çağırır.
export default function Modal({ open, onClose, className = '', closeOnBackdrop = true, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={className}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (closeOnBackdrop && e.target === ref.current) onClose(); }}
    >
      {open && children}
    </dialog>
  );
}
