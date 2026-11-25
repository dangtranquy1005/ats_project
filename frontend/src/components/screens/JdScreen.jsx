import React from 'react';
import { useApp } from '../../context/AppContext';

export default function JdScreen() {
  const { jobs, activeJobId, switchTab, openModal, deleteJob, toggleJobStatus, setActiveJobId, showToast } = useApp();

  const handleEdit = (job, e) => {
    if (e) e.stopPropagation();
    openModal('editJd', job);
  };

  const handleDelete = (job, e) => {
    if (e) e.stopPropagation();
    openModal('confirm', {
      title: 'Xóa vị trí tuyển dụng này?',
      body: `Toàn bộ CV, điểm số và tệp PDF gốc của vị trí "${job.title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa vị trí',
      onConfirm: () => deleteJob(job.id)
    });
  };

  return (
    <div id="screen-jd" className="h-full w-full flex flex-col gap-3 overflow-hidden">
      {/* Header Thanh Công Cụ & Tác Vụ Tuyển Dụng */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 flex justify-between items-center shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Bước 1: Quản lý tiêu chí tuyển dụng (Job Description - JD)
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {jobs.length} VỊ TRÍ ĐANG QUẢN TRỊ
              </span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Thiết lập điều kiện lọc cứng (Hard filter), từ điển kỹ năng chuẩn hóa và hệ số trọng số đánh giá
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => switchTab('screen-upload')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <i className="fa-solid fa-cloud-arrow-up text-blue-600"></i> Tiếp nhận hồ sơ (48 CV)
          </button>
          <button
            onClick={() => openModal('createJd')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-98"
          >
            <i className="fa-solid fa-plus text-xs"></i> Tạo vị trí mới
          </button>
        </div>
      </div>

      {/* Dải Thống Kê Nổi Bật Vận Hành Tuyển Dụng (Recruitment KPI Strip) */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-xl border border-blue-100 p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base border border-blue-100">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Chiến dịch tuyển dụng
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {jobs.length < 10 ? `0${jobs.length}` : jobs.length}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {jobs.filter(j => j.status === 'OPEN').length} Đang mở
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-indigo-100 p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-base border border-indigo-100">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Chỉ tiêu nhân sự
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900 font-mono">06</span>
              <span className="text-[11px] font-medium text-slate-500">Người (Đã tuyển 2/6)</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => switchTab('screen-upload')}
          className="bg-white hover:bg-emerald-50/30 rounded-xl border border-emerald-100 hover:border-emerald-300 p-3 flex items-center gap-3 shadow-xs cursor-pointer transition"
          title="Bấm để xem danh sách hồ sơ thu thập"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base border border-emerald-100">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Hồ sơ đã thu thập
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-emerald-700 font-mono">94</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                +18 Tuần này →
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => switchTab('screen-ranking')}
          className="bg-white hover:bg-amber-50/30 rounded-xl border border-amber-100 hover:border-amber-300 p-3 flex items-center gap-3 shadow-xs cursor-pointer transition"
          title="Bấm để xem ứng viên đạt chuẩn xếp hạng"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base border border-amber-100">
            <i className="fa-solid fa-filter-circle-check"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tỷ lệ qua lọc cứng
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900 font-mono">79.8%</span>
              <span className="text-[11px] font-medium text-emerald-600">Đạt chuẩn (75/94) →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Cards Vị Trí Tuyển Dụng */}
      <div id="jd-cards-grid" className="grid grid-cols-3 gap-3.5 flex-1 overflow-y-auto">
        {jobs.map(job => {
          const isOpen = job.status === 'OPEN';
          const isSelected = job.id === activeJobId;
          return (
            <div
              key={job.id}
              onClick={() => {
                setActiveJobId(job.id);
                showToast('Chọn vị trí tuyển dụng', `Đang quản trị vị trí: ${job.title}`, 'info');
              }}
              className={`bg-white rounded-2xl flex flex-col justify-between relative overflow-hidden transition shadow-sm cursor-pointer ${
                isSelected
                  ? 'border-2 border-blue-600 shadow-md ring-4 ring-blue-500/10'
                  : 'border border-slate-200 hover:border-blue-400'
              }`}
            >
              <div
                className={`h-2 w-full ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
                    : isOpen
                    ? 'bg-blue-400'
                    : 'bg-slate-300'
                }`}
              ></div>

              <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                      {job.code}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleJobStatus(job.id);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                        isOpen
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOpen ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      ></span>
                      {isOpen ? 'Đang tuyển' : 'Tạm dừng'}
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug hover:text-blue-600 transition">
                    {job.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Kinh nghiệm tối thiểu:</span>
                      <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        ≥ {job.minExp} năm (Lọc cứng)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Yêu cầu học vấn:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {job.education}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Từ điển kỹ năng:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleEdit(job, e)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 transition"
                      title="Sửa vị trí"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(job, e)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold border border-rose-200 transition"
                      title="Xóa vị trí"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('skillPick', {
                          jobId: job.id,
                          title: job.title,
                          skills: job.skills
                        });
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                      title="Cấu hình kỹ năng JD"
                    >
                      <i className="fa-solid fa-sliders"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveJobId(job.id);
                      switchTab('screen-upload');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-98 flex items-center gap-1"
                  >
                    Tiếp nhận CV <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
