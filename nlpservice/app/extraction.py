import re
import unicodedata
from datetime import date

from app.schemas import Education, Entity, Experience, Person


def fold(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text.casefold())
                   if not unicodedata.combining(c)).replace("đ", "d")


HEADINGS = {
    "skills": {"skills", "technical skills", "technologies", "ky nang", "ky nang chuyen mon", "cong nghe"},
    "experience": {"experience", "work experience", "employment history", "professional experience",
                   "kinh nghiem", "kinh nghiem lam viec", "qua trinh cong tac"},
    "education": {"education", "academic background", "hoc van", "trinh do hoc van", "dao tao"},
    "other": {"projects", "du an", "summary", "profile", "gioi thieu", "muc tieu nghe nghiep",
              "certifications", "chung chi", "languages", "ngoai ngu", "interests", "so thich"},
}


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text).replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(re.sub(r"[^\S\n]+", " ", line).strip()
                     for line in text.replace("\x00", "").splitlines()).strip()


def sections(text: str) -> dict[str, str]:
    result = {name: [] for name in ["header", *HEADINGS]}
    current = "header"
    for line in text.splitlines():
        title, separator, inline = line.partition(":")
        normalized = fold(title.strip(" :•-"))
        detected = next((name for name, names in HEADINGS.items() if normalized in names), None)
        if detected:
            current = detected
            if separator and inline.strip():
                result[current].append(inline.strip())
        else:
            result[current].append(line)
    return {name: "\n".join(lines).strip() for name, lines in result.items()}


def detect_language(text: str) -> str:
    lowered = fold(text)
    if re.search(r"[ăâđêôơưĂÂĐÊÔƠƯ]", text) or any(
        word in lowered for word in ["kinh nghiem", "hoc van", "ky nang", "nguyen", "cu nhan"]
    ):
        return "vi"
    return "en"


def extract_person(text: str, header: str, entities: list[Entity]) -> Person:
    email = re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", text)
    phone = None
    for match in re.finditer(r"(?<!\w)(?:\+?\d[\d ().-]{7,}\d)(?!\w)", text):
        digits = re.sub(r"\D", "", match.group())
        if 9 <= len(digits) <= 15 and not re.search(r"(?:19|20)\d{2}\s*[-–—]", match.group()):
            phone = re.sub(r"[ ().-]", "", match.group()).strip()
            break
    name = None
    for line in header.splitlines()[:10]:
        labeled = re.match(r"^(?:full name|name|ho ten|họ tên)\s*:\s*(.+)$", line, re.I)
        if labeled:
            name = labeled.group(1).strip()
            break
    if name is None:
        name = next((e.text for e in entities if e.label in {"PERSON", "PER"} and e.text in header), None)
    if name is None:
        for line in header.splitlines()[:4]:
            if (2 <= len(line.split()) <= 5 and all(c.isalpha() or c in " '-" for c in line)
                    and fold(line) not in {"curriculum vitae", "resume", "so yeu ly lich"}
                    and not re.search(r"developer|engineer|student|sinh vien|lap trinh|chuyen vien", fold(line))):
                name = line
                break
    links = list(dict.fromkeys(url.rstrip(".,)") for url in re.findall(r"https?://[^\s<>]+", text)))
    return Person(name=name, email=email.group() if email else None, phone=phone, links=links)


DATE = r"(?:(?:0?[1-9]|1[0-2])[/.-])?(?:19|20)\d{2}"
CURRENT = r"(?:present|current|now|hiện tại|hien tai|nay)"
DATE_RANGE = re.compile(rf"(?P<start>{DATE})\s*(?:[-–—]|to|đến|den)\s*(?P<end>{DATE}|{CURRENT})", re.I)


def parse_date(value: str) -> tuple[str | None, str | None]:
    parts = re.split(r"[/.-]", value)
    try:
        year = int(parts[-1])
        month = int(parts[0]) if len(parts) == 2 else 1
        return date(year, month, 1).isoformat(), "month" if len(parts) == 2 else "year"
    except ValueError:
        return None, None


def extract_experiences(section: str, entities: list[Entity]) -> list[Experience]:
    lines = section.splitlines()
    anchors = [(i, DATE_RANGE.search(line)) for i, line in enumerate(lines) if DATE_RANGE.search(line)]
    starts = []
    for index, match in anchors:
        start = index
        if not lines[index][:match.start()].strip(" |-:"):
            # Common CVs put role and company on the two lines immediately before dates.
            lower_bound = anchors[len(starts) - 1][0] + 1 if starts else 0
            while start > max(lower_bound, index - 2) and lines[start - 1].strip():
                start -= 1
        starts.append(start)
    result = []
    for position, (index, match) in enumerate(anchors):
        end = starts[position + 1] if position + 1 < len(starts) else len(lines)
        block = "\n".join(lines[starts[position]:end]).strip()
        title_line = lines[starts[position]]
        title_line = DATE_RANGE.sub("", title_line).strip(" |-:–")
        parts = re.split(r"\s+(?:at|tại|tai)\s+|\s*[|]\s*", title_line, maxsplit=1, flags=re.I)
        job_title = parts[0].strip() or None
        company = parts[1].strip(" |-:–") if len(parts) > 1 else None
        if company is None:
            company = next((entity.text for entity in entities if entity.label == "ORG" and entity.text in block), None)
        start_date, start_precision = parse_date(match["start"])
        current = bool(re.fullmatch(CURRENT, match["end"], re.I))
        end_date, end_precision = (None, None) if current else parse_date(match["end"])
        if end_date and start_date and end_date < start_date:
            start_date = end_date = start_precision = end_precision = None
        description = "\n".join(lines[index + 1:end]).strip()
        result.append(Experience(
            companyName=company, jobTitle=job_title, startDate=start_date, endDate=end_date,
            startDatePrecision=start_precision, endDatePrecision=end_precision,
            isCurrent=current, description=description, sourceText=block,
        ))
    if section and not result:
        result.append(Experience(description=section, sourceText=section))
    return result


DEGREES = [
    (r"\b(?:ph\.?\s*d\.?|doctorate|doctoral|doctor of philosophy|tiến sĩ)\b", "Doctorate"),
    (r"\b(?:master(?:'s)?|m\.?\s*sc\.?|mba|m\.?\s*eng\.?|thạc sĩ)\b", "Master"),
    (r"\b(?:bachelor(?:'s)?|b\.?\s*sc\.?|b\.?\s*eng\.?|b\.?\s*a\.?|cử nhân)\b", "Bachelor"),
    (r"\b(?:kỹ sư|ky su)\b", "Engineer"),
    (r"\b(?:associate(?:'s)?|cao đẳng)\b", "Associate"),
]


def extract_educations(section: str) -> list[Education]:
    if not section:
        return []
    blocks = re.split(r"\n\s*\n", section)
    result = []
    for block in blocks:
        lines = block.splitlines()
        institution = next((line.strip(" |-") for line in lines if re.search(
            r"university|college|institute|đại học|cao đẳng|học viện|dai hoc", line, re.I)), None)
        # Bỏ dấu cho quy tắc bằng cấp; không suy ra Bachelor chỉ từ tên trường University/Đại học.
        degree = next((canonical for pattern, canonical in DEGREES if re.search(fold(pattern), fold(block), re.I)), None)
        field = None
        labeled = re.search(r"(?:major|field|chuyên ngành|chuyen nganh)\s*:\s*([^\n|]+)", block, re.I)
        if labeled:
            field = labeled.group(1).strip()
        else:
            match = re.search(r"(?:Bachelor(?:'s)?|Master(?:'s)?)\s+(?:of|in)\s+([^\n|]+)", block, re.I)
            if match:
                field = match.group(1).strip()
        graduation = re.search(
            r"(?:graduat\w*|tốt nghiệp|tot nghiep)\s*:?\s*((?:19|20)\d{2})", block, re.I
        )
        result.append(Education(
            institution=institution, degree=degree, field=field,
            graduationYear=int(graduation.group(1)) if graduation else None, sourceText=block,
        ))
    return result
