import {useState,useRef,useEffect,useCallback} from 'react';
import {scoringAPI,apiError} from '../services/api';

export function useRanking(jobId, scoreRevision, updateJobCvCount, reviewRevision) {
  const [page,setPage]=useState(0);
  const [params,setParams]=useState({sortBy:'OVERALL_SCORE',sortOrder:'DESC'});
  const [data,setData]=useState(null);
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(Boolean(jobId));
  const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0);
  const mounted=useRef(false);
  const controller=useRef(null);
  const request=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  const load=useCallback(async(silent=false)=>{
    if(!jobId)return;
    controller.current?.abort(); const abort=new AbortController(); controller.current=abort;
    const id=++request.current; if(!silent)setLoading(true);
    try {
      const [ranking,status]=await Promise.all([
        scoringAPI.ranking(jobId,{...params,page,size:10},abort.signal),scoringAPI.status(jobId,abort.signal),
      ]);
      if(!mounted.current || id!==request.current)return;
      if(page>0 && page>=ranking.totalPages){setPage(Math.max(0,ranking.totalPages-1));return;}
      setData(ranking);setSummary(status);setError('');updateJobCvCount(jobId,status.totalCvs);
    }catch(err){if(!abort.signal.aborted && mounted.current && id===request.current)setError(apiError(err));}
    finally{if(mounted.current && id===request.current)setLoading(false);}
  },[jobId,page,params,updateJobCvCount]);
  useEffect(()=>{load();return()=>controller.current?.abort();},[load,attempt,scoreRevision,reviewRevision]);
  useEffect(()=>{
    if(!jobId)return;
    const focus=()=>load(true);window.addEventListener('focus',focus);
    const timer=setInterval(()=>{if(!document.hidden)load(true);},error?10000:5000);
    return()=>{window.removeEventListener('focus',focus);if(timer)clearInterval(timer);};
  },[jobId,error,load]);
  return {data,summary,loading,error,page,setPage,mounted,
    apply:params=>{setParams(params);setPage(0);},
    refresh:()=>{controller.current?.abort();++request.current;setAttempt(n=>n+1);},
  };
}
