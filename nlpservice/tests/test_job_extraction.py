from app.job_extraction import extract_job
from app.schemas import DictionarySkill

DICTIONARY=[DictionarySkill(id=1,canonical='Java'),DictionarySkill(id=2,canonical='Spring Boot',aliases=['SpringBoot']),DictionarySkill(id=3,canonical='Docker'),DictionarySkill(id=4,canonical='C#')]

def test_vietnamese_draft_has_evidence_and_real_dictionary_ids():
    result=extract_job('Vị trí: Java Developer\nKinh nghiệm từ 3-5 năm\nTrình độ: Đại học trở lên\nKỹ năng bắt buộc\nJava, SpringBoot\nKỹ năng ưu tiên\nDocker',DICTIONARY)
    assert result['title']=='Java Developer'
    assert result['minExperienceYears']==3
    assert result['educationRequirements']=='UNIVERSITY'
    skills={s['skillId']:s for s in result['requiredSkills']}
    assert skills[1]['mandatory'] and skills[2]['mandatory']
    assert not skills[3]['mandatory']
    assert all(s['weight']==1 for s in skills.values())
    assert result['experienceSource']=='Kinh nghiệm từ 3-5 năm'

def test_english_alternatives_are_not_converted_to_mandatory_and():
    result=extract_job('Position: Backend Engineer\nAt least 2 years of experience\nBachelor degree required\nMust have Java or C#\nDocker is preferred',DICTIONARY)
    assert result['minExperienceYears']==2
    assert result['educationRequirements']=='UNIVERSITY'
    assert all(not s['mandatory'] for s in result['requiredSkills'])
    assert any('hoặc/or' in w for w in result['warnings'])

def test_unknown_fields_are_not_invented_and_negative_skills_are_skipped():
    result=extract_job('About our company\nWe build products.\nDocker is not required',DICTIONARY)
    assert result['title'] is None
    assert result['minExperienceYears'] is None
    assert result['educationRequirements'] is None
    assert result['requiredSkills']==[]
    assert result['warnings']

def test_pdf_table_labels_and_duplicate_skills():
    result=extract_job('Backend Developer\nJava\n3\nBắt buộc\nDocker\n1\nƯu tiên\nJava trong dự án',DICTIONARY)
    skills={s['skillId']:s for s in result['requiredSkills']}
    assert len(skills)==2
    assert skills[1]['mandatory']
    assert not skills[3]['mandatory']

def test_no_requirement_and_conflicting_education_need_review():
    result=extract_job('Java Developer\nKhông yêu cầu kinh nghiệm\nKhông yêu cầu bằng cấp',DICTIONARY)
    assert result['minExperienceYears']==0
    assert result['educationRequirements']=='NONE'
    result=extract_job('Java Developer\nBằng cấp: Đại học hoặc Cao đẳng',DICTIONARY)
    assert result['educationRequirements'] is None
