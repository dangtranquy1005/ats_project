import React from 'react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { activeJob, weights, openModal, activeScreen, switchTab, logout } = useApp();
  const screenTitles={'screen-jd':'Tiêu chí tuyển dụng','screen-upload':'Tải lên & Xử lý CV','screen-ranking':'Xếp hạng ứng viên','screen-report':'Hồ sơ ứng viên','screen-skills':'Từ điển kỹ năng','screen-account':'Tài khoản','screen-errors':'Kết nối và phiên đăng nhập'};
  return <header className="shrink-0 bg-white border-b px-3 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
    <div className="flex lg:hidden items-center gap-2 w-full">
      <label htmlFor="mobile-screen" className="text-xs text-blue-700 font-bold shrink-0">AutoScreen</label>
      <select id="mobile-screen" aria-label="Màn hình" value={activeScreen} onChange={e=>switchTab(e.target.value)} className="min-w-0 flex-1 border rounded-lg px-2 py-2 text-sm">
        <option value="screen-jd">1. Tiêu chí tuyển dụng</option><option value="screen-upload">2. Tải lên &amp; Xử lý CV</option><option value="screen-ranking">3. Chấm điểm &amp; Xếp hạng</option><option value="screen-report">4. Xem &amp; đánh giá hồ sơ</option><option value="screen-skills">Từ điển kỹ năng</option><option value="screen-account">Tài khoản</option><option value="screen-errors">Thông tin lỗi</option>
      </select>
      <button onClick={logout} className="text-xs text-slate-500 shrink-0">Đăng xuất</button>
    </div>
    <p className="hidden lg:block text-sm font-semibold text-slate-700">{screenTitles[activeScreen]||'Không gian tuyển dụng'}</p>
    {activeJob && <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap"><span className="whitespace-nowrap">Tổng CV: <b>{activeJob.totalCv}</b></span><button onClick={() => openModal('weights')} className="px-3 py-2 border rounded-lg text-left max-w-full hover:bg-slate-50"><span className="block text-xs font-semibold">Ưu tiên chấm điểm</span><span className="block text-[11px] text-slate-500">Kỹ năng {Math.round(weights.w1 * 100)}% · Kinh nghiệm {Math.round(weights.w2 * 100)}% · Học vấn {Math.round(weights.w3 * 100)}%</span></button></div>}
  </header>;
}
