import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalConfirm() {
  const { modals, closeModal } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setError(''); setBusy(false); }, [modals.confirm, modals.confirmData]);
  if (!modals.confirm) return null;
  const { title, body, okText, onConfirm } = modals.confirmData;
  const confirm = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onConfirm?.(); closeModal('confirm'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
    <h3 className="font-bold">{title}</h3><p className="text-sm text-slate-600">{body}</p>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex justify-end gap-3"><button disabled={busy} onClick={() => closeModal('confirm')} className="px-4 py-2 border rounded-lg">Hủy</button><button disabled={busy} onClick={confirm} className="px-4 py-2 rounded-lg bg-rose-600 text-white">{busy ? 'Đang xử lý…' : okText || 'Xác nhận'}</button></div>
  </div></div>;
}
