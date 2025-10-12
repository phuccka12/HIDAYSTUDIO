import React from "react";

export const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
      {children}
    </div>
  </div>
);
