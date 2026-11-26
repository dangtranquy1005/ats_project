import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI, jobAPI, skillAPI, apiError } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State
  const [activeScreen, setActiveScreen] = useState('screen-auth');

  // Auth State
  const [user, setUser] = useState({});
  const [token, setToken] = useState(() => localStorage.getItem('ats_token') || sessionStorage.getItem('ats_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  const sessionVersion = useRef(0);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [skillsError, setSkillsError] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const activeJob = jobs.find(j => j.id === activeJobId);
  const weights = activeJob?.scoringConfig || { w1: 0.5, w2: 0.3, w3: 0.2 };
  const jobsRevision = useRef(0);
  const [scoreRevision, setScoreRevision] = useState(0);
  const [scoreReport, setScoreReport] = useState(null);
  const [reviewRevision, setReviewRevision] = useState(0);
  const reviewsChanged = useCallback(() => setReviewRevision(n => n + 1), []);
  const reviewDirty = useRef(false);
  const setReviewDirty = useCallback(value => { reviewDirty.current = value; }, []);
  const scoresChanged = useCallback(() => setScoreRevision(n => n + 1), []);
  const openScoreReport = (cvId, source = 'screen-ranking') => requestNavigation(() => {
    setScoreReport({ cvId, jobId: activeJobId, source });
    setActiveScreen('screen-report');
  });


  // Tổng CV lấy từ danh sách API, đồng bộ sidebar/JD sau upload hoặc xóa.
  const updateJobCvCount = useCallback((jobId, total) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, totalCv: total } : j));
  }, []);

  // Skills State (Đồng bộ với SkillController.java)
  const [standardSkills, setStandardSkills] = useState([]);
  const [categories, setCategories] = useState([]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Modals Visibility
  const [modals, setModals] = useState({
    weights: false,
    createJd: false,
    editJd: false,
    jdData: null,
    skillPick: false,
    skillForm: false,
    skillFormData: { mode: 'add', skill: null },
    alias: false,
    aliasSkill: null,
    cvDetail: false,
    cvDetailData: null,
    confirm: false,
    confirmData: { title: '', body: '', okText: 'Xác nhận', onConfirm: null }
  });

  const requestNavigation = useCallback(action => {
    if (!reviewDirty.current) { action(); return; }
    setModals(prev => ({ ...prev, confirm: true, confirmData: {
      title: 'Rời hồ sơ?', body: 'Bạn có muốn rời hồ sơ khi chưa lưu thay đổi không?', okText: 'Rời hồ sơ',
      onConfirm: () => { reviewDirty.current = false; action(); },
    }}));
  }, []);

  const mapJob = (j, config = { w1: 0.5, w2: 0.3, w3: 0.2 }) => ({
    id: j.jobId, code: `#JD-${j.jobId}`, title: j.title, status: j.status,
    description: j.description || '', minExp: j.minExperienceYears ?? 0,
    education: j.educationRequirements || '', requiredSkills: j.requiredSkills || [],
    skills: (j.requiredSkills || []).map(s => s.skillName), totalCv: j.totalApplications ?? 0,
    createdAt: j.createdAt?.split('T')[0] || '', scoringConfig: config,
  });

  // Không coi token trong storage là phiên hợp lệ trước khi /me xác nhận.
  useEffect(() => {
    let cancelled = false;
    const version = ++sessionVersion.current;
    if (!token) { setAuthLoading(false); return; }
    setAuthLoading(true);
    setAuthError('');
    authAPI.me().then(res => {
      if (cancelled || version !== sessionVersion.current) return;
      setUser(res.result);
      setIsAuthenticated(true);
      setActiveScreen('screen-jd');
    }).catch(error => {
      if (!cancelled && version === sessionVersion.current) setAuthError(apiError(error));
    }).finally(() => { if (!cancelled) setAuthLoading(false); });
    return () => { cancelled = true; };
  }, [token, authAttempt]);

  useEffect(() => {
    const expired = () => {
      ++sessionVersion.current;
      localStorage.removeItem('ats_token');
      sessionStorage.removeItem('ats_token');
      setToken(''); setIsAuthenticated(false); setUser({}); setJobs([]); setActiveJobId(null); setScoreReport(null);
      setStandardSkills([]); setCategories([]);
      setActiveScreen('screen-auth'); setModals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])));
      setAuthError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };
    window.addEventListener('ats:unauthorized', expired);
    return () => window.removeEventListener('ats:unauthorized', expired);
  }, []);

  const refreshJobs = async () => {
    const version = sessionVersion.current;
    const revision = ++jobsRevision.current;
    setJobsLoading(true); setJobsError('');
    try {
      const summaries = [];
      let page = 0;
      let result;
      do {
        result = await jobAPI.list(page++, 50);
        summaries.push(...result.content);
      } while (!result.last);
      const loaded = await Promise.all(summaries.filter(summary => summary.status === 'OPEN').map(async summary => {
        const [detail, config] = await Promise.all([jobAPI.get(summary.jobId), jobAPI.getConfig(summary.jobId)]);
        return mapJob(detail, { w1: config.jaccardWeight, w2: config.cosineWeight, w3: config.educationWeight });
      }));
      if (version !== sessionVersion.current) return;
      if (revision !== jobsRevision.current) return;
      const visible = loaded.filter(job => job.status === 'OPEN');
      setJobs(visible);
      setActiveJobId(prev => visible.some(j => j.id === prev) ? prev : visible[0]?.id ?? null);
    } catch (error) {
      if (version === sessionVersion.current) setJobsError(apiError(error));
    } finally {
      if (version === sessionVersion.current) setJobsLoading(false);
    }
  };

  const refreshSkills = async () => {
    const version = sessionVersion.current;
    setSkillsError('');
    try {
      const [list, groups] = await Promise.all([skillAPI.search(''), skillAPI.categories()]);
      const loaded = list.map(s => ({
        id: s.skillId, name: s.canonicalName, type: s.skillType,
        categoryId: s.categoryId, category: s.categoryName || '', inUse: s.inUse,
        aliasRecords: s.aliases || [], aliases: (s.aliases || []).map(a => a.aliasText),
      }));
      if (version !== sessionVersion.current) return;
      setStandardSkills(loaded);
      setCategories(groups.map(g => ({ id: g.categoryId, name: g.categoryName, description: g.description,
        skills: loaded.filter(s => s.categoryId === g.categoryId).map(s => s.name) })));
    } catch (error) {
      if (version === sessionVersion.current) setSkillsError(apiError(error));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshJobs(); refreshSkills();
  }, [isAuthenticated]);

  // Toast Function
  const showToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchTab = (screenId) => {
    if (screenId === activeScreen) return;
    requestNavigation(() => setActiveScreen(isAuthenticated ? screenId : 'screen-auth'));
  };

  const login = async (email, password, remember = true) => {
    try {
      const response = await authAPI.login(email.trim(), password);
      const auth = response.result;
      if (!auth?.token) throw new Error('Phản hồi đăng nhập không có token.');
      localStorage.removeItem('ats_token'); sessionStorage.removeItem('ats_token');
      (remember ? localStorage : sessionStorage).setItem('ats_token', auth.token);
      setAuthError(''); setAuthLoading(true); setToken(auth.token);
      setAuthAttempt(n => n + 1);
      return true;
    } catch (error) { throw new Error(apiError(error)); }
  };

  const logout = () => requestNavigation(() => {
    ++sessionVersion.current;
    localStorage.removeItem('ats_token'); sessionStorage.removeItem('ats_token');
    setToken(''); setIsAuthenticated(false); setUser({}); setJobs([]); setActiveJobId(null); setScoreReport(null);
    setStandardSkills([]); setCategories([]); setAuthError(''); setJobsError(''); setSkillsError('');
    setModals(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])));
    setActiveScreen('screen-auth');
  });

  const register = async (fullName, email, password) => {
    if (!fullName.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8) {
      throw new Error('Họ tên bắt buộc, email đúng định dạng, mật khẩu từ 8 ký tự.');
    }
    try {
      await authAPI.register({ fullname: fullName.trim(), email: email.trim(), password });
      showToast('Tạo tài khoản thành công', 'Vui lòng đăng nhập bằng tài khoản vừa tạo.', 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  // Chỉ cập nhật giao diện sau khi API đã lưu thành công.
  const saveWeights = async (w1, w2, w3) => {
    if (!activeJobId) throw new Error('Hãy chọn một JD.');
    const version = sessionVersion.current;
    try {
      const result = await jobAPI.updateConfig(activeJobId, { w1, w2, w3 });
      if (version !== sessionVersion.current) return;
      ++jobsRevision.current;
      setJobs(prev => prev.map(j => j.id === result.jobId ? { ...j, scoringConfig: {
        w1: result.jaccardWeight, w2: result.cosineWeight, w3: result.educationWeight,
      }} : j));
      scoresChanged();
      closeModal('weights');
      showToast('Đã lưu mức ưu tiên', 'Hệ thống sẽ tự cập nhật điểm theo lựa chọn mới.', 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  const createJob = async data => {
    const version = sessionVersion.current;
    try {
      const result = await jobAPI.create(data);
      if (version !== sessionVersion.current) return;
      const saved = mapJob(result);
      ++jobsRevision.current;
      setJobs(prev => [saved, ...prev]); setActiveJobId(saved.id); closeModal('createJd');
      showToast('Đã tạo JD', saved.title, 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  const updateJob = async (id, data) => {
    const version = sessionVersion.current;
    try {
      const result = await jobAPI.update(id, data);
      if (version !== sessionVersion.current) return;
      ++jobsRevision.current;
      setJobs(prev => prev.map(j => j.id === id ? { ...mapJob(result, j.scoringConfig), totalCv: j.totalCv } : j));
      scoresChanged();
      closeModal('editJd'); showToast('Đã lưu JD', 'Đã lưu thông tin tuyển dụng của bạn.', 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  const deleteJob = async id => {
    const version = sessionVersion.current;
    try {
      await jobAPI.delete(id);
      if (version !== sessionVersion.current) return;
      ++jobsRevision.current;
      setJobs(prev => prev.filter(j => j.id !== id));
      setActiveJobId(prev => prev === id ? jobs.find(j => j.id !== id && j.status === 'OPEN')?.id ?? null : prev);
      setScoreReport(prev => prev?.jobId === id ? null : prev);
      if (activeJobId === id) setActiveScreen('screen-jd');
      showToast('Đã cập nhật vị trí', 'Vị trí đã được gỡ khỏi danh sách tuyển dụng.', 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  const updateJobSkills = async (id, items) => {
    const version = sessionVersion.current;
    try {
      const result = await jobAPI.updateSkills(id, items.map(({skillId, mandatory, weight}) => ({skillId, mandatory, weight: Number(weight)})));
      if (version !== sessionVersion.current) return;
      ++jobsRevision.current;
      setJobs(prev => prev.map(j => j.id === id ? { ...j, requiredSkills: result.requiredSkills,
        skills: result.requiredSkills.map(s => s.skillName) } : j));
      scoresChanged();
      showToast('Đã lưu kỹ năng', 'Đã cập nhật các kỹ năng và mức ưu tiên của vị trí.', 'success');
    } catch (error) { throw new Error(apiError(error)); }
  };

  const toggleJobStatus = id => {
    const target = jobs.find(j => j.id === id);
    if (!target) return;
    openModal('confirm', {
      title: 'Đóng vị trí tuyển dụng?',
      body: `Bạn có muốn đóng vị trí "${target.title}" không?${reviewDirty.current ? ' Thay đổi chưa lưu trong hồ sơ sẽ không được giữ.' : ''}`,
      okText: 'Đóng vị trí',
      onConfirm: () => deleteJob(id),
    });
  };

  const openModal = (name, data = null) => {
    setModals(prev => ({
      ...prev,
      [name]: true,
      ...(name === 'createJd' ? { jdData: data } : {}),
      ...(name === 'editJd' ? { jdData: data } : {}),
      ...(name === 'skillForm' ? { skillFormData: data || { mode: 'add', skill: null } } : {}),
      ...(name === 'skillPick' ? { skillPickData: data } : {}),
      ...(name === 'alias' ? { aliasSkill: data } : {}),
      ...(name === 'cvDetail' ? { cvDetailData: data } : {}),
      ...(name === 'confirm' ? { confirmData: data } : {})
    }));
  };

  const closeModal = (name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        switchTab,
        user,
        setUser,
        token,
        isAuthenticated,
        authLoading, authError, retrySession: () => setAuthAttempt(n => n + 1),
        jobsLoading, jobsError, skillsError, refreshJobs, refreshSkills,
        login,
        logout,
        register,
        jobs,
        activeJobId,
        setActiveJobId: id => { if (id !== activeJobId) requestNavigation(() => setActiveJobId(id)); },
        activeJob,
        createJob,
        updateJob,
        deleteJob,
        updateJobSkills,
        toggleJobStatus,
        weights,
        saveWeights,
        updateJobCvCount,
        scoreRevision, scoresChanged, scoreReport, openScoreReport,
        reviewRevision, reviewsChanged, setReviewDirty,
        standardSkills,
        categories,
        toasts,
        showToast,
        removeToast,
        modals,
        openModal,
        closeModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
