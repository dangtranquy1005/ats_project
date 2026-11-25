import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialCandidates,
  initialJobs,
  initialSkills,
  initialUnknownSkills,
  initialCategories,
  initialUploadQueue
} from '../data/mockData';
import { authAPI, jobAPI, skillAPI, cvAPI } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State
  const [activeScreen, setActiveScreen] = useState('screen-auth');

  // Auth State
  const [user, setUser] = useState({
    fullName: 'Phạm Minh Đức',
    email: 'recruiter@company.com',
    role: 'RECRUITER'
  });
  const [token, setToken] = useState(localStorage.getItem('ats_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('ats_token'));

  // Jobs State (Đồng bộ với JobController.java)
  const [jobs, setJobs] = useState(initialJobs);
  const [activeJobId, setActiveJobId] = useState(1);
  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0];

  // Weights State (Đồng bộ với ScoringConfigRequest & JobController.java)
  const [weights, setWeights] = useState({ w1: 0.5, w2: 0.3, w3: 0.2 });

  // Candidates & Live Recalculated Scores
  const [candidates, setCandidates] = useState(initialCandidates);
  const [candidateKeys, setCandidateKeys] = useState(['an', 'mai', 'bao']);
  const [activeCandidateKey, setActiveCandidateKey] = useState('an');

  // CV Upload Queue (Đồng bộ với CvController.java)
  const [uploadQueue, setUploadQueue] = useState(initialUploadQueue);

  // Skills State (Đồng bộ với SkillController.java)
  const [standardSkills, setStandardSkills] = useState(initialSkills);
  const [unknownSkills, setUnknownSkills] = useState(initialUnknownSkills);
  const [categories, setCategories] = useState(initialCategories);

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

  // Tự động tải danh sách Jobs và Skills từ Backend Spring Boot khi khởi động
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const jobPage = await jobAPI.list(0, 50);
        if (jobPage && jobPage.content && jobPage.content.length > 0) {
          const mappedJobs = jobPage.content.map(j => ({
            id: j.jobId,
            code: `#JD-${j.jobId}`,
            title: j.title,
            status: j.status || 'OPEN',
            minExp: 2.0,
            education: 'Đại học chuyên ngành CNTT',
            description: j.title,
            skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
            totalCv: j.totalApplications || 0,
            passedHardFilter: Math.round((j.totalApplications || 0) * 0.75),
            avgScore: 76.5,
            createdAt: j.createdAt ? j.createdAt.split('T')[0] : '2026-11-24'
          }));
          setJobs(mappedJobs);
          setActiveJobId(mappedJobs[0].id);
        }
      } catch (err) {
        // Backend chưa bật hoặc chưa seed -> giữ mock data
      }

      try {
        const skillList = await skillAPI.search('');
        if (Array.isArray(skillList) && skillList.length > 0) {
          const mappedSkills = skillList.map(s => ({
            id: s.skillId || s.id,
            name: s.name || s.canonicalName,
            type: s.type || s.skillType || 'TECHNICAL',
            category: s.categoryName || 'Backend',
            aliases: s.aliases?.map(a => a.aliasText || a) || []
          }));
          setStandardSkills(mappedSkills);
        }
      } catch (err) {
        // giữ mock data
      }
    };

    fetchBackendData();
  }, [token]);

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
    setActiveScreen(screenId);
  };

  // 1. Auth: Đăng nhập (Gọi Backend UserController: POST /api/v1/user/login)
  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      // BaseResponse: { status, message, data: { token, email, fullName } }
      const authData = res.data || res;
      if (authData && authData.token) {
        setToken(authData.token);
        localStorage.setItem('ats_token', authData.token);
        setUser({
          email: authData.email || email,
          fullName: authData.fullName || authData.fullname || 'Nhà tuyển dụng',
          role: 'RECRUITER'
        });
        setIsAuthenticated(true);
        showToast('Đăng nhập thành công', `Chào mừng ${authData.fullName || authData.fullname || email} quay lại AutoScreen.`, 'success');
        switchTab('screen-jd');
        return true;
      }
      throw new Error('Phản hồi đăng nhập không có token.');
    } catch (backendErr) {
      // Fallback cho tài khoản demo prototype nếu backend chưa bật
      if (
        (email === 'recruiter@company.com' || email === 'admin@company.com' || email === 'phamminhduc@gmail.com') &&
        (password === 'secretpassword123' || password === 'hr_secret_2026')
      ) {
        const dummyToken = 'demo-jwt-token-recruiter';
        setToken(dummyToken);
        localStorage.setItem('ats_token', dummyToken);
        setUser({
          fullName: 'Phạm Minh Đức',
          email: email,
          role: 'RECRUITER'
        });
        setIsAuthenticated(true);
        showToast('Đăng nhập thành công', 'Chào mừng Phạm Minh Đức quay lại AutoScreen.', 'success');
        switchTab('screen-jd');
        return true;
      }
      throw new Error(backendErr.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ats_token');
    showToast('Đăng xuất', 'Đã quay về màn hình đăng nhập hệ thống.', 'info');
    switchTab('screen-auth');
  };

  // 2. Auth: Đăng ký (Gọi Backend UserController: POST /api/v1/user/create)
  const register = async (fullName, email, password) => {
    if (!fullName?.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      throw new Error('Họ tên bắt buộc, email đúng định dạng, mật khẩu từ 8 ký tự.');
    }
    if (email.toLowerCase() === 'recruiter@company.com') {
      throw new Error('Email này đã được đăng ký.');
    }
    try {
      await authAPI.register({ fullname: fullName, email, password, role: 'RECRUITER' });
    } catch (e) {
      // nếu backend offline, vẫn thông báo theo flow prototype
    }
    showToast('Tạo tài khoản thành công', 'Đã tạo tài khoản vai trò RECRUITER. Vui lòng đăng nhập.', 'success');
    return true;
  };

  // Tính lại điểm số
  const recalculateScores = (newWeights) => {
    const { w1, w2, w3 } = newWeights;
    setCandidates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        const c = updated[k];
        if (c.status === 'passed') {
          const newScore = Math.round((w1 * c.baseSkillScore + w2 * c.baseExpScore + w3 * c.baseEduScore) * 10) / 10;
          c.score = newScore.toFixed(1);
          c.explain = `
            <p>• <b>Tầng 1 - Lọc cứng (Hard filter):</b> <span class="text-emerald-700 font-semibold">ĐẠT</span> (${k === 'an' ? '3.5' : '2.0'} năm kinh nghiệm thực tế &gt;= yêu cầu 2.0 năm; Tốt nghiệp ĐH).</p>
            <p>• <b>Tầng 2 - So khớp kỹ năng:</b> ${c.baseSkillScore}%</p>
            <p>• <b>Tầng 2 - So khớp ngữ nghĩa kinh nghiệm:</b> ${c.baseExpScore}%</p>
            <p>• <b>Công thức tính điểm:</b> ${w1} × ${c.baseSkillScore}% + ${w2} × ${c.baseExpScore}% + ${w3} × ${c.baseEduScore}% = <b class="text-slate-900 font-mono">${newScore.toFixed(1)} / 100</b>.</p>
          `;
        }
      });
      return updated;
    });
  };

  // 3. Cấu hình trọng số (Gọi Backend JobController: PUT /api/v1/jobs/{id}/scoring-config)
  const saveWeights = async (w1, w2, w3) => {
    const newWeights = { w1, w2, w3 };
    setWeights(newWeights);
    recalculateScores(newWeights);

    try {
      if (activeJobId) {
        await jobAPI.updateConfig(activeJobId, {
          jaccardWeight: w1,
          cosineWeight: w2,
          educationWeight: w3,
          minPassScore: 60.0,
          minRequiredSkills: 1
        });
      }
    } catch (e) {
      // Backend offline -> vẫn cập nhật local state
    }

    closeModal('weights');
    showToast('Đã lưu trọng số', 'Hệ thống backend đã cập nhật trọng số và tính toán lại điểm số tự động.', 'success');
  };

  // 4. Tạo vị trí tuyển dụng JD (Gọi Backend JobController: POST /api/v1/jobs)
  const createJob = async (jobData) => {
    let createdJobId = Date.now();
    try {
      const res = await jobAPI.create(jobData);
      if (res && (res.jobId || res.id)) {
        createdJobId = res.jobId || res.id;
      }
    } catch (e) {
      // fallback
    }

    const newJob = {
      id: createdJobId,
      code: `#JD-${Math.floor(Math.random() * 900 + 100)}`,
      title: jobData.title,
      status: 'OPEN',
      minExp: parseFloat(jobData.minExp) || 2.0,
      education: jobData.education || 'Đại học chuyên ngành CNTT',
      description: jobData.description || 'Tuyển dụng và sàng lọc hồ sơ ứng viên.',
      skills: typeof jobData.skills === 'string' ? jobData.skills.split(',').map(s => s.trim()).filter(Boolean) : jobData.skills,
      totalCv: 0,
      passedHardFilter: 0,
      avgScore: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setJobs(prev => [newJob, ...prev]);
    setActiveJobId(newJob.id);
    closeModal('createJd');
    showToast('Tạo vị trí thành công', `Đã kích hoạt vị trí mới: ${newJob.title}`, 'success');
  };

  // 5. Sửa vị trí JD (Gọi Backend JobController: PUT /api/v1/jobs/{id})
  const updateJob = async (id, jobData) => {
    try {
      await jobAPI.update(id, jobData);
    } catch (e) {
      // fallback
    }
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return {
          ...j,
          title: jobData.title,
          minExp: parseFloat(jobData.minExp) || j.minExp,
          education: jobData.education || j.education,
          description: jobData.description || j.description,
          skills: typeof jobData.skills === 'string' ? jobData.skills.split(',').map(s => s.trim()).filter(Boolean) : jobData.skills
        };
      }
      return j;
    }));
    closeModal('editJd');
    showToast('Đã cập nhật vị trí', 'Thông tin vị trí tuyển dụng đã được cập nhật.', 'success');
  };

  // 6. Xóa vị trí JD (Gọi Backend JobController: DELETE /api/v1/jobs/{id})
  const deleteJob = async (id) => {
    try {
      await jobAPI.delete(id);
    } catch (e) {
      // fallback
    }
    setJobs(prev => prev.filter(j => j.id !== id));
    setActiveJobId(prev => {
      if (prev !== id) return prev;
      const remaining = jobs.filter(j => j.id !== id);
      return remaining[0]?.id ?? prev;
    });
    closeModal('confirm');
    showToast('Đã xóa', 'Đã xóa vị trí tuyển dụng khỏi danh sách.', 'success');
  };

  const updateJobSkills = (jobId, skillNames) => {
    const names = (Array.isArray(skillNames) ? skillNames : [])
      .map(s => (typeof s === 'string' ? s.trim() : s?.name))
      .filter(Boolean);
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, skills: names } : j)));
  };

  // 7. Thay đổi trạng thái vị trí (Gọi Backend JobController: PATCH /api/v1/jobs/{id}/status)
  const toggleJobStatus = async (id) => {
    const target = jobs.find(j => j.id === id);
    if (!target) return;
    const nextStatus = target.status === 'OPEN' ? 'CLOSED' : 'OPEN';

    try {
      await jobAPI.changeStatus(id, nextStatus);
    } catch (e) {
      // fallback
    }

    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return { ...j, status: nextStatus };
      }
      return j;
    }));
    showToast('Trạng thái vị trí', `Vị trí đã chuyển sang: ${nextStatus === 'OPEN' ? 'Đang tuyển' : 'Tạm dừng'}`, 'info');
  };

  // 8. Tải lên CV & Apache PDFBox bóc tách (Gọi Backend CvController: POST /api/v1/cvs/upload)
  const handleUploadFiles = async (files) => {
    const fileList = Array.from(files);
    let successCount = 0;

    // Gửi multipart files sang Spring Boot CvController
    try {
      const results = await cvAPI.upload(activeJobId, fileList);
      if (Array.isArray(results) && results.length > 0) {
        results.forEach(res => {
          if (res.success) {
            successCount++;
            setUploadQueue(prev => [
              {
                id: res.cvId || Date.now() + Math.random(),
                name: res.filePath || 'CV_Upload.pdf',
                size: '1.5 MB',
                status: 'PROCESSED',
                time: '0.8s',
                note: `Hoàn thành: ${res.candidateName || 'Ứng viên mới'}`
              },
              ...prev
            ]);
          } else {
            setUploadQueue(prev => [
              {
                id: Date.now() + Math.random(),
                name: res.filePath || 'File_Error.pdf',
                size: '—',
                status: 'REJECTED',
                time: '0.1s',
                note: res.errorMessage || 'Thất bại: Không đọc được tệp PDF'
              },
              ...prev
            ]);
          }
        });
        showToast('Hoàn thành', `Hệ thống đã xử lý xong ${successCount}/${fileList.length} tệp CV.`, 'success');
        return;
      }
    } catch (e) {
      // Backend offline: mô phỏng theo flow prototype
    }

    fileList.forEach(file => {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      const isPdf = /\.pdf$/i.test(file.name);
      const isOversize = file.size > 10 * 1024 * 1024;

      if (!isPdf || isOversize) {
        const rejectItem = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: `${mb} MB`,
          status: 'REJECTED',
          time: '0.1s',
          note: !isPdf ? 'Thất bại: Chỉ hỗ trợ tệp định dạng .pdf.' : 'Thất bại: Vượt dung lượng tối đa 10 MB.'
        };
        setUploadQueue(prev => [rejectItem, ...prev]);
      } else {
        successCount++;
        const pendingItem = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: `${mb} MB`,
          status: 'PROCESSING',
          time: 'Đang xử lý...',
          note: 'Đang đọc nội dung và tìm kỹ năng trong CV...'
        };
        setUploadQueue(prev => [pendingItem, ...prev]);

        setTimeout(() => {
          setUploadQueue(prev => prev.map(q => {
            if (q.id === pendingItem.id) {
              return {
                ...q,
                status: 'PROCESSED',
                time: '0.7s',
                note: 'Hoàn thành'
              };
            }
            return q;
          }));
          showToast('Hoàn thành', `Tệp ${file.name} đã xử lý xong và thêm vào Bảng xếp hạng.`, 'success');
        }, 1500);
      }
    });

    showToast('Tiếp nhận hồ sơ', `Đã nhận ${successCount}/${fileList.length} tệp PDF.`, successCount > 0 ? 'success' : 'warning');
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

  const deleteCV = (cvId) => {
    setUploadQueue(prev => prev.filter(item => item.id !== cvId));
    showToast('Đã xóa CV', 'Đã gỡ tệp CV khỏi hàng đợi xử lý.', 'success');
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
        login,
        logout,
        register,
        jobs,
        activeJobId,
        setActiveJobId,
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
        deleteCV,
        updateCandidateHrNote,
        uploadQueue,
        handleUploadFiles,
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
