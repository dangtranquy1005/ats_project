import React from 'react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { jobs, activeJobId, activeJob, setActiveJobId, weights, openModal, toggleJobStatus, activeScreen, switchTab, logout } = useApp();
  return <header className="shrink-0 bg-white border-b px-3 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
    <div className="flex lg:hidden items-center gap-2 w-full">
      <label htmlFor="mobile-screen" className="text-xs text-blue-700 font-bold shrink-0">AutoScreen</label>
      <select id="mobile-screen" aria-label="Màn hình" value={activeScreen} onChange={e=>switchTab(e.target.value)} className="min-w-0 flex-1 border rounded-lg px-2 py-2 text-sm">
        <option value="screen-jd">1. Tiêu chí tuyển dụng</option><option value="screen-upload">2. Tải lên &amp; Xử lý CV</option><option value="screen-ranking">3. Chấm điểm &amp; Xếp hạng</option><option value="screen-report">4. Xem &amp; đánh giá hồ sơ</option><option value="screen-skills">Từ điển kỹ năng</option><option value="screen-account">Tài khoản</option><option value="screen-errors">Thông tin lỗi</option>
      </select>
      <button onClick={logout} className="text-xs text-slate-500 shrink-0">Đăng xuất</button>
    </div>
    <div className="flex gap-2 items-center min-w-0 w-full md:w-auto md:flex-1"><label className="text-sm font-semibold shrink-0" htmlFor="campaign-selector">Vị trí</label>
      <select id="campaign-selector" disabled={!jobs.length} value={activeJobId ?? ''} onChange={e => setActiveJobId(Number(e.target.value))} className="min-w-0 flex-1 border rounded-lg px-2 py-2 text-sm max-w-xs">
        {!jobs.length && <option value="">Chưa có JD</option>}{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
      </select>
      {activeJob && <button onClick={() => toggleJobStatus(activeJob.id)} className="px-2 py-1 border rounded-full text-xs whitespace-nowrap shrink-0">{activeJob.status === 'OPEN' ? 'Đang tuyển' : 'Đã đóng'}</button>}
    </div>
    {activeJob && <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap"><span className="whitespace-nowrap">Tổng CV: <b>{activeJob.totalCv}</b></span><button onClick={() => openModal('weights')} className="px-3 py-2 border rounded-lg text-left max-w-full hover:bg-slate-50"><span className="block text-xs font-semibold">Ưu tiên chấm điểm</span><span className="block text-[11px] text-slate-500">Kỹ năng {Math.round(weights.w1 * 100)}% · Kinh nghiệm {Math.round(weights.w2 * 100)}% · Học vấn {Math.round(weights.w3 * 100)}%</span></button></div>}
  </header>;
}
