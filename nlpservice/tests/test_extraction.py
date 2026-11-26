import json

import pytest
from fastapi.testclient import TestClient

from app.extraction import extract_experiences, sections
from app.main import ROOT, create_app
from app.schemas import DictionarySkill
from app.skills import match_skills, unknown_skills

@pytest.mark.parametrize('degree,expected',[
    ('Cử nhân','Bachelor'),('Cu nhan','Bachelor'),('Kỹ sư','Engineer'),('Ky su','Engineer'),
    ('Bachelor of Science','Bachelor'),('B.Sc.','Bachelor'),('B.Eng.','Bachelor'),
    ('Cao đẳng','Associate'),('Cao dang','Associate'),('Associate Degree','Associate'),
    ('Thạc sĩ','Master'),('Thac si','Master'),('MSc','Master'),('MBA','Master'),
    ('Tiến sĩ','Doctorate'),('Tien si','Doctorate'),('Ph.D.','Doctorate'),
])
def test_bilingual_degrees(degree,expected):
    from app.extraction import extract_educations
    assert extract_educations(f'Example University\n{degree}\nGraduated: 2021')[0].degree == expected

def test_university_name_is_not_evidence_of_a_degree():
    from app.extraction import extract_educations
    assert extract_educations('Example University\nMajor: Computer Science')[0].degree is None


@pytest.fixture
def client():
    with TestClient(create_app("rules")) as instance:
        yield instance


def test_english_demo_and_java_compatibility(client):
    payload = json.loads((ROOT / "examples" / "extract-en.json").read_text(encoding="utf-8"))
    response = client.post("/nlp/extract", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["candidateName"] == "Jane Doe"
    assert result["email"] == "jane@example.com"
    assert result["language"] == "en"
    assert {s["skillId"] for s in result["skills"]} == {101, 102, 103}
    assert result["experiences"][0]["companyName"] == "Example Ltd"
    assert result["experiences"][0]["startDate"] == "2022-01-01"
    assert result["experiences"][0]["endDate"] == "2024-12-01"
    assert result["educations"][0]["degree"] == "Bachelor"
    assert result["educations"][0]["graduationYear"] == 2021
    assert result["rawTokens"]
    assert json.loads(result["rawNlpResult"])["cvId"] == 2


def test_vietnamese_demo(client):
    payload = json.loads((ROOT / "examples" / "extract-vi.json").read_text(encoding="utf-8"))
    response = client.post("/nlp/extract", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["person"]["name"] == "Nguyễn Văn An"
    assert result["person"]["phone"] == "0901234567"
    assert result["language"] == "vi"
    assert result["experiences"][0]["companyName"] == "Công ty ABC"
    assert result["experiences"][1]["isCurrent"] is True
    assert result["experiences"][1]["endDate"] is None
    assert result["educations"][0]["field"] == "Công nghệ thông tin"
    assert result["educations"][0]["degree"] == "Engineer"


def test_boundaries_aliases_overlap_deduplication_and_punctuation():
    dictionary = [
        DictionarySkill(key="java", canonical="Java"),
        DictionarySkill(key="javascript", canonical="JavaScript"),
        DictionarySkill(key="c", canonical="C"),
        DictionarySkill(key="cpp", canonical="C++"),
        DictionarySkill(key="csharp", canonical="C#"),
        DictionarySkill(key="react", canonical="React", aliases=["React.js"]),
        DictionarySkill(key="react-native", canonical="React Native"),
    ]
    result = match_skills("JavaScript, C++, C#, React Native, React.js, React", dictionary)
    assert {s.key for s in result} == {"javascript", "cpp", "csharp", "react-native", "react"}
    assert len(result) == 5
    assert next(s for s in result if s.key == "react").matchMethod == "ALIAS"


def test_fuzzy_is_suggestion_only():
    dictionary = [DictionarySkill(id=1, canonical="PostgreSQL", aliases=["Postgres"])]
    assert match_skills("PostgreSQlX", dictionary) == []
    suggestions = unknown_skills("PostgreSQlX", dictionary)
    assert suggestions[0].suggestions[0].skillId == 1


def test_default_dictionary_has_keys_not_fabricated_db_ids(client):
    result = client.post("/nlp/extract", json={"rawText": "Skills: React.js"}).json()
    assert result["skills"][0]["key"] == "react"
    assert result["skills"][0]["skillId"] is None
    assert any("PostgreSQL" in warning for warning in result["warnings"])


@pytest.mark.parametrize("payload", [
    {"text": "   "},
    {"text": "\u0000"},
    {"text": "x" * 200_001},
    {"text": "CV", "languageHint": "fr"},
    {"text": "CV", "skillDictionary": [{"canonical": "Java"}]},
    {"text": "CV", "skillDictionary": [
        {"id": 1, "canonical": "Java"}, {"id": 2, "canonical": "java"},
    ]},
    {"text": "CV", "skillDictionary": [
        {"id": 1, "canonical": "Java"}, {"id": 1, "canonical": "Python"},
    ]},
])
def test_invalid_input_is_422(client, payload):
    assert client.post("/nlp/extract", json=payload).status_code == 422


def test_empty_dictionary_is_respected(client):
    result = client.post("/nlp/extract", json={"text": "Skills: Java", "skillDictionary": []}).json()
    assert result["skills"] == []


def test_dates_missing_invalid_and_overlapping_are_not_invented():
    assert extract_experiences("Backend developer without dates", [])[0].startDate is None
    assert extract_experiences("Developer | ABC 2024 - 2022", [])[0].startDate is None
    results = extract_experiences("Dev | ABC 2021 - 2023\nJava\nDev | XYZ 2022 - Present\nPython", [])
    assert len(results) == 2
    assert results[0].startDatePrecision == "year"
    assert results[1].isCurrent


def test_inline_sections_and_health(client):
    assert sections("Kỹ năng: Java, React\nHọc vấn\nĐại học X")["skills"] == "Java, React"
    assert client.get("/health").json()["mode"] == "rules"
