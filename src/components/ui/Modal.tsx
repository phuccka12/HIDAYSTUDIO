import type { ReactNode } from 'react';

export function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    </div>
  );
}

export default function Modal({
  title,
  onClose,
  children,
  widthClass = 'w-full max-w-2xl'
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* ensure modal doesn't exceed viewport height and make content scrollable */}
      <div className={`relative z-10 ${widthClass} max-h-[90vh]`}> 
        <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Đóng"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
