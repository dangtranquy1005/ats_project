import { useState, useEffect, useRef, useCallback } from 'react';
import { cvAPI, apiError } from '../services/api';

// Mỗi màn upload được mount theo jobId; hủy lượt đọc cũ khi chuyển JD/đăng xuất.
export function useCvQueue(jobId, updateJobCvCount) {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [queue, setQueue] = useState({ items: [], totalElements: 0, totalPages: 0, statusCounts: {} });
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const controller = useRef(null);
  const mounted = useRef(false);
  const requestId = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const load = useCallback(async (silent = false) => {
    if (!jobId) return;
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    try {
      const result = await cvAPI.list(jobId, { page, status, size: 10, signal: current.signal });
      if (!mounted.current || id !== requestId.current) return;
      // Xóa hàng cuối trang thì quay về trang hợp lệ trước khi render danh sách mới.
      if (page > 0 && page >= result.totalPages) { setPage(Math.max(0, result.totalPages - 1)); return; }
      setQueue(result); setError('');
      updateJobCvCount(jobId, Object.values(result.statusCounts).reduce((n, count) => n + count, 0));
    } catch (err) {
      if (!current.signal.aborted && mounted.current && id === requestId.current) setError(apiError(err));
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, [jobId, page, status, updateJobCvCount]);
  useEffect(() => { load(); return () => controller.current?.abort(); }, [load, revision]);
  const pending = (queue.statusCounts.PENDING || 0) + (queue.statusCounts.PARSING || 0);
  useEffect(() => {
    if (!jobId) return;
    // Dừng polling khi không còn CV chờ/đang xử lý. Bấm tải lại để nhận CV từ phiên khác.
    const interval = (pending > 0 || error) ? setInterval(() => { if (!document.hidden) load(true); }, error ? 10000 : 3000) : null;
    const focus = () => load(true);
    window.addEventListener('focus', focus);
    return () => { if (interval) clearInterval(interval); window.removeEventListener('focus', focus); };
  }, [jobId, pending, error, load]);
  const refresh = () => { controller.current?.abort(); ++requestId.current; setRevision(n => n + 1); };
  const filter = value => { setStatus(value); setPage(0); };
  return { ...queue, loading, error, page, setPage, status, filter, refresh, mounted };
}
