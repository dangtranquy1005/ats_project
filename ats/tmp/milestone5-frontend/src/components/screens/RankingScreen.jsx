import React,{useState,useRef} from 'react';
import {useApp} from '../../context/AppContext';
import {scoringAPI,apiError} from '../../services/api';
import {score100,rankingParams} from '../../services/scoringPresentation';
import {useRanking} from '../../hooks/useRanking';
import ReviewBadge from '../ReviewBadge';
import {REVIEW_STATES} from '../../services/reviewPresentation';

const defaults={query:'',passed:'',reviewStatus:'',minScore:'',maxScore:'',sortBy:'OVERALL_SCORE',sortOrder:'DESC'};
export default function RankingScreen(){
  const {activeJob,activeJobId,scoreRevision,reviewRevision,scoresChanged,openScoreReport,updateJobCvCount,switchTab}=useApp();
  const ranking=useRanking(activeJobId,scoreRevision,updateJobCvCount,reviewRevision);
  const [form,setForm]=useState(defaults);
  const [formError,setFormError]=useState('');
  const [busy,setBusy]=useState(false);
  const inFlight=useRef(false);
  const [scoreError,setScoreError]=useState('');
  const [receipt,setReceipt]=useState(null);
  const [exporting,setExporting]=useState(false);
  const exportController=useRef(null);
  const applied=useRef(rankingParams(defaults));
  const summary=ranking.summary;
  const needsRescore=(summary?.unscoredCvs||0)+(summary?.staleCvs||0);
  const button='px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';
  const input='px-3 py-2 border border-slate-300 rounded-lg text-sm w-full';
  const change=(field,value)=>setForm(prev=>({...prev,[field]:value}));
  const apply=e=>{e.preventDefault();try{const params=rankingParams(form);applied.current=params;ranking.apply(params);setFormError('');}catch(err){setFormError(err.message);}};
  const rescore=async()=>{
    if(inFlight.current || !activeJobId)return;
    inFlight.current=true;setBusy(true);setScoreError('');setReceipt(null);
    try{
      const result=await scoringAPI.rescore(activeJobId);
      if(!ranking.mounted.current)return;
      setReceipt(result);ranking.setPage(0);scoresChanged();ranking.refresh();
    }catch(err){if(ranking.mounted.current){setScoreError(err.response?apiError(err):'Chưa xác nhận được kết quả chấm. Hãy tải lại bảng trước khi chấm lại.');ranking.refresh();}}
    finally{inFlight.current=false;if(ranking.mounted.current)setBusy(false);}
  };
  const exportCsv=async()=>{
    if(exportController.current)return;
    const controller=new AbortController();exportController.current=controller;setExporting(true);setScoreError('');
    try{const blob=await scoringAPI.exportCsv(activeJobId,applied.current,controller.signal);if(!ranking.mounted.current)return;const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`xep-hang-${activeJobId}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    catch(err){if(ranking.mounted.current)setScoreError('Chưa xuất được danh sách. Hãy tải lại bảng rồi thử lại.');}
    finally{exportController.current=null;if(ranking.mounted.current)setExporting(false);}
  };
  if(!activeJob)return <div className="bg-white border rounded-xl p-8 text-sm">Hãy chọn JD để xem bảng xếp hạng. <button onClick={()=>switchTab('screen-jd')} className="underline text-blue-600">Quản lý JD</button></div>;
  return <div id="screen-ranking" className="h-full overflow-auto flex flex-col gap-4">
    <div className="bg-white border rounded-xl p-5 flex justify-between items-center gap-3 flex-wrap"><div><h1 className="font-bold text-lg">Chấm điểm &amp; Xếp hạng CV</h1><p className="text-sm text-slate-500 mt-1">{activeJob.title} · điểm hiển thị theo thang 100</p></div><div className="flex gap-2"><button className={button} disabled={busy||ranking.loading} onClick={ranking.refresh}>Tải lại bảng</button><button className={button} disabled={busy||ranking.loading||exporting||Boolean(ranking.error)} onClick={exportCsv}>{exporting?'Đang xuất…':'Xuất toàn bộ kết quả lọc (CSV)'}</button><button disabled={busy||!activeJob.requiredSkills.length||!summary?.readyCvs} onClick={rescore} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white disabled:opacity-50">{busy?'Đang chấm điểm…':'Chấm / Chấm lại toàn bộ JD'}</button></div></div>
    {!activeJob.requiredSkills.length && <p role="alert" className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">JD cần ít nhất một kỹ năng trước khi chấm điểm. <button onClick={()=>switchTab('screen-jd')} className="underline">Sửa tiêu chí JD</button></p>}
    {summary && <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{[['Điểm còn hiệu lực',summary.currentCvs],['Chưa chấm / cần chấm lại',needsRescore],['Đáp ứng / chưa đáp ứng',`${summary.passedCvs} / ${summary.hardFailedCvs}`],['Đang chờ / xử lý / cần thử lại',`${summary.pendingCvs} / ${summary.parsingCvs} / ${summary.parseFailedCvs}`]].map(([label,value])=><div key={label} className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold mt-2">{value}</p></div>)}</div>}
    {needsRescore>0 && <p role="status" className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">{summary.unscoredCvs} CV chưa chấm, {summary.staleCvs} CV cần cập nhật điểm theo tiêu chí mới. Hãy chấm lại để xem đầy đủ kết quả.</p>}
    {receipt && <p role="status" className="bg-emerald-50 text-emerald-800 rounded-lg p-3 text-sm">Đã chấm {receipt.updatedCvs}/{receipt.totalCvs} CV. Bỏ qua {receipt.totalCvs-receipt.updatedCvs} CV chưa phân tích xong hoặc phân tích lỗi. Chấm lỗi: {receipt.failedCvs}.</p>}
    {scoreError && <p role="alert" className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{scoreError}</p>}
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <form onSubmit={apply} className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <label className="text-xs text-slate-600 col-span-2">Tìm tên, email hoặc ID CV<input aria-label="Tìm ứng viên" maxLength={255} value={form.query} onChange={e=>change('query',e.target.value)} className={input}/></label>
        <label className="text-xs text-slate-600">Yêu cầu bắt buộc<select aria-label="Yêu cầu bắt buộc" value={form.passed} onChange={e=>change('passed',e.target.value)} className={input}><option value="">Tất cả</option><option value="true">Đạt</option><option value="false">Không đạt</option></select></label>
        <label className="text-xs text-slate-600">Đánh giá tuyển dụng<select aria-label="Lọc đánh giá tuyển dụng" value={form.reviewStatus} onChange={e=>change('reviewStatus',e.target.value)} className={input}><option value="">Tất cả</option>{Object.entries(REVIEW_STATES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs text-slate-600">Điểm tối thiểu<input aria-label="Điểm tối thiểu" type="number" min="0" max="100" step="any" value={form.minScore} onChange={e=>change('minScore',e.target.value)} className={input}/></label>
        <label className="text-xs text-slate-600">Điểm tối đa<input aria-label="Điểm tối đa" type="number" min="0" max="100" step="any" value={form.maxScore} onChange={e=>change('maxScore',e.target.value)} className={input}/></label>
        <label className="text-xs text-slate-600">Sắp xếp theo<select aria-label="Sắp xếp theo" value={form.sortBy} onChange={e=>change('sortBy',e.target.value)} className={input}><option value="OVERALL_SCORE">Điểm tổng</option><option value="SKILL">Kỹ năng phù hợp</option><option value="COSINE">Kinh nghiệm liên quan</option><option value="EDUCATION">Học vấn</option></select></label>
        <label className="text-xs text-slate-600">Chiều sắp xếp<select aria-label="Chiều sắp xếp" value={form.sortOrder} onChange={e=>change('sortOrder',e.target.value)} className={input}><option value="DESC">Giảm dần</option><option value="ASC">Tăng dần</option></select></label>
        <div className="flex items-end gap-2"><button disabled={busy||ranking.loading} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50">Áp dụng</button><button type="button" className={button} disabled={busy} onClick={()=>{setForm(defaults);setFormError('');applied.current=rankingParams(defaults);ranking.apply(applied.current);}}>Đặt lại</button></div>
      </form>
      {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
      {ranking.error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg">{ranking.error} Dữ liệu có thể chưa mới nhất. <button className="underline" onClick={ranking.refresh}>Thử lại</button></p>}
      <p className="text-xs text-slate-500">Ứng viên đáp ứng yêu cầu bắt buộc được hiển thị trước, sau đó sắp theo điểm bạn chọn.</p>
      {ranking.loading && <p role="status" className="text-sm text-slate-500">Đang tải kết quả…</p>}
      <div className="hidden md:block overflow-x-auto"><table className="w-full text-left text-sm" id="table-candidates"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Thứ tự','Ứng viên','Đánh giá','Yêu cầu bắt buộc','Kỹ năng','Kinh nghiệm','Học vấn','Tổng /100',''].map((s,i)=><th className="p-3 whitespace-nowrap" key={i}>{s}</th>)}</tr></thead><tbody className="divide-y">{ranking.data?.content.map(cv=><tr key={cv.cvId} className="hover:bg-slate-50"><td className="p-3 font-mono">#{cv.rank}</td><td className="p-3"><p className="font-semibold">{cv.candidateName||`CV #${cv.cvId}`}</p><p className="text-xs text-slate-500">{cv.email||'Chưa có email'} · CV #{cv.cvId}</p></td><td className="p-3"><ReviewBadge status={cv.reviewStatus}/></td><td className="p-3"><span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${cv.passedHardFilter?'text-emerald-700 bg-emerald-50':'text-rose-700 bg-rose-50'}`}>{cv.passedHardFilter?'Đạt':'Không đạt'}</span></td><td className="p-3 font-mono">{score100(cv.skillScore??cv.jaccardScore)}</td><td className="p-3 font-mono">{score100(cv.cosineScore)}</td><td className="p-3 font-mono">{score100(cv.educationScore)}</td><td className="p-3 font-bold font-mono text-blue-700">{score100(cv.overallScore)}</td><td className="p-3"><button className={button} disabled={busy||ranking.loading||Boolean(ranking.error)} onClick={()=>openScoreReport(cv.cvId)}>Xem hồ sơ</button></td></tr>)}</tbody></table></div>
      <div className="md:hidden space-y-3">{ranking.data?.content.map(cv=><article key={cv.cvId} className="border rounded-xl p-3 space-y-3">
        <div className="flex justify-between items-start gap-3"><div className="min-w-0"><p className="font-semibold text-sm break-words">#{cv.rank} · {cv.candidateName||`CV #${cv.cvId}`}</p><p className="text-xs text-slate-500 break-all">{cv.email||'Chưa có email'} · CV #{cv.cvId}</p></div><p className="font-bold text-lg text-blue-700 shrink-0">{score100(cv.overallScore)}<span className="text-xs font-normal"> /100</span></p></div>
        <p className={`text-xs font-semibold ${cv.passedHardFilter?'text-emerald-700':'text-rose-700'}`}>{cv.passedHardFilter?'Qua yêu cầu bắt buộc':'Không qua yêu cầu bắt buộc'}</p>
        <ReviewBadge status={cv.reviewStatus}/>
        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 rounded-lg p-2"><p>Kỹ năng<br/><b>{score100(cv.skillScore??cv.jaccardScore)}</b></p><p>Kinh nghiệm<br/><b>{score100(cv.cosineScore)}</b></p><p>Học vấn<br/><b>{score100(cv.educationScore)}</b></p></div>
        <button className={`${button} w-full`} disabled={busy||ranking.loading||Boolean(ranking.error)} onClick={()=>openScoreReport(cv.cvId)}>Xem hồ sơ</button>
      </article>)}</div>
      {!ranking.loading&&!ranking.error&&!ranking.data?.content.length && <p className="text-sm text-slate-500 p-6 text-center">{needsRescore>0?`Có ${needsRescore} CV chưa có điểm còn hiệu lực. Bấm “Chấm / Chấm lại toàn bộ JD” để hiển thị kết quả.`:'Chưa có kết quả phù hợp với bộ lọc.'}<button className="block mx-auto mt-3 text-blue-600 underline" onClick={()=>switchTab('screen-upload')}>Xem danh sách CV đã tải</button></p>}
      <div className="flex justify-end items-center gap-3 text-xs"><span>{ranking.data?.totalElements||0} kết quả · Trang {ranking.page+1}/{Math.max(1,ranking.data?.totalPages||0)}</span><button className={button} disabled={busy||ranking.loading||ranking.page===0} onClick={()=>ranking.setPage(p=>p-1)}>Trang trước</button><button className={button} disabled={busy||ranking.loading||ranking.page+1>=(ranking.data?.totalPages||0)} onClick={()=>ranking.setPage(p=>p+1)}>Trang sau</button></div>
    </div>
  </div>;
}
