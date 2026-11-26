import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {authAPI,apiError} from '../../services/api';
export default function ErrorsScreen(){
  const {user,logout}=useApp();
  const [busy,setBusy]=useState(false),[result,setResult]=useState(''),[error,setError]=useState('');
  const check=async()=>{setBusy(true);setResult('');setError('');try{await authAPI.me();setResult(`Kết nối bình thường. Phiên đăng nhập của ${user.email} còn hiệu lực.`);}catch(err){setError(apiError(err));}finally{setBusy(false);}};
  return <div className="h-full overflow-auto"><section className="max-w-2xl mx-auto bg-white border rounded-xl p-6 space-y-5"><h1 className="font-bold text-lg">Kết nối và phiên đăng nhập</h1><p className="text-sm text-slate-500">Kiểm tra kết nối khi bạn gặp khó khăn khi tải hoặc lưu dữ liệu.</p><button onClick={check} disabled={busy} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">{busy?'Đang kiểm tra…':'Kiểm tra kết nối'}</button>{result&&<p role="status" className="text-sm text-emerald-700">{result}</p>}{error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="text-sm text-slate-600 space-y-3"><p>Nếu không kết nối được, kiểm tra mạng rồi thử tải lại. Với thao tác lưu chưa xác nhận được kết quả, hãy đọc lại dữ liệu trước khi gửi thêm lần nữa.</p><p>Khi phiên hết hạn, bạn sẽ được đưa về trang đăng nhập. Hãy lưu nội dung đang làm trước khi đăng xuất.</p></div><button onClick={logout} className="border px-4 py-2 rounded-lg text-sm">Đăng xuất</button></section></div>;
}
