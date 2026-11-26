export const EDUCATION_LEVELS={NONE:'Không yêu cầu',COLLEGE:'Cao đẳng',UNIVERSITY:'Đại học',MASTER:'Thạc sĩ',DOCTORATE:'Tiến sĩ'};
const fold=value=>(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
export function educationValue(value){
  const text=fold(value);
  if(!text||['none','khong yeu cau','khong bat buoc'].includes(text))return 'NONE';
  if(/\b(doctorate|doctoral|phd|ph d|doctor of philosophy|tien si)\b/.test(text))return 'DOCTORATE';
  if(/\b(master|masters|msc|m sc|mba|meng|m eng|thac si)\b/.test(text))return 'MASTER';
  if(/\b(university|bachelor|bachelors|bsc|b sc|ba|b a|beng|b eng|bs|engineer|dai hoc|cu nhan|ky su)\b/.test(text))return 'UNIVERSITY';
  if(/\b(college|associate|associates|cao dang)\b/.test(text))return 'COLLEGE';
  return value;
}
export function educationLabel(value){return EDUCATION_LEVELS[educationValue(value)]||value||EDUCATION_LEVELS.NONE;}
