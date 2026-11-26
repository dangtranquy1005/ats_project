import React,{useId} from 'react';
import {useApp} from '../context/AppContext';

export default function JobSelector({context='upload',disabled=false}){
  const {jobs,activeJobId,setActiveJobId,jobsLoading,jobsError,refreshJobs,switchTab}=useApp();
  const id=useId();
  return <section className="shrink-0 rounded-xl border-2 border-blue-200 bg-blue-50/70 p-4 sm:p-5 space-y-3">
    <div className="flex items-start justify-between gap-3 flex-wrap"><div><label htmlFor={id} className="block text-base font-bold text-slate-900">Chọn vị trí tuyển dụng</label><p id={`${id}-hint`} className="text-sm text-slate-600 mt-1">{context==='ranking'?'Xem xếp hạng ứng viên của vị trí bạn muốn đánh giá.':'CV tải lên sẽ được gắn với vị trí bạn chọn bên dưới.'}</p></div><button type="button" onClick={()=>switchTab('screen-jd')} className="text-sm text-blue-700 font-medium underline underline-offset-2">Quản lý vị trí</button></div>
    <select id={id} aria-describedby={`${id}-hint`} value={activeJobId??''} disabled={disabled||jobsLoading||!jobs.length} onChange={e=>{if(e.target.value)setActiveJobId(Number(e.target.value));}} className="block w-full min-w-0 rounded-xl border-2 border-blue-400 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed">
      {(!jobs.length||!activeJobId)&&<option value="">{jobsLoading?'Đang tải vị trí…':jobs.length?'Chọn một vị trí':'Chưa có vị trí đang tuyển'}</option>}
      {jobs.map(job=><option key={job.id} value={job.id}>{job.title} · {job.totalCv??0} CV</option>)}
    </select>
    {disabled&&<p className="text-xs text-blue-800" role="status">Chờ thao tác hiện tại hoàn tất trước khi đổi vị trí.</p>}
    {jobsError&&<p role="alert" className="text-sm text-rose-700">{jobsError} <button type="button" disabled={jobsLoading} onClick={refreshJobs} className="underline">Thử tải lại vị trí</button></p>}
    {!jobsLoading&&!jobsError&&!jobs.length&&<p className="text-sm text-slate-600">Chưa có vị trí đang tuyển. Mở Quản lý vị trí để tạo vị trí hoặc tải JD từ PDF.</p>}
  </section>;
}
