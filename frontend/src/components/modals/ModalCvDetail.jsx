import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ModalCvDetail() {
  const { modals, closeModal, candidates, activeCandidateKey } = useApp();
  const isOpen = modals.cvDetail;
  const targetKey = modals.cvDetailData?.candidateKey || (typeof modals.cvDetailData === 'string' ? modals.cvDetailData : activeCandidateKey);
  const currentCandidate = candidates[targetKey] || candidates.an;
  const fileName = modals.cvDetailData?.name || currentCandidate.pdfFile;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-tabFadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-3 shadow-elevation border border-slate-200 text-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Chi tiết thông tin · {fileName}
            </h3>
            <p className="text-slate-500">
              Trạng thái:{' '}
              <b className="text-emerald-700">Hoàn thành</b>
            </p>
          </div>
          <button
            onClick={() => closeModal('cvDetail')}
            className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="text-[11px] text-slate-500">
            <tr>
              <th className="py-1">Kỹ năng (tên chuẩn)</th>
              <th>Cách nhận diện</th>
              <th>Độ tin cậy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentCandidate.skills.filter(s => s.pass).map((sk, idx) => (
              <tr key={idx}>
                <td className="py-1.5 font-semibold text-slate-800">{sk.name}</td>
                <td>
                  <span
                    className={`px-1.5 rounded text-[10px] border ${
                      sk.matchType === 'exact'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {sk.matchType === 'exact' ? 'Khớp đúng' : 'Gần đúng'}
                  </span>
                </td>
                <td className="font-mono">{sk.score || '1.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          <b>Kinh nghiệm:</b>{' '}
          {targetKey === 'an'
            ? '3.5 năm · FPT Software, CMC Telecom'
            : targetKey === 'mai'
            ? '2.0 năm · VNG Corporation'
            : '0.8 năm · FPT Software'}
        </p>
        <p>
          <b>Học vấn:</b> {currentCandidate.pdfEduSchool} ({currentCandidate.pdfEduYear})
        </p>

        {currentCandidate.unknownSkills?.length > 0 && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            Kỹ năng lạ được gắn cờ:{' '}
            <b>{currentCandidate.unknownSkills.join(', ')}</b> → chuyển vào danh sách chờ bổ sung.
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => closeModal('cvDetail')}
            className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
