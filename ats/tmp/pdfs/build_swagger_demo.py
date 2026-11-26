import json
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pypdfium2 as pdfium
from pypdf import PdfReader

root=Path("demo/nlp-swagger")
pdfdir=Path("output/pdf")
qa=Path("tmp/pdfs")
ids=json.loads((root/"skill-ids.json").read_text(encoding="utf-8"))
seed=json.loads(Path("src/main/resources/skills.json").read_text(encoding="utf-8-sig"))
dictionary=[{"id":ids[s["canonicalName"]],"canonical":s["canonicalName"],"aliases":s["aliases"],"category":s["category"]} for s in seed]
pdfmetrics.registerFont(TTFont("DemoArial","C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("DemoArialBold","C:/Windows/Fonts/arialbd.ttf"))
body=ParagraphStyle("Body",fontName="DemoArial",fontSize=10.5,leading=15,spaceAfter=3)
heading=ParagraphStyle("Heading",parent=body,fontName="DemoArialBold",fontSize=11.5,spaceBefore=12,spaceAfter=6)
title=ParagraphStyle("Name",parent=heading,fontSize=21,leading=26,spaceBefore=0,spaceAfter=12)
cases=[
("01-backend-strong","vi",[
"Họ tên: Nguyễn Minh An","Email: an.demo@example.com","Điện thoại: 0901 234 567","",
"KỸ NĂNG","JAVA, SpringBoot, Postgres, Docker, Git","",
"KINH NGHIỆM LÀM VIỆC","Backend Developer | Công ty Demo ABC | 01/2020 - 12/2024",
"Phát triển REST API bằng Java, Spring Boot và PostgreSQL. Đóng gói ứng dụng bằng Docker.","",
"HỌC VẤN","Đại học Xây dựng Hà Nội","Kỹ sư","Chuyên ngành: Công nghệ thông tin","Tốt nghiệp: 2019"]),
("02-frontend-english","en",[
"Name: Jane Demo","Email: jane.demo@example.com","Phone: +84 902 345 678","",
"SKILLS","React.js, TypeScript, NextJS, Docker, Git, JavaScript","",
"WORK EXPERIENCE","Frontend Developer | Example Studio | 01/2021 - 12/2024",
"Built accessible interfaces with React.js and TypeScript. Delivered web applications with NextJS and Docker.","",
"EDUCATION","Example University","Bachelor of Computer Science","Graduated: 2020"]),
("03-junior-typos","vi",[
"Họ tên: Trần Gia Bình","Email: binh.demo@example.com","Điện thoại: 0903 456 789","",
"KY NANG","Java, Docker, SpringBott, PostgreSQlX, lam viec nhom","",
"KINH NGHIEM LAM VIEC","Backend Intern | Công ty Demo XYZ | 06/2025 - 11/2025",
"Xây dựng chức năng quản lý bằng Java và Docker trong thời gian thực tập.","",
"HOC VAN","Đại học Demo","Cử nhân","Chuyên ngành: Công nghệ thông tin","Tốt nghiệp: 2025"]),
("04-missing-contact","vi",[
"KỸ NĂNG","Java, SpringBoot, Postgres","",
"KINH NGHIỆM LÀM VIỆC","Backend Developer | 01/2020 - 12/2024",
"Phát triển REST API và xử lý dữ liệu bằng Java. Có kinh nghiệm xây dựng ứng dụng quản lý.","",
"HỌC VẤN","Đại học Demo","Kỹ sư","Chuyên ngành: Công nghệ thông tin","Tốt nghiệp: 2019"])
]
headings={"KỸ NĂNG","KINH NGHIỆM LÀM VIỆC","HỌC VẤN","SKILLS","WORK EXPERIENCE","EDUCATION","KY NANG","KINH NGHIEM LAM VIEC","HOC VAN"}
manifest=[]
for index,(name,language,lines) in enumerate(cases,1):
    text="\n".join(lines)
    (root/f"{name}.txt").write_text(text+"\n",encoding="utf-8")
    request={"cvId":index,"languageHint":language,"rawText":text,"skillDictionary":dictionary}
    (root/f"{name}-extract.json").write_text(json.dumps(request,ensure_ascii=False,indent=2),encoding="utf-8")
    story=[]
    for line_index,line in enumerate(lines):
        if not line:
            story.append(Spacer(1,5))
            continue
        style=heading if line in headings else (title if line_index==0 and name!="04-missing-contact" else body)
        story.append(Paragraph(escape(line),style))
    path=pdfdir/f"demo-cv-{name}.pdf"
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=40,bottomMargin=40).build(story)
    document=pdfium.PdfDocument(str(path))
    assert len(document)==1
    document[0].render(scale=1.3).to_pil().save(qa/f"{name}.png")
    extracted="\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    assert len(extracted)>70
    assert ("KỸ NĂNG" in extracted) or ("SKILLS" in extracted) or ("KY NANG" in extracted)
    manifest.append({"name":name,"pdf":str(path),"request":str(root/f"{name}-extract.json")})
# Bản scan chỉ chứa ảnh, dùng để kiểm tra PARSED_FAILED và giữ file gốc.
scan=pdfdir/"demo-cv-05-scan-only.pdf"
c=canvas.Canvas(str(scan),pagesize=A4)
c.drawImage(str(qa/"01-backend-strong.png"),0,0,width=A4[0],height=A4[1])
c.save()
assert not (PdfReader(scan).pages[0].extract_text() or "").strip()
doc=pdfium.PdfDocument(str(scan))
doc[0].render(scale=1).to_pil().save(qa/"05-scan-only.png")
jobs=[
("jd-java",{"title":"Demo Java Backend","description":"Phát triển REST API bằng Java và Spring Boot, lưu trữ PostgreSQL, triển khai Docker.","minExperienceYears":2,"educationRequirements":""},
 [("Java",3,True),("Spring Boot",3,True),("PostgreSQL",2,False),("Docker",2,False)]),
("jd-frontend",{"title":"Demo React Frontend","description":"Phát triển giao diện bằng React, TypeScript, Next.js và Docker.","minExperienceYears":1,"educationRequirements":""},
 [("React",3,True),("TypeScript",3,True),("Next.js",2,False),("Docker",2,False)])
]
for name,job,required in jobs:
    job["requiredSkillIds"]=[ids[skill] for skill,weight,mandatory in required]
    (root/f"{name}-create.json").write_text(json.dumps(job,ensure_ascii=False,indent=2),encoding="utf-8")
    (root/f"{name}-skills.json").write_text(json.dumps([{"skillId":ids[s],"mandatory":m,"weight":w} for s,w,m in required],indent=2),encoding="utf-8")
(root/"scoring-skill-only.json").write_text(json.dumps({"skillWeight":1.0,"cosineWeight":0.0,"educationWeight":0.0},indent=2),encoding="utf-8")
(root/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
print("Created 5 PDFs, 4 text/JSON CVs and 2 JD sets")

