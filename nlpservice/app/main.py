import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException

from app.engine import NLPEngine
from app.extraction import (
    clean_text, detect_language, extract_educations, extract_experiences, extract_person, sections,
)
from app.schemas import DictionarySkill, ExtractRequest, ExtractResponse, validate_dictionary
from app.skills import match_skills, unknown_skills

logger = logging.getLogger(__name__)
VERSION = "ats-nlp-1.0"
ROOT = Path(__file__).resolve().parent.parent


def create_app(mode: str | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        # Fail startup if full models cannot be loaded; health must reflect actual capability.
        application.state.engine = NLPEngine(mode)
        with (ROOT / "data" / "skills.json").open(encoding="utf-8-sig") as source:
            application.state.dictionary = [DictionarySkill.model_validate(row) for row in json.load(source)]
        validate_dictionary(application.state.dictionary)
        logger.info("NLP ready: mode=%s, dictionary=%d", application.state.engine.mode,
                    len(application.state.dictionary))
        yield

    application = FastAPI(
        title="ATS CV NLP Service", version=VERSION, lifespan=lifespan,
        description="Extract Vietnamese/English CV text for Spring Boot. POST /nlp/extract accepts text, not PDF.",
    )

    @application.get("/health")
    def health():
        return {
            "status": "ok", "version": VERSION, "mode": application.state.engine.mode,
            "englishModel": application.state.engine.english_model_name if application.state.engine.english else None,
            "vietnameseModel": "underthesea" if application.state.engine.vi_ner else None,
            "dictionarySize": len(application.state.dictionary),
        }

    @application.post("/nlp/extract", response_model=ExtractResponse)
    def extract(request: ExtractRequest):
        text = clean_text(request.text)
        if not text.strip():
            raise HTTPException(status_code=422, detail="CV text is empty after normalization")
        language = detect_language(text) if request.languageHint == "auto" else request.languageHint
        dictionary = request.skillDictionary
        warnings = []
        if dictionary is None:
            dictionary = application.state.dictionary
            warnings.append("Using demo dictionary keys. Send skillDictionary with PostgreSQL ids for persistence.")
        if application.state.engine.mode == "rules":
            warnings.append("Rules mode: spaCy/underthesea NER is disabled.")
        tokens, entities = application.state.engine.analyze(text, language)
        parts = sections(text)
        person = extract_person(text, parts["header"], entities)
        experiences = extract_experiences(parts["experience"], entities)
        educations = extract_educations(parts["education"])
        if parts["experience"] and any(item.startDate is None for item in experiences):
            warnings.append("Some experience dates are missing or invalid; inspect sourceText before filtering.")
        if not parts["experience"]:
            warnings.append("Experience section not recognized; experienceText is empty.")
        if not parts["education"]:
            warnings.append("Education section not recognized.")
        warnings.append("Skill confidence is dictionary-match strength, not a calibrated probability or proficiency.")
        response = ExtractResponse(
            cvId=request.cvId, language=language, person=person,
            candidateName=person.name, email=person.email, phone=person.phone,
            skills=match_skills(text, dictionary), experiences=experiences, educations=educations,
            experienceText=parts["experience"], rawTokens=tokens, entities=entities,
            unknownSkills=unknown_skills(parts["skills"], dictionary), normalizedText=text,
            warnings=warnings, modelVersion=f"{VERSION}/{application.state.engine.mode}",
        )
        # Keep compatibility with Java AnalyzeResponse.rawNlpResult (a JSON string).
        response.rawNlpResult = json.dumps(
            response.model_dump(exclude={"rawNlpResult"}), ensure_ascii=False, separators=(",", ":")
        )
        return response

    @application.post("/nlp/extract-job")
    def extract_job_draft(request: ExtractRequest):
        from app.job_extraction import extract_job
        if request.skillDictionary is None:
            raise HTTPException(status_code=422, detail="Job extraction requires a dictionary with database ids")
        if not clean_text(request.text).strip():
            raise HTTPException(status_code=422, detail="Job text is empty")
        return extract_job(request.text, request.skillDictionary)

    return application


app = create_app()
