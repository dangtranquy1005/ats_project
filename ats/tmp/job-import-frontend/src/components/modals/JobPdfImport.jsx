import React,{useEffect,useRef,useState} from 'react';
import {jobAPI,apiError} from '../../services/api';

export default function JobPdfImport({onClose,onDraft}){
  const [file,setFile]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const controller=useRef(null),mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  const submit=async e=>{
    e.preventDefault();if(controller.current)return;
    if(!file||!file.name.toLowerCase().endsWith('.pdf')||file.size===0||file.size>10*1024*1024){setError('Chọn một tệp PDF không rỗng, tối đa 10 MB.');return;}
    const abort=new AbortController();controller.current=abort;setBusy(true);setError('');
    try{const draft=await jobAPI.importPdf(file,abort.signal);if(mounted.current&&!abort.signal.aborted)onDraft({...draft,imported:true,sourceFilename:file.name});}
    catch(err){if(mounted.current&&!abort.signal.aborted)setError(apiError(err));}
    finally{controller.current=null;if(mounted.current)setBusy(false);}
  };
  return <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50"><form role="dialog" aria-modal="true" aria-label="Tạo JD từ PDF" onSubmit={submit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"><h2 className="text-lg font-bold">Tạo JD từ PDF</h2><p className="text-sm text-slate-500">Chọn bản mô tả tuyển dụng. Sau khi đọc xong, bạn sẽ kiểm tra và sửa thông tin trong form trước khi lưu vị trí.</p><label className="block text-sm font-medium">Tệp JD PDF<input aria-label="Tệp JD PDF" type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}} className="block w-full border rounded-lg p-3 mt-2 text-sm"/></label><p className="text-xs text-slate-500">Tối đa 10 MB. Dùng PDF có thể chọn và sao chép chữ; bản scan chỉ có ảnh hiện chưa được hỗ trợ.</p>{error&&<p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-lg p-3">{error}</p>}{busy&&<p role="status" className="text-sm text-blue-700">Đang đọc và phân tích JD…</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Hủy</button><button disabled={busy||!file} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{busy?'Đang phân tích…':'Phân tích PDF'}</button></div></form></div>;
}
