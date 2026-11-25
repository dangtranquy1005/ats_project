import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function FigmaBar() {
  const {
    activeScreen,
    switchTab,
    openModal,
    selectCandidateForReport,
    approveCV,
    rejectCV,
    showToast
  } = useApp();

  const [selectedScreen, setSelectedScreen] = useState('');

  const screens = [
    { id: 'screen-auth', label: '01. Đăng nhập (Auth)' },
    { id: 'screen-jd', label: '02. Tiêu chí JD' },
    { id: 'screen-upload', label: '03. Tiếp nhận CV' },
    { id: 'screen-ranking', label: '04. Xếp hạng ứng viên' },
    { id: 'screen-report', label: '05. Đối soát CV & PDF' },
    { id: 'screen-skills', label: '06. Từ điển kỹ năng' },
    { id: 'screen-account', label: '07. Tài khoản' },
    { id: 'screen-errors', label: '08. Lỗi & phiên' },
  ];

  const figmaHtmlFiles = [
    { value: '01', label: '01. 01_dang-nhap.html (Đăng nhập)' },
    { value: '02', label: '02. 02_dang-ky.html (Đăng ký tài khoản)' },
    { value: '03', label: '03. 03_dang-ky-loi-409.html (Đăng ký lỗi 409 trùng email)' },
    { value: '04', label: '04. 04_dang-nhap-loi-401.html (Đăng nhập lỗi 401 sai mật khẩu)' },
    { value: '05', label: '05. 05_tieu-chi-jd.html (Màn hình tiêu chí tuyển dụng JD)' },
    { value: '06', label: '06. 06_tiep-nhan-cv1.html (Tiếp nhận & Hàng đợi tải CV)' },
    { value: '07', label: '07. 07_bang-xep-hang.html (Bảng xếp hạng ứng viên)' },
    { value: '08', label: '08. 08_doi-soat-cv.html (Đối soát hồ sơ Nguyễn Văn An)' },
    { value: '09', label: '09. 09_tu-dien-ky-nang.html (Từ điển kỹ năng chuẩn)' },
    { value: '10', label: '10. 10_ky-nang-la.html (Kỹ năng lạ chờ bổ sung)' },
    { value: '11', label: '11. 11_cay-nhom-ky-nang.html (Cây phân cấp nhóm kỹ năng)' },
    { value: '12', label: '12. 12_tai-khoan.html (Hồ sơ tài khoản Recruiter)' },
    { value: '13', label: '13. 13_loi-va-phien.html (Mô phỏng lỗi hệ thống 401-404)' },
    { value: '14', label: '14. 14_modal-trong-so.html (Modal Cấu hình trọng số w1, w2, w3)' },
    { value: '15', label: '15. 15_modal-tao-jd.html (Modal Tạo mới tiêu chí JD)' },
    { value: '16', label: '16. 16_modal-sua-jd.html (Modal Chỉnh sửa vị trí JD)' },
    { value: '17', label: '17. 17_modal-chon-ky-nang-jd.html (Modal Chọn kỹ năng từ thư viện)' },
    { value: '18', label: '18. 18_modal-them-ky-nang.html (Modal Thêm mới kỹ năng chuẩn)' },
    { value: '19', label: '19. 19_modal-sua-ky-nang.html (Modal Chỉnh sửa kỹ năng)' },
    { value: '20', label: '20. 20_modal-them-bien-the.html (Modal Thêm từ đồng nghĩa Alias)' },
    { value: '21', label: '21. 21_modal-xoa-vi-tri.html (Modal Xác nhận xóa vị trí JD)' },
    { value: '22', label: '22. 22_modal-xoa-cv.html (Modal Xác nhận xóa CV ứng viên)' },
    { value: '23', label: '23. 23_modal-xoa-ky-nang.html (Modal Xác nhận xóa kỹ năng)' },
    { value: '24', label: '24. 24_modal-ky-nang-dang-dung-409.html (Modal Báo lỗi 409 kỹ năng đang dùng)' },
    { value: '25', label: '25. 25_modal-du-lieu-boc-tach-cv.html (Modal Chi tiết bóc tách CV)' },
    { value: '26', label: '26. 26_doi-soat-cv-bi-loai-vong-1.html (Hồ sơ Phạm Quốc Bảo bị loại V1)' },
    { value: '27', label: '27. 27_doi-soat-cv-tran-thi-mai.html (Hồ sơ Trần Thị Mai - Hạng #2)' },
    { value: '28', label: '28. 28_doi-soat-cv-hoang-linh.html (Hồ sơ ứng viên Hoàng Linh)' },
    { value: '29', label: '29. 29_doi-soat-cv-da-duyet.html (Hồ sơ trạng thái Đã Duyệt)' },
    { value: '30', label: '30. 30_doi-soat-cv-da-loai.html (Hồ sơ trạng thái Đã Loại)' },
    { value: '31', label: '31. 31_quen-mat-khau.html (Màn hình Quên mật khẩu)' },
    { value: '32', label: '32. 32_quen-mat-khau-da-gui.html (Quên mật khẩu: Đã gửi email)' },
    { value: '33', label: '33. 33_dang-ky-loi-400.html (Đăng ký: Báo lỗi 400 validation)' },
    { value: '34', label: '34. 34_modal-tao-jd-loi-400.html (Tạo JD: Báo lỗi 400 thiếu trường)' },
    { value: '35', label: '35. 35_modal-trong-so-loi-tong-khac-1.html (Trọng số: Báo lỗi tổng khác 1.0)' },
    { value: '36', label: '36. 36_modal-them-bien-the-loi-409.html (Thêm Alias: Báo lỗi 409 trùng lặp)' },
    { value: '37', label: '37. 37_modal-them-ky-nang-trong.html (Thêm kỹ năng: Báo lỗi trường trống)' },
    { value: '38', label: '38. 38_tao-vi-tri-thanh-cong.html (Tạo JD thành công & Thông báo Toast)' },
  ];

  const handleSelectFigmaScreen = (val) => {
    setSelectedScreen(val);
    switch (val) {
      case '01':
      case '02':
      case '03':
      case '04':
      case '31':
      case '32':
      case '33':
        switchTab('screen-auth');
        break;
      case '05':
        switchTab('screen-jd');
        break;
      case '06':
        switchTab('screen-upload');
        break;
      case '07':
        switchTab('screen-ranking');
        break;
      case '08':
        switchTab('screen-report');
        selectCandidateForReport('an');
        break;
      case '09':
      case '10':
      case '11':
        switchTab('screen-skills');
        break;
      case '12':
        switchTab('screen-account');
        break;
      case '13':
        switchTab('screen-errors');
        break;
      case '14':
      case '35':
        switchTab('screen-ranking');
        openModal('weights');
        break;
      case '15':
      case '34':
        switchTab('screen-jd');
        openModal('createJd', { mode: 'create' });
        break;
      case '16':
        switchTab('screen-jd');
        openModal('createJd', { mode: 'edit' });
        break;
      case '17':
        switchTab('screen-jd');
        openModal('skillPick');
        break;
      case '18':
      case '37':
        switchTab('screen-skills');
        openModal('skillForm', { mode: 'add', skill: null });
        break;
      case '19':
        switchTab('screen-skills');
        openModal('skillForm', { mode: 'edit', skill: { name: 'PostgreSQL', category: 'Database', type: 'TECHNICAL' } });
        break;
      case '20':
      case '36':
        switchTab('screen-skills');
        openModal('alias', { name: 'Spring Boot' });
        break;
      case '21':
        switchTab('screen-jd');
        openModal('confirm', {
          title: 'Xóa vị trí tuyển dụng này?',
          body: 'Toàn bộ CV, dữ liệu bóc tách, điểm số và tệp PDF gốc của vị trí này sẽ bị xóa vĩnh viễn.',
          okText: 'Xóa vị trí'
        });
        break;
      case '22':
        switchTab('screen-upload');
        openModal('confirm', {
          title: 'Xóa CV ứng viên?',
          body: 'Hồ sơ bóc tách và tệp CV sẽ bị xóa khỏi hàng đợi.',
          okText: 'Xóa CV'
        });
        break;
      case '23':
        switchTab('screen-skills');
        openModal('confirm', {
          title: 'Xóa kỹ năng chuẩn?',
          body: 'Kỹ năng này chưa gắn vào vị trí tuyển dụng nào. Bạn có chắc muốn xóa?',
          okText: 'Xóa kỹ năng'
        });
        break;
      case '24':
        switchTab('screen-skills');
        openModal('confirm', {
          title: 'Không thể xóa kỹ năng này (409 Conflict)',
          body: 'Kỹ năng "Spring Boot" đang được sử dụng trong 2 vị trí tuyển dụng đang mở. Vui lòng gỡ khỏi các JD trước khi xóa.',
          okText: 'Đã hiểu'
        });
        break;
      case '25':
        switchTab('screen-upload');
        openModal('cvDetail');
        break;
      case '26':
        switchTab('screen-report');
        selectCandidateForReport('bao');
        break;
      case '27':
        switchTab('screen-report');
        selectCandidateForReport('mai');
        break;
      case '28':
        switchTab('screen-report');
        selectCandidateForReport('an');
        break;
      case '29':
        switchTab('screen-report');
        selectCandidateForReport('an');
        approveCV('an');
        break;
      case '30':
        switchTab('screen-report');
        selectCandidateForReport('bao');
        rejectCV('bao');
        break;
      case '38':
        switchTab('screen-jd');
        showToast('Thành công (201 Created)', 'Vị trí mới "Kỹ sư DevOps" đã được tạo thành công.', 'success');
        break;
      default:
        break;
    }
  };

  return (
    <div
      id="figma-prototype-bar"
      className="h-10 bg-slate-900 text-white px-4 overflow-x-auto whitespace-nowrap flex items-center justify-between text-[11px] shrink-0 z-50 border-b border-slate-800 select-none shadow-sm gap-4"
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-400 flex items-center gap-1.5 shrink-0">
          <i className="fa-brands fa-figma text-xs"></i> Luồng nghiệp vụ:
        </span>
        <span className="text-slate-600">|</span>

        {screens.map((s, idx) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => switchTab(s.id)}
              className={`px-2 py-0.5 rounded transition ${
                activeScreen === s.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {s.label}
            </button>
            {idx < screens.length - 1 && (
              <i className="fa-solid fa-chevron-right text-[8px] text-slate-600"></i>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
          <i className="fa-solid fa-layer-group text-xs"></i> Nhảy tới 38 màn Figma:
        </label>
        <select
          value={selectedScreen}
          onChange={(e) => handleSelectFigmaScreen(e.target.value)}
          className="bg-slate-800 text-amber-200 border border-slate-700 rounded px-2.5 py-1 text-[11px] font-medium outline-none focus:border-amber-400 cursor-pointer max-w-[280px]"
        >
          <option value="">-- Chọn màn hình (01 - 38) --</option>
          {figmaHtmlFiles.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
