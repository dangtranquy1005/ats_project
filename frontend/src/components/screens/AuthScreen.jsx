import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AuthScreen() {
  const { login, register, showToast } = useApp();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('recruiter@company.com');
  const [email, setEmail] = useState('recruiter@company.com');
  const [password, setPassword] = useState('secretpassword123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(email, password);
    } catch (err) {
      setLoginError(err.message || 'Email hoặc mật khẩu không đúng.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    try {
      await register(regFullName, regEmail, regPassword);
      setAuthMode('login');
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err) {
      setRegError(err.message);
    }
  };

  const fillDemo = () => {
    setEmail('recruiter@company.com');
    setPassword('hr_secret_2026');
    setLoginError('');
    showToast('Thông tin mẫu', 'Đã nạp email và mật khẩu tài khoản HR mẫu.', 'info');
  };

  return (
    <div
      id="screen-auth"
      className="h-full w-full relative overflow-auto rounded-xl border border-slate-200/80 flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 55% 50% at 28% 22%, #DBEAFE 0%, rgba(219,234,254,0) 70%), radial-gradient(ellipse 45% 40% at 88% 88%, #E0E7FF 0%, rgba(224,231,255,0) 70%), linear-gradient(135deg,#EFF6FF 0%,#F8FAFF 55%,#FFFFFF 100%)'
      }}
    >
      <div className="relative w-full min-h-full flex flex-col">
        {/* Nội dung chính: giới thiệu (trái) + thẻ đăng nhập (phải) */}
        <div className="flex-1 grid grid-cols-2 items-center gap-10 px-16 py-8">
          {/* Cột trái */}
          <div className="max-w-[540px] space-y-5 justify-self-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-blue-200 text-[9px] font-bold text-blue-700 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> NỀN TẢNG TUYỂN DỤNG & SÀNG LỌC CV TỰ ĐỘNG BẰNG AI
            </span>
            <h1 className="text-[25px] leading-[1.35] font-extrabold text-slate-900 tracking-tight">
              Tự Động Hóa Sàng Lọc &amp;
              <span className="block text-blue-600 mt-1.5">Hồ Sơ Ứng Viên Chuẩn Doanh Nghiệp</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
              Giải pháp trích xuất dữ liệu PDF siêu tốc, chuẩn hóa năng lực ứng viên theo bộ lọc cứng 2 tầng và chấm điểm xếp hạng khách quan theo trọng số hội đồng tuyển dụng.
            </p>
            <div className="space-y-2.5 max-w-md">
              <div className="bg-white/90 rounded-xl border border-slate-200/80 shadow-card px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900">
                    Bóc tách PDF tự động (Apache PDFBox &amp; NER)
                  </p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Trích xuất kỹ năng, kinh nghiệm và học vấn trong <b className="text-slate-700">0.8 giây</b>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                  0.8s
                </span>
              </div>
              <div className="bg-white/90 rounded-xl border border-slate-200/80 shadow-card px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-filter"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900">
                    Bộ lọc cứng 2 tầng quyết (Hard Filter)
                  </p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Tự động loại bỏ hồ sơ thiếu số năm kinh nghiệm hoặc bằng cấp.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                  Đạt chuẩn
                </span>
              </div>
              <div className="bg-white/90 rounded-xl border border-slate-200/80 shadow-card px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 text-xs">
                  <i className="fa-solid fa-chart-simple"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900">
                    Chấm điểm trọng số mềm (Soft Scoring)
                  </p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Tùy biến trọng số w1, w2, w3 theo từng vị trí tuyển dụng linh hoạt.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono shrink-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                  w1+w2+w3
                </span>
              </div>
            </div>
            <div className="flex items-center gap-5 pt-1">
              <div>
                <p className="text-lg font-extrabold text-blue-700 font-mono">96.8%</p>
                <p className="text-[10px] text-slate-500">Khớp thực thể NER</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <p className="text-lg font-extrabold text-blue-700 font-mono">-70%</p>
                <p className="text-[10px] text-slate-500">Thời gian lọc hồ sơ</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <p className="text-lg font-extrabold text-emerald-600 font-mono">100,000+</p>
                <p className="text-[10px] text-slate-500">CV đã đối soát</p>
              </div>
            </div>
          </div>

          {/* Cột phải: thẻ đăng nhập */}
          <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-elevation p-6 w-full max-w-[360px] justify-self-center space-y-3.5"
            style={{ boxShadow: '0 20px 40px -12px rgba(37,99,235,.15)' }}
          >
            <div className="text-center">
              <h2 className="text-base font-extrabold text-slate-900">
                {authMode === 'login'
                  ? 'Đăng nhập tài khoản'
                  : authMode === 'register'
                  ? 'Đăng ký tài khoản mới'
                  : 'Quên mật khẩu'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {authMode === 'login'
                  ? 'Cổng Quản Trị Tuyển Dụng & Sơ Loại Ứng Viên'
                  : authMode === 'register'
                  ? 'Dành cho nhà tuyển dụng của doanh nghiệp'
                  : 'Nhập email để nhận liên kết đặt lại mật khẩu'}
              </p>
            </div>

            {authMode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setLoginError('');
                    try {
                      await login('recruiter@company.com', 'secretpassword123');
                    } catch (err) {
                      setLoginError(err.message || 'Không đăng nhập được bằng Google Workspace.');
                    }
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <i className="fa-brands fa-google text-blue-600"></i> Đăng nhập với Google Workspace
                </button>

                <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-400">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  HOẶC DÙNG EMAIL
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
              </>
            )}

            {authMode === 'forgot' ? (
              <div className="space-y-3.5">
                {!forgotSent ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setForgotSent(true);
                      showToast('Đã gửi liên kết', 'Vui lòng kiểm tra hộp thư email.', 'success');
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Email tài khoản
                      </label>
                      <div className="relative">
                        <i className="fa-regular fa-envelope absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                    >
                      Gửi liên kết đặt lại mật khẩu
                    </button>
                    <p className="text-center text-[10px] text-slate-500">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setAuthMode('login');
                        }}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        ← Quay lại đăng nhập
                      </a>
                    </p>
                  </form>
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-11 h-11 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-lg shadow-xs">
                      <i className="fa-solid fa-envelope-circle-check"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Đã gửi email khôi phục!</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Liên kết đặt lại mật khẩu đã được gửi tới <b className="text-slate-700">{forgotEmail}</b>. Vui lòng kiểm tra hộp thư.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setForgotSent(false);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                    >
                      Quay lại màn hình đăng nhập
                    </button>
                  </div>
                )}
              </div>
            ) : authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Email tài khoản
                  </label>
                  <div className="relative">
                    <i className="fa-regular fa-envelope absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-700">Mật khẩu</label>
                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        setAuthMode('forgot');
                        setForgotSent(false);
                      }}
                      className="text-[10px] font-semibold text-blue-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[11px]`}></i>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[10px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  Ghi nhớ phiên làm việc trên máy này
                </label>

                {loginError && (
                  <p className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-[11px] tracking-wide shadow-card transition flex items-center justify-center gap-2 active:scale-98"
                >
                  VÀO BẢNG ĐIỀU KHIỂN HỆ THỐNG <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>

                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600 transition"
                >
                  Điền thông tin tài khoản mẫu
                </button>

                <p className="text-center text-[10px] text-slate-500">
                  Chưa có tài khoản?{' '}
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setAuthMode('register');
                    }}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Đăng ký mới
                  </a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Họ và tên</label>
                  <div className="relative">
                    <i className="fa-regular fa-user absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Email công ty</label>
                  <div className="relative">
                    <i className="fa-regular fa-envelope absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                    <input
                      type="email"
                      required
                      placeholder="hr@company.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <i className="fa-solid fa-lock absolute left-3 top-2.5 text-slate-400 text-[11px]"></i>
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 8 ký tự"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {regError && (
                  <p className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i> {regError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-[11px] tracking-wide shadow-card transition"
                >
                  TẠO TÀI KHOẢN MỚI
                </button>

                <p className="text-center text-[10px] text-slate-500">
                  Đã có tài khoản?{' '}
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setAuthMode('login');
                    }}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Đăng nhập
                  </a>
                </p>
              </form>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 pt-1 border-t border-slate-100">
              <i className="fa-solid fa-shield-halved text-emerald-500"></i> Hệ thống bảo mật thông tin hồ sơ (Chuẩn AES-256)
            </div>
          </div>
        </div>

        {/* Chân trang */}
        <div className="px-16 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-card">
                <i className="fa-regular fa-file-lines text-sm"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">AutoScreen</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ATS ENTERPRISE
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">v2.4</span>
                </div>
                <p className="text-[9px] text-slate-500">
                  Hệ thống Sàng Lọc &amp; Đánh giá Hồ Sơ Ứng Viên Chuẩn doanh nghiệp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hệ thống sẵn sàng vận hành
              </span>
              <span className="h-3 w-px bg-slate-300"></span>
              <span>
                Hỗ trợ kỹ thuật: <b className="text-slate-700">1900 6868</b>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[9px] text-slate-400">
            <span>AutoScreen Enterprise Edition © 2026. Chuẩn mực tuyển dụng số.</span>
            <span>Quy chuẩn: Apache PDFBox &nbsp;•&nbsp; NER Model &nbsp;•&nbsp; Jaccard &amp; Cosine &nbsp;•&nbsp; PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
