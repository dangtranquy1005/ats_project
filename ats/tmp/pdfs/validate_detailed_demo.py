import json,urllib.request,concurrent.futures
from pathlib import Path
root=Path('output/pdf/ats-demo-detailed');out=root/'expected'/'nlp-observed';out.mkdir(exist_ok=True)
def check(path):
    request=urllib.request.Request('http://127.0.0.1:8000/nlp/extract',data=path.read_bytes(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=90) as response: result=json.load(response)
    (out/path.name).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return dict(cv=path.stem,name=result.get('candidateName'),skills=[s['canonical'] for s in result['skills']],experiences=[(e.get('startDate'),e.get('endDate')) for e in result['experiences']],education=[e.get('degree') for e in result['educations']],unknown=[s['raw'] for s in result.get('unknownSkills',[])])
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(check,sorted((root/'nlp-requests').glob('*.json'))))
(root/'expected'/'nlp-observed-summary.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=True))
