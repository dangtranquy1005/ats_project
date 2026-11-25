import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Gắn JWT token vào Header Authorization cho mọi request bảo mật
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ats_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. Quản lý tài khoản & Xác thực (UserController.java: /api/v1/user)
export const authAPI = {
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
    const res = await api.post('/jobs', {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || jobData.description,
      minExperienceYears: Math.round(jobData.minExp || 2),
      educationRequirements: jobData.education,
      location: jobData.location || 'Hà Nội',
      salary: jobData.salary || 0.0,
      requiredSkillIds: jobData.requiredSkillIds || []
    });
    return res.data;
  },
  update: async (id, jobData) => {
    // PUT /api/v1/jobs/{id} -> JobRequest
    const res = await api.put(`/jobs/${id}`, {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || jobData.description,
      minExperienceYears: Math.round(jobData.minExp || 2),
      educationRequirements: jobData.education,
      location: jobData.location || 'Hà Nội',
      salary: jobData.salary || 0.0,
      requiredSkillIds: jobData.requiredSkillIds || []
    });
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
      educationWeight: config.educationWeight ?? config.w3 ?? 0.2,
      minPassScore: config.minPassScore ?? 60.0,
      minRequiredSkills: config.minRequiredSkills ?? 1
    });
    return res.data;
  }
};

// 3. Quản lý CV & Bóc tách văn bản (CvController.java: /api/v1/cvs)
export const cvAPI = {
  upload: async (jobId, files) => {
    // POST /api/v1/cvs/upload (multipart/form-data: jobId, files)
    const formData = new FormData();
    formData.append('jobId', jobId);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await api.post('/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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

// 4. Quản lý Từ điển kỹ năng (SkillController.java: /api/v1/skills)
export const skillAPI = {
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
      categoryId: data.categoryId || 1
    });
    return res.data;
  },
  update: async (id, data) => {
    // PUT /api/v1/skills/{id} -> SkillRequest
    const res = await api.put(`/skills/${id}`, {
      canonicalName: data.canonicalName || data.name,
      description: data.description || '',
      skillType: data.skillType || data.type || 'TECHNICAL',
      categoryId: data.categoryId || 1
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
