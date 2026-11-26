import React,{useState} from 'react';
import JobPdfImport from '../modals/JobPdfImport';
import { useApp } from '../../context/AppContext';
import {educationLabel} from '../../services/educationPresentation';

export default function JdScreen() {
  const [showImport,setShowImport]=useState(false);
  const { jobs, jobsLoading, jobsError, skillsError, refreshJobs, refreshSkills, activeJobId, setActiveJobId, openModal, deleteJob, toggleJobStatus } = useApp();
  const button = 'px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50';
  return <div id="screen-jd" className="h-full flex flex-col gap-4 overflow-auto">
    <div className="bg-white border rounded-xl p-5 flex items-center justify-between gap-3">
      <div><h1 className="font-bold text-lg">Tiêu chí tuyển dụng (JD)</h1><p className="text-sm text-slate-500 mt-1">{jobs.length} vị trí · {jobs.filter(j => j.status === 'OPEN').length} đang tuyển · {jobs.reduce((n, j) => n + j.totalCv, 0)} CV</p></div>
      <div className="flex gap-2 flex-wrap"><button onClick={()=>setShowImport(true)} className={button}>Tạo JD từ PDF</button><button disabled={jobsLoading} onClick={refreshJobs} className={button}>{jobsLoading ? 'Đang tải…' : 'Tải lại'}</button><button onClick={() => openModal('createJd')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">Tạo vị trí mới</button></div>
    </div>
    {jobsError && <div role="alert" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-4 text-sm">{jobsError} <button onClick={refreshJobs} className="underline">Thử lại</button></div>}
    {skillsError && <div role="alert" className="bg-amber-50 text-amber-800 rounded-lg p-4 text-sm">Không tải được từ điển: {skillsError} <button onClick={refreshSkills} className="underline">Thử lại</button></div>}
    {!jobsLoading && !jobsError && !jobs.length && <div className="p-12 text-center text-slate-500 bg-white border rounded-xl">Chưa có vị trí đang tuyển. Tạo vị trí mới để bắt đầu.</div>}
    <div id="jd-cards-grid" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {jobs.map(job => <article key={job.id} className={`bg-white rounded-xl p-5 border space-y-4 shadow-sm ${activeJobId === job.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
        <div className="flex justify-between items-start gap-3"><button className="text-left" onClick={() => setActiveJobId(job.id)}><p className="text-xs text-slate-400">{job.code}</p><h2 className="font-bold text-lg text-slate-900">{job.title}</h2></button><button onClick={() => toggleJobStatus(job.id)} className={`px-2 py-1 rounded text-xs border ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{job.status === 'OPEN' ? 'Đang tuyển' : 'Đã đóng'}</button></div>
        <p className="text-sm text-slate-500 whitespace-pre-wrap line-clamp-4">{job.description || 'Chưa có mô tả.'}</p>
        <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2"><p>Kinh nghiệm tối thiểu: <b>{job.minExp} năm</b></p><p>Học vấn: <b>{educationLabel(job.education)}</b></p><p>Tổng CV: <b>{job.totalCv}</b></p></div>
        <div className="flex flex-wrap gap-2">{job.requiredSkills.map(s => <span key={s.skillId} className={`px-2 py-1 text-xs rounded border ${s.mandatory ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600'}`}>{s.skillName} · {s.mandatory ? 'Bắt buộc' : 'Ưu tiên'} · mức {s.weight}</span>)}{!job.requiredSkills.length && <p className="text-xs text-amber-700">Chưa có kỹ năng, chưa thể chấm điểm.</p>}</div>
        <p className="text-xs text-slate-500">Ưu tiên đánh giá: Kỹ năng {Math.round(job.scoringConfig.w1 * 100)}% · Kinh nghiệm {Math.round(job.scoringConfig.w2 * 100)}% · Học vấn {Math.round(job.scoringConfig.w3 * 100)}%</p>
        <div className="flex gap-2 flex-wrap border-t pt-4">
          <button className={button} onClick={() => openModal('editJd', job)}>Sửa JD</button>
          <button className={button} onClick={() => openModal('skillPick', {jobId: job.id, title: job.title, currentSkills: job.requiredSkills})}>Kỹ năng</button>
          <button className={button} onClick={() => { setActiveJobId(job.id); openModal('weights'); }}>Ưu tiên chấm điểm</button>
          <button className="px-3 py-2 text-rose-600 border border-rose-200 rounded-lg text-sm" onClick={() => openModal('confirm', { title: 'Xóa vị trí này?', body: `Bạn có muốn xóa vị trí "${job.title}" không?`, okText: 'Xóa vị trí', onConfirm: () => deleteJob(job.id) })}>Xóa</button>
        </div>
      </article>)}
    </div>
    {showImport&&<JobPdfImport onClose={()=>setShowImport(false)} onDraft={draft=>{setShowImport(false);openModal('createJd',draft);}}/>}
  </div>;
}
