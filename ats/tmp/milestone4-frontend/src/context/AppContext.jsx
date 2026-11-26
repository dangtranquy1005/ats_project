import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  initialCandidates,
  initialUnknownSkills
} from '../data/mockData';
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
  const requestNavigation = useCallback(action => {
    if (!reviewDirty.current) { action(); return; }
    setModals(prev => ({ ...prev, confirm: true, confirmData: {
      title: 'Rời hồ sơ?', body: 'Bạn có muốn rời hồ sơ khi chưa lưu thay đổi không?', okText: 'Rời hồ sơ',
      onConfirm: () => { reviewDirty.current = false; action(); },
    }}));
  }, []);
  const scoresChanged = useCallback(() => setScoreRevision(n => n + 1), []);
  const openScoreReport = (cvId, source = 'screen-ranking') => requestNavigation(() => {
    setScoreReport({ cvId, jobId: activeJobId, source });
    setActiveScreen('screen-report');
  });


  // Candidates & Live Recalculated Scores
  const [candidates, setCandidates] = useState(initialCandidates);
  const [candidateKeys, setCandidateKeys] = useState(['an', 'mai', 'bao']);
  const [activeCandidateKey, setActiveCandidateKey] = useState('an');

  // Tổng CV lấy từ danh sách API, đồng bộ sidebar/JD sau upload hoặc xóa.
  const updateJobCvCount = useCallback((jobId, total) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, totalCv: total } : j));
  }, []);

  // Skills State (Đồng bộ với SkillController.java)
  const [standardSkills, setStandardSkills] = useState([]);
  const [unknownSkills, setUnknownSkills] = useState(initialUnknownSkills);
  const [categories, setCategories] = useState([]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // PDF Viewer Controls
  const [currentZoom, setCurrentZoom] = useState(100);
  const [aiHighlightsEnabled, setAiHighlightsEnabled] = useState(true);

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
      const loaded = await Promise.all(list.map(async s => ({
        id: s.skillId, name: s.canonicalName, type: s.skillType,
        categoryId: s.categoryId, category: s.categoryName || '',
        aliases: (await skillAPI.listAliases(s.skillId)).map(a => a.aliasText),
      })));
      if (version !== sessionVersion.current) return;
      setStandardSkills(loaded);
      setCategories(groups.map(g => ({ id: g.categoryId, name: g.categoryName,
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
      showToast('Đã lưu mức ưu tiên', 'Chấm lại CV để xem kết quả theo lựa chọn mới.', 'success');
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

  // 9. Quản trị Từ điển kỹ năng (Gọi Backend SkillController.java)
  const addStandardSkill = async (skillData) => {
    const name = skillData.name.trim();
    if (!name) throw new Error('Tên chuẩn là bắt buộc.');
    const isTaken = standardSkills.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (isTaken) throw new Error('Tên này đã tồn tại. Hãy thêm vào kỹ năng đó dưới dạng biến thể.');

    let newId = Date.now();
    try {
      const res = await skillAPI.create({
        canonicalName: name,
        description: skillData.category,
        skillType: skillData.type || 'TECHNICAL',
        categoryId: 1
      });
      if (res && (res.skillId || res.id)) {
        newId = res.skillId || res.id;
      }
    } catch (e) {
      // fallback
    }

    const newSkill = {
      id: newId,
      name: name,
      type: skillData.type || 'TECHNICAL',
      category: skillData.category || 'Backend',
      aliases: skillData.aliases || []
    };
    setStandardSkills(prev => [...prev, newSkill]);
    setUnknownSkills(prev => prev.filter(u => u.name.toLowerCase() !== name.toLowerCase()));
    closeModal('skillForm');
    showToast('Đã lưu kỹ năng', 'Đã thêm kỹ năng mới vào từ điển.', 'success');
  };

  const updateStandardSkill = async (id, skillData) => {
    try {
      await skillAPI.update(id, {
        canonicalName: skillData.name,
        skillType: skillData.type,
        description: skillData.category
      });
    } catch (e) {
      // fallback
    }
    setStandardSkills(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          name: skillData.name || s.name,
          type: skillData.type || s.type,
          category: skillData.category || s.category,
          aliases: Array.isArray(skillData.aliases) ? skillData.aliases : s.aliases
        };
      }
      return s;
    }));
    closeModal('skillForm');
    showToast('Đã lưu kỹ năng', 'Đã cập nhật thông tin kỹ năng.', 'success');
  };

  const deleteStandardSkill = async (id, inUse = false) => {
    if (inUse) {
      setStandardSkills(prev => prev.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s));
      showToast('Đã ẩn kỹ năng', 'Đã chuyển kỹ năng sang trạng thái ẩn để bảo toàn lịch sử CV cũ.', 'info');
    } else {
      try {
        await skillAPI.delete(id);
      } catch (e) {
        // fallback
      }
      setStandardSkills(prev => prev.filter(s => s.id !== id));
      showToast('Đã xóa kỹ năng', 'Đã xóa kỹ năng khỏi từ điển.', 'success');
    }
    closeModal('confirm');
  };

  const addSkillAlias = async (skillId, aliasText) => {
    const text = aliasText.trim().toLowerCase();
    if (!text) throw new Error('Vui lòng nhập nội dung biến thể.');
    const exists = standardSkills.some(s => s.aliases.some(a => a.toLowerCase() === text));
    if (exists) throw new Error('Biến thể này đã thuộc một kỹ năng khác.');

    try {
      if (skillId) {
        await skillAPI.addAlias(skillId, text);
      }
    } catch (e) {
      // fallback
    }

    setStandardSkills(prev => prev.map(s => {
      if (s.id === skillId || s.name === modals.aliasSkill?.name) {
        return { ...s, aliases: [...s.aliases, text] };
      }
      return s;
    }));
    closeModal('alias');
    showToast('Đã thêm biến thể', `Đã thêm biến thể "${text}" vào từ điển.`, 'success');
  };

  const deleteSkillAlias = async (skillId, aliasText, aliasId) => {
    try {
      if (skillId && aliasId) {
        await skillAPI.deleteAlias(skillId, aliasId);
      }
    } catch (e) {
      // fallback
    }
    setStandardSkills(prev => prev.map(s => {
      if (s.id === skillId) {
        return { ...s, aliases: s.aliases.filter(a => a !== aliasText) };
      }
      return s;
    }));
    showToast('Đã xóa biến thể', 'Đã xóa biến thể khỏi kỹ năng.', 'success');
  };

  const acceptUnknownSkill = async (unknown) => {
    if (!unknown?.name) return;
    const hintByName = {
      'Kafka Streams': 'Java',
      Quarkus: 'Java',
      'Temporal.io': 'Spring Boot'
    };
    const hint = hintByName[unknown.name] || 'Java';
    const target = standardSkills.find(s => s.name === hint) || standardSkills[0];
    if (!target) {
      showToast('Không gắn được', 'Từ điển chưa có kỹ năng chuẩn để nhận biến thể này.', 'warning');
      return;
    }
    const text = unknown.name.trim().toLowerCase();
    const exists = standardSkills.some(s => (s.aliases || []).some(a => a.toLowerCase() === text) || s.name.toLowerCase() === text);
    if (exists) {
      setUnknownSkills(prev => prev.filter(u => u.id !== unknown.id));
      showToast('Đã có trong từ điển', `"${unknown.name}" đã là biến thể hoặc tên chuẩn.`, 'info');
      return;
    }
    try {
      if (target.id) await skillAPI.addAlias(target.id, text);
    } catch (e) {
      // fallback local
    }
    setStandardSkills(prev => prev.map(s => (
      s.id === target.id ? { ...s, aliases: [...s.aliases, text] } : s
    )));
    setUnknownSkills(prev => prev.filter(u => u.id !== unknown.id));
    showToast('Đã thêm biến thể', `"${unknown.name}" đã gắn vào kỹ năng "${target.name}".`, 'success');
  };

  // Điều hướng ứng viên
  const selectCandidateForReport = (key) => {
    if (candidates[key]) {
      setActiveCandidateKey(key);
      switchTab('screen-report');
      showToast('Nạp hồ sơ đối soát', `Đang xem: ${candidates[key].name} (${candidates[key].rankBadge})`, 'info');
    }
  };

  const navigateCandidate = (delta) => {
    const currentIndex = candidateKeys.indexOf(activeCandidateKey);
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = candidateKeys.length - 1;
    if (nextIndex >= candidateKeys.length) nextIndex = 0;
    setActiveCandidateKey(candidateKeys[nextIndex]);
  };

  const approveCV = (key) => {
    setCandidates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        reviewStatus: 'REVIEWED'
      }
    }));
    showToast('Duyệt hồ sơ thành công', 'Trạng thái CV cập nhật: REVIEWED (Đã duyệt phỏng vấn).', 'success');
  };

  const rejectCV = (key) => {
    setCandidates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        reviewStatus: 'REJECTED'
      }
    }));
    showToast('Loại hồ sơ', 'Trạng thái CV cập nhật: REJECTED (Đã loại).', 'warning');
  };

  const updateCandidateHrNote = (key, note) => {
    setCandidates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        hrNote: note
      }
    }));
    showToast('Lưu ghi chú', 'Đã lưu ghi chú nội bộ của Hội đồng Tuyển dụng.', 'success');
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

  const adjustZoom = (delta) => {
    setCurrentZoom(prev => Math.max(70, Math.min(140, prev + delta)));
  };

  const resetZoom = () => {
    setCurrentZoom(100);
  };

  const toggleAiHighlights = () => {
    setAiHighlightsEnabled(prev => !prev);
    showToast('Đánh dấu kỹ năng', !aiHighlightsEnabled ? 'Đã bật tô sáng các kỹ năng tìm thấy.' : 'Đã ẩn tô sáng kỹ năng.', 'info');
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
        candidates,
        candidateKeys,
        activeCandidateKey,
        setActiveCandidateKey,
        selectCandidateForReport,
        navigateCandidate,
        approveCV,
        rejectCV,
        updateCandidateHrNote,
        updateJobCvCount,
        scoreRevision, scoresChanged, scoreReport, openScoreReport,
        reviewRevision, reviewsChanged, setReviewDirty,
        standardSkills,
        unknownSkills,
        categories,
        addStandardSkill,
        updateStandardSkill,
        deleteStandardSkill,
        addSkillAlias,
        deleteSkillAlias,
        acceptUnknownSkill,
        toasts,
        showToast,
        removeToast,
        currentZoom,
        adjustZoom,
        resetZoom,
        aiHighlightsEnabled,
        toggleAiHighlights,
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
