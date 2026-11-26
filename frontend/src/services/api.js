import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Gắn JWT token vào Header Authorization cho mọi request bảo mật
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ats_token') || sessionStorage.getItem('ats_token');
  if (token && !config.url.startsWith('/user/login') && !config.url.startsWith('/user/create') && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(response => response, error => {
  const currentToken = localStorage.getItem('ats_token') || sessionStorage.getItem('ats_token');
  if (error.response?.status === 401 && currentToken && error.config?.headers?.Authorization === `Bearer ${currentToken}`) {
    window.dispatchEvent(new Event('ats:unauthorized'));
  }
  return Promise.reject(error);
});

export function apiError(error) {
  if (!error.response) return 'Không kết nối được hệ thống. Vui lòng thử lại sau.';
  const body = error.response.data;
  return body?.error?.message || body?.message || body?.detail ||
    ({ 401: 'Email hoặc mật khẩu không đúng, hoặc phiên đã hết hạn.', 403: 'Bạn không có quyền thực hiện thao tác này.',
       404: 'Không tìm thấy dữ liệu thuộc tài khoản.', 409: 'Dữ liệu đã thay đổi hoặc đang được sử dụng. Hãy tải lại và kiểm tra.' }[error.response.status]) ||
    `Yêu cầu thất bại (HTTP ${error.response.status}).`;
}

const jobPayload = data => ({
  title: data.title,
  description: data.description,
  minExperienceYears: Number(data.minExp),
  educationRequirements: data.education || null,
  requiredSkills: data.requiredSkills.map(({ skillId, mandatory, weight }) => ({ skillId, mandatory, weight: Number(weight) })),
});

// 1. Quản lý tài khoản & Xác thực (UserController.java: /api/v1/user)
export const authAPI = {
  me: async () => (await api.get('/user/me')).data,
  login: async (email, password) => {
    // UserController: POST /api/v1/user/login -> { email, password }
    const res = await api.post('/user/login', { email, password });
    return res.data;
  },
  register: async ({ fullname, email, password, role = 'RECRUITER' }) => {
    // UserController: POST /api/v1/user/create -> UserDto
    const res = await api.post('/user/create', {
      fullname,
      email,
      password,
      role
    });
    return res.data;
  }
};

// 2. Quản lý vị trí tuyển dụng JD & Trọng số (JobController.java: /api/v1/jobs)
export const jobAPI = {
  list: async (page = 0, size = 20) => {
    // GET /api/v1/jobs?page=0&size=20
    const res = await api.get(`/jobs?page=${page}&size=${size}`);
    return res.data;
  },
  get: async (id) => {
    // GET /api/v1/jobs/{id}
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },
  create: async (jobData) => {
    // POST /api/v1/jobs -> JobRequest
    const res = await api.post('/jobs', jobPayload(jobData));
    return res.data;
  },
  update: async (id, jobData) => {
    // PUT /api/v1/jobs/{id} -> JobRequest
    const res = await api.put(`/jobs/${id}`, jobPayload(jobData));
    return res.data;
  },
  changeStatus: async (id, status) => {
    // PATCH /api/v1/jobs/{id}/status -> { status: "OPEN" | "CLOSED" }
    const res = await api.patch(`/jobs/${id}/status`, { status });
    return res.data;
  },
  delete: async (id) => {
    // DELETE /api/v1/jobs/{id}
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },
  getSkills: async (id) => {
    // GET /api/v1/jobs/{id}/skills
    const res = await api.get(`/jobs/${id}/skills`);
    return res.data;
  },
  updateSkills: async (id, items) => {
    // PUT /api/v1/jobs/{id}/skills -> List<JobSkillRequest>
    const res = await api.put(`/jobs/${id}/skills`, items);
    return res.data;
  },
  getConfig: async (id) => {
    // GET /api/v1/jobs/{id}/scoring-config
    const res = await api.get(`/jobs/${id}/scoring-config`);
    return res.data;
  },
  updateConfig: async (id, config) => {
    // PUT /api/v1/jobs/{id}/scoring-config -> ScoringConfigRequest
    const res = await api.put(`/jobs/${id}/scoring-config`, {
      jaccardWeight: config.jaccardWeight ?? config.w1 ?? 0.5,
      cosineWeight: config.cosineWeight ?? config.w2 ?? 0.3,
      educationWeight: config.educationWeight ?? config.w3 ?? 0.2
    });
    return res.data;
  }
};

// 3. Quản lý CV & Bóc tách văn bản (CvController.java: /api/v1/cvs)
export const cvAPI = {
  list: async (jobId, { page = 0, size = 10, status, signal } = {}) =>
    (await api.get('/cvs', { params: { jobId, page, size, status: status || undefined }, signal })).data,
  detail: async (id, signal) => (await api.get(`/cvs/${id}`, { signal })).data,
  review: async (id, signal) => (await api.get(`/cvs/${id}/review`, { signal })).data,
  saveReview: async (id, data) => (await api.put(`/cvs/${id}/review`, data)).data,
  status: async id => (await api.get(`/cvs/${id}/status`)).data,
  retry: async id => (await api.post(`/cvs/${id}/retry`)).data,
  delete: async id => (await api.delete(`/cvs/${id}`)).data,
  file: async (id, signal) => (await api.get(`/cvs/${id}/file`, { responseType: 'blob', timeout: 120000, signal })).data,
  upload: async (jobId, files, onUploadProgress) => {
    // POST /api/v1/cvs/upload (multipart/form-data: jobId, files)
    const formData = new FormData();
    formData.append('jobId', jobId);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await api.post('/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000, onUploadProgress
    });
    return res.data;
  },
  extractTest: async (file) => {
    // POST /api/v1/cvs/extract-test (multipart/form-data: file)
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/cvs/extract-test', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

// Chấm điểm và đọc kết quả đã lưu: điểm API dùng thang 0..1.
export const scoringAPI = {
  exportCsv: async (jobId,params,signal) => (await api.get(`/jobs/${jobId}/ranking/export`,{params,signal,responseType:'blob',timeout:60000})).data,
  rescore: async jobId => (await api.post(`/jobs/${jobId}/rescore`, null, { timeout: 180000 })).data,
  ranking: async (jobId, params, signal) => (await api.get(`/jobs/${jobId}/ranking`, { params, signal })).data,
  status: async (jobId, signal) => (await api.get(`/jobs/${jobId}/scoring-status`, { signal })).data,
  match: async (cvId, signal) => (await api.get(`/cvs/${cvId}/match`, { signal })).data,
};

// 4. Quản lý Từ điển kỹ năng (SkillController.java: /api/v1/skills)
export const skillAPI = {
  unknown: async (page=0, search='', signal) => (await api.get('/unknown-skills',{params:{page,size:25,search},signal})).data,
  createCategory: async data => (await api.post('/skill-categories',data)).data,
  updateCategory: async (id,data) => (await api.put(`/skill-categories/${id}`,data)).data,
  deleteCategory: async id => (await api.delete(`/skill-categories/${id}`)).data,
  search: async (query = '') => {
    // GET /api/v1/skills?query=...
    const res = await api.get(`/skills?query=${encodeURIComponent(query)}`);
    return res.data;
  },
  categories: async () => {
    // GET /api/v1/skill-categories
    const res = await api.get('/skill-categories');
    return res.data;
  },
  create: async (data) => {
    // POST /api/v1/skills -> SkillRequest (canonicalName, description, skillType, categoryId)
    const res = await api.post('/skills', {
      canonicalName: data.canonicalName || data.name,
      description: data.description || '',
      skillType: data.skillType || data.type || 'TECHNICAL',
      categoryId: data.categoryId ?? null
    });
    return res.data;
  },
  update: async (id, data) => {
    // PUT /api/v1/skills/{id} -> SkillRequest
    const res = await api.put(`/skills/${id}`, {
      canonicalName: data.canonicalName || data.name,
      description: data.description || '',
      skillType: data.skillType || data.type || 'TECHNICAL',
      categoryId: data.categoryId ?? null
    });
    return res.data;
  },
  delete: async (id) => {
    // DELETE /api/v1/skills/{id}
    const res = await api.delete(`/skills/${id}`);
    return res.data;
  },
  listAliases: async (id) => {
    // GET /api/v1/skills/{id}/aliases
    const res = await api.get(`/skills/${id}/aliases`);
    return res.data;
  },
  addAlias: async (id, aliasText) => {
    // POST /api/v1/skills/{id}/aliases -> { aliasText }
    const res = await api.post(`/skills/${id}/aliases`, { aliasText });
    return res.data;
  },
  deleteAlias: async (id, aliasId) => {
    // DELETE /api/v1/skills/{id}/aliases/{aliasId}
    const res = await api.delete(`/skills/${id}/aliases/${aliasId}`);
    return res.data;
  }
};

export default api;
