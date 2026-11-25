import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalSkillForm() {
  const { modals, closeModal, addStandardSkill, updateStandardSkill } = useApp();
  const isOpen = modals.skillForm;
  const { mode, skill } = modals.skillFormData || { mode: 'add', skill: null };

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Backend');
  const [type, setType] = useState('TECHNICAL');
  const [aliases, setAliases] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (skill && (mode === 'edit' || skill.name)) {
        setName(skill.name || '');
        setCategory(skill.category || 'Backend');
        setType(skill.type || 'TECHNICAL');
        setAliases(Array.isArray(skill.aliases) ? skill.aliases.join(', ') : '');
      } else {
        setName('');
        setCategory('Backend');
        setType('TECHNICAL');
        setAliases('');
      }
      setError('');
    }
  }, [isOpen, mode, skill]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError('Tên kỹ năng chuẩn là bắt buộc.');
        return;
      }
      const aliasList = aliases.split(',').map(a => a.trim()).filter(Boolean);
      if (mode === 'edit' && skill) {
        await updateStandardSkill(skill.id, {
          name: trimmedName,
          category,
          type,
          aliases: aliasList
        });
      } else {
        await addStandardSkill({
          name: trimmedName,
          category,
          type,
          aliases: aliasList
        });
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu kỹ năng');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl w-full p-6 space-y-4 shadow-elevation border border-slate-200 max-w-md">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {mode === 'edit' ? 'Sửa kỹ năng chuẩn' : 'Thêm kỹ năng chuẩn'}
            </h3>
            <p className="text-xs text-slate-500">
              Cập nhật từ điển dùng để nhận diện kỹ năng trong CV
            </p>
          </div>
          <button
            onClick={() => closeModal('skillForm')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên chuẩn *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Spring Boot"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                error ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {error && (
              <p className="text-[11px] font-semibold text-rose-700 mt-1 flex items-center gap-1">
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nhóm kỹ năng
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Database">Cơ sở dữ liệu</option>
                <option value="DevOps">DevOps</option>
                <option value="Kỹ năng mềm">Kỹ năng mềm</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Loại
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="TECHNICAL">Công nghệ (TECHNICAL)</option>
                <option value="SOFT">Kỹ năng mềm (SOFT)</option>
                <option value="LANGUAGE">Ngoại ngữ (LANGUAGE)</option>
                <option value="CERTIFICATE">Chứng chỉ (CERTIFICATE)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Biến thể (alias)
            </label>
            <input
              type="text"
              value={aliases}
              onChange={e => setAliases(e.target.value)}
              placeholder="Nhập biến thể, cách nhau bằng dấu phẩy"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => closeModal('skillForm')}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-98"
          >
            Lưu kỹ năng
          </button>
        </div>
      </div>
    </div>
  );
}
