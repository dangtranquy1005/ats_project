export const CV_STATES = {
  PENDING: 'Đang chờ', PARSING: 'Đang xử lý', PARSED: 'Đã phân tích',
  PARSED_FAILED: 'Phân tích thất bại', SCORED: 'Đã chấm điểm', REVIEWED: 'Đã duyệt',
};
export const isProcessing = status => status === 'PENDING' || status === 'PARSING';
export function cvStage(cv) {
  if (cv.status === 'PENDING') return cv.textExtracted ? 'Chờ NLP phân tích' : 'Chờ đọc PDF';
  if (cv.status === 'PARSING') return cv.textExtracted ? 'NLP đang phân tích' : 'Đang đọc PDF';
  if (cv.status === 'PARSED_FAILED') return cv.errorMessage || 'Phân tích thất bại';
  return CV_STATES[cv.status] || cv.status;
}
export function validateFiles(files) {
  return Array.from(files).map(file => ({ file, error:
    !/\.pdf$/i.test(file.name) ? 'Chỉ hỗ trợ file PDF.' :
    file.size === 0 ? 'File rỗng.' :
    file.name.length > 255 ? 'Tên file vượt quá 255 ký tự.' :
    file.size > 10 * 1024 * 1024 ? 'File vượt quá 10 MB.' : null,
  }));
}
