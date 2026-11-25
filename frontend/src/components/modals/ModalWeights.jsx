import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalWeights() {
  const { modals, closeModal, weights, saveWeights } = useApp();
  const [w1, setW1] = useState(weights.w1);
  const [w2, setW2] = useState(weights.w2);
  const [w3, setW3] = useState(weights.w3);

  useEffect(() => {
    if (modals.weights) {
      setW1(weights.w1);
      setW2(weights.w2);
      setW3(weights.w3);
    }
  }, [modals.weights, weights]);

  if (!modals.weights) return null;

  const sum = parseFloat((w1 + w2 + w3).toFixed(2));
  const isBalanced = Math.abs(sum - 1.0) < 0.01;

  const applyPreset = (presetW1, presetW2, presetW3) => {
    setW1(presetW1);
    setW2(presetW2);
    setW3(presetW3);
  };

  const autoBalance = () => {
    const total = w1 + w2 + w3;
    if (total > 0) {
      let nw1 = Math.round((w1 / total) * 20) / 20;
      let nw2 = Math.round((w2 / total) * 20) / 20;
      let nw3 = parseFloat((1.0 - nw1 - nw2).toFixed(2));
      if (nw3 < 0.05) {
        nw3 = 0.05;
        nw2 = parseFloat((1.0 - nw1 - nw3).toFixed(2));
      }
      setW1(nw1);
      setW2(nw2);
      setW3(nw3);
    }
  };

  const handleSave = () => {
    let finalW1 = w1;
    let finalW2 = w2;
    let finalW3 = w3;
    if (!isBalanced) {
      const total = w1 + w2 + w3;
      if (total > 0) {
        finalW1 = Math.round((w1 / total) * 20) / 20;
        finalW2 = Math.round((w2 / total) * 20) / 20;
        finalW3 = parseFloat((1.0 - finalW1 - finalW2).toFixed(2));
        if (finalW3 < 0.05) {
          finalW3 = 0.05;
          finalW2 = parseFloat((1.0 - finalW1 - finalW3).toFixed(2));
        }
      }
    }
    saveWeights(finalW1, finalW2, finalW3);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevation border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Cấu hình trọng số chấm điểm (w1, w2, w3)
            </h3>
            <p className="text-xs text-slate-500">
              Score = w1×Skill + w2×Experience + w3×Education
            </p>
          </div>
          <button
            onClick={() => closeModal('weights')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-200">
            <div>
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>w1 (Kỹ năng - Skill Match):</span>
                <span className="text-blue-600 font-mono font-bold">
                  {w1.toFixed(2)} ({Math.round(w1 * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={w1}
                onChange={e => setW1(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>w2 (Kinh nghiệm - Experience Match):</span>
                <span className="text-blue-600 font-mono font-bold">
                  {w2.toFixed(2)} ({Math.round(w2 * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={w2}
                onChange={e => setW2(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-800 mb-1">
                <span>w3 (Bằng cấp & Học vấn):</span>
                <span className="text-blue-600 font-mono font-bold">
                  {w3.toFixed(2)} ({Math.round(w3 * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={w3}
                onChange={e => setW3(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Presets Buttons */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 font-semibold">Mẫu thiết lập:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset(0.5, 0.3, 0.2)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition"
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.6, 0.25, 0.15)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition"
              >
                Ưu tiên Skill
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.35, 0.45, 0.2)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition"
              >
                Ưu tiên KN
              </button>
              <button
                type="button"
                onClick={autoBalance}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold transition"
                title="Tự động chuẩn hóa tổng 3 trọng số về đúng 100%"
              >
                ⚡ Cân bằng 100%
              </button>
            </div>
          </div>

          {isBalanced ? (
            <p className="text-[11px] text-emerald-600 font-bold italic text-center">
              • Tổng ba trọng số w1 + w2 + w3 = 1.0 (100% Cân đối)
            </p>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-[11px] text-amber-600 font-bold italic">
                Tổng hiện tại = {sum.toFixed(2)} (chưa tròn 1.00)
              </p>
              <button
                type="button"
                onClick={autoBalance}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Bấm vào đây để tự động cân bằng về 100%
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => closeModal('weights')}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-98"
          >
            {isBalanced ? 'Lưu & Tính lại điểm' : 'Cân bằng & Lưu điểm'}
          </button>
        </div>
      </div>
    </div>
  );
}
