import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SkillsScreen() {
  const {
    standardSkills,
    unknownSkills,
    categories,
    deleteSkillAlias,
    openModal,
    deleteStandardSkill,
    acceptUnknownSkill
  } = useApp();

  const [activeTab, setActiveTab] = useState(1); // 1: std, 2: unk, 3: tree
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  const filteredStandardSkills = standardSkills.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()));

    const matchCat = selectedCat === 'ALL' || s.category === selectedCat;
    return matchSearch && matchCat;
  });

  const handleDeleteSkill = (skill) => {
    const isInUse = skill.name === 'Spring Boot' || skill.name === 'PostgreSQL' || skill.name === 'Docker';
    openModal('confirm', {
      title: isInUse ? `Không thể xóa "${skill.name}"` : `Xóa kỹ năng "${skill.name}"?`,
      body: isInUse
        ? 'Kỹ năng đang được tin tuyển dụng và CV sử dụng. Hãy gỡ khỏi các tin trước, hoặc ẩn kỹ năng để giữ lịch sử của CV cũ.'
        : 'Kỹ năng và các biến thể sẽ bị xóa khỏi từ điển.',
      okText: isInUse ? 'Ẩn kỹ năng' : 'Xóa kỹ năng',
      onConfirm: () => deleteStandardSkill(skill.id, isInUse)
    });
  };

  return (
    <div id="screen-skills" className="h-full w-full flex flex-col gap-3">
      {/* Top Header */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 flex justify-between items-center shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="fa-solid fa-book-open"></i>
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">Quản trị từ điển kỹ năng</h2>
            <p className="text-xs text-slate-500">
              Tên chuẩn và biến thể dùng để nhận diện kỹ năng trong CV
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-400"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kỹ năng..."
              className="pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none w-56 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none text-xs cursor-pointer"
          >
            <option value="ALL">Nhóm: Tất cả</option>
            <option value="Backend">Backend</option>
            <option value="Frontend">Frontend</option>
            <option value="Database">Cơ sở dữ liệu</option>
            <option value="DevOps">DevOps</option>
            <option value="Kỹ năng mềm">Kỹ năng mềm</option>
          </select>

          <button
            onClick={() => openModal('skillForm', { mode: 'add', skill: null })}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition active:scale-98 flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-xs"></i> Thêm kỹ năng
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 shrink-0 text-xs">
        <button
          onClick={() => setActiveTab(1)}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 1
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Kỹ năng chuẩn ({standardSkills.length})
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 2
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Kỹ năng lạ chờ bổ sung ({unknownSkills.length})
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 3
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Cây nhóm kỹ năng
        </button>
      </div>

      {/* Tab 1: Kỹ năng chuẩn */}
      {activeTab === 1 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-left">Tên chuẩn</th>
                  <th className="px-5 py-3 text-left">Nhóm</th>
                  <th className="px-5 py-3 text-left">Loại</th>
                  <th className="px-5 py-3 text-left">Biến thể (alias)</th>
                  <th className="px-5 py-3 text-left">Đang dùng</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandardSkills.map(skill => (
                  <tr
                    key={skill.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{skill.name}</span>
                        {skill.hidden && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-normal">
                            Đã ẩn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{skill.category}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {skill.type === 'TECHNICAL' ? 'Công nghệ' : 'Kỹ năng mềm'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {skill.aliases.map((al, alIdx) => (
                          <span
                            key={alIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200 flex items-center gap-1"
                          >
                            {al}
                            <i
                              onClick={() => deleteSkillAlias(skill.id, al)}
                              title="Xóa biến thể"
                              className="fa-solid fa-xmark text-[9px] text-slate-400 cursor-pointer hover:text-rose-600"
                            ></i>
                          </span>
                        ))}
                        <button
                          onClick={() => openModal('alias', skill)}
                          className="text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          + Thêm
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {skill.name === 'Spring Boot'
                        ? '8 tin • 31 CV'
                        : skill.name === 'PostgreSQL'
                        ? '6 tin • 27 CV'
                        : skill.name === 'Docker'
                        ? '5 tin • 20 CV'
                        : '2 tin • 8 CV'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openModal('skillForm', { mode: 'edit', skill })}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
            <i className="fa-solid fa-circle-info mr-1"></i> Sau khi sửa từ điển, CV đã xử lý trước đó không tự chạy lại. Hãy dùng "Xử lý lại" ở bước Tiếp nhận CV.
          </div>
        </div>
      )}

      {/* Tab 2: Kỹ năng lạ chờ bổ sung */}
      {activeTab === 2 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left">Cụm từ trong CV</th>
                  <th className="px-5 py-3 text-left">Số lần xuất hiện</th>
                  <th className="px-5 py-3 text-left">Gợi ý gần nhất</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {unknownSkills.map(u => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-5 py-3 font-mono text-slate-600">{u.count} CV</td>
                    <td className="px-5 py-3 text-slate-600">
                      {u.name === 'Kafka Streams'
                        ? 'Apache Kafka (độ khớp 74%)'
                        : u.name === 'Quarkus'
                        ? 'Java Microservices (độ khớp 60%)'
                        : 'Không có gợi ý'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => acceptUnknownSkill(u)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition"
                      >
                        Thêm làm biến thể
                      </button>
                      <button
                        onClick={() =>
                          openModal('skillForm', {
                            mode: 'add',
                            skill: { name: u.name, category: 'Backend', type: 'TECHNICAL' }
                          })
                        }
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                      >
                        Tạo kỹ năng mới
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cây nhóm kỹ năng */}
      {activeTab === 3 && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex-1 overflow-auto p-5 text-xs">
          <p className="text-[11px] text-slate-500 mb-3">
            <i className="fa-solid fa-circle-info mr-1"></i> Cây nhóm kỹ năng cha–con dùng để phân loại khi chọn yêu cầu cho vị trí.
          </p>
          <ul className="space-y-4 text-slate-800 font-semibold">
            {categories.map((cat, idx) => (
              <li key={idx} className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm mb-1.5">
                  <i className="fa-solid fa-folder-open"></i>
                  <span>{cat.name}</span>
                </div>
                <ul className="ml-5 mt-1 flex flex-wrap gap-1.5 font-normal">
                  {cat.skills.map((s, sIdx) => (
                    <li
                      key={sIdx}
                      onClick={() => {
                        setSelectedCat('ALL');
                        setSearch(s);
                        setActiveTab(1);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer transition shadow-xs"
                      title={`Bấm để xem và chỉnh sửa kỹ năng "${s}"`}
                    >
                      {s} →
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
