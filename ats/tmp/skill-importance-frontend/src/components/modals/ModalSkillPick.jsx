import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SkillImportancePicker from '../SkillImportancePicker';

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export default function ModalSkillPick() {
  const { modals, closeModal, standardSkills, skillsError, refreshSkills, updateJobSkills } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!modals.skillPick) return;
    setSelected((modals.skillPickData?.currentSkills || []).map(s => ({ ...s })));
    setSearch(''); setError(''); setBusy(false);
  }, [modals.skillPick, modals.skillPickData]);
  if (!modals.skillPick) return null;
  const pick = modals.skillPickData;
  const suggestions = standardSkills.filter(s => normalize([s.name, ...(s.aliases || [])].join(' ')).includes(normalize(search)));
  const update = (id, change) => setSelected(prev => prev.map(s => s.skillId === id ? { ...s, ...change } : s));
  const save = async () => {
    if (busy) return;
    if (selected.some(s => !Number.isFinite(Number(s.weight)) || Number(s.weight) <= 0)) {
      setError('Hãy chọn mức độ quan trọng cho các kỹ năng trước khi lưu.'); return;
    }
    setBusy(true); setError('');
    try {
      const items = selected.map(s => ({...s, weight: Number(s.weight)}));
      if (pick?.jobId) await updateJobSkills(pick.jobId, items);
      if (pick?.onSelect) pick.onSelect(items);
      closeModal('skillPick');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-auto shadow-xl">
      <h2 className="text-lg font-bold">Kỹ năng yêu cầu · {pick?.title || 'JD mới'}</h2>
      {skillsError && <div role="alert" className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{skillsError} <button onClick={refreshSkills} className="underline">Tải lại từ điển</button></div>}
      <input aria-label="Tìm kỹ năng" placeholder="Tìm kỹ năng…" value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <div className="border rounded-lg max-h-40 overflow-auto divide-y text-sm">
        {suggestions.map(s => <button key={s.id} type="button" disabled={busy || selected.some(item => item.skillId === s.id)} onClick={() => setSelected(prev => [...prev, { skillId: s.id, skillName: s.name, mandatory: true, weight: 1 }])} className="w-full text-left px-3 py-2 hover:bg-blue-50 disabled:text-slate-400">{s.name} <span className="text-xs text-slate-400">· {s.category}</span> {selected.some(item => item.skillId === s.id) && '✓'}</button>)}
        {!suggestions.length && <p className="p-3 text-slate-500">Chưa có kỹ năng phù hợp trong từ điển.</p>}
      </div>
      <p className="text-xs text-slate-500">Chọn “Bắt buộc” nếu ứng viên cần có kỹ năng đó để đáp ứng yêu cầu tuyển dụng.</p>
      <div className="space-y-3">{selected.map(s=><article key={s.skillId} className="border border-slate-200 rounded-xl p-3 space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-sm">{s.skillName}</h3><button type="button" disabled={busy} onClick={()=>setSelected(prev=>prev.filter(item=>item.skillId!==s.skillId))} className="text-xs text-rose-600 hover:underline disabled:opacity-50" aria-label={`Gỡ ${s.skillName}`}>Gỡ</button></div><SkillImportancePicker name={s.skillName} value={s.weight} disabled={busy} onChange={weight=>update(s.skillId,{weight})}/><label className="flex items-center gap-2 text-sm"><input aria-label={`Bắt buộc ${s.skillName}`} type="checkbox" disabled={busy} checked={s.mandatory} onChange={e=>update(s.skillId,{mandatory:e.target.checked})}/>Bắt buộc có kỹ năng này</label></article>)}</div>
      <p className="text-xs text-slate-500">Chọn mức cao hơn cho kỹ năng bạn muốn chú trọng hơn. “Bắt buộc” là điều kiện ứng viên cần đáp ứng, được chọn riêng với mức độ quan trọng.</p>
      {error && <p role="alert" className="text-rose-700 text-sm">{error}</p>}
      <div className="flex justify-end gap-3"><button disabled={busy} onClick={() => closeModal('skillPick')} className="px-4 py-2 border rounded-lg">Hủy</button><button disabled={busy || Boolean(skillsError)} onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{busy ? 'Đang lưu…' : pick?.jobId ? 'Lưu kỹ năng' : 'Áp dụng vào biểu mẫu'}</button></div>
    </div>
  </div>;
}
