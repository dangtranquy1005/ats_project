import os
import re
import threading

from app.schemas import Entity


class NLPEngine:
    """Load models once and serialize access to shared model state."""

    def __init__(self, mode: str | None = None):
        self.mode = mode or os.getenv("NLP_MODE", "full")
        if self.mode not in {"full", "rules"}:
            raise ValueError("NLP_MODE must be full or rules")
        self.lock = threading.Lock()
        self.english = None
        self.english_model_name = os.getenv("SPACY_MODEL", "en_core_web_sm")
        self.vi_ner = None
        self.vi_tokenize = None
        if self.mode == "full":
            import spacy
            from underthesea import ner, word_tokenize

            self.english = spacy.load(self.english_model_name)
            self.vi_ner = ner
            self.vi_tokenize = word_tokenize
            # Warm Vietnamese models before readiness, surfacing missing model files at startup.
            self.vi_tokenize("Nguyễn Văn An làm việc tại Hà Nội.")
            self.vi_ner("Nguyễn Văn An làm việc tại Hà Nội.")

    def analyze(self, text: str, language: str) -> tuple[list[str], list[Entity]]:
        if self.mode == "rules":
            return re.findall(r"\w+(?:[.+#-]\w+)*|[^\w\s]", text), []
        with self.lock:
            if language == "en":
                doc = self.english(text)
                return [token.text for token in doc if not token.is_space], [
                    Entity(text=entity.text, label=entity.label_, start=entity.start_char, end=entity.end_char)
                    for entity in doc.ents
                ]
            tokens = self.vi_tokenize(text)
            entities = []
            current = []
            label = None
            # underthesea NER rows are (word, POS, chunk, BIO entity tag).
            for row in self.vi_ner(text):
                word, tag = row[0], row[-1]
                if tag.startswith("B-") or tag == "O" or (label and tag[2:] != label):
                    if current:
                        entities.append(Entity(text=" ".join(current), label=label))
                    current = []
                    label = None
                if tag.startswith(("B-", "I-")):
                    label = tag[2:]
                    current.append(word)
            if current:
                entities.append(Entity(text=" ".join(current), label=label))
            return tokens, entities
