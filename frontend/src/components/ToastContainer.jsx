import React from 'react';
import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-50 pointer-events-none"
    >
      {toasts.map(toast => {
        let iconColor = 'text-blue-600 bg-blue-50 border-blue-100';
        let icon = 'fa-solid fa-circle-info';
        if (toast.type === 'success') {
          iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
          icon = 'fa-solid fa-circle-check';
        } else if (toast.type === 'warning' || toast.type === 'error') {
          iconColor = 'text-amber-600 bg-amber-50 border-amber-100';
          icon = 'fa-solid fa-triangle-exclamation';
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-slate-200 rounded-xl p-3.5 shadow-elevation flex items-start gap-3 min-w-[320px] max-w-md transform transition-all duration-200 animate-tabFadeIn"
          >
            <div
              className={`w-7 h-7 rounded-lg ${iconColor} border flex items-center justify-center shrink-0 text-xs`}
            >
              <i className={icon}></i>
            </div>
            <div className="flex-1 pr-2">
              <h5 className="font-bold text-slate-900 text-xs">{toast.title}</h5>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
}
