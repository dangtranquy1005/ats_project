import React from 'react';
import {SKILL_IMPORTANCE_OPTIONS,isCustomSkillImportance} from '../services/skillImportance';

export default function SkillImportancePicker({name,value,onChange,disabled}){
  return <fieldset disabled={disabled} className="space-y-2 min-w-0"><legend className="text-xs text-slate-600 mb-2">Mức độ quan trọng của {name}</legend><div className="grid grid-cols-3 gap-2">{SKILL_IMPORTANCE_OPTIONS.map(option=>{
    const checked=Number(value)===option.value;
    return <label key={option.value} className={`flex items-center justify-center px-2 py-2.5 border rounded-lg text-xs text-center cursor-pointer focus-within:ring-2 focus-within:ring-blue-400 ${checked?'bg-blue-50 border-blue-500 text-blue-800 font-semibold':'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'} ${disabled?'opacity-50 cursor-not-allowed':''}`}><input type="radio" className="sr-only" name={`importance-${name}`} value={option.value} checked={checked} onChange={()=>onChange(option.value)}/><span>{option.label}</span></label>;
  })}</div>{isCustomSkillImportance(value)&&<p className="text-xs text-slate-500">Đang giữ thiết lập trước đây. Chọn một mức ở trên nếu bạn muốn thay đổi.</p>}</fieldset>;
}
