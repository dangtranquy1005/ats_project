import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalAlias() {
  const { modals, closeModal, addSkillAlias } = useApp();
  const isOpen = modals.alias;
  const targetSkill = modals.aliasSkill;
  const [aliasText, setAliasText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAliasText('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (!aliasText.trim()) {
        setError('Vui lòng nhập nội dung biến thể.');
        return;
      }
      await addSkillAlias(targetSkill?.id, aliasText);
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu biến thể');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 shadow-elevation border border-slate-200 text-xs">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900">
            Thêm biến thể cho <span>{targetSkill?.name || 'Kỹ năng'}</span>
          </h3>
          <button
            onClick={() => closeModal('alias')}
            className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <input
          type="text"
          value={aliasText}
          onChange={e => setAliasText(e.target.value)}
          placeholder="Ví dụ: spring boot 3"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        {error && (
          <p className="text-[11px] text-rose-600 font-semibold">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => closeModal('alias')}
            className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-xs active:scale-98"
          >
            Lưu biến thể
          </button>
        </div>
      </div>
    </div>
  );
}
