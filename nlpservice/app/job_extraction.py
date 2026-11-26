"""Create an editable job draft from text; do not invent weights or resolve alternatives as AND."""
import re
from app.extraction import clean_text, fold
from app.skills import match_skills

def extract_job(text, dictionary):
    text = clean_text(text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    warnings = ["Mức ưu tiên của các kỹ năng đang để bằng nhau. Hãy kiểm tra trước khi lưu.",
                "Mô tả đang giữ nội dung tài liệu. Bạn có thể rút gọn phần mô tả công việc trước khi lưu."]
    title = None
    for line in lines[:25]:
        labeled = re.match(r"^(?:ten vi tri|vi tri tuyen dung|vi tri|job title|position|title)\s*:\s*(.+)$", fold(line))
        if labeled:
            title = line.split(':', 1)[1].strip()
            break
        if len(line) <= 150 and re.search(r"\b(developer|engineer|lap trinh vien|chuyen vien|data analyst|data scientist|ky su)\b", fold(line)):
            title = re.sub(r"^(?:tuyen dung|hiring)\s*[:\-]?\s*", "", line, flags=re.I)
            break
    if title and len(title)>255:
        title = None
    if not title:
        warnings.append("Chưa xác định được tên vị trí. Hãy nhập tên phù hợp.")
    experience = None
    experience_source = None
    education = None
    education_source = None
    edu_patterns = [('DOCTORATE', r'\b(ph\.?\s*d|doctorate|doctoral|tien si)\b'),
                    ('MASTER', r'\b(master|msc|mba|thac si)\b'),
                    ('UNIVERSITY', r'\b(bachelor|bsc|beng|dai hoc|cu nhan|ky su)\b'),
                    ('COLLEGE', r'\b(associate|cao dang)\b')]
    for line in lines:
        plain = fold(line)
        if re.search(r'kinh nghiem|experience', plain):
            if re.search(r'khong (?:yeu cau|can).*kinh nghiem|no experience required|without experience', plain):
                value = 0
            else:
                match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:[-–—]\s*\d+(?:[.,]\d+)?)?\s*\+?\s*(?:nam|years?)(?!\w)', plain)
                if not match:
                    continue
                number = float(match[1].replace(',', '.'))
                if not number.is_integer():
                    warnings.append("Kinh nghiệm có số lẻ. Hãy chọn số năm tối thiểu trong form.")
                    continue
                value = int(number)
            if experience is not None and experience != value:
                warnings.append("Có nhiều yêu cầu kinh nghiệm khác nhau. Hãy kiểm tra số năm tối thiểu.")
                experience = None
                experience_source = line
                break
            experience, experience_source = value, line
    for line in lines:
        plain = fold(line)
        if not re.search(r'hoc van|bang cap|tot nghiep|trinh do|cu nhan|bachelor|master|doctorate|phd|thac si|tien si|cao dang|degree|qualification', plain):
            continue
        if re.search(r'khong (?:yeu cau|bat buoc).*?(?:hoc van|bang cap)|no degree required|degree not required', plain):
            education, education_source = 'NONE', line
            break
        levels = [name for name, pattern in edu_patterns if re.search(pattern, plain)]
        if len(levels) == 1:
            education, education_source = levels[0], line
            break
        if len(levels) > 1:
            education_source = line
            warnings.append("Có nhiều lựa chọn học vấn. Hãy chọn trình độ tối thiểu phù hợp.")
            break
    skills = {}
    mode = None
    unclear = False
    for index, line in enumerate(lines):
        plain = fold(line)
        if plain.strip(' :') in {'ky nang bat buoc','bat buoc','required skills','must have','mandatory skills'}:
            mode = True
        elif plain.strip(' :') in {'uu tien','ky nang uu tien','preferred skills','nice to have','preferred qualifications'}:
            mode = False
        elif plain.strip(' :') in {'quyen loi','benefits','about us','ve chung toi','mo ta cong viec','responsibilities'}:
            mode = None
        matches = match_skills(line, dictionary)
        if not matches:
            continue
        if re.search(r'khong (?:yeu cau|bat buoc|can)|not required|no need|without', plain):
            warnings.append("Có câu phủ định về kỹ năng; hãy đối chiếu lại phần kỹ năng đã chọn.")
            continue
        context = line
        # PDF tables often place weight and mandatory label on the next lines.
        for following in lines[index+1:index+3]:
            if match_skills(following, dictionary):
                break
            if re.fullmatch(r'\d+(?:[.,]\d+)?', following) or fold(following).strip() in {'bat buoc','uu tien','required','preferred'}:
                context += ' ' + following
            else:
                break
        normalized = fold(context)
        alternative = bool(re.search(r'\b(hoac|or|either)\b', normalized))
        preferred = bool(re.search(r'uu tien|preferred|nice to have|plus|advantage', normalized))
        required = bool(re.search(r'bat buoc|must have|required|mandatory', normalized))
        mandatory = required if required != preferred else mode if not (required and preferred) else None
        if alternative:
            mandatory = False
            warnings.append("Có yêu cầu kỹ năng thay thế (hoặc/or). Hãy chọn lại kỹ năng bắt buộc; hệ thống chưa áp dụng nhóm thay thế tự động.")
        if mandatory is None:
            unclear = True
        for match in matches:
            identity = match.skillId
            if identity is None:
                continue
            item = dict(skillId=identity, skillName=match.canonical, mandatory=bool(mandatory), weight=1.0, sourceText=context)
            old = skills.get(identity)
            if old is None or (mandatory is True and not old['mandatory']):
                skills[identity] = item
    if unclear:
        warnings.append("Một số kỹ năng chưa rõ bắt buộc hay ưu tiên; đang để ưu tiên để bạn xác nhận.")
    if not skills:
        warnings.append("Chưa nhận diện được kỹ năng từ từ điển. Hãy chọn kỹ năng trong form.")
    if experience is None:
        warnings.append("Chưa chốt được số năm kinh nghiệm tối thiểu. Hãy điền lại trong form.")
    if education is None:
        warnings.append("Chưa chốt được yêu cầu học vấn; đang để Không yêu cầu để bạn kiểm tra.")
    return dict(title=title, description=text, minExperienceYears=experience,
                educationRequirements=education, requiredSkills=list(skills.values()),
                warnings=list(dict.fromkeys(warnings)), experienceSource=experience_source,
                educationSource=education_source)
