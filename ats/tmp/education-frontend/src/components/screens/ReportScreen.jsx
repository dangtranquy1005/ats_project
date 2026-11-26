import React,{useEffect,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {educationLabel} from '../../services/educationPresentation';
import {scoringAPI,cvAPI,apiError} from '../../services/api';
import {score100} from '../../services/scoringPresentation';
import CvExtractionModal from '../modals/CvExtractionModal';
import PdfPreview from '../PdfPreview';
import CvReviewPanel from '../CvReviewPanel';

export default function ReportScreen(){
  const {scoreReport,activeJobId,switchTab,scoreRevision}=useApp();
  const cvId=scoreReport?.jobId===activeJobId?scoreReport.cvId:null;
  const [detail,setDetail]=useState(null);
  const [cv,setCv]=useState(null);
  const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0);
  const [showNlp,setShowNlp]=useState(false);
  const [cvError,setCvError]=useState('');
  useEffect(()=>{const focus=()=>setAttempt(n=>n+1);window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[]);
  useEffect(()=>{
    if(!cvId)return;
    setCv(null);setCvError('');
    const controller=new AbortController();
    cvAPI.detail(cvId,controller.signal).then(extraction=>{
      if(controller.signal.aborted)return;
      if(extraction.cv.jobId!==activeJobId){setCvError('CV không thuộc vị trí đang chọn.');return;}
      setCv(extraction.cv);
    }).catch(err=>{if(!controller.signal.aborted)setCvError(apiError(err));});
    return()=>controller.abort();
  },[cvId,activeJobId]);
  useEffect(()=>{
    if(!cvId)return;
    const controller=new AbortController();setDetail(null);setError('');
    scoringAPI.match(cvId,controller.signal).then(score=>{
      if(controller.signal.aborted)return;
      if(score.jobId!==activeJobId){setError('CV không thuộc vị trí đang chọn.');return;}
      setDetail(score);
    }).catch(err=>{if(!controller.signal.aborted)setError(err.response?.status===409?'Tiêu chí đã thay đổi. Chấm lại vị trí để xem điểm mới.':err.response?.status===404?'Hồ sơ chưa có điểm. Bạn vẫn có thể đọc CV và lưu đánh giá.':apiError(err));});
    return()=>controller.abort();
  },[cvId,activeJobId,attempt,scoreRevision]);
  const button='px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50';
  if(!cvId)return <div className="bg-white border rounded-xl p-8 text-sm">Chọn một hồ sơ từ danh sách CV hoặc bảng xếp hạng để xem và đánh giá. <button className="text-blue-600 underline" onClick={()=>switchTab('screen-upload')}>Mở danh sách CV</button></div>;
  const skill=detail?.skillScore??detail?.jaccardScore;
  return <div id="screen-report" className="h-full overflow-auto space-y-4 select-text">
    <div className="bg-white border rounded-xl p-5 flex justify-between gap-3 flex-wrap"><div><h1 className="font-bold text-lg">Xem &amp; đánh giá hồ sơ</h1><p className="text-sm text-slate-500 mt-1">{cv?.candidateName||`CV #${cvId}`} · {cv?.email||'Chưa có email'}</p></div><div className="flex gap-2 flex-wrap"><button className={button} onClick={()=>switchTab(scoreReport?.source||'screen-ranking')}>Quay lại danh sách</button>{cv&&<button className={button} onClick={()=>setShowNlp(true)}>Thông tin từ CV</button>}</div></div>
    {cvError&&<div role="alert" className="p-4 rounded-lg bg-rose-50 text-rose-700 text-sm">{cvError}</div>}
    {!cv&&!cvError&&<p role="status" className="p-4 text-sm text-slate-500">Đang tải hồ sơ…</p>}
    {cv&&<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] gap-4 items-start"><PdfPreview cvId={cvId} filename={cv.filename}/><CvReviewPanel cvId={cvId}/></div>}
    {cv&&error&&<div role="status" className="p-4 rounded-lg bg-amber-50 text-amber-800 text-sm">{error} <button className="underline" onClick={()=>setAttempt(n=>n+1)}>Tải lại điểm</button></div>}
    {cv&&!detail&&!error&&<p className="p-4 text-sm text-slate-500">Đang tải kết quả chấm…</p>}
    {cv&&detail&&<>
      <div className="bg-white border rounded-xl p-5 flex justify-between flex-wrap gap-3"><div><h2 className="font-bold">Kết quả chấm điểm</h2><p className="text-xs text-slate-500 mt-2">Lần chấm: {detail.calculatedAt?.replace('T',' ').slice(0,19)}</p></div><div className="text-right"><p className="text-3xl font-bold text-blue-700">{score100(detail.overallScore)}<span className="text-sm text-slate-400"> /100</span></p><p className={`text-sm font-semibold ${detail.passedHardFilter?'text-emerald-700':'text-rose-700'}`}>{detail.passedHardFilter?'Đáp ứng yêu cầu bắt buộc':'Chưa đáp ứng yêu cầu bắt buộc'}</p></div></div>
      <div className="bg-white border rounded-xl p-5 space-y-4"><h2 className="font-bold">Điểm này được đánh giá thế nào?</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[['Kỹ năng phù hợp',skill],['Kinh nghiệm liên quan',detail.cosineScore],['Học vấn',detail.educationScore]].map(([label,value])=><div key={label} className="bg-slate-50 border rounded-lg p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold mt-1">{score100(value)} /100</p></div>)}</div>
        {detail.weights?<details className="space-y-2"><summary className="text-sm text-blue-700 cursor-pointer">Xem cách cộng điểm</summary><p className="text-sm bg-blue-50 text-blue-900 rounded-lg p-3 font-mono">{Number((detail.weights.skill*100).toFixed(4))}% × {score100(skill)} + {Number((detail.weights.cosine*100).toFixed(4))}% × {score100(detail.cosineScore)} + {Number((detail.weights.education*100).toFixed(4))}% × {score100(detail.educationScore)} = {score100(detail.overallScore)} /100</p></details>:<p className="text-sm text-amber-800">Chấm lại vị trí này để xem cách cộng điểm chi tiết.</p>}
        <p className="text-xs text-slate-500">Điểm tổng kết hợp ba tiêu chí theo mức ưu tiên bạn đã chọn. Kinh nghiệm được đánh giá dựa trên công việc từng làm; số năm kinh nghiệm là một yêu cầu bắt buộc riêng.</p>
      </div>
      <div className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Yêu cầu bắt buộc</h2>{detail.hardFilterReasons?.length?<ul className="list-disc pl-5 text-sm text-rose-700 space-y-2">{detail.hardFilterReasons.map(reason=><li key={reason}>{reason}</li>)}</ul>:<p className="text-sm text-emerald-700">Đáp ứng các điều kiện bắt buộc tại thời điểm chấm.</p>}
        {detail.experienceYears!==null&&detail.experienceYears!==undefined&&<p className="text-sm text-slate-600">Kinh nghiệm xác nhận: {detail.experienceYears.toFixed(2)} năm · yêu cầu {detail.requiredExperienceYears} năm. Các khoảng làm việc trùng thời gian được gộp khi tính.</p>}
        {detail.weights&&<p className="text-sm text-slate-600">Yêu cầu học vấn: {educationLabel(detail.educationRequirements)}</p>}
        <p className="text-sm">Thiếu kỹ năng bắt buộc: <b>{detail.missingMandatorySkills?.join(', ')||'Không có'}</b></p>
      </div>
      <div className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Đối chiếu kỹ năng ({detail.matchedSkillCount}/{detail.totalRequiredSkills})</h2>{detail.skillBreakdown?.length?<div className="overflow-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Kỹ năng','Mức yêu cầu','Mức ưu tiên','Kết quả'].map(s=><th className="p-3" key={s}>{s}</th>)}</tr></thead><tbody className="divide-y">{detail.skillBreakdown.map(s=><tr key={s.skillId}><td className="p-3 font-semibold">{s.skillName}</td><td className="p-3">{s.mandatory?'Bắt buộc':'Ưu tiên'}</td><td className="p-3 font-mono">{s.weight}</td><td className={`p-3 ${s.matched?'text-emerald-700':'text-rose-700'}`}>{s.matched?'Đạt':'Thiếu'}</td></tr>)}</tbody></table></div>:<div className="text-sm space-y-2"><p>Đạt: {detail.matchedSkills?.join(', ')||'Không có'}</p><p>Thiếu: {detail.missingSkills?.join(', ')||'Không có'}</p></div>}</div>
    </>}
    {showNlp&&<CvExtractionModal id={cvId} onClose={()=>setShowNlp(false)}/>}
  </div>;
}
