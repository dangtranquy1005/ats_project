import React,{useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc=workerUrl;

export default function PdfCanvas({blob}) {
  const [doc,setDoc]=useState(null),[page,setPage]=useState(1),[zoom,setZoom]=useState(1);
  const [error,setError]=useState(''),[rendering,setRendering]=useState(true),[text,setText]=useState('');
  const surface=useRef(null);
  useEffect(()=>{
    let disposed=false,task;
    setDoc(null);setError('');setPage(1);
    blob.arrayBuffer().then(data=>{
      if(disposed)return;
      task=getDocument({data:new Uint8Array(data),isEvalSupported:false});
      return task.promise;
    }).then(pdf=>{if(pdf&&!disposed)setDoc(pdf);}).catch(()=>{if(!disposed)setError('Không mở được bản xem trước. Bạn có thể tải PDF gốc để đọc.');});
    return()=>{disposed=true;task?.destroy().catch(()=>{});};
  },[blob]);
  useEffect(()=>{
    if(!doc||!surface.current)return;
    let disposed=false,task;
    setRendering(true);setError('');setText('');
    const holder=surface.current;
    const canvas=document.createElement('canvas');
    canvas.setAttribute('aria-label',`Trang ${page} của CV`);
    holder.replaceChildren(canvas);
    doc.getPage(page).then(async pdfPage=>{
      if(disposed)return;
      const base=pdfPage.getViewport({scale:1});
      const scale=Math.max(0.1,(holder.clientWidth-32)/base.width)*zoom;
      const viewport=pdfPage.getViewport({scale});
      const ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
      canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
      canvas.className='bg-white shadow-sm mx-auto';
      task=pdfPage.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});
      await task.promise;
      if(disposed)return;
      setRendering(false);
      const content=await pdfPage.getTextContent();
      if(!disposed)setText(content.items.map(item=>item.str||'').join(' '));
    }).catch(err=>{if(!disposed&&err.name!=='RenderingCancelledException'){setError('Không hiển thị được trang này. Hãy thử trang khác hoặc tải PDF.');setRendering(false);}});
    return()=>{disposed=true;task?.cancel();};
  },[doc,page,zoom]);
  const button='px-2 py-1 border rounded-md text-xs bg-white disabled:opacity-40';
  return <div>
    <div className="flex flex-wrap gap-2 items-center justify-between px-4 py-3 bg-slate-50 border-b text-xs">
      <div className="flex gap-2 items-center"><button type="button" aria-label="Trang PDF trước" className={button} disabled={!doc||page<=1} onClick={()=>setPage(n=>n-1)}>←</button><span>Trang {page}/{doc?.numPages||'…'}</span><button type="button" aria-label="Trang PDF sau" className={button} disabled={!doc||page>=doc.numPages} onClick={()=>setPage(n=>n+1)}>→</button></div>
      <div className="flex gap-2 items-center"><button type="button" aria-label="Thu nhỏ PDF" className={button} disabled={zoom<=0.6} onClick={()=>setZoom(n=>Math.max(0.6,n-0.2))}>−</button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label="Phóng to PDF" className={button} disabled={zoom>=2} onClick={()=>setZoom(n=>Math.min(2,n+0.2))}>+</button></div>
    </div>
    {error?<p role="alert" className="p-4 text-sm text-rose-700">{error}</p>:rendering&&<p role="status" className="p-3 text-sm text-slate-500">Đang hiển thị PDF…</p>}
    <div ref={surface} className="overflow-auto p-4 bg-slate-100 max-h-[680px] min-h-[300px]"/>
    {text&&<p className="sr-only" aria-label={`Nội dung trang ${page}`}>{text}</p>}
  </div>;
}
