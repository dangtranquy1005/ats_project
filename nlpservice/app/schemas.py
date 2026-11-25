from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


def normalize_term(value: str) -> str:
    import unicodedata

    return " ".join(unicodedata.normalize("NFKC", value).split()).casefold()


class DictionarySkill(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int | None = Field(default=None, gt=0, validation_alias=AliasChoices("id", "skillId"))
    key: str | None = Field(default=None, min_length=1, max_length=100)
    canonical: str = Field(
        min_length=1, max_length=255, validation_alias=AliasChoices("canonical", "canonicalName")
    )
    aliases: list[str] = Field(default_factory=list, max_length=64)
    category: str | None = None

    @model_validator(mode="after")
    def validate_skill(self):
        if self.id is None and (self.key is None or not self.key.strip()):
            raise ValueError("Each skill needs a database id or a stable key")
        if not normalize_term(self.canonical):
            raise ValueError("Canonical name cannot be blank")
        if any(not normalize_term(term) or len(term) > 255 for term in self.aliases):
            raise ValueError("Aliases must contain 1 to 255 characters")
        return self


class ExtractRequest(BaseModel):
    cvId: int | None = Field(default=None, gt=0)
    text: str = Field(
        min_length=1, max_length=200_000, validation_alias=AliasChoices("text", "rawText")
    )
    languageHint: Literal["auto", "vi", "en"] = "auto"
    skillDictionary: list[DictionarySkill] | None = Field(
        default=None, max_length=5000, validation_alias=AliasChoices("skillDictionary", "skills")
    )
    fileType: str | None = None

    @field_validator("text")
    @classmethod
    def nonblank_text(cls, value):
        if not value.strip():
            raise ValueError("CV text cannot be blank")
        return value

    @model_validator(mode="after")
    def unambiguous_dictionary(self):
        if self.skillDictionary is not None:
            validate_dictionary(self.skillDictionary)
        return self


def validate_dictionary(skills: list[DictionarySkill]) -> None:
    identities = set()
    terms = {}
    for skill in skills:
        identity = ("id", skill.id) if skill.id is not None else ("key", skill.key)
        if identity in identities:
            raise ValueError("Duplicate skill id/key")
        identities.add(identity)
        for term in [skill.canonical, *skill.aliases]:
            normalized = normalize_term(term)
            if normalized in terms and terms[normalized] != identity:
                raise ValueError(f"Ambiguous skill name or alias: {term}")
            terms[normalized] = identity


class Entity(BaseModel):
    text: str
    label: str
    start: int | None = None
    end: int | None = None


class Person(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    links: list[str] = Field(default_factory=list)


class SkillMatch(BaseModel):
    skillId: int | None = None
    key: str | None = None
    raw: str
    canonical: str
    category: str | None = None
    matchMethod: Literal["EXACT", "ALIAS"]
    confidence: float
    start: int
    end: int


class SkillSuggestion(BaseModel):
    canonical: str
    skillId: int | None = None
    key: str | None = None
    similarity: float


class UnknownSkill(BaseModel):
    raw: str
    suggestions: list[SkillSuggestion] = Field(default_factory=list)


class Experience(BaseModel):
    companyName: str | None = None
    jobTitle: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    startDatePrecision: Literal["year", "month"] | None = None
    endDatePrecision: Literal["year", "month"] | None = None
    isCurrent: bool = False
    description: str
    sourceText: str


class Education(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field: str | None = None
    graduationYear: int | None = None
    sourceText: str


class ExtractResponse(BaseModel):
    cvId: int | None
    language: Literal["vi", "en"]
    person: Person
    candidateName: str | None
    email: str | None
    phone: str | None
    skills: list[SkillMatch]
    experiences: list[Experience]
    educations: list[Education]
    experienceText: str
    rawTokens: list[str]
    entities: list[Entity]
    unknownSkills: list[UnknownSkill]
    normalizedText: str
    warnings: list[str]
    modelVersion: str
    rawNlpResult: str = ""
