import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useApp} from '../context/AppContext';
import {cvAPI,apiError} from '../services/api';
import {REVIEW_STATES} from '../services/reviewPresentation';
import ReviewBadge from './ReviewBadge';

export default function CvReviewPanel({cvId}) {
  const {setReviewDirty,reviewsChanged,openModal}=useApp();
  const [saved,setSaved]=useState(null);
  const [status,setStatus]=useState('PENDING');
  const [note,setNote]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const mounted=useRef(false),dirtyRef=useRef(false),request=useRef(null),saving=useRef(false);
  const dirty=Boolean(saved&&(status!==saved.reviewStatus||note!==saved.note));
  dirtyRef.current=dirty;
  const load=useCallback(async()=>{
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setLoading(true);setError('');setMessage('');
    try {
      const result=await cvAPI.review(cvId,controller.signal);
      if(controller.signal.aborted||!mounted.current)return;
      setSaved(result);setStatus(result.reviewStatus);setNote(result.note);dirtyRef.current=false;
    } catch(err){if(!controller.signal.aborted&&mounted.current)setError(apiError(err));}
    finally{if(!controller.signal.aborted&&mounted.current)setLoading(false);}
  },[cvId]);
  useEffect(()=>{
    mounted.current=true;load();
    const focus=()=>{if(!dirtyRef.current&&!saving.current)load();};
    window.addEventListener('focus',focus);
    return()=>{mounted.current=false;request.current?.abort();window.removeEventListener('focus',focus);setReviewDirty(false);};
  },[load,setReviewDirty]);
  useEffect(()=>{
    setReviewDirty(dirty);
    if(!dirty)return;
    const beforeUnload=e=>{e.preventDefault();e.returnValue='';};
    window.addEventListener('beforeunload',beforeUnload);
    return()=>window.removeEventListener('beforeunload',beforeUnload);
  },[dirty,setReviewDirty]);
  const reload=()=>{
    if(!dirty){load();return;}
    openModal('confirm',{title:'Tải lại đánh giá?',body:'Bạn có muốn bỏ thay đổi chưa lưu và tải bản mới không?',okText:'Tải bản mới',onConfirm:load});
  };
  const save=async e=>{
    e.preventDefault();if(saving.current||!saved||!dirty)return;
    saving.current=true;setBusy(true);setError('');setMessage('');
    request.current?.abort();
    try {
      const result=await cvAPI.saveReview(cvId,{reviewStatus:status,note,expectedVersion:saved.version});
      if(!mounted.current)return;
      setSaved(result);setStatus(result.reviewStatus);setNote(result.note);dirtyRef.current=false;
      setReviewDirty(false);reviewsChanged();setMessage('Đã lưu đánh giá và ghi chú.');
    } catch(err){if(mounted.current)setError(err.response?.status===409?'Hồ sơ có thay đổi mới. Hãy tải bản mới trước khi lưu.':apiError(err));}
    finally{saving.current=false;if(mounted.current)setBusy(false);}
  };
  return <section className="bg-white border rounded-xl p-5 space-y-4 self-start">
    <div className="flex justify-between items-center gap-3"><h2 className="font-bold">Đánh giá của bạn</h2>{saved&&<ReviewBadge status={saved.reviewStatus}/>}</div>
    <p className="text-sm text-slate-500">Ghi lại nhận xét sau khi đọc hồ sơ để tiện trao đổi và chọn ứng viên.</p>
    {loading&&<p role="status" className="text-sm text-slate-500">Đang tải đánh giá…</p>}
    {error&&<p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-lg p-3">{error} Thay đổi chưa lưu vẫn được giữ trên màn hình.</p>}
    {saved&&<form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy||loading||!saved.canEdit} className="space-y-2"><legend className="text-sm font-semibold mb-2">Bạn đánh giá hồ sơ này thế nào?</legend>{Object.entries(REVIEW_STATES).map(([value,label])=><label key={value} className={`flex items-center gap-3 p-3 border rounded-lg text-sm cursor-pointer ${status===value?'border-blue-400 bg-blue-50 text-blue-900':'border-slate-200'} ${!saved.canReview&&value!=='PENDING'?'opacity-50':''}`}><input type="radio" name={`review-${cvId}`} value={value} checked={status===value} disabled={!saved.canReview&&value!=='PENDING'} onChange={()=>{setStatus(value);setMessage('');}}/>{label}</label>)}</fieldset>
      {!saved.canEdit?<p className="text-sm text-amber-800">Vị trí đã đóng. Bạn vẫn có thể đọc đánh giá đã lưu.</p>:!saved.canReview&&<p className="text-sm text-amber-800">Hãy chờ hồ sơ phân tích xong trước khi chọn đánh giá. Bạn vẫn có thể lưu ghi chú.</p>}
      <div><label htmlFor={`hr-note-${cvId}`} className="block text-sm font-semibold mb-2">Ghi chú tuyển dụng</label><textarea id={`hr-note-${cvId}`} rows={6} maxLength={5000} value={note} disabled={busy||loading||!saved.canEdit} onChange={e=>{setNote(e.target.value);setMessage('');}} placeholder="Ví dụ: Kinh nghiệm phù hợp, cần trao đổi thêm về thời gian nhận việc…" className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-y disabled:bg-slate-50"/><p className="text-xs text-slate-500 text-right">{note.length.toLocaleString('vi-VN')} / 5.000 ký tự</p></div>
      <div className="flex gap-2 flex-wrap"><button disabled={!dirty||busy||loading||!saved.canEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">{busy?'Đang lưu…':'Lưu đánh giá'}</button><button type="button" disabled={busy||loading} onClick={reload} className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50">Tải bản mới</button></div>
      {dirty&&<p className="text-xs text-amber-800">Bạn có thay đổi chưa lưu.</p>}
      {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
      {saved.reviewedAt&&<p className="text-xs text-slate-500">Đánh giá lúc {new Date(saved.reviewedAt).toLocaleString('vi-VN')}</p>}
    </form>}
    {!saved&&!loading&&<button className="text-blue-700 underline text-sm" onClick={load}>Thử lại</button>}
  </section>;
}
