import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AuthScreen() {
  const { login, register, authError, token, retrySession, logout } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submit = async e => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      if (mode === 'register') {
        await register(name, email, password);
        setMode('login'); setPassword(''); setSuccess('Đăng ký thành công. Hãy đăng nhập bằng tài khoản vừa tạo.');
      } else await login(email, password, remember);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const input = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-blue-500';
  return <div id="screen-auth" className="h-full flex items-center justify-center overflow-auto rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-5">
      <div><p className="text-blue-600 font-bold text-sm">AutoScreen · ATS</p><h1 className="text-2xl font-bold text-slate-900 mt-2">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1><p className="text-sm text-slate-500 mt-2">Quản lý tiêu chí tuyển dụng và hồ sơ ứng viên.</p></div>
      {authError && <div role="alert" className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">{authError}{token && <div className="flex gap-4 mt-2"><button onClick={retrySession} className="underline">Thử lại phiên</button><button onClick={logout} className="underline">Đăng nhập lại</button></div>}</div>}
      {success && <p role="status" className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">{success}</p>}
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && <label className="block text-sm font-medium">Họ và tên<input aria-label="Họ và tên" className={input} value={name} onChange={e => setName(e.target.value)} required maxLength={255} autoComplete="name" /></label>}
        <label className="block text-sm font-medium">Email<input aria-label="Email" className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label className="block text-sm font-medium">Mật khẩu<input aria-label="Mật khẩu" className={input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
        {mode === 'register' ? <p className="text-xs text-slate-500">Mật khẩu từ 8 ký tự, tối đa 72 byte.</p> : <label className="flex gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Ghi nhớ phiên trên máy này</label>}
        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-lg">{error}</p>}
        <button disabled={busy} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
      </form>
      <button disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }} className="text-sm text-blue-600 underline">{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button>
    </div>
  </div>;
}
