import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ReportScreen() {
  const {
    candidates,
    activeCandidateKey,
    candidateKeys,
    navigateCandidate,
    approveCV,
    rejectCV,
    switchTab,
    openModal,
    showToast,
    currentZoom,
    adjustZoom,
    resetZoom,
    aiHighlightsEnabled,
    toggleAiHighlights,
    updateCandidateHrNote
  } = useApp();

  const currentCandidate = candidates[activeCandidateKey] || candidates.an;
  const currentIndex = candidateKeys.indexOf(activeCandidateKey) + 1;
  const [hrNote, setHrNote] = useState(currentCandidate.hrNote || '');

  useEffect(() => {
    setHrNote(currentCandidate.hrNote || '');
  }, [activeCandidateKey, currentCandidate.hrNote]);

  const isFailed = currentCandidate.status === 'failed';
  const isReviewed = currentCandidate.reviewStatus === 'REVIEWED';
  const isRejected = currentCandidate.reviewStatus === 'REJECTED';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (activeCandidateKey === 'an') {
      const link = document.createElement('a');
      link.href = '/CV_Nguyen_Van_An_Backend_Developer.pdf';
      link.download = 'CV_Nguyen_Van_An_Backend_Developer.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Tải hồ sơ PDF', 'Đã tải xuống tệp PDF gốc của Nguyễn Văn An.', 'success');
      return;
    }
    const body = [
      currentCandidate.pdfName,
      currentCandidate.pdfTitle,
      currentCandidate.pdfEmail,
      currentCandidate.pdfPhone,
      '',
      currentCandidate.pdfSummary?.replace(/<[^>]+>/g, '') || '',
      '',
      `Học vấn: ${currentCandidate.pdfEduSchool} (${currentCandidate.pdfEduYear})`,
      currentCandidate.pdfEduDegree || ''
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (currentCandidate.pdfFile || 'CV.txt').replace(/\.pdf$/i, '.txt');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Tải hồ sơ', `Đã tải bản trích xuất của ${currentCandidate.pdfFile}.`, 'success');
  };

  return (
    <div id="screen-report" className="h-full w-full flex flex-col gap-3">
      {/* Top Action Bar */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 flex justify-between items-center shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => switchTab('screen-ranking')}
            className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 font-semibold text-xs transition active:scale-98 shadow-xs"
          >
            <i className="fa-solid fa-arrow-left text-[11px]"></i> Quay lại Bảng xếp hạng
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <span className="font-bold text-slate-900 text-sm" id="report-candidate-title">
              {currentCandidate.title}
            </span>
            <span className="text-slate-400 text-xs ml-2">
              Vị trí: Backend Java Developer
            </span>
          </div>
        </div>

        {/* Điều Hướng Ứng Viên & Nút Duyệt / Loại */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 mr-1">
            <button
              onClick={() => navigateCandidate(-1)}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold text-[11px] rounded hover:bg-white transition"
              title="Ứng viên trước"
            >
              <i className="fa-solid fa-chevron-left mr-1"></i> Trước
            </button>
            <span className="px-2 font-semibold text-[11px] text-blue-700 font-mono">
              {currentIndex} / {candidateKeys.length}
            </span>
            <button
              onClick={() => navigateCandidate(1)}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 font-semibold text-[11px] rounded hover:bg-white transition"
              title="Ứng viên tiếp theo"
            >
              Sau <i className="fa-solid fa-chevron-right ml-1"></i>
            </button>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isRejected || isFailed
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isReviewed ? (
              <>
                <i className="fa-solid fa-circle-check"></i> ĐÃ DUYỆT (REVIEWED)
              </>
            ) : isRejected || isFailed ? (
              <>
                <i className="fa-solid fa-circle-xmark"></i> ĐÃ LOẠI
              </>
            ) : (
              <>
                <i className="fa-solid fa-clock"></i> Chờ duyệt
              </>
            )}
          </span>

          <button
            onClick={() => approveCV(activeCandidateKey)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98"
          >
            <i className="fa-solid fa-check"></i> DUYỆT HỒ SƠ (PHỎNG VẤN)
          </button>
          <button
            onClick={() => rejectCV(activeCandidateKey)}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition active:scale-98"
          >
            <i className="fa-solid fa-xmark"></i> LOẠI HỒ SƠ
          </button>
        </div>
      </div>

      {/* Split View 50% - 50% */}
      <div className="grid grid-cols-12 gap-3.5 flex-1 overflow-hidden">
        {/* CỘT TRÁI (6 CỘT): BÓC TÁCH & ĐỐI SOÁT */}
        <div className="col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 overflow-y-auto space-y-4 shadow-xs">
          {/* Candidate Summary Card */}
          <div className="bg-white rounded-xl p-4 text-slate-800 flex justify-between items-center border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-base shadow-xs ${
                  isFailed
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {currentCandidate.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {currentCandidate.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentCandidate.rankColor}`}
                  >
                    {currentCandidate.rankBadge}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5 font-mono">
                  {currentCandidate.contact}
                </p>
                <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                  {currentCandidate.pdfEduSchool} ({currentCandidate.pdfEduYear})
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl p-3 text-center min-w-[90px] border ${
                isFailed
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <span
                className={`text-2xl font-bold font-mono ${
                  isFailed ? 'text-rose-700' : 'text-blue-700'
                }`}
              >
                {currentCandidate.score}
              </span>
              <span
                className={`block text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                  isFailed ? 'text-rose-900/60' : 'text-blue-900/60'
                }`}
              >
                {isFailed ? 'Trạng thái' : 'Điểm tổng kết'}
              </span>
            </div>
          </div>

          {/* Hard filter rejection banner */}
          {isFailed && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>HỒ SƠ BỊ CHẶN TẠI TẦNG 1: BỘ LỌC CỨNG (HARD FILTER)</span>
              </div>
              <p className="text-xs text-rose-600 leading-relaxed pl-5">
                Ứng viên chỉ có <b>0.8 năm kinh nghiệm thực tế</b>, không đạt điều kiện tiên quyết của vị trí (yêu cầu tối thiểu ≥ 2.0 năm). Hệ thống không tiến hành chấm điểm mềm tầng 2.
              </p>
            </div>
          )}

          {/* Kỹ Năng Đáp Ứng */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-layer-group text-blue-600"></i> Kỹ năng chuyên môn đối chiếu
              </h4>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isFailed
                    ? 'text-slate-600 bg-slate-100 border-slate-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {currentCandidate.skillRate}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentCandidate.skills.map((sk, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1.5 border ${
                    sk.pass
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      sk.pass ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-rose-600'
                    } text-[11px]`}
                  ></i>
                  {sk.name}
                  {sk.pass && !sk.name.includes('năm') && (
                    <em
                      className={`not-italic font-mono text-[9px] px-1 rounded bg-white border ${
                        sk.matchType === 'exact'
                          ? 'text-emerald-700 border-emerald-200'
                          : 'text-amber-700 border-amber-300'
                      }`}
                    >
                      {sk.matchType} · {sk.score}
                    </em>
                  )}
                </span>
              ))}

              {currentCandidate.unknownSkills?.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openModal('skillForm', { mode: 'add', skill: { name: u, category: 'Backend', type: 'TECHNICAL' } })}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                  title="Nhấn để bổ sung kỹ năng này vào từ điển chuẩn"
                >
                  <i className="fa-solid fa-flag text-[11px] text-amber-600"></i> {u} · kỹ năng lạ <span className="text-[10px] text-blue-600 font-semibold underline ml-0.5">+ Bổ sung</span>
                </button>
              ))}
            </div>
          </div>

          {/* Diễn giải chi tiết thuật toán */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-brain text-blue-600"></i> Diễn giải thuật toán chấm điểm
            </h4>
            <div
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: currentCandidate.explain }}
            />
            <p className="text-xs text-slate-600 pt-1">
              • <b>Điểm thành phần:</b> Jaccard {currentCandidate.metrics?.jaccard} · Cosine{' '}
              {currentCandidate.metrics?.cosine} · education_score{' '}
              {currentCandidate.metrics?.education} ·{' '}
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  openModal('cvDetail');
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Xem chi tiết thông tin
              </a>
            </p>
          </div>

          {/* Học vấn & Bằng cấp */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-graduation-cap text-blue-600"></i> Học vấn &amp; Bằng cấp
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{currentCandidate.pdfEduSchool}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {currentCandidate.pdfEduYear}
                </span>
              </div>
              <p className="text-slate-600 text-xs">{currentCandidate.pdfEduDegree}</p>
            </div>
          </div>

          {/* Kinh nghiệm làm việc */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-briefcase text-blue-600"></i> Kinh nghiệm làm việc
            </h4>
            <div className="space-y-2 text-xs">
              {currentCandidate.pdfJobs?.map((job, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex justify-between items-start font-bold text-slate-900">
                    <p className="text-blue-900">{job.company}</p>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {job.period}
                    </span>
                  </div>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px] leading-relaxed">
                    {job.duties.map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú nội bộ HR */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1.5">
              <i className="fa-solid fa-pen-nib text-slate-500"></i> Ghi chú nội bộ Hội đồng Tuyển dụng:
            </label>
            <textarea
              value={hrNote}
              onChange={e => setHrNote(e.target.value)}
              placeholder="Nhập ghi chú cho ứng viên này..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none h-16"
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => updateCandidateHrNote(activeCandidateKey, hrNote)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (6 CỘT): PDF CANVAS VIEWER */}
        <div className="col-span-6 bg-slate-100 rounded-xl border border-slate-300 flex flex-col overflow-hidden shadow-xs">
          {/* Toolbar PDF Viewer */}
          <div className="bg-white px-4 py-2 flex justify-between items-center text-xs text-slate-700 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-[11px]">
                <i className="fa-solid fa-file-pdf"></i>
              </span>
              <span className="font-mono text-xs text-slate-900 font-semibold">
                {currentCandidate.pdfFile}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                Đã xác thực
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600 text-xs">
              <button
                type="button"
                onClick={toggleAiHighlights}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition"
              >
                <i
                  className={`fa-solid fa-highlighter ${
                    aiHighlightsEnabled ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                ></i>
                Highlight từ khóa: {aiHighlightsEnabled ? 'BẬT' : 'TẮT'}
              </button>

              <div className="flex items-center bg-slate-100 rounded border border-slate-200 p-0.5">
                <button
                  onClick={() => adjustZoom(-10)}
                  className="hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-200 transition"
                  title="Thu nhỏ"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-800 font-semibold">
                  {currentZoom}%
                </span>
                <button
                  onClick={() => adjustZoom(10)}
                  className="hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-200 transition"
                  title="Phóng to"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
                <button
                  onClick={resetZoom}
                  className="hover:text-slate-900 px-1.5 py-0.5 rounded hover:bg-slate-200 text-[10px] text-slate-500"
                  title="Đặt lại zoom"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
              </div>

              <div className="h-3 w-px bg-slate-200"></div>
              <span className="font-mono text-[11px] text-slate-500">Trang 1 / 1</span>
              <div className="h-3 w-px bg-slate-200"></div>
              <button
                onClick={handlePrint}
                className="hover:text-slate-900 transition"
                title="In tài liệu"
              >
                <i className="fa-solid fa-print"></i>
              </button>
              <button
                onClick={handleDownload}
                className="hover:text-slate-900 transition"
                title="Tải xuống PDF"
              >
                <i className="fa-solid fa-download"></i>
              </button>
            </div>
          </div>

          {/* Vùng Giấy Canvas PDF */}
          <div className="flex-1 p-5 overflow-y-auto flex justify-center bg-slate-200">
            <div
              id="pdf-canvas"
              className={`w-full max-w-lg bg-white rounded shadow-md overflow-hidden border border-slate-300 font-cv text-slate-800 flex flex-col origin-top transition-transform duration-150 ${
                !aiHighlightsEnabled ? 'ai-keywords-disabled' : ''
              }`}
              style={{ transform: `scale(${currentZoom / 100})` }}
            >
              {/* Header CV Navy */}
              <div className="bg-[#1E293B] text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-lg text-white">
                    {currentCandidate.avatar}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                      {currentCandidate.pdfName}
                    </h2>
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mt-0.5">
                      {currentCandidate.pdfTitle}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-300 mt-2 font-mono">
                      <span>
                        <i className="fa-solid fa-envelope text-slate-400 mr-1"></i>
                        {currentCandidate.pdfEmail}
                      </span>
                      <span>
                        <i className="fa-solid fa-phone text-slate-400 mr-1"></i>
                        {currentCandidate.pdfPhone}
                      </span>
                      <span>
                        <i className="fa-solid fa-location-dot text-slate-400 mr-1"></i> Hà Nội
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bố cục thân CV 2 cột */}
              <div className="grid grid-cols-12 flex-1">
                {/* Cột trái 4 cols */}
                <div className="col-span-4 bg-[#F8FAFC] border-r border-slate-200 p-4 space-y-4 text-[10px]">
                  <div>
                    <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b pb-1">
                      <i className="fa-solid fa-code text-blue-600"></i> Kỹ năng chính
                    </h4>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">Backend:</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <span className="ai-keyword">Java (Core, OOP)</span>
                          <span className="ai-keyword">Spring Boot 3</span>
                          <span className="ai-keyword">RESTful API</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">Database:</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <span className="ai-keyword">PostgreSQL</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] uppercase font-bold">DevOps:</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <span className="ai-keyword">Docker</span>
                          <span className="ai-keyword">Git</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b pb-1">
                      <i className="fa-solid fa-graduation-cap text-blue-600"></i> Học vấn
                    </h4>
                    <p className="font-bold text-slate-800">{currentCandidate.pdfEduSchool}</p>
                    <p className="text-slate-500 font-mono text-[9px]">{currentCandidate.pdfEduYear}</p>
                    <p className="text-slate-600 mt-0.5">{currentCandidate.pdfEduDegree}</p>
                  </div>
                </div>

                {/* Cột phải 8 cols */}
                <div className="col-span-8 p-5 space-y-4 text-[11px]">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5 text-xs flex items-center gap-1.5 border-b pb-1">
                      <i className="fa-solid fa-user-tie text-blue-600"></i> Tóm tắt hồ sơ
                    </h4>
                    <p
                      className="text-slate-600 leading-relaxed text-[11px]"
                      dangerouslySetInnerHTML={{ __html: currentCandidate.pdfSummary }}
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-xs flex items-center gap-1.5 border-b pb-1">
                      <i className="fa-solid fa-briefcase text-blue-600"></i> Kinh nghiệm công tác
                    </h4>
                    <div className="space-y-3">
                      {currentCandidate.pdfJobs?.map((job, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                            <span className="text-blue-900">{job.company}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {job.period}
                            </span>
                          </div>
                          <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[10px] leading-relaxed">
                            {job.duties.map((d, dIdx) => (
                              <li key={dIdx}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
