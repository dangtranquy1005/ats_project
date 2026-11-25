import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ErrorsScreen() {
  const { switchTab } = useApp();

  return (
    <div id="screen-errors" className="h-full w-full flex flex-col gap-3">
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 flex justify-between items-center shrink-0 shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-900">
            Trạng thái lỗi và phiên đăng nhập
          </h2>
          <p className="text-xs text-slate-500">
            401 hết phiên • tài khoản bị khóa • 403 không đủ quyền • 404 không tìm thấy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
        {/* 401 Session Expired */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center gap-2 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold font-mono text-sm">
            <i className="fa-regular fa-clock"></i>
          </div>
          <h3 className="font-bold text-sm text-slate-900">Phiên đăng nhập đã hết hạn</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Đăng nhập lại để tiếp tục. Thay đổi chưa lưu sẽ được giữ lại.
          </p>
          <button
            onClick={() => switchTab('screen-auth')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition mt-1"
          >
            Đăng nhập lại
          </button>
        </div>

        {/* Account Locked */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center gap-2 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold font-mono text-sm">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h3 className="font-bold text-sm text-slate-900">Tài khoản đã bị khóa</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Liên hệ quản trị viên để mở khóa tài khoản này.
          </p>
          <button
            onClick={() => switchTab('screen-auth')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition mt-1"
          >
            Quay lại đăng nhập
          </button>
        </div>

        {/* 403 Forbidden */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center gap-2 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold font-mono text-sm">
            403
          </div>
          <h3 className="font-bold text-sm text-slate-900">Bạn không có quyền vào trang này</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Trang Từ điển kỹ năng chỉ dành cho quản trị viên.
          </p>
          <button
            onClick={() => switchTab('screen-jd')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition mt-1"
          >
            Về danh sách vị trí
          </button>
        </div>

        {/* 404 Not Found */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center gap-2 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold font-mono text-sm">
            404
          </div>
          <h3 className="font-bold text-sm text-slate-900">Không tìm thấy tin hoặc hồ sơ</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Tin này đã bị xóa hoặc không thuộc tài khoản của bạn.
          </p>
          <button
            onClick={() => switchTab('screen-jd')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition mt-1"
          >
            Về danh sách vị trí
          </button>
        </div>
      </div>
    </div>
  );
}
