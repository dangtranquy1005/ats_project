import re

from rapidfuzz.fuzz import ratio

from app.schemas import DictionarySkill, SkillMatch, SkillSuggestion, UnknownSkill, normalize_term


def match_skills(text: str, dictionary: list[DictionarySkill]) -> list[SkillMatch]:
    candidates = []
    for skill in dictionary:
        for term in dict.fromkeys([skill.canonical, *skill.aliases]):
            # Keep punctuation meaningful for C++, C#, .NET and React.js.
            escaped = r"\s+".join(re.escape(part) for part in term.split())
            pattern = re.compile(r"(?<![\w.+#])" + escaped + r"(?![\w+#]|\.\w)", re.IGNORECASE)
            for match in pattern.finditer(text):
                candidates.append((match.start(), match.end(), skill, term))

    # Reserve longest spans first, so React Native does not also produce React.
    occupied = []
    seen = set()
    results = []
    for start, end, skill, term in sorted(candidates, key=lambda c: (-(c[1] - c[0]), c[0])):
        if any(start < right and end > left for left, right in occupied):
            continue
        occupied.append((start, end))
        identity = (skill.id, skill.key, skill.canonical)
        if identity in seen:
            continue
        seen.add(identity)
        results.append(SkillMatch(
            skillId=skill.id, key=skill.key, raw=text[start:end], canonical=skill.canonical,
            category=skill.category,
            matchMethod="EXACT" if normalize_term(term) == normalize_term(skill.canonical) else "ALIAS",
            confidence=1.0, start=start, end=end,
        ))
    return sorted(results, key=lambda match: match.start)


def unknown_skills(section: str, dictionary: list[DictionarySkill]) -> list[UnknownSkill]:
    known = {normalize_term(term) for skill in dictionary for term in [skill.canonical, *skill.aliases]}
    results = []
    seen = set()
    for raw in re.split(r"[,;\n•|]", section):
        raw = raw.strip(" \t-")
        term = normalize_term(raw)
        # A skills list can also contain prose; only short list items are candidates.
        if not term or term in seen or term in known or len(term) > 60 or len(term.split()) > 5:
            continue
        seen.add(term)
        if match_skills(raw, dictionary):
            continue
        suggestions = []
        if len(term) >= 5:
            for skill in dictionary:
                similarity = max(ratio(term, normalize_term(name))
                                 for name in [skill.canonical, *skill.aliases])
                if similarity >= 85:
                    suggestions.append(SkillSuggestion(
                        canonical=skill.canonical, skillId=skill.id, key=skill.key,
                        similarity=round(similarity / 100, 3),
                    ))
        suggestions.sort(key=lambda s: s.similarity, reverse=True)
        results.append(UnknownSkill(raw=raw, suggestions=suggestions[:3]))
    return results[:100]
