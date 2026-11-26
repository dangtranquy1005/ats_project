import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { activeScreen, switchTab, user, logout, jobs, scoreReport } = useApp();

  const workflowItems = [
    {
      id: 'screen-jd',
      title: 'Tiêu chí tuyển dụng (JD)',
      icon: 'fa-briefcase'
    },
    {
      id: 'screen-upload',
      title: 'Tải lên & Xử lý CV',
      icon: 'fa-cloud-arrow-up'
    },
    {
      id: 'screen-ranking',
      title: 'Bảng xếp hạng ứng viên',
      icon: 'fa-ranking-star'
    }
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-68 bg-white text-slate-700 hidden lg:flex flex-col justify-between shrink-0 z-30 border-r border-slate-200/90 shadow-xs relative"
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => switchTab('screen-jd')}>
            {/* Vector Logo Squircle Brand Mark */}
            <svg
              viewBox="0 0 120 120"
              className="w-9 h-9 rounded-xl shrink-0 shadow-xs"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="asPrimaryGrad_nav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <filter id="cardShadow_nav" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.18" />
                </filter>
              </defs>
              <rect width="120" height="120" rx="30" fill="url(#asPrimaryGrad_nav)" />
              <rect x="38" y="24" width="44" height="58" rx="8" fill="#FFFFFF" fillOpacity="0.3" />
              <rect x="31" y="32" width="58" height="58" rx="10" fill="#FFFFFF" fillOpacity="0.5" />
              <rect x="24" y="40" width="72" height="56" rx="12" fill="#FFFFFF" filter="url(#cardShadow_nav)" />
              <rect x="34" y="52" width="28" height="4" rx="2" fill="#2563EB" />
              <rect x="34" y="60" width="44" height="4" rx="2" fill="#94A3B8" />
              <rect x="34" y="68" width="24" height="4" rx="2" fill="#CBD5E1" />
              <circle cx="78" cy="74" r="14" fill="#059669" />
              <path
                d="M72 74L76 78L84 70"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-[14px] tracking-tight text-slate-900 leading-none">
                  AutoScreen
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  ATS PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Tuyển dụng & Sàng lọc CV</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200 font-semibold">
            v2.4
          </span>
        </div>

        {/* Điều hướng quy trình tuyển dụng */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Chức năng
            </p>
          </div>

          {workflowItems.map((item) => {
            const isActive = activeScreen === item.id || (activeScreen === 'screen-report' && (scoreReport?.source || 'screen-ranking') === item.id);
            return (
              <button
                key={item.id}
                onClick={() => switchTab(item.id)}
                className={`nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} text-xs`}></i>
                  </span>
                  <span className="text-left">{item.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Quản trị hệ thống */}
        <div className="px-3 mt-3">
          <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 tracking-wider">
            QUẢN TRỊ HỆ THỐNG
          </p>
          <button
            onClick={() => switchTab('screen-skills')}
            className={`nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs group ${
              activeScreen === 'screen-skills'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                  activeScreen === 'screen-skills'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                }`}
              >
                <i className="fa-solid fa-book-open text-xs"></i>
              </span>
              <span className="text-left">Từ điển kỹ năng</span>
            </span>
          </button>
        </div>

        <div className="px-4 py-3.5 mx-3 mt-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <p className="font-bold text-slate-800">Tổng quan tuyển dụng</p>
          <p>Vị trí đang tuyển: <b>{jobs.filter(j => j.status === 'OPEN').length}</b></p>
          <p>Hồ sơ đã tiếp nhận: <b>{jobs.reduce((total, j) => total + j.totalCv, 0)}</b></p>
        </div>
      </div>

      {/* User Profile & Logged Account */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div
          onClick={() => switchTab('screen-account')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Xem thông tin tài khoản"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition">
              HR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-slate-900 text-xs group-hover:text-blue-600 transition">
              {user?.fullName || user?.email}
            </p>
            <p className="text-[10px] text-slate-500">
              {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhà tuyển dụng'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Đăng xuất tài khoản"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition"
        >
          <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
        </button>
      </div>
    </aside>
  );
}
