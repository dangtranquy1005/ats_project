import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const criteria = [
  { key: 'w1', label: 'Kỹ năng phù hợp', description: 'Những kỹ năng cần cho vị trí tuyển dụng.', color: 'bg-blue-500' },
  { key: 'w2', label: 'Kinh nghiệm liên quan', description: 'Công việc từng làm có liên quan đến vị trí này.', color: 'bg-violet-500' },
  { key: 'w3', label: 'Học vấn', description: 'Bằng cấp và chuyên ngành đáp ứng yêu cầu.', color: 'bg-teal-500' },
];
export default function ModalWeights() {
  const { modals, closeModal, weights, saveWeights, activeJob } = useApp();
  const [values, setValues] = useState({ w1: 50, w2: 30, w3: 20 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (modals.weights) {
      setValues(Object.fromEntries(Object.entries(weights).map(([key,value]) => [key, Number((value * 100).toFixed(8))])));
      setError(''); setBusy(false);
    }
  }, [modals.weights, weights]);
  if (!modals.weights || !activeJob) return null;
  const validInputs = Object.values(values).every(value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100);
  const sum = Object.values(values).reduce((total,value) => total + Number(value || 0), 0);
  const valid = validInputs && Math.abs(sum - 100) <= 0.0001;
  const difference = Number(Math.abs(100 - sum).toFixed(4));
  const save = async () => {
    if (!valid || busy) return;
    setBusy(true); setError('');
    try { await saveWeights(Number(values.w1)/100, Number(values.w2)/100, Number(values.w3)/100); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"><div role="dialog" aria-modal="true" aria-labelledby="priority-title" className="bg-white rounded-2xl w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-auto shadow-xl">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-600 mb-1">{activeJob.title}</p><h2 id="priority-title" className="font-bold text-xl text-slate-900">Bạn muốn ưu tiên điều gì?</h2></div><button aria-label="Đóng thiết lập ưu tiên" disabled={busy} onClick={() => closeModal('weights')} className="text-slate-400 hover:text-slate-700 p-1">✕</button></div>
    <p className="text-sm text-slate-500 leading-relaxed">Chia 100% cho ba tiêu chí. Tỷ lệ càng cao, tiêu chí đó càng ảnh hưởng đến điểm của ứng viên.</p>
    <div className="space-y-3">{criteria.map(({key,label,description,color}) => <div key={key} className="border border-slate-200 rounded-xl p-3 flex gap-3 items-start"><span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${color}`}></span><div className="flex-1 min-w-0"><label htmlFor={`priority-${key}`} className="font-semibold text-sm text-slate-800">{label}</label><p className="text-xs leading-relaxed text-slate-500 mt-1">{description}</p></div><div className="flex items-center gap-1 shrink-0"><input id={`priority-${key}`} aria-label={`Mức ưu tiên ${label}`} type="number" min="0" max="100" step="any" value={values[key]} disabled={busy} onChange={e => setValues(prev => ({...prev, [key]: e.target.value}))} className="w-20 border border-slate-300 rounded-lg px-2 py-2 text-right font-semibold text-sm focus:outline-blue-500"/><span className="text-sm text-slate-500">%</span></div></div>)}</div>
    <div className="space-y-2"><div className="flex justify-between text-sm font-semibold"><span>Tổng mức ưu tiên</span><span className={valid?'text-emerald-700':'text-amber-700'}>{Number(sum.toFixed(4))}% / 100%</span></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden flex" aria-hidden="true">{criteria.map(({key,color}) => <span key={key} className={color} style={{width: `${Math.max(0,Math.min(100,Number(values[key])||0)) / Math.max(100,sum) * 100}%`}}/>)}</div>
      {!valid && <p role="status" className="text-xs text-amber-700">{!validInputs?'Mỗi tỷ lệ cần nằm trong khoảng 0% đến 100%.':sum<100?`Bạn còn ${difference}% chưa phân bổ.`:`Tổng đang vượt ${difference}%. Hãy giảm một hoặc nhiều tiêu chí.`}</p>}
    </div>
    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">Ví dụ: Kỹ năng 50% nghĩa là phần kỹ năng đóng góp tối đa 50/100 điểm.</div>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex justify-between items-center gap-3 border-t pt-4 flex-wrap"><button disabled={busy} onClick={() => setValues({w1:50,w2:30,w3:20})} className="text-xs text-blue-600 underline">Dùng gợi ý 50% · 30% · 20%</button><div className="flex gap-3"><button disabled={busy} onClick={() => closeModal('weights')} className="px-4 py-2 border rounded-lg text-sm">Hủy</button><button onClick={save} disabled={!valid || busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{busy?'Đang lưu…':'Lưu mức ưu tiên'}</button></div></div>
  </div></div>;
}
