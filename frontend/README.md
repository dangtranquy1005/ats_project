# AutoScreen Frontend (React + Vite + Tailwind CSS)

Hệ thống giao diện người dùng React hoàn chỉnh được chuyển đổi và phát triển tiếp từ bản thiết kế Figma Prototype (`autoscreen_figma_html27`), tích hợp liền mạch với backend Spring Boot `ats_project` mà không sửa đổi bất kỳ tệp mã nguồn cũ nào của backend.

---

## 🚀 Cấu trúc thư mục

```
d:\slide\ats_project\frontend\
├── src\
│   ├── components\
│   │   ├── FigmaBar.jsx         # Thanh điều hướng nhanh Figma prototype (01 -> 08 & Modals)
│   │   ├── Navbar.jsx           # Topbar: Chọn vị trí JD, thống kê KPI, cấu hình trọng số
│   │   ├── Sidebar.jsx          # Thanh menu bên trái chuẩn mực UI/UX
│   │   ├── ToastContainer.jsx   # Hệ thống thông báo nổi (Toast Floating Notification)
│   │   ├── modals\
│   │   │   ├── ModalWeights.jsx     # Cấu hình trọng số w1, w2, w3 & tính lại điểm live
│   │   │   ├── ModalCreateJd.jsx    # Tạo & Sửa vị trí JD (Hard filter, skills)
│   │   │   ├── ModalSkillPick.jsx   # Chọn kỹ năng từ thư viện chuẩn
│   │   │   ├── ModalSkillForm.jsx   # Thêm/sửa kỹ năng chuẩn (check 400, 409)
│   │   │   ├── ModalAlias.jsx       # Thêm biến thể alias cho kỹ năng
│   │   │   ├── ModalCvDetail.jsx    # Bảng bóc tách dữ liệu CV (exact/fuzzy, confidence)
│   │   └── screens\
│   │       ├── AuthScreen.jsx       # 01. Đăng nhập / Đăng ký / Quên mật khẩu
│   │       ├── JdScreen.jsx         # 02. Quản lý tiêu chí tuyển dụng (JD)
│   │       ├── UploadScreen.jsx     # 03. Tiếp nhận CV (Kéo thả PDF, hàng đợi)
│   │       ├── RankingScreen.jsx    # 04. Bảng xếp hạng ứng viên & lọc điểm
│   │       ├── ReportScreen.jsx     # 05. Đối soát CV & Trình xem trước PDF canvas
│   │       ├── SkillsScreen.jsx     # 06. Quản trị từ điển kỹ năng & Skill Tree
│   │       ├── AccountScreen.jsx    # 07. Quản lý tài khoản Recruiter
│   │       └── ErrorsScreen.jsx     # 08. Màn hình mô phỏng các lỗi (401, 403, 404, Locked)
│   ├── context\
│   │   └── AppContext.jsx       # State management toàn cục (Auth, Jobs, CVs, Skills, Toasts)
│   ├── services\
│   │   └── api.js               # Kết nối API Spring Boot (/api/v1/...) có fallback data
│   ├── data\
│   │   └── mockData.js          # Dữ liệu mẫu chuẩn xác từ thiết kế Figma
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🛠️ Hướng dẫn Chạy trên Visual Studio Code

### Cách 1: Chạy trực tiếp từ Terminal trong VS Code
1. Mở thư mục `d:\slide\ats_project` trên Visual Studio Code.
2. Mở Terminal mới (`Ctrl + \``) và chạy:
   ```bash
   cd frontend
   npm run dev
   ```
3. Truy cập trình duyệt: **`http://localhost:3000`**

### Cách 2: Sử dụng VS Code Tasks
- Nhấn tổ hợp phím `Ctrl + Shift + P` -> gõ `Tasks: Run Task` -> chọn **`Run React Frontend (Vite)`**.

---

## 🔗 Tích hợp với Backend Spring Boot
- Vite đã được cấu hình Proxy chuyển tiếp tự động các yêu cầu `/api` sang backend `http://localhost:8080`.
- Ứng dụng hỗ trợ cơ chế song hành:
  - Khi Backend đang chạy: Gọi trực tiếp API `/api/v1/jobs`, `/api/v1/user/login`, `/api/v1/cvs/upload`, v.v.
  - Khi Backend chưa bật: Tự động dùng bộ dữ liệu mô phỏng nguyên bản của Figma để người dùng có thể test tương tác toàn bộ 38 màn hình & modal mà không bị gián đoạn.
