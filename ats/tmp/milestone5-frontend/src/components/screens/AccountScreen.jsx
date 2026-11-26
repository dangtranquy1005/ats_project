import React from 'react';
import { useApp } from '../../context/AppContext';

export default function AccountScreen() {
  const { user, switchTab, logout } = useApp();

  return (
    <div id="screen-account" className="h-full w-full flex flex-col gap-3 items-center overflow-auto p-4">
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs w-full max-w-xl p-6 space-y-5 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user.fullName ? user.fullName.split(' ').map(n => n[0]).slice(-2).join('') : 'HR'}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-slate-900">{user.fullName || 'Chưa cập nhật'}</h2>
            <p className="text-xs text-slate-500 font-mono">{user.email || 'Chưa cập nhật'}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            {user.role || 'RECRUITER'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
              {user.fullName || 'Chưa cập nhật'}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium font-mono">
              {user.email || 'Chưa cập nhật'}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vai trò</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
              {user.role==='ADMIN'?'Quản trị viên':'Nhà tuyển dụng'}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trạng thái tài khoản</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang hoạt động
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Phiên đăng nhập hiện tại</p>
            <p className="text-slate-500 mt-0.5">Bạn cần đăng nhập lại khi phiên hết hạn.</p>
          </div>
          <button
            onClick={() => switchTab('screen-errors')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition"
          >
            Xem trạng thái phiên
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
