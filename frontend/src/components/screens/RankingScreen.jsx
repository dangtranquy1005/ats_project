import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function RankingScreen() {
  const {
    candidates,
    weights,
    selectCandidateForReport,
    switchTab,
    openModal,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('total'); // 'total' | 'name'
  const [minScore, setMinScore] = useState(0);
  const [skillFilter, setSkillFilter] = useState('');

  const candidateList = Object.values(candidates);

  const filteredCandidates = candidateList
    .filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contact.toLowerCase().includes(search.toLowerCase());

      let matchMode = true;
      if (filterMode === 'passed') matchMode = c.status === 'passed';
      else if (filterMode === 'failed') matchMode = c.status === 'failed';
      else if (filterMode === 'high-score') {
        const sc = parseFloat(c.score);
        matchMode = !isNaN(sc) && sc >= 80;
      }

      let matchMinScore = true;
      if (minScore > 0) {
        const sc = parseFloat(c.score);
        matchMinScore = !isNaN(sc) && sc >= minScore;
      }

      let matchSkill = true;
      if (skillFilter) {
        matchSkill = c.skills.some(
          s => s.name.toLowerCase().includes(skillFilter.toLowerCase()) && s.pass
        );
      }

      return matchSearch && matchMode && matchMinScore && matchSkill;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'vi');
      }
      const scoreA = parseFloat(a.score) || 0;
      const scoreB = parseFloat(b.score) || 0;
      return scoreB - scoreA;
    });

  const exportRankingCSV = () => {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['Hạng', 'Ứng viên', 'Liên hệ', 'Lọc cứng', 'Điểm kỹ năng', 'Điểm kinh nghiệm', 'Điểm tổng'];
    const lines = filteredCandidates.map((c, idx) => [
      c.status === 'passed' ? idx + 1 : 'LOẠI',
      c.name,
      c.contact,
      c.status === 'passed' ? 'ĐẠT' : 'LOẠI',
      c.baseSkillScore,
      c.baseExpScore,
      c.score
    ].map(escape).join(','));
    const csv = `\uFEFF${header.map(escape).join(',')}\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AutoScreen_Candidate_Ranking.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(
      'Xuất báo cáo',
      `Đã tải AutoScreen_Candidate_Ranking.csv (${filteredCandidates.length} ứng viên).`,
      'success'
    );
  };

  return (
    <div id="screen-ranking" className="h-full w-full flex flex-col gap-3">
      {/* Filter Bar Gọn Gàng, Rõ Ràng */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90 flex flex-wrap justify-between items-center gap-2.5 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên ứng viên, email..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-56 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none text-xs cursor-pointer focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tất cả ứng viên (48)</option>
            <option value="passed">Chỉ lấy ứng viên ĐẠT Hard filter</option>
            <option value="failed">Chỉ ứng viên BỊ LOẠI ở Hard filter</option>
            <option value="high-score">Ứng viên có điểm &gt; 80</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none text-xs cursor-pointer"
          >
            <option value="total">Sắp xếp: Điểm tổng</option>
            <option value="name">Sắp xếp: Tên A–Z</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold whitespace-nowrap">
            Điểm tối thiểu
            <input
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={e => setMinScore(parseFloat(e.target.value) || 0)}
              className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs outline-none"
            />
          </label>

          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none text-xs cursor-pointer"
          >
            <option value="">Kỹ năng: Tất cả</option>
            <option value="docker">Có Docker</option>
            <option value="redis">Có Redis</option>
            <option value="postgres">Có PostgreSQL</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            id="ranking-formula-badge"
            onClick={() => openModal('weights')}
            className="text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
            title="Bấm để cấu hình trọng số chấm điểm (w1, w2, w3)"
          >
            <i className="fa-solid fa-sliders text-blue-600"></i>
            <span>Score = {weights.w1}×Skill + {weights.w2}×Exp + {weights.w3}×Edu</span>
          </button>
          <button
            onClick={() => switchTab('screen-upload')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition active:scale-98 shadow-xs whitespace-nowrap shrink-0"
          >
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i> Tải thêm CV
          </button>
          <button
            onClick={exportRankingCSV}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs active:scale-98 whitespace-nowrap shrink-0"
          >
            <i className="fa-solid fa-download text-xs"></i> Xuất bảng điểm
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu Chi Tiết */}
      <div className="bg-white rounded-xl border border-slate-200/90 flex-1 overflow-hidden flex flex-col shadow-xs">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse text-xs" id="table-candidates">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider sticky top-0 border-b border-slate-200 z-10 font-bold">
              <tr>
                <th
                  onClick={() => setSortBy('total')}
                  className="py-3 pl-4 pr-2.5 w-16 cursor-pointer hover:text-blue-600 transition whitespace-nowrap"
                  title="Sắp xếp theo thứ hạng / điểm"
                >
                  Hạng {sortBy === 'total' && '↓'}
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'name' ? 'total' : 'name')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600 transition whitespace-nowrap"
                  title="Sắp xếp theo tên A-Z"
                >
                  Ứng viên {sortBy === 'name' && '↑'}
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Lọc cứng</th>
                <th className="py-3 px-3 whitespace-nowrap">Kỹ năng</th>
                <th className="py-3 px-3 whitespace-nowrap">Kinh nghiệm</th>
                <th className="py-3 px-3 whitespace-nowrap">Học vấn</th>
                <th
                  onClick={() => setSortBy('total')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-blue-600 transition whitespace-nowrap"
                  title="Sắp xếp theo điểm tổng kết"
                >
                  Điểm tổng {sortBy === 'total' && '↓'}
                </th>
                <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700" id="ranking-tbody">
              {filteredCandidates.map((c, idx) => {
                const isPassed = c.status === 'passed';
                const rankNum = idx + 1;
                return (
                  <tr
                    key={c.key}
                    onClick={() => selectCandidateForReport(c.key)}
                    className="candidate-row hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <td className="py-3.5 pl-4 pr-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isPassed && rankNum === 1
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : isPassed && rankNum === 2
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isPassed ? `#${rankNum}` : 'LOẠI'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                            isPassed
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition candidate-name whitespace-nowrap">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono candidate-contact truncate max-w-[180px]">
                            {c.contact}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {isPassed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
                          <i className="fa-solid fa-check text-emerald-600"></i> Đạt (≥ 2.0 năm)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap">
                          <i className="fa-solid fa-xmark text-rose-600"></i> Loại (0.8 &lt; 2.0)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {isPassed ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${c.baseSkillScore}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {c.baseSkillScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {isPassed ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${c.baseExpScore}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {c.baseExpScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-700 truncate block max-w-[155px]" title={`1.0 (${c.pdfEduSchool})`}>
                        1.0 ({c.pdfEduSchool})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border inline-block whitespace-nowrap ${
                          isPassed
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {c.score}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCandidateForReport(c.key);
                        }}
                        className="px-2.5 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 rounded-md font-semibold text-xs transition whitespace-nowrap"
                      >
                        Xem kết quả →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
