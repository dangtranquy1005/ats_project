export function score100(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? (Number(value) * 100).toFixed(1) : '—';
}
export function rankingParams(form) {
  const params = { query: form.query.trim(), sortBy: form.sortBy, sortOrder: form.sortOrder };
  for (const [field, value] of [['minScore',form.minScore],['maxScore',form.maxScore]]) {
    if (value === '') continue;
    const number=Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 100) throw new Error('Điểm lọc phải nằm trong khoảng 0–100.');
    params[field]=number/100;
  }
  if (params.minScore !== undefined && params.maxScore !== undefined && params.minScore > params.maxScore) throw new Error('Điểm tối thiểu không được lớn hơn điểm tối đa.');
  if (form.passed !== '') params.passedHardFilter = form.passed === 'true';
  if (form.reviewStatus) params.reviewStatus = form.reviewStatus;
  return params;
}
