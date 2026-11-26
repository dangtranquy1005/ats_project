import React, { useState, useEffect } from 'react';
import {skillImportanceLabel} from '../../services/skillImportance';
import { useApp } from '../../context/AppContext';
import {EDUCATION_LEVELS,educationValue} from '../../services/educationPresentation';

export default function ModalCreateJd() {
  const { modals, closeModal, createJob, updateJob, openModal } = useApp();
  const isOpen = modals.createJd || modals.editJd;
  const isEdit = modals.editJd;
  const data = modals.jdData;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minExp, setMinExp] = useState(0);
  const [education, setEducation] = useState('NONE');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setTitle(data?.title || ''); setDescription(data?.description || '');
    setMinExp(isEdit ? data.minExp : data?.imported ? (data.minExperienceYears ?? '') : 0);
    setEducation(educationValue(isEdit ? data.education : data?.educationRequirements));
    setRequiredSkills((data?.requiredSkills || []).map(s => ({...s})));
    setError(''); setBusy(false);
  }, [isOpen, isEdit, data]);
  if (!isOpen) return null;
  const dismiss = () => { if (!busy) closeModal(isEdit ? 'editJd' : 'createJd'); };
  const submit = async e => {
    e.preventDefault(); if (busy) return;
    if (!title.trim() || !Number.isInteger(Number(minExp)) || Number(minExp) < 0) {
      setError('Tên vị trí và số năm kinh nghiệm nguyên không âm là bắt buộc.'); return;
    }
    setBusy(true); setError('');
    try {
      const payload = { title: title.trim(), description: description.trim(), minExp: Number(minExp), education, requiredSkills };
      if (isEdit) await updateJob(data.id, payload); else await createJob(payload);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const input = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm';
  return <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
    <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-auto shadow-xl">
      <div className="flex justify-between"><h2 className="font-bold text-lg">{isEdit ? 'Sửa vị trí tuyển dụng' : 'Tạo vị trí tuyển dụng'}</h2><button type="button" disabled={busy} onClick={dismiss} aria-label="Đóng">✕</button></div>
      {!isEdit&&data?.imported&&<div className="p-3 bg-blue-50 rounded-lg text-sm space-y-2"><p className="font-semibold">Đã điền thông tin từ {data.sourceFilename}. Hãy kiểm tra trước khi lưu.</p>{data.warnings?.length>0&&<ul className="list-disc pl-5 text-blue-900 space-y-1">{data.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}{(data.experienceSource||data.educationSource)&&<details><summary className="cursor-pointer text-blue-700">Xem căn cứ kinh nghiệm và học vấn</summary>{data.experienceSource&&<p className="mt-2 whitespace-pre-wrap">{data.experienceSource}</p>}{data.educationSource&&<p className="mt-2 whitespace-pre-wrap">{data.educationSource}</p>}</details>}</div>}
      <label className="block text-sm font-medium">Tên vị trí<input aria-label="Tên vị trí" className={input} required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block text-sm font-medium">Mô tả công việc<textarea aria-label="Mô tả công việc" className={input} rows={4} value={description} onChange={e => setDescription(e.target.value)} /></label>
      <label className="block text-sm font-medium">Kinh nghiệm tối thiểu (năm)<input aria-label="Kinh nghiệm tối thiểu" className={input} type="number" min="0" step="1" required value={minExp} onChange={e => setMinExp(e.target.value)} /></label>
      <div><label className="block text-sm font-medium">Yêu cầu học vấn<select aria-label="Yêu cầu học vấn" className={input} value={education} onChange={e => setEducation(e.target.value)}>{Object.entries(EDUCATION_LEVELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}{!EDUCATION_LEVELS[education]&&<option value={education}>Yêu cầu đã lưu: {education}</option>}</select></label><p className="text-xs text-slate-500 mt-1">Ứng viên có trình độ này hoặc cao hơn sẽ đáp ứng yêu cầu. Chọn “Không yêu cầu” nếu không cần xét bằng cấp.</p></div>
      <div className="border border-slate-200 rounded-lg p-3 text-sm space-y-2">
        <p className="font-semibold">Kỹ năng đã chọn ({requiredSkills.length})</p>
        {requiredSkills.map(s => <p key={s.skillId}>{s.skillName} · {s.mandatory ? 'Bắt buộc' : 'Ưu tiên'} · {skillImportanceLabel(s.weight)}</p>)}
        {!requiredSkills.length && <p className="text-slate-500">Thêm ít nhất một kỹ năng để có thể đánh giá ứng viên.</p>}
        <button type="button" disabled={busy} onClick={() => openModal('skillPick', { title, currentSkills: requiredSkills, onSelect: setRequiredSkills })} className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">Chọn kỹ năng từ từ điển</button>
      </div>
      {error && <p role="alert" className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={dismiss} className="px-4 py-2 border rounded-lg">Hủy</button><button disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu vị trí'}</button></div>
    </form>
  </div>;
}
