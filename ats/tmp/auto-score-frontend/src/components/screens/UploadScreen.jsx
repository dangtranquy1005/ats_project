import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { cvAPI, apiError } from '../../services/api';
import { CV_STATES, cvStage, isProcessing, validateFiles } from '../../services/cvPresentation';
import { useCvQueue } from '../../hooks/useCvQueue';
import CvExtractionModal from '../modals/CvExtractionModal';
import ReviewBadge from '../ReviewBadge';

export default function UploadScreen() {
  const { activeJob, activeJobId, updateJobCvCount, openModal, showToast, switchTab, openScoreReport } = useApp();
  const queue = useCvQueue(activeJobId, updateJobCvCount, activeJob?.status === 'OPEN' && Boolean(activeJob?.requiredSkills.length));
  const fileInput = useRef(null);
  const uploadingRef = useRef(false);
  const operations = useRef(new Set());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [busyIds, setBusyIds] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const canUpload = activeJob?.status === 'OPEN' && !uploading;
  const counts = queue.statusCounts;
  const total = Object.values(counts).reduce((n, count) => n + count, 0);
  const completed = (counts.PARSED || 0) + (counts.SCORED || 0) + (counts.REVIEWED || 0);
  const button = 'px-3 py-2 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';

  const upload = async files => {
    if (uploadingRef.current || !activeJobId || activeJob?.status !== 'OPEN') return;
    const checked = validateFiles(files);
    if (!checked.length) return;
    if (checked.length > 50) { setUploadError('Mỗi lượt chọn tối đa 50 file.'); return; }
    const entries = checked.map(({file, error}, i) => ({key: i, filename: file.name, error, state: error ? 'rejected' : 'waiting'}));
    setReceipts(entries); setUploadError(''); setUploading(true); uploadingRef.current = true;
    let accepted = 0;
    try {
      // Một file/request: không vượt tổng multipart 30 MB, lỗi từng file không làm mất kết quả khác.
      for (let i = 0; i < checked.length; i++) {
        const {file, error} = checked[i];
        if (error) continue;
        if (!queue.mounted.current) break;
        setReceipts(prev => prev.map(r => r.key === i ? {...r, state:'uploading'} : r));
        setProgress(`Đang gửi ${i + 1}/${checked.length}: ${file.name}`);
        try {
          const results = await cvAPI.upload(activeJobId, [file], event => {
            if (queue.mounted.current && event.total) setProgress(`Đang gửi ${i + 1}/${checked.length}: ${Math.round(event.loaded * 100 / event.total)}%`);
          });
          if (!queue.mounted.current) break;
          const result = results?.[0];
          if (!result || typeof result.success !== 'boolean') throw new Error('Phản hồi upload không hợp lệ.');
          if (result.success) accepted++;
          setReceipts(prev => prev.map(r => r.key === i ? {...r, state:result.success ? 'accepted' : 'rejected', cvId:result.cvId,
            error:result.errorMessage || (!result.success ? 'Không thể tiếp nhận tệp này.' : '')} : r));
          queue.refresh();
        } catch (err) {
          if (!queue.mounted.current) break;
          const message = err.response ? apiError(err) : 'Chưa xác nhận được kết quả gửi. Hãy tải lại danh sách trước khi gửi lại để tránh trùng CV.';
          setReceipts(prev => prev.map(r => r.key === i ? {...r, state:err.response ? 'rejected' : 'unknown', error:message} : r.state === 'waiting' ? {...r,state:'cancelled',error:'Chưa gửi.'} : r));
          setUploadError(message);
          // Không tự gửi lại POST khi timeout/mất kết nối: server có thể đã lưu CV.
          break;
        }
      }
      if (queue.mounted.current) {
        queue.refresh();
        if (accepted) showToast('Đã tiếp nhận CV', `${accepted} file đã được tiếp nhận. Bạn có thể theo dõi tiến độ ngay bên dưới.`, 'success');
      }
    } finally {
      uploadingRef.current = false;
      if (queue.mounted.current) { setUploading(false); setProgress(''); }
    }
  };

  const operation = async (cv, type) => {
    if (operations.current.has(cv.cvId)) return;
    operations.current.add(cv.cvId); setBusyIds(prev => [...prev, cv.cvId]);
    try {
      if (type === 'retry') {
        await cvAPI.retry(cv.cvId);
        if (queue.mounted.current) { queue.refresh(); showToast('Đã yêu cầu thử lại', 'Hồ sơ đang được xử lý lại.', 'info'); }
      } else if (type === 'delete') {
        await cvAPI.delete(cv.cvId);
        if (queue.mounted.current) { queue.refresh(); showToast('Đã xóa CV', 'Đã xóa hồ sơ ứng viên.', 'success'); }
      } else {
        const blob = await cvAPI.file(cv.cvId);
        if (!queue.mounted.current) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = cv.filename; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      const message = apiError(err);
      if (queue.mounted.current) { showToast('Thao tác thất bại', message, 'error'); queue.refresh(); }
      if (type === 'delete') throw new Error(message);
    } finally {
      operations.current.delete(cv.cvId);
      if (queue.mounted.current) setBusyIds(prev => prev.filter(id => id !== cv.cvId));
    }
  };

  if (!activeJob) return <div className="bg-white border rounded-xl p-8 text-sm">Hãy chọn hoặc tạo JD trước khi tải CV. <button onClick={() => switchTab('screen-jd')} className="text-blue-600 underline">Quản lý JD</button></div>;
  return <div id="screen-upload" className="h-full overflow-auto flex flex-col gap-4">
    <div className="bg-white border rounded-xl p-5 space-y-3 shrink-0">
      <div className="flex items-center justify-between gap-3"><div><h1 className="font-bold text-lg">Tải lên &amp; Xử lý CV</h1><p className="text-sm text-slate-500">{activeJob.title} · Tải hồ sơ và theo dõi quá trình đọc thông tin</p></div><button className={button} disabled={queue.loading} onClick={queue.refresh}>Tải lại danh sách</button></div>
      {activeJob.status !== 'OPEN' && <p role="alert" className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">JD đã đóng. Hãy mở JD để nhận thêm CV; vẫn có thể xem hoặc thử lại hồ sơ cũ.</p>}
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (canUpload) upload(e.dataTransfer.files); }} className={`p-6 border-2 border-dashed rounded-xl text-center ${canUpload ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-slate-50'}`}>
        <input aria-label="Chọn tệp CV PDF" ref={fileInput} type="file" multiple accept=".pdf,application/pdf" disabled={!canUpload} className="hidden" onChange={e => { const files = Array.from(e.target.files || []); e.target.value=''; upload(files); }} />
        <button disabled={!canUpload} onClick={() => fileInput.current?.click()} className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg disabled:opacity-50">{uploading ? 'Đang tải lên…' : 'Chọn tệp PDF'}</button>
        <p className="text-xs text-slate-500 mt-3">Kéo thả hoặc chọn tối đa 50 file/lượt · 10 MB/file · gửi lần lượt từng file.</p>
        {uploading && <p role="status" className="text-sm text-blue-700 mt-2">{progress} · Giữ màn hình này mở đến khi gửi xong.</p>}
      </div>
      {uploadError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg">{uploadError}</p>}
      {receipts.length > 0 && <div className="text-xs border rounded-lg max-h-40 overflow-auto divide-y">{receipts.map(r => <p key={r.key} className={`p-2 ${r.state === 'accepted' ? 'text-emerald-700' : r.error ? 'text-rose-700' : 'text-slate-600'}`}>{r.filename} · {r.state === 'accepted' ? `Đã tiếp nhận · CV #${r.cvId}` : r.state === 'uploading' ? 'Đang gửi' : r.state === 'waiting' ? 'Chờ gửi' : r.state === 'unknown' ? 'Chưa xác nhận' : r.state === 'cancelled' ? 'Chưa gửi' : 'Bị từ chối'}{r.error && ` · ${r.error}`}</p>)}</div>}
    </div>
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Tiến trình xử lý hồ sơ</h2><button className={button} onClick={() => switchTab('screen-ranking')}>Chấm điểm &amp; Xếp hạng</button><p className="text-xs text-slate-500">{completed}/{total} đã phân tích · {counts.PENDING || 0} chờ · {counts.PARSING || 0} đang xử lý · {counts.PARSED_FAILED || 0} lỗi</p></div>
      <div className="flex flex-wrap justify-between gap-3"><label className="text-sm">Trạng thái <select aria-label="Lọc trạng thái CV" value={queue.status} onChange={e => queue.filter(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">Tất cả</option>{Object.entries(CV_STATES).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><p className="text-xs text-slate-500 self-center">Tự cập nhật khi hồ sơ đang được đọc hoặc chờ chấm điểm.</p></div>
      {queue.error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg">{queue.error} Dữ liệu đang hiển thị có thể chưa mới nhất. <button className="underline" onClick={queue.refresh}>Thử lại</button></p>}
      {queue.loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách CV…</p>}
      {!queue.loading && !queue.error && !queue.items.length && <p className="p-8 text-center text-sm text-slate-500">Chưa có CV phù hợp với bộ lọc.</p>}
      <div className="divide-y">{queue.items.map(cv => <article key={cv.cvId} className="py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-sm break-all">{cv.filename} <span className="text-slate-400 font-normal">#{cv.cvId}</span></h3><p className="text-xs text-slate-500 mt-1">{cv.candidateName || 'Chưa xác định ứng viên'} · {cv.uploadedAt?.replace('T',' ').slice(0,19)}</p></div><span className={`text-xs px-2 py-1 border rounded-full ${cv.status === 'PARSED_FAILED' ? 'text-rose-700 bg-rose-50 border-rose-200' : isProcessing(cv.status) ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>{CV_STATES[cv.status] || cv.status}</span></div>
        <ReviewBadge status={cv.reviewStatus}/>
        <p className={`text-sm select-text ${cv.status === 'PARSED_FAILED' ? 'text-rose-700' : 'text-slate-500'}`}>{cvStage(cv)}</p>
        <div className="flex gap-2 flex-wrap"><button className={button} disabled={busyIds.includes(cv.cvId)} onClick={() => openScoreReport(cv.cvId,'screen-upload')}>Xem &amp; đánh giá</button><button className={button} onClick={() => setDetailId(cv.cvId)}>Thông tin CV</button><button className={button} disabled={busyIds.includes(cv.cvId)} onClick={() => operation(cv,'download')}>Tải PDF gốc</button>
          {cv.status === 'PARSED_FAILED' && <button className={button} disabled={busyIds.includes(cv.cvId)} onClick={() => operation(cv,'retry')}>Thử lại</button>}
          <button className={`${button} text-rose-600`} disabled={busyIds.includes(cv.cvId) || cv.status === 'PARSING'} title={cv.status === 'PARSING' ? 'Chờ CV xử lý xong trước khi xóa' : 'Xóa hồ sơ và PDF gốc'} onClick={() => openModal('confirm', { title:'Xóa CV?', body:`Bạn có muốn xóa hồ sơ "${cv.filename}" không?`, okText:'Xóa CV', onConfirm:() => operation(cv,'delete') })}>Xóa CV</button>
        </div>
      </article>)}</div>
      <div className="flex items-center justify-end gap-3 text-xs border-t pt-3"><span>{queue.totalElements} hồ sơ · Trang {queue.page + 1}/{Math.max(1,queue.totalPages)}</span><button className={button} disabled={queue.page === 0 || queue.loading} onClick={() => queue.setPage(p => p - 1)}>Trang trước</button><button className={button} disabled={queue.page + 1 >= queue.totalPages || queue.loading} onClick={() => queue.setPage(p => p + 1)}>Trang sau</button></div>
    </div>
    {detailId && <CvExtractionModal id={detailId} onClose={() => setDetailId(null)} />}
  </div>;
}
