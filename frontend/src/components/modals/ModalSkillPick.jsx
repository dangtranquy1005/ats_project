import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const DEFAULT_SKILLS = [
  { name: 'Java', weight: '1.0', required: true },
  { name: 'Spring Boot', weight: '1.0', required: true },
  { name: 'PostgreSQL', weight: '0.9', required: true },
  { name: 'Docker', weight: '0.8', required: false }
];

function toSkillRows(raw) {
  if (!raw) return DEFAULT_SKILLS.map(s => ({ ...s }));
  const names = Array.isArray(raw)
    ? raw
    : String(raw).split(',').map(s => s.trim()).filter(Boolean);
  if (names.length === 0) return DEFAULT_SKILLS.map(s => ({ ...s }));
  return names.map(name => ({ name, weight: '1.0', required: true }));
}

export default function ModalSkillPick() {
  const { modals, closeModal, standardSkills, showToast, updateJobSkills } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(DEFAULT_SKILLS);

  useEffect(() => {
    if (!modals.skillPick) return;
    const incoming = modals.skillPickData;
    const raw = incoming?.currentSkills ?? incoming?.skills;
    setSelectedSkills(toSkillRows(raw));
    setSearch('');
  }, [modals.skillPick, modals.skillPickData]);

  if (!modals.skillPick) return null;

  const suggestions = standardSkills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.aliases || []).some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  const addSkill = (skill) => {
    if (selectedSkills.some(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
      showToast('Đã có trong danh sách', `Kỹ năng "${skill.name}" đã được chọn trước đó.`, 'info');
      return;
    }
    setSelectedSkills(prev => [...prev, { name: skill.name, weight: '1.0', required: true }]);
    showToast('Đã thêm kỹ năng', `Đã thêm "${skill.name}" vào danh sách yêu cầu`, 'success');
  };

  const removeSkill = (name) => {
    setSelectedSkills(prev => prev.filter(s => s.name !== name));
  };

  const handleSave = () => {
    const names = selectedSkills.map(s => s.name);
    const skillsStr = names.join(', ');
    const pick = modals.skillPickData;
    if (pick?.jobId) {
      updateJobSkills(pick.jobId, names);
    }
    if (typeof pick?.onSelect === 'function') {
      pick.onSelect(skillsStr);
    }
    closeModal('skillPick');
    showToast('Đã lưu', 'Đã cập nhật kỹ năng yêu cầu của vị trí', 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60] animate-tabFadeIn">
      <div className="bg-white rounded-2xl w-full p-6 space-y-4 shadow-elevation border border-slate-200 max-w-xl">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Kỹ năng yêu cầu của vị trí</h3>
            <p className="text-xs text-slate-500">{modals.skillPickData?.title || 'Vị trí tuyển dụng'}</p>
          </div>
          <button
            onClick={() => closeModal('skillPick')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 text-xs">
            Tìm kỹ năng trong từ điển
          </label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="mt-1.5 border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs overflow-hidden max-h-36 overflow-y-auto">
            {suggestions.slice(0, search ? 8 : 6).map(s => {
              const isAdded = selectedSkills.some(item => item.name.toLowerCase() === s.name.toLowerCase());
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSkill(s)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 text-left transition ${
                    isAdded ? 'bg-slate-50/70 text-slate-500' : 'text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <i className={`fa-solid ${isAdded ? 'fa-check text-emerald-600' : 'fa-plus text-slate-400'}`}></i>
                    <b>{s.name}</b>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    isAdded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {isAdded ? 'Đã chọn' : s.category}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Gợi ý lấy từ bộ nhớ của hệ thống, không chờ truy vấn dữ liệu.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left">Kỹ năng đã chọn ({selectedSkills.length})</th>
                <th className="px-4 py-2.5 text-left">Mức độ quan trọng</th>
                <th className="px-4 py-2.5 text-left">Bắt buộc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedSkills.map(s => (
                <tr key={s.name} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.weight}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedSkills(prev => prev.map(item => item.name === s.name ? { ...item, weight: val } : item));
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    >
                      <option value="1.0">1.0</option>
                      <option value="0.9">0.9</option>
                      <option value="0.8">0.8</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={s.required}
                      onChange={e => {
                        const checked = e.target.checked;
                        setSelectedSkills(prev => prev.map(item => item.name === s.name ? { ...item, required: checked } : item));
                      }}
                      className="accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400">
                    <button
                      type="button"
                      onClick={() => removeSkill(s.name)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition"
                      title={`Gỡ bỏ ${s.name}`}
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => closeModal('skillPick')}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-98"
          >
            Lưu kỹ năng yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}
