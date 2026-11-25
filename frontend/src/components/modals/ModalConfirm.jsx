import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalConfirm() {
  const { modals, closeModal } = useApp();
  const isOpen = modals.confirm;
  const { title, body, okText, onConfirm } = modals.confirmData || {
    title: 'Xác nhận thao tác?',
    body: '',
    okText: 'Xác nhận',
    onConfirm: () => {}
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal('confirm');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl w-full p-6 space-y-4 shadow-elevation border border-slate-200 max-w-sm">
        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
          {body}
        </div>
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => closeModal('confirm')}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-98"
          >
            {okText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
