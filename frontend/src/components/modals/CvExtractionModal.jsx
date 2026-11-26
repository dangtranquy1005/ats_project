import React, { useEffect, useState } from 'react';
import { cvAPI, apiError } from '../../services/api';
import { cvStage } from '../../services/cvPresentation';

function date(value, precision) {
  if (!value) return 'Chưa xác định';
  if (precision?.toUpperCase() === 'YEAR') return value.slice(0, 4);
  if (precision?.toUpperCase() === 'MONTH') return value.slice(0, 7);
  return value;
}
export default function CvExtractionModal({ id, onClose }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    cvAPI.detail(id, controller.signal).then(data => { if (!controller.signal.aborted) { setDetail(data); setError(''); } })
      .catch(err => { if (!controller.signal.aborted) setError(apiError(err)); });
    return () => controller.abort();
  }, [id, attempt]);
  return <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center"><div role="dialog" aria-label="Thông tin ứng viên" className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl p-6 space-y-4 select-text">
    <div className="flex justify-between gap-4"><h2 className="font-bold text-lg">Thông tin ứng viên</h2><button onClick={onClose} aria-label="Đóng chi tiết CV">✕</button></div>
    {error && <p role="alert" className="text-rose-700">{error} <button onClick={() => setAttempt(n => n + 1)} className="underline">Thử lại</button></p>}
    {!detail && !error && <p>Đang tải dữ liệu…</p>}
    {detail && <>
      <p className="font-semibold">{detail.cv.filename} · CV #{detail.cv.cvId}</p><p className="text-sm text-slate-500">{cvStage(detail.cv)}</p>
      <dl className="bg-slate-50 rounded-lg p-3 text-sm space-y-2"><div>Ứng viên: <b>{detail.cv.candidateName || 'Chưa xác định'}</b></div><div>Email: {detail.cv.email || 'Chưa xác định'}</div><div>Điện thoại: {detail.phone || 'Chưa xác định'}</div></dl>
      <h3 className="font-semibold">Kỹ năng ({detail.skills.length})</h3><div className="flex flex-wrap gap-2">{detail.skills.map(s => <span key={s.skillId} className="px-2 py-1 text-sm border rounded-lg bg-blue-50 text-blue-800">{s.canonicalName} · {s.matchMethod}</span>)}{!detail.skills.length && <p className="text-sm text-slate-500">Chưa có kỹ năng được nhận diện.</p>}</div>
      <h3 className="font-semibold">Kinh nghiệm ({detail.experiences.length})</h3>
      {detail.experiences.map((e, i) => <div key={i} className="border rounded-lg p-3 text-sm space-y-1"><p className="font-semibold">{e.jobTitle || 'Chưa rõ chức danh'} · {e.companyName || 'Chưa rõ công ty'}</p><p>{date(e.startDate, e.startDatePrecision)} → {e.current ? 'Hiện tại' : date(e.endDate, e.endDatePrecision)}</p><p className="whitespace-pre-wrap text-slate-500">{e.description || e.sourceText}</p></div>)}
      {!detail.experiences.length && <p className="text-sm text-slate-500">Chưa có kinh nghiệm được trích xuất.</p>}
      <h3 className="font-semibold">Học vấn ({detail.educations.length})</h3>
      {detail.educations.map((e, i) => <div key={i} className="border rounded-lg p-3 text-sm"><p className="font-semibold">{e.institution || 'Chưa rõ trường'}</p><p>{e.degree || 'Chưa rõ bằng cấp'} · {e.fieldOfStudy || 'Chưa rõ chuyên ngành'} · {e.graduationYear || 'Chưa rõ năm tốt nghiệp'}</p><p className="text-slate-500 whitespace-pre-wrap">{e.sourceText}</p></div>)}
      {!detail.educations.length && <p className="text-sm text-slate-500">Chưa có học vấn được trích xuất.</p>}
      <p className="text-xs text-slate-500">Thông tin được đọc từ hồ sơ ứng viên. Hãy đối chiếu với bản PDF gốc khi cần.</p>
    </>}
    <div className="text-right"><button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Đóng</button></div>
  </div></div>;
}
