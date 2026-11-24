FROM python:3.12-slim
WORKDIR /service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm \
    && python -c "from underthesea import ner, word_tokenize; word_tokenize('Nguyễn Văn An'); ner('Nguyễn Văn An làm việc tại Hà Nội.')"
COPY app ./app
COPY data ./data
ENV NLP_MODE=full
EXPOSE 8000
HEALTHCHECK --start-period=180s --interval=30s --timeout=5s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
