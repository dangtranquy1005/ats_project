import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalCreateJd() {
  const { modals, closeModal, createJob, updateJob, openModal } = useApp();
  const isOpen = modals.createJd || modals.editJd;
  const isEdit = modals.editJd;
  const data = modals.jdData;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [minExp, setMinExp] = useState('2.0');
  const [edu, setEdu] = useState('Đại học CNTT');
  const [skills, setSkills] = useState('Kubernetes, Docker, AWS, Terraform, CI/CD');
  const [error, setError] = useState('');

  const eduOptions = [
    'Đại học CNTT',
    'Đại học chuyên ngành CNTT',
    'Đại học chuyên ngành CNTT hoặc tương đương',
    'Đại học / Cao đẳng chuyên ngành CNTT',
    'Cao đẳng / Đại học',
    'Thạc sĩ / Đại học Khoa học Máy tính / Toán tin',
    'Không bắt buộc'
  ];
  if (edu && !eduOptions.includes(edu)) eduOptions.push(edu);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && data) {
        setTitle(data.title || '');
        setDesc(data.description || '');
        setMinExp(data.minExp?.toString() || '2.0');
        setEdu(data.education || 'Đại học chuyên ngành CNTT');
        setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '');
      } else {
        setTitle('');
        setDesc('');
        setMinExp('2.0');
        setEdu('Đại học CNTT');
        setSkills('Kubernetes, Docker, AWS, Terraform, CI/CD');
      }
      setError('');
    }
  }, [isOpen, isEdit, data]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = title.trim();
    const d = desc.trim();

    if (!t || d.length < 20) {
      setError('Vui lòng nhập tên vị trí và mô tả (tối thiểu 20 ký tự).');
      return;
    }

    if (isEdit && data) {
      updateJob(data.id, {
        title: t,
        description: d,
        minExp: parseFloat(minExp),
        education: edu,
        skills
      });
    } else {
      createJob({
        title: t,
        description: d,
        minExp: parseFloat(minExp),
        education: edu,
        skills
      });
    }
  };

  const handleOpenSkillPick = () => {
    openModal('skillPick', {
      title: title.trim() || (isEdit ? data?.title : 'Vị trí mới'),
      currentSkills: skills,
      onSelect: (selectedSkillsStr) => setSkills(selectedSkillsStr)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevation border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-folder-plus text-blue-600"></i>
              <span>{isEdit ? 'Sửa vị trí tuyển dụng' : 'Thêm vị trí tuyển dụng mới (JD)'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Khởi tạo điều kiện Lọc cứng & Từ điển Kỹ năng chuẩn hóa
            </p>
          </div>
          <button
            onClick={() => closeModal(isEdit ? 'editJd' : 'createJd')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên vị trí công việc *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Kỹ sư DevOps Cloud (Kubernetes + AWS)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mô tả công việc *
            </label>
            <textarea
              rows="3"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Nhiệm vụ chính, môi trường, yêu cầu cụ thể..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            ></textarea>
            {error && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kinh nghiệm tối thiểu (Lọc cứng) *
              </label>
              <select
                value={minExp}
                onChange={e => setMinExp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer"
              >
                <option value="1.0">≥ 1.0 năm</option>
                <option value="1.5">≥ 1.5 năm</option>
                <option value="2.0">≥ 2.0 năm</option>
                <option value="3.0">≥ 3.0 năm</option>
                <option value="5.0">≥ 5.0 năm (Senior)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Yêu cầu học vấn (Lọc cứng) *
              </label>
              <select
                value={edu}
                onChange={e => setEdu(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none cursor-pointer"
              >
                {eduOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Từ điển Kỹ năng cốt lõi (Phân tách bởi dấu phẩy) *
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleOpenSkillPick}
              className="mt-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-list-check"></i> Chọn từ từ điển chuẩn
            </button>
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ chuẩn hóa từ khóa đối chiếu với hồ sơ ứng viên.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => closeModal(isEdit ? 'editJd' : 'createJd')}
              className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-98 transition"
            >
              {isEdit ? 'Lưu thay đổi' : 'Tạo vị trí & Kích hoạt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
