import runpy,sys,csv,json,zipfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
from reportlab.platypus import Table,TableStyle,PageBreak,Spacer
from reportlab.lib import colors
from pypdf import PdfReader
import pypdfium2 as pdfium

ctx=runpy.run_path('tmp/pdfs/build_detailed_demo.py')
ROOT,QA,CVS,JOBS=[ctx[k] for k in ['ROOT','QA','CVS','JOBS']]
para,pdf,section,TITLE,H,BODY,SMALL=[ctx[k] for k in ['para','pdf','section','TITLE','H','BODY','SMALL']]
degrees=['Engineer','Bachelor','Bachelor','Bachelor','Bachelor','Bachelor','Associate','Bachelor','Associate']
rows=[]
for j in JOBS:
 for c,degree in zip(CVS,degrees):
  found=set(c['skills']); matched=[name for name,weight,mandatory in j['skills'] if name in found]
  missing=[name for name,weight,mandatory in j['skills'] if mandatory and name not in found]
  skill=sum(weight for name,weight,mandatory in j['skills'] if name in found)/sum(weight for name,weight,mandatory in j['skills'])
  reasons=[]
  if missing:reasons.append('Thiếu bắt buộc: '+', '.join(missing))
  if c['years']<j['minExperienceYears']:reasons.append('Chưa đủ số năm kinh nghiệm')
  if j['educationRequirements'] and {'Associate':1,'Bachelor':2,'Engineer':2,'Master':3,'Doctorate':4}.get(degree,0)<2:reasons.append('Chưa xác nhận đúng yêu cầu bằng cấp')
  rows.append(dict(job=j['code'],cv=c['code'],skillScore=round(skill,8),overallSkillOnly=round(skill*100,2),experienceYears=c['years'],passedHardFilter=not reasons,matched=matched,missingMandatory=missing,reasons=reasons,kind='expected_from_authored_content_not_live_nlp'))
for j in JOBS:rows.append(dict(job=j['code'],cv='CV10',skillScore=None,overallSkillOnly=None,experienceYears=None,passedHardFilter=None,reasons=['PDF ảnh không có văn bản; mong đợi PARSED_FAILED'],kind='expected_unparsed'))
(ROOT/'expected'/'expected-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
with (ROOT/'expected'/'expected-results.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(['JD','CV','Điểm kỹ năng /100','Năm kinh nghiệm','Qua yêu cầu bắt buộc','Lý do'])
 for row in rows:writer.writerow([row['job'],row['cv'],row['overallSkillOnly'],row['experienceYears'],'Chưa phân tích' if row['passedHardFilter'] is None else 'Đạt' if row['passedHardFilter'] else 'Chưa đạt','; '.join(row['reasons'])])

def table(data,widths):
 t=Table([[para(v,SMALL) for v in row] for row in data],colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf1f8')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d5dfe8')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));return t
story=[para('Bộ CV và JD demo ATS',TITLE),para('10 CV - 3 vị trí tuyển dụng - Dữ liệu giả lập',H),para('Bộ tài liệu phục vụ trình diễn luồng tải CV, trích xuất, chấm điểm, giải thích, đánh giá của nhà tuyển dụng và bổ sung từ điển. Không dùng bộ nhỏ này để công bố độ chính xác tổng quát của NLP.'),para('Các điểm dưới đây là đáp án kỳ vọng từ nội dung được soạn. Chưa chạy kiểm thử NLP trực tiếp vì quyền thực thi yêu cầu mạng đã bị từ chối. PDF đã được kiểm tra văn bản và bố cục cục bộ.',SMALL),para('Danh sách hồ sơ',H)]
story.append(table([['Mã','Ứng viên','Tình huống chính']]+[[c['code'],c['name'],c['case']] for c in CVS]+[['CV10','Bản scan CV01','PDF chỉ có ảnh, không có lớp văn bản']], [45,155,310]))
story+=section('Thư mục sử dụng',['cv/: 10 file PDF độc lập để tải vào hệ thống. Không tải JD vào ô upload CV.','jd/: 3 JD PDF và dữ liệu nguồn dùng tên kỹ năng. text/: nội dung gốc của 9 CV có văn bản.','api/: JSON tạo JD theo từng database và hai cấu hình ưu tiên chấm điểm.','expected/: đáp án chuẩn, ma trận điểm và các lý do chưa đáp ứng yêu cầu.','nlp-requests/: request kiểm tra riêng NLP; ID trong đây là ID fixture, không dùng để ghi vào backend.'])
story+=[PageBreak(),para('Tiêu chí và đáp án đối chiếu',TITLE)]
for j in JOBS:
 story+=[para(j['code']+' - '+j['title'],H),para(f"Tối thiểu {j['minExperienceYears']} năm. Học vấn: {j['educationRequirements'] or 'không lọc cứng'}."),para('; '.join(f"{n}={w}"+(' bắt buộc' if m else ' ưu tiên') for n,w,m in j['skills']),SMALL)]
story+=[para('Điểm kỳ vọng khi chỉ chấm kỹ năng',H),para('Áp dụng cấu hình 100% kỹ năng, 0% kinh nghiệm liên quan, 0% học vấn. Mỗi JD có tổng mức ưu tiên bằng 10. Yêu cầu bắt buộc và số năm kinh nghiệm vẫn được kiểm tra dù trọng số thành phần bằng 0.',SMALL)]
matrix=[['CV','JD01 Java','JD02 Frontend','JD03 Python']]
for c in CVS:
 matrix.append([c['code']]+[f"{next(r['overallSkillOnly'] for r in rows if r['job']==j['code'] and r['cv']==c['code']):g}" for j in JOBS])
matrix.append(['CV10','Không chấm','Không chấm','Không chấm'])
story.append(table(matrix,[60,150,150,150]))
story+=section('Cách giải thích kết quả',['JD01: CV01, CV02, CV05 và CV09 kỳ vọng qua yêu cầu bắt buộc. CV03 đạt 70 điểm nhưng thiếu Spring Boot. CV04 đạt 100 điểm nhưng mới có 0,5 năm kinh nghiệm.','JD02: CV06 kỳ vọng phù hợp đầy đủ. CV07 chỉ có React và Git, đạt 40 điểm và thiếu TypeScript bắt buộc.','JD03: CV08 kỳ vọng phù hợp đầy đủ. Yêu cầu Đại học chấp nhận Bachelor, Kỹ sư hoặc bằng cao hơn; Cao đẳng chưa đáp ứng.'])
story+=[PageBreak(),para('Kịch bản demo qua giao diện',TITLE)]
steps=[
('1. Chọn đúng môi trường','Frontend phát triển thường ở localhost:3000 và gọi backend 8082; chọn JSON trong api/backend-8082. Bộ Docker đầy đủ ở localhost:8090, backend 8083; chọn api/docker-demo-8083. Hai bộ này dùng database riêng, không dùng chéo ID kỹ năng.'),
('2. Tạo JD Java','Đăng nhập, tạo vị trí theo JD01.pdf. Chọn đúng năm kinh nghiệm và năm kỹ năng; đánh dấu Java và Spring Boot bắt buộc. Chọn ưu tiên 100% kỹ năng cho lượt đối chiếu đầu.'),
('3. Tải bộ hồ sơ Java','Tải CV01, CV02, CV03, CV04, CV05 và CV09. Chờ từng CV đến Đã phân tích. Mở thông tin trích xuất để đối chiếu tên, kỹ năng, thời gian làm việc và học vấn trước khi chấm.'),
('4. Chấm và giải thích','Chấm toàn bộ JD. CV04 có thể đạt 100 điểm nhưng vẫn chưa đáp ứng 2 năm kinh nghiệm; CV03 có điểm nhưng thiếu kỹ năng bắt buộc. Các CV qua lọc cứng được ưu tiên hiển thị trước. Thứ tự cùng điểm còn có thể phụ thuộc tiêu chí phụ, không cam kết hạng tuyệt đối khi bằng điểm.'),
('5. Thử tên gọi khác','Mở CV05: JAVA, springboot, postgres và DOCKER kỳ vọng được đưa về kỹ năng chuẩn. Không mặc định mọi cách viết liền hoặc lỗi chính tả đều được nhận diện nếu chưa có alias hoặc quy tắc hỗ trợ.'),
('6. Thử thời gian làm song song','CV09 có hai công việc, mỗi công việc 2 năm, nhưng trùng 1 năm. Kỳ vọng tổng là 3 năm, không phải 4 năm. Hồ sơ không có email/điện thoại vẫn cần lưu và xem được.'),
('7. Thử PDF scan','Tải CV10. Vì không có OCR trong pipeline hiện tại, kỳ vọng Phân tích thất bại và có thông báo; PDF gốc vẫn tải/xem được. Retry không tự biến ảnh thành văn bản.'),
('8. Đánh giá và xuất kết quả','Chọn Phù hợp hoặc Chưa phù hợp, nhập ghi chú rồi lưu. Tải lại, chấm lại và kiểm tra ghi chú còn nguyên. Lọc đánh giá và xuất toàn bộ kết quả lọc thành CSV.'),
('9. Chạy hai vị trí còn lại','Tạo JD02, tải CV06 và CV07. Tạo JD03, tải CV08. Có thể tải thêm CV01 vào JD03 để trình bày việc cùng một CV có điểm khác khi yêu cầu tuyển dụng thay đổi.'),
('10. Thử từ điển với ADMIN','Mở Cần bổ sung, tìm QzFlow từ CV09 nếu NLP tách được mục này. Tạo một kỹ năng mới tên QzFlow nếu thực sự coi đó là kỹ năng. Không tự gắn QzFlow vào Java vì không có căn cứ tương đương. Tải CV09 lần nữa để kiểm tra từ điển cập nhật.')]
for title,body in steps:story+=section(title,[body])
story+=[PageBreak(),para('Dùng JSON và ghi nhận kết quả',TITLE)]
story+=section('Tạo JD bằng Swagger',['Đăng nhập để lấy token, bấm Authorize và nhập Bearer token theo cấu hình Swagger hiện tại.','POST /api/v1/jobs: dán nội dung JD01-create.json, JD02-create.json hoặc JD03-create.json từ đúng thư mục database. Lưu jobId trong response.','PUT /api/v1/jobs/{jobId}/scoring-config: dùng api/scoring-skill-only.json cho lượt đối chiếu đầu. Cấu hình balanced dùng 60% kỹ năng, 30% kinh nghiệm liên quan, 10% học vấn.','POST /api/v1/cvs/upload: điền jobId và chọn PDF. Theo dõi GET /api/v1/cvs?jobId=... đến PARSED hoặc PARSED_FAILED.','POST /api/v1/jobs/{jobId}/rescore không cần JSON body. GET /api/v1/jobs/{jobId}/ranking cũng không cần JSON body; sử dụng tham số lọc.'])
story+=section('Đọc đúng bảng đáp án',['Công thức kỹ năng: tổng mức ưu tiên kỹ năng có trong CV / tổng mức ưu tiên của JD. Ví dụ CV02 có Java=3, Spring Boot=3 và PostgreSQL=2 nên JD01 được 8/10 = 80 điểm.','Điểm tổng ở chế độ balanced phụ thuộc phần kinh nghiệm NLP thực sự trích xuất; không suy ra điểm tổng bằng cách chỉ đếm tên kỹ năng. Bảng trong bộ này không gán sẵn điểm cosine chưa đo.','Có thêm kỹ năng ngoài JD không làm giảm độ bao phủ. Các ví dụ cố ý không dùng câu phủ định tên công nghệ để tránh nhầm giữa chỉ xuất hiện tên và thực sự có kỹ năng.'])
story+=section('Các điểm cần kiểm tra cẩn thận',['Ngày làm việc trong CV cố định theo tháng/năm, không dùng hiện tại, để đáp án không thay đổi theo ngày demo. NLP phải giữ độ chính xác tháng khi chuyển sang dữ liệu Java.','NLP mới hỗ trợ tên bằng cấp tiếng Việt không dấu. Với kết quả CV được phân tích trước khi cập nhật, cần phân tích lại để nhận quy tắc mới; chỉ chấm lại không chạy NLP.','JD dùng dropdown Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ và Không yêu cầu. Bachelor/Cử nhân/Kỹ sư ánh xạ về Đại học; bằng cao hơn đáp ứng yêu cầu thấp hơn. Giá trị Bachelor trong JSON cũ vẫn tương thích.','ID trong JSON đã được đọc từ hai database tại thời điểm tạo bộ tài liệu. Nếu thay database hoặc nạp lại từ điển, phải đọc GET /api/v1/skills và thay skillId theo đúng tên; không suy đoán ID từ số thứ tự trong file.','NLP có thể nhận thiếu hoặc sai dù văn bản được thiết kế rõ ràng. Khi kết quả khác đáp án, kiểm tra trích xuất trước rồi mới kiểm tra phần chấm điểm; không sửa đáp án chỉ để khớp đầu ra.'])
story+=section('Biên bản demo gợi ý',['Ghi cho mỗi CV: trạng thái xử lý; tên/email; kỹ năng chuẩn; khoảng kinh nghiệm; bằng cấp; điểm kỹ năng; lý do chưa đáp ứng; đánh giá của người tuyển dụng.','Dùng expected/expected-results.csv để đối chiếu 30 cặp CV-JD, gồm cả trường hợp PDF scan không chấm. expected/ground-truth.json lưu dữ liệu nhãn để mở rộng kiểm thử.','Tất cả tên ứng viên, công ty, trường, email, số điện thoại và kết quả dự án trong bộ này đều là giả lập. Không gửi tin nhắn đến các địa chỉ hoặc số liên hệ.'])
guide=ROOT/'HUONG-DAN-DEMO.pdf';pdf(guide,story)
reader=PdfReader(guide);print('Guide pages:',len(reader.pages))
d=pdfium.PdfDocument(str(guide))
for n,page in enumerate(d):page.render(scale=1.15).to_pil().save(QA/f'GUIDE-{n+1}.png')
d.close()
(ROOT/'README.txt').write_text('BỘ CV VÀ JD DEMO ATS\n\nBắt đầu bằng HUONG-DAN-DEMO.pdf.\n10 CV: thư mục cv. 3 JD: thư mục jd. JSON: api/backend-8082 hoặc api/docker-demo-8083.\nĐáp án là kỳ vọng từ nội dung soạn, chưa được NLP trực tiếp xác nhận.\nKhông dùng dữ liệu này làm thông tin cá nhân thật.\n',encoding='utf-8-sig')
jsonfile=ctx['jsonfile'];jsonfile(ROOT/'verification.json',dict(pdfLayout='rendered for local visual review',cvTextCount=9,imageOnlyCv='CV10',liveNlpTest='not run: network execution permission declined',scoreExpectations='authored ground truth; not observed runtime output',jobJsonIds='read-only snapshots of backend 8082 and Docker demo 8083 dictionaries'))
imgs=sorted(QA.glob('GUIDE-*.png'));sheet=Image.new('RGB',(len(imgs)*310,450),'#dfe5ed');draw=ImageDraw.Draw(sheet)
for i,f in enumerate(imgs):sheet.paste(ImageOps.contain(Image.open(f),(300,421)),(i*310,22));draw.text((i*310+4,3),f.stem,fill='black')
sheet.save(QA/'guide-contact.png')
archive=ROOT.parent/'ats-demo-detailed.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in ROOT.rglob('*'):
  if p.is_file():z.write(p,Path(ROOT.name)/p.relative_to(ROOT))
print('Bundle:',archive,archive.stat().st_size)
