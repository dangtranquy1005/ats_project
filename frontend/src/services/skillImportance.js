export const SKILL_IMPORTANCE_OPTIONS = [
  {value:1,label:'Bình thường'},
  {value:2,label:'Quan trọng'},
  {value:3,label:'Rất quan trọng'},
];
export function skillImportanceLabel(weight){
  const option=SKILL_IMPORTANCE_OPTIONS.find(item=>item.value===Number(weight));
  if(option)return option.label;
  return Number.isFinite(Number(weight))&&Number(weight)>0?'Thiết lập trước đây':'Chưa chọn';
}
export function isCustomSkillImportance(weight){
  return Number.isFinite(Number(weight))&&Number(weight)>0&&!SKILL_IMPORTANCE_OPTIONS.some(item=>item.value===Number(weight));
}
