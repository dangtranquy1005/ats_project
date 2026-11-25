// Mock data matching the AutoScreen Figma prototype exactly

export const initialCandidates = {
  an: {
    key: 'an',
    seq: '1 / 3',
    title: 'Hồ sơ ứng viên: Nguyễn Văn An (#CV-0029)',
    name: 'Nguyễn Văn An',
    rankBadge: 'Hạng #1',
    rankColor: 'bg-blue-50 text-blue-700 border-blue-200',
    contact: 'an.nguyen@email.com • 0987.654.321',
    eduText: '<i class="fa-solid fa-graduation-cap text-slate-400"></i> Đại học chuyên ngành CNTT (2019 - 2023)',
    avatar: 'NA',
    status: 'passed',
    score: '88.5',
    baseSkillScore: 86,
    baseExpScore: 85,
    baseEduScore: 100,
    skillRate: 'Độ khớp: 86%',
    skills: [
      { name: 'Java Core & OOP', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'Spring Boot 3', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'PostgreSQL & JPA', pass: true, matchType: 'fuzzy', score: '0.92' },
      { name: 'Docker Container', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'RESTful API', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'Git & CI/CD', pass: true, matchType: 'fuzzy', score: '0.88' },
      { name: 'Redis Caching (Thiếu)', pass: false, matchType: 'none', score: '0.00' }
    ],
    unknownSkills: ['Kafka Streams'],
    metrics: {
      jaccard: '0.78',
      cosine: '0.85',
      education: '1.00'
    },
    explain: `
      <p>• <b>Tầng 1 - Lọc cứng (Hard filter):</b> <span class="text-emerald-700 font-semibold">ĐẠT</span> (3.5 năm kinh nghiệm thực tế &gt; yêu cầu 2.0 năm; Tốt nghiệp ĐH chuyên ngành CNTT).</p>
      <p>• <b>Tầng 2 - So khớp kỹ năng:</b> 86% (Khớp 6/7 kỹ năng sau khi chuẩn hóa biến thể qua từ điển kỹ năng).</p>
      <p>• <b>Tầng 2 - So khớp ngữ nghĩa kinh nghiệm:</b> 85% (Mô tả công việc tại FPT Software tương thích cao với vị trí tuyển).</p>
      <p>• <b>Công thức tính điểm:</b> 0.5 × 86% + 0.3 × 85% + 0.2 × 100% = 43.0 + 25.5 + 20.0 = <b class="text-slate-900 font-mono">88.5 / 100</b>.</p>
    `,
    pdfFile: 'NguyenVanAn_CV.pdf',
    pdfName: 'NGUYỄN VĂN AN',
    pdfTitle: 'Senior Java Backend Developer',
    pdfEmail: 'an.nguyen@email.com',
    pdfPhone: '0987.654.321',
    pdfEduSchool: 'Đại học Chuyên ngành CNTT',
    pdfEduYear: '2019 - 2023',
    pdfEduDegree: 'Tốt nghiệp Kỹ sư (Loại Giỏi)',
    pdfSummary: 'Lập trình viên Backend hơn 3.5 năm kinh nghiệm thực chiến phát triển các hệ thống Microservices quy mô lớn với <span class="ai-keyword">Java</span> và <span class="ai-keyword">Spring Boot 3</span>. Đam mê tối ưu hóa hiệu năng cơ sở dữ liệu <span class="ai-keyword">PostgreSQL</span> và xây dựng kiến trúc chịu tải phân tán.',
    pdfJobs: [
      {
        company: 'FPT Software — Senior Java Software Engineer',
        period: '03/2023 - Hiện tại',
        duties: [
          'Chủ trì thiết kế kiến trúc Backend Microservices trên nền tảng Spring Boot 3, xử lý hơn 1,000,000 giao dịch/ngày.',
          'Tối ưu hóa câu truy vấn và chỉ mục cơ sở dữ liệu PostgreSQL, giảm 35% thời gian phản hồi API.',
          'Đóng gói container dịch vụ với Docker và triển khai tự động hóa CI/CD.',
          'Xây dựng tài liệu đặc tả RESTful API bảo mật phân quyền OAuth2/JWT.'
        ]
      },
      {
        company: 'CMC Telecom — Java Developer Intern',
        period: '06/2022 - 02/2023',
        duties: [
          'Tham gia phát triển các API CRUD và viết Unit test với JUnit 5, Mockito.',
          'Tìm hiểu và ứng dụng cơ bản Docker Container trong môi trường phát triển cục bộ.'
        ]
      }
    ],
    hrNote: 'Ứng viên có kiến thức Microservices chắc chắn. Đã hẹn phỏng vấn kỹ thuật vòng 1 vào 14:00 Thứ 5 tuần này.',
    reviewStatus: 'PENDING'
  },
  mai: {
    key: 'mai',
    seq: '2 / 3',
    title: 'Hồ sơ ứng viên: Trần Thị Mai (#CV-0034)',
    name: 'Trần Thị Mai',
    rankBadge: 'Hạng #2',
    rankColor: 'bg-slate-100 text-slate-700 border-slate-200',
    contact: 'mai.tran@gmail.com • 0912.333.444',
    eduText: '<i class="fa-solid fa-graduation-cap text-slate-400"></i> Đại học Bách Khoa Hà Nội - CNTT (2019 - 2023)',
    avatar: 'TM',
    status: 'passed',
    score: '81.0',
    baseSkillScore: 80,
    baseExpScore: 70,
    baseEduScore: 100,
    skillRate: 'Độ khớp: 80%',
    skills: [
      { name: 'Java Core & OOP', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'Spring Boot 3', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'PostgreSQL & JPA', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'RESTful API', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'Git/GitHub', pass: true, matchType: 'fuzzy', score: '0.85' },
      { name: 'Docker (Thiếu)', pass: false, matchType: 'none', score: '0.00' },
      { name: 'Redis Caching (Thiếu)', pass: false, matchType: 'none', score: '0.00' }
    ],
    unknownSkills: [],
    metrics: {
      jaccard: '0.71',
      cosine: '0.70',
      education: '1.00'
    },
    explain: `
      <p>• <b>Tầng 1 - Lọc cứng (Hard filter):</b> <span class="text-emerald-700 font-semibold">ĐẠT</span> (2.0 năm kinh nghiệm thực tế = yêu cầu 2.0 năm; Tốt nghiệp ĐH Bách Khoa CNTT).</p>
      <p>• <b>Tầng 2 - So khớp kỹ năng:</b> 80% (Khớp 5/7 kỹ năng, chưa có kinh nghiệm thực tế với Docker và Redis trên production).</p>
      <p>• <b>Tầng 2 - So khớp ngữ nghĩa kinh nghiệm:</b> 70% (Có kinh nghiệm xây dựng API RESTful và tối ưu cơ sở dữ liệu).</p>
      <p>• <b>Công thức tính điểm:</b> 0.5 × 80% + 0.3 × 70% + 0.2 × 100% = 40.0 + 21.0 + 20.0 = <b class="text-slate-900 font-mono">81.0 / 100</b>.</p>
    `,
    pdfFile: 'TranThiMai_CV.pdf',
    pdfName: 'TRẦN THỊ MAI',
    pdfTitle: 'Java Backend Engineer',
    pdfEmail: 'mai.tran@gmail.com',
    pdfPhone: '0912.333.444',
    pdfEduSchool: 'Đại học Bách Khoa Hà Nội',
    pdfEduYear: '2019 - 2023',
    pdfEduDegree: 'Kỹ sư Công nghệ Thông tin',
    pdfSummary: 'Kỹ sư phần mềm 2 năm kinh nghiệm lập trình Backend với <span class="ai-keyword">Java</span>, <span class="ai-keyword">Spring Boot</span> và cơ sở dữ liệu <span class="ai-keyword">PostgreSQL</span>. Có nền tảng thuật toán vững chắc và tư duy thiết kế hệ thống chuẩn mực.',
    pdfJobs: [
      {
        company: 'VNG Corporation — Software Engineer',
        period: '07/2024 - Hiện tại',
        duties: [
          'Phát triển các module chức năng thanh toán trên nền tảng Spring Boot.',
          'Viết câu truy vấn tối ưu và thiết kế schema PostgreSQL.',
          'Tích hợp các cổng dịch vụ bên thứ ba qua giao thức RESTful API.'
        ]
      }
    ],
    hrNote: 'Học vấn xuất sắc (Bách Khoa). Kỹ năng nền tảng tốt, có thể đào tạo thêm về Docker Container khi nhận việc.',
    reviewStatus: 'PENDING'
  },
  bao: {
    key: 'bao',
    seq: '3 / 3',
    title: 'Hồ sơ ứng viên: Phạm Quốc Bảo (#CV-0012)',
    name: 'Phạm Quốc Bảo',
    rankBadge: 'BỊ LOẠI VÒNG 1',
    rankColor: 'bg-rose-50 text-rose-700 border-rose-200',
    contact: 'bao.pham@outlook.com • 0938.889.991',
    eduText: '<i class="fa-solid fa-graduation-cap text-slate-400"></i> ĐH Công nghệ - ĐHQGHN (2020 - 2024)',
    avatar: 'PB',
    status: 'failed',
    score: 'Chặn',
    baseSkillScore: 0,
    baseExpScore: 0,
    baseEduScore: 100,
    skillRate: 'Chưa chấm điểm',
    skills: [
      { name: 'Java Core', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'Spring Boot', pass: true, matchType: 'exact', score: '1.00' },
      { name: 'MySQL', pass: true, matchType: 'fuzzy', score: '0.85' },
      { name: 'Kinh nghiệm 0.8 năm < 2.0 năm yêu cầu', pass: false, matchType: 'none', score: '0.00' }
    ],
    unknownSkills: ['Quarkus'],
    metrics: {
      jaccard: '—',
      cosine: '—',
      education: '1.00'
    },
    explain: `
      <p class="text-rose-700 font-semibold">• <b>Tầng 1 - Lọc cứng (Hard filter):</b> LOẠI (Ứng viên mới có 0.8 năm kinh nghiệm thực tế, chưa đáp ứng mức yêu cầu tối thiểu ≥ 2.0 năm của vị trí).</p>
      <p class="text-slate-500">• <b>Tầng 2 - Chấm điểm mềm:</b> Bỏ qua tự động theo quy trình tuyển dụng.</p>
      <p class="text-slate-500">• <b>Khuyến nghị:</b> Lưu trữ vào Talent Pool thực tập sinh / Junior cho đợt tuyển dụng sau.</p>
    `,
    pdfFile: 'PhamQuocBao_CV.pdf',
    pdfName: 'PHẠM QUỐC BẢO',
    pdfTitle: 'Junior Java Developer',
    pdfEmail: 'bao.pham@outlook.com',
    pdfPhone: '0938.889.991',
    pdfEduSchool: 'ĐH Công nghệ - ĐHQGHN',
    pdfEduYear: '2020 - 2024',
    pdfEduDegree: 'Cử nhân CNTT mới tốt nghiệp',
    pdfSummary: 'Lập trình viên mới tốt nghiệp với 8 tháng kinh nghiệm thực tập tại dự án nội bộ. Đam mê học hỏi công nghệ mới và mong muốn tìm kiếm cơ hội cọ xát trong môi trường chuyên nghiệp.',
    pdfJobs: [
      {
        company: 'FPT Software — Java Intern',
        period: '01/2024 - 08/2024 (8 tháng)',
        duties: [
          'Hỗ trợ viết Unit Test và sửa lỗi bug nhỏ trên dự án Java Web.',
          'Tìm hiểu và sử dụng Git trong quy trình nhóm.'
        ]
      }
    ],
    hrNote: 'Hồ sơ thiếu kinh nghiệm thực tế. Đã tự động gửi email thông báo từ chối lịch sự và lưu hồ sơ vào Talent Pool.',
    reviewStatus: 'REJECTED'
  }
};

export const initialJobs = [
  {
    id: 1,
    code: '#JD-2026-01',
    title: 'Backend Java Developer (Spring Boot 3 + PostgreSQL)',
    status: 'OPEN',
    minExp: 2.0,
    education: 'Đại học chuyên ngành CNTT hoặc tương đương',
    description: 'Phát triển kiến trúc dịch vụ phân tán Microservices, xử lý tải cao, chuẩn hóa kết nối cơ sở dữ liệu và tích hợp API cho hệ thống tài chính.',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Redis', 'RESTful API', 'Git'],
    totalCv: 48,
    passedHardFilter: 38,
    avgScore: 76.4,
    createdAt: '2026-10-15'
  },
  {
    id: 2,
    code: '#JD-2026-02',
    title: 'Frontend ReactJS Engineer (TypeScript + Tailwind)',
    status: 'OPEN',
    minExp: 2.0,
    education: 'Đại học / Cao đẳng chuyên ngành CNTT',
    description: 'Thiết kế và xây dựng giao diện ứng dụng web Single Page Application hiệu năng cao, tối ưu UX/UI theo thiết kế Figma.',
    skills: ['ReactJS', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'HTML5/CSS3', 'RESTful API'],
    totalCv: 24,
    passedHardFilter: 19,
    avgScore: 74.2,
    createdAt: '2026-10-20'
  },
  {
    id: 3,
    code: '#JD-2026-03',
    title: 'Kỹ sư Dữ liệu & Xử lý NLP (Python FastAPI)',
    status: 'CLOSED',
    minExp: 3.0,
    education: 'Thạc sĩ / Đại học Khoa học Máy tính / Toán tin',
    description: 'Xây dựng pipeline thu thập dữ liệu, phân loại văn bản tiếng Việt và ứng dụng LLM trong trích xuất thông tin tự động.',
    skills: ['Python', 'FastAPI', 'PyTorch / HuggingFace', 'NLP', 'Docker', 'SQL'],
    totalCv: 16,
    passedHardFilter: 11,
    avgScore: 79.8,
    createdAt: '2026-09-01'
  }
];

export const initialSkills = [
  { id: 1, name: 'Java', type: 'TECHNICAL', category: 'Backend', aliases: ['java 17', 'java 21', 'core java', 'java oop'] },
  { id: 2, name: 'Spring Boot', type: 'TECHNICAL', category: 'Backend', aliases: ['spring-boot', 'springboot', 'spring framework', 'spring 3'] },
  { id: 3, name: 'PostgreSQL', type: 'TECHNICAL', category: 'Database', aliases: ['postgres', 'psql', 'postgresql 15', 'postgres db'] },
  { id: 4, name: 'Docker', type: 'TECHNICAL', category: 'DevOps', aliases: ['docker container', 'docker compose', 'containerization'] },
  { id: 5, name: 'Redis', type: 'TECHNICAL', category: 'Database', aliases: ['redis cache', 'redis cluster', 'redis caching'] },
  { id: 6, name: 'ReactJS', type: 'TECHNICAL', category: 'Frontend', aliases: ['react', 'react.js', 'react 18', 'react native'] },
  { id: 7, name: 'Giao tiếp nhóm', type: 'SOFT', category: 'Kỹ năng mềm', aliases: ['teamwork', 'làm việc nhóm', 'communication'] },
  { id: 8, name: 'Tiếng Anh chuyên ngành', type: 'LANGUAGE', category: 'Ngoại ngữ', aliases: ['english technical', 'toeic 700+', 'ielts 6.5'] }
];

export const initialUnknownSkills = [
  { id: 101, name: 'Kafka Streams', count: 4, detectedIn: 'NguyenVanAn_CV.pdf', status: 'FLAGGED' },
  { id: 102, name: 'Quarkus', count: 2, detectedIn: 'PhamQuocBao_CV.pdf', status: 'FLAGGED' },
  { id: 103, name: 'Temporal.io', count: 1, detectedIn: 'LeVanCuong_CV.pdf', status: 'FLAGGED' }
];

export const initialCategories = [
  {
    name: 'Backend Development',
    skills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Node.js', 'Go']
  },
  {
    name: 'Frontend Development',
    skills: ['ReactJS', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js']
  },
  {
    name: 'Database & Caching',
    skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch']
  },
  {
    name: 'DevOps & Cloud',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux']
  },
  {
    name: 'Soft Skills & Languages',
    skills: ['Giao tiếp nhóm', 'Giải quyết vấn đề', 'Quản lý thời gian', 'Tiếng Anh chuyên ngành']
  }
];

export const initialUploadQueue = [
  {
    id: 1,
    name: 'NguyenVanAn_CV.pdf',
    size: '1.8 MB',
    status: 'PROCESSED',
    time: '0.7s',
    note: 'Hoàn thành',
    candidateKey: 'an'
  },
  {
    id: 2,
    name: 'TranThiMai_CV.pdf',
    size: '1.2 MB',
    status: 'PROCESSED',
    time: '0.8s',
    note: 'Hoàn thành',
    candidateKey: 'mai'
  },
  {
    id: 3,
    name: 'PhamQuocBao_CV.pdf',
    size: '0.9 MB',
    status: 'PROCESSED',
    time: '0.6s',
    note: 'Hoàn thành',
    candidateKey: 'bao'
  },
  {
    id: 6,
    name: 'LeVanCuong_CV.pdf',
    size: '1.4 MB',
    status: 'PROCESSING',
    time: 'Đang xử lý...',
    note: 'Đang đọc nội dung và tìm kỹ năng trong CV...'
  },
  {
    id: 4,
    name: 'DanhSach_UngVien.docx',
    size: '220 KB',
    status: 'REJECTED',
    time: '0.1s',
    note: 'Thất bại: Chỉ hỗ trợ tệp định dạng PDF.'
  },
  {
    id: 5,
    name: 'HoSo_Scan_Full.pdf',
    size: '14.2 MB',
    status: 'REJECTED',
    time: '0.1s',
    note: 'Thất bại: Tệp vượt quá dung lượng tối đa 10 MB.'
  }
];
