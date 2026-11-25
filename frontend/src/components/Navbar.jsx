import React from 'react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { jobs, activeJobId, setActiveJobId, weights, openModal, showToast, switchTab, toggleJobStatus } = useApp();

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0];
  const isJobOpen = activeJob?.status === 'OPEN';

  const handleCampaignChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setActiveJobId(id);
    const chosen = jobs.find(j => j.id === id);
    if (chosen) {
      showToast('Chuyển vị trí', `Đang xem hồ sơ và tiêu chí của: ${chosen.title}`, 'info');
    }
  };

  const w1Pct = Math.round(weights.w1 * 100);
  const w2Pct = Math.round(weights.w2 * 100);
  const w3Pct = Math.round(weights.w3 * 100);

  return (
    <header
      id="app-topbar"
      className="h-16 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between gap-2 shrink-0 z-20 min-w-0"
    >
      {/* Lựa Chọn Vị Trí Tuyển Dụng */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 whitespace-nowrap shrink-0">
          <i className="fa-solid fa-briefcase text-slate-500"></i>
          <span>Vị trí:</span>
        </div>

        <div className="relative min-w-0">
          <select
            id="campaign-selector"
            value={activeJobId}
            onChange={handleCampaignChange}
            className="font-bold text-slate-800 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs border border-slate-300 cursor-pointer outline-none transition pr-7 appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs max-w-[200px] xl:max-w-[260px] truncate"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-2.5 pointer-events-none text-slate-400 text-[10px]"></i>
        </div>

        <button
          type="button"
          onClick={() => toggleJobStatus(activeJobId)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-98 whitespace-nowrap shrink-0 ${
            isJobOpen
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
          }`}
          title="Bấm để bật / tắt trạng thái nhận hồ sơ"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isJobOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          {isJobOpen ? 'Đang nhận hồ sơ' : 'Tạm dừng nhận hồ sơ'}
        </button>
      </div>

      {/* Khối Thống Kê Nhanh & Trọng Số Chấm Điểm */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs text-slate-600 font-medium whitespace-nowrap">
          <button
            type="button"
            onClick={() => switchTab('screen-upload')}
            className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer whitespace-nowrap"
            title="Bấm để đến danh sách tiếp nhận CV"
          >
            <i className="fa-solid fa-file-pdf text-slate-400"></i>
            <span>Tổng CV:</span>
            <b className="text-slate-900 font-mono text-xs ml-0.5">48</b>
          </button>
          <div className="h-3.5 w-px bg-slate-200"></div>
          <button
            type="button"
            onClick={() => switchTab('screen-ranking')}
            className="flex items-center gap-1 hover:text-emerald-700 transition cursor-pointer whitespace-nowrap"
            title="Bấm để đến bảng xếp hạng ứng viên"
          >
            <i className="fa-solid fa-filter text-emerald-600"></i>
            <span>Đạt lọc:</span>
            <b className="text-emerald-700 font-mono text-xs ml-0.5">
              38 <span className="font-normal text-emerald-600">(79%)</span>
            </b>
          </button>
          <div className="h-3.5 w-px bg-slate-200"></div>
          <button
            type="button"
            onClick={() => switchTab('screen-ranking')}
            className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer whitespace-nowrap"
            title="Bấm để đến bảng xếp hạng ứng viên"
          >
            <i className="fa-solid fa-chart-line text-blue-600"></i>
            <span>Điểm TB:</span>
            <b className="text-slate-900 font-mono text-xs ml-0.5">76.4</b>
          </button>
        </div>

        {/* Nút Trọng Số Cấu Hình */}
        <button
          onClick={() => openModal('weights')}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-xs active:scale-98 whitespace-nowrap shrink-0"
        >
          <i className="fa-solid fa-sliders text-blue-600"></i>
          <span id="topbar-weight-text">
            {w1Pct}% / {w2Pct}% / {w3Pct}%
          </span>
        </button>

        {/* Nút Thông Báo */}
        <button
          onClick={() =>
            showToast(
              'Thông báo hệ thống',
              'Đã xử lý xong 48/48 CV của đợt tuyển dụng hiện tại.',
              'success'
            )
          }
          className="w-9 h-9 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition border border-slate-200 relative shadow-xs"
        >
          <i className="fa-regular fa-bell text-xs"></i>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      </div>
    </header>
  );
}
