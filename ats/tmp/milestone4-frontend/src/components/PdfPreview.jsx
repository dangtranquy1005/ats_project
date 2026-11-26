import React,{useEffect,useState,lazy,Suspense} from 'react';
import {cvAPI,apiError} from '../services/api';
const PdfCanvas=lazy(()=>import('./PdfCanvas'));

export default function PdfPreview({cvId,filename}) {
  const [url,setUrl]=useState('');
  const [blob,setBlob]=useState(null);
  const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    let objectUrl;
    setUrl('');setBlob(null);setError('');
    cvAPI.file(cvId,controller.signal).then(blob=>{
      if(controller.signal.aborted)return;
      objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);setBlob(blob);
    }).catch(err=>{if(!controller.signal.aborted)setError(apiError(err));});
    return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[cvId,attempt]);
  return <section className="bg-white border rounded-xl overflow-hidden min-w-0">
    <div className="p-4 border-b flex justify-between gap-3 items-center"><div className="min-w-0"><h2 className="font-bold">CV gốc</h2><p className="text-xs text-slate-500 break-all mt-1">{filename}</p></div>{url&&<a href={url} download={filename||`cv-${cvId}.pdf`} className="text-sm text-blue-700 shrink-0 underline">Tải PDF</a>}</div>
    {error?<div role="alert" className="p-6 text-sm text-rose-700 space-y-3"><p>{error}</p><button className="underline" onClick={()=>setAttempt(n=>n+1)}>Thử tải lại PDF</button></div>:url?<><Suspense fallback={<p className="p-4 text-sm text-slate-500">Đang mở trình đọc PDF…</p>}><PdfCanvas blob={blob}/></Suspense></>:<p role="status" className="p-8 text-sm text-slate-500">Đang mở PDF…</p>}
  </section>;
}
