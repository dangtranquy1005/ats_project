import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const PAGE_SIZE = 4;

export default function UploadScreen() {
  const { uploadQueue, handleUploadFiles, switchTab, openModal, showToast, deleteCV, selectCandidateForReport } = useApp();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);

  const filteredQueue = uploadQueue.filter(item => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'REJECTED') return item.status === 'REJECTED' || item.status === 'FAILED';
    return item.status === filterStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredQueue.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, uploadQueue.length]);

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div id="screen-upload" className="h-full w-full flex flex-col gap-3.5">
      {/* Top Row: Upload Dropzone & 4-Step Pipeline */}
      <div className="grid grid-cols-12 gap-3.5 shrink-0">
        {/* Dropzone Tải lên */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="col-span-5 bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 flex items-center gap-4 transition cursor-pointer group shadow-xs"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept=".pdf"
            onChange={onFileInputChange}
          />

          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
              Kéo thả danh sách tệp CV (.PDF) vào đây
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tải lên 20 - 50 file PDF cùng lúc • Dung lượng tối đa 10MB/file
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold shadow-xs">
                Chọn tệp từ máy tính
              </span>
              <span className="text-[11px] text-slate-400">Định dạng chuẩn PDF</span>
            </div>
          </div>
        </div>

        {/* 4-Step Pipeline Process Visualizer */}
        <div className="col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-xs">Nhận file PDF</p>
              <p className="text-[11px] text-slate-400">Kiểm tra định dạng</p>
            </div>
          </div>

          <i className="fa-solid fa-chevron-right text-slate-300"></i>

          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-xs">Đọc nội dung CV</p>
              <p className="text-[11px] text-slate-400">Lấy thông tin từ PDF</p>
            </div>
          </div>

          <i className="fa-solid fa-chevron-right text-slate-300"></i>

          <div
            onClick={() => switchTab('screen-skills')}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition"
            title="Bấm để xem danh sách kỹ năng"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-xs">Tìm kỹ năng</p>
              <p className="text-[11px] text-slate-400">Kỹ năng &amp; Kinh nghiệm →</p>
            </div>
          </div>

          <i className="fa-solid fa-chevron-right text-slate-300"></i>

          <div
            onClick={() => switchTab('screen-ranking')}
            className="flex items-center gap-3 cursor-pointer hover:bg-emerald-50/50 p-1.5 rounded-lg transition"
            title="Bấm để xem Bảng xếp hạng ứng viên"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-xs">Lưu &amp; Xếp hạng</p>
              <p className="text-[11px] text-slate-400">Chuyển sang bảng điểm →</p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 flex-1 flex flex-col overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-bold text-slate-800 text-xs">
              Tiến trình xử lý hồ sơ
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <i className="fa-solid fa-circle-check text-emerald-600"></i> Đã xử lý 45/48 hồ sơ • 1 đang xử lý • 1 chờ • 1 lỗi
            </span>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setPage(1);
                showToast('Làm mới hàng đợi', `Đang hiển thị ${uploadQueue.length} hồ sơ trong hàng đợi.`, 'info');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <i className="fa-solid fa-rotate-right"></i> Làm mới tiến trình
            </button>
          </div>
        </div>

        <div id="upload-queue-list" className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
          {/* Filter Bar */}
          <div className="sticky top-0 z-10 bg-white px-5 py-2 flex items-center justify-between gap-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PROCESSING', label: 'Đang xử lý' },
                { key: 'PROCESSED', label: 'Hoàn thành' },
                { key: 'REJECTED', label: 'Thất bại' }
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setFilterStatus(st.key)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                    filterStatus === st.key
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="hidden xl:inline">
                Tự động cập nhật trạng thái xử lý
              </span>
              <button
                type="button"
                onClick={() => openModal('cvDetail')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-blue-600 font-semibold hover:bg-slate-50 transition"
              >
                Chi tiết thông tin
              </button>
              <span>Trang {safePage}/{totalPages}</span>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Trang trước"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Trang sau"
              >
                ›
              </button>
            </div>
          </div>

          {/* Queue Rows */}
          {pageItems.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-500 text-xs">
              Không có hồ sơ nào trong bộ lọc này.
            </div>
          )}

          {pageItems.map((item, idx) => {
            const isRejected = item.status === 'REJECTED' || item.status === 'FAILED';
            const isProcessed = item.status === 'PROCESSED';
            const isProcessing = item.status === 'PROCESSING';
            const statusLabel = isRejected
              ? 'Thất bại'
              : isProcessed
              ? 'Hoàn thành'
              : isProcessing
              ? 'Đang xử lý'
              : 'Đang chờ';

            const handleRowClick = () => {
              if (item.candidateKey) {
                selectCandidateForReport(item.candidateKey);
              } else if (isRejected) {
                showToast('Xử lý thất bại', item.note, 'warning');
              } else if (isProcessing) {
                showToast('Tiến trình xử lý', 'Hệ thống đang đọc và xử lý tệp này...', 'info');
              } else {
                switchTab('screen-ranking');
              }
            };

            return (
              <div
                key={item.id || idx}
                onClick={handleRowClick}
                className={`px-5 py-3.5 flex items-center justify-between transition cursor-pointer ${
                  isRejected ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base shrink-0 ${
                      isRejected
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : isProcessed
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        isRejected ? 'fa-file-circle-xmark' : 'fa-file-pdf'
                      }`}
                    ></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.size})
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        isRejected
                          ? 'text-rose-600'
                          : isProcessed
                          ? 'text-emerald-600'
                          : 'text-blue-700'
                      }`}
                    >
                      {isProcessing && <i className="fa-solid fa-spinner fa-spin mr-1"></i>}
                      {isProcessed && <i className="fa-solid fa-circle-check mr-1"></i>}
                      {item.note}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  {item.time && (
                    <span className="text-slate-400 font-mono text-xs">{item.time}</span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isProcessed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {statusLabel}
                  </span>

                  {isProcessed && (
                    <>
                      <button
                        type="button"
                        onClick={() => openModal('cvDetail', item)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-md text-xs transition"
                        title="Xem thông tin đã đọc từ CV"
                      >
                        <i className="fa-solid fa-file-lines text-slate-400 mr-1"></i> Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.candidateKey) selectCandidateForReport(item.candidateKey);
                          else switchTab('screen-ranking');
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md text-xs transition"
                      >
                        {item.candidateKey ? 'Xem kết quả →' : 'Xếp hạng →'}
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      onClick={() => showToast('Chi tiết lỗi', item.note, 'warning')}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold rounded-md text-xs transition"
                      title="Xem lý do thất bại"
                    >
                      Xem lỗi
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openModal('confirm', {
                      title: 'Xóa CV ứng viên?',
                      body: `Hồ sơ "${item.name}" sẽ bị gỡ khỏi hàng đợi xử lý.`,
                      okText: 'Xóa CV',
                      onConfirm: () => deleteCV(item.id)
                    })}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-xs font-semibold border border-rose-200 transition"
                    title="Xóa CV khỏi hàng đợi"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
