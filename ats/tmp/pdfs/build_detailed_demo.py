import csv, json, zipfile, math, re, unicodedata
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

ROOT=Path('output/pdf/ats-demo-detailed'); ROOT.mkdir(parents=True,exist_ok=True)
QA=Path('tmp/pdfs/detailed-qa'); QA.mkdir(parents=True,exist_ok=True)
for folder in ['cv','jd','text','api/backend-8082','api/docker-demo-8083','expected','nlp-requests']:
    (ROOT/folder).mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('ArialDemo','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialDemoBold','C:/Windows/Fonts/arialbd.ttf'))
BODY=ParagraphStyle('Body',fontName='ArialDemo',fontSize=10,leading=14,spaceAfter=5,textColor=colors.HexColor('#26364a'))
H=ParagraphStyle('Heading',parent=BODY,fontName='ArialDemoBold',fontSize=11,leading=15,spaceBefore=10,spaceAfter=5,textColor=colors.HexColor('#174d78'))
TITLE=ParagraphStyle('Title',parent=H,fontSize=21,leading=27,spaceBefore=0,spaceAfter=7)
SMALL=ParagraphStyle('Small',parent=BODY,fontSize=8,leading=11)
def para(text,style=BODY): return Paragraph(escape(str(text)).replace('\n','<br/>'),style)
def footer(c,doc):
    c.setFont('ArialDemo',7);c.setFillColor(colors.HexColor('#64748b'))
    c.drawString(42,24,'DỮ LIỆU GIẢ LẬP - Chỉ dùng cho demo và kiểm thử ATS')
    c.drawRightString(A4[0]-42,24,f'Trang {doc.page}')
def pdf(path,story):
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=36,bottomMargin=40,title=path.stem,author='ATS Demo Fixtures').build(story,onFirstPage=footer,onLaterPages=footer)
def section(title,lines):
    return [KeepTogether([para(title,H),para(lines[0])])]+[para(line) for line in lines[1:]] if lines else []
def cv(code,name,role,skills,years,case,summary,jobs,education,projects,extra=None,email=True):
    return dict(code=code,name=name,role=role,skills=skills,years=years,case=case,summary=summary,jobs=jobs,education=education,projects=projects,extra=extra or [],email=email)

CVS=[
cv('CV01','Nguyễn Minh An','Java Backend Developer',['Java','Spring Boot','PostgreSQL','Docker','Redis','Git','JUnit','REST API'],6.0,'Java đầy đủ yêu cầu',
 'Lập trình viên backend tập trung vào hệ thống quản lý đơn hàng và tích hợp dịch vụ. Mong muốn xây dựng sản phẩm ổn định, có kiểm thử và tài liệu bàn giao rõ ràng.',[
 ('Backend Developer | Công ty Giải pháp Sao Mai Demo | 01/2022 - 01/2026',[
 'Phát triển REST API bằng Java và Spring Boot cho nghiệp vụ đặt hàng, thanh toán và quản lý kho.',
 'Thiết kế bảng PostgreSQL, tối ưu truy vấn phân trang và bổ sung Redis cho dữ liệu tra cứu thường xuyên.',
 'Đóng gói ứng dụng bằng Docker; viết kiểm thử JUnit cho luồng tạo đơn, hủy đơn và hoàn tiền.',
 'Kết quả dự án giả lập: giảm thời gian phản hồi truy vấn danh sách từ 850 ms xuống 310 ms.']),
 ('Java Developer | Công ty Phần mềm Mộc Việt Demo | 01/2020 - 01/2022',[
 'Xây dựng cổng quản lý khách hàng bằng Java; thực hiện kiểm tra dữ liệu đầu vào và ghi nhật ký lỗi.',
 'Tham gia rà soát mã nguồn qua Git, xử lý lỗi được phát hiện trong kiểm thử nghiệm thu.'])],
 ['Đại học Công nghệ Minh Hòa Demo','Kỹ sư','Chuyên ngành: Công nghệ thông tin','Tốt nghiệp: 2019'],[
 'OrderHub Demo: phụ trách API đơn hàng, truy vấn báo cáo và bộ kiểm thử; nhóm 5 người, bàn giao theo từng đợt hai tuần.',
 'CacheLab Demo: xây dựng cơ chế lưu đệm Redis, theo dõi dữ liệu hết hạn và xử lý khi bộ nhớ đệm tạm ngừng.']),
cv('CV02','Trần Thu Hà','Java Backend Developer',['Java','Spring Boot','PostgreSQL','Git','REST API'],3.0,'Java thiếu hai kỹ năng ưu tiên',
 'Có kinh nghiệm xây dựng hệ thống quản lý nội bộ, chú trọng tính đúng của dữ liệu và giao tiếp với nhóm kiểm thử. Muốn phát triển sâu về backend nghiệp vụ.',[
 ('Backend Developer | Công ty Quản trị An Lạc Demo | 01/2023 - 01/2026',[
 'Xây dựng REST API bằng Java và Spring Boot cho nhân sự, chấm công và phê duyệt nghỉ phép.',
 'Thiết kế lược đồ PostgreSQL, kiểm soát giao dịch khi nhiều người cùng cập nhật đơn phê duyệt.',
 'Chuẩn hóa thông báo lỗi, kiểm tra quyền người dùng và bổ sung nhật ký thay đổi hồ sơ.',
 'Phối hợp rà soát qua Git; xử lý 24 lỗi nghiệp vụ trong đợt nghiệm thu giả lập.'])],
 ['Đại học Kinh tế Kỹ thuật Hướng Dương Demo','Cử nhân','Chuyên ngành: Công nghệ thông tin','Tốt nghiệp: 2022'],[
 'HR Portal Demo: phụ trách luồng xin nghỉ, phê duyệt nhiều cấp và thống kê ngày phép.',
 'Customer Desk Demo: xây dựng tìm kiếm khách hàng, phân trang và kiểm tra dữ liệu trùng.']),
cv('CV03','Lê Hoàng Nam','Java Application Developer',['Java','PostgreSQL','Docker','Redis','Git'],5.0,'Điểm kỹ năng khá nhưng thiếu Spring Boot bắt buộc',
 'Phát triển ứng dụng xử lý dữ liệu và các dịch vụ chạy nền. Có kinh nghiệm vận hành tác vụ theo lịch và xử lý dữ liệu lớn theo lô.',[
 ('Application Developer | Công ty Dữ liệu Bình Minh Demo | 01/2021 - 01/2026',[
 'Viết chương trình Java đọc tệp giao dịch và đồng bộ dữ liệu vào PostgreSQL theo lô.',
 'Sử dụng Redis lưu trạng thái xử lý; chạy tác vụ bằng Docker để thống nhất môi trường.',
 'Thiết kế cơ chế ghi nhận lỗi từng bản ghi, chạy lại phần thất bại và đối soát kết quả cuối ngày.',
 'Quản lý phiên bản qua Git; bổ sung hướng dẫn khôi phục khi tác vụ bị ngắt giữa chừng.'])],
 ['Đại học Kỹ thuật Đông Hà Demo','Cử nhân','Chuyên ngành: Khoa học máy tính','Tốt nghiệp: 2020'],[
 'BatchLedger Demo: xử lý 120.000 dòng dữ liệu giả lập mỗi lượt, có kiểm tra trùng và báo cáo sai lệch.',
 'Job Monitor Demo: thống kê tác vụ thành công, thất bại và thời gian chạy theo từng ngày.']),
cv('CV04','Vũ Khánh Linh','Junior Backend Developer',['Java','Spring Boot','PostgreSQL','Docker','Redis','Git'],0.5,'Đủ kỹ năng nhưng thiếu số năm kinh nghiệm',
 'Ứng viên mới tốt nghiệp, đã thực tập và hoàn thành đồ án dịch vụ đặt lịch. Có thể trình bày luồng xử lý, dữ liệu và các trường hợp lỗi của dự án cá nhân.',[
 ('Backend Intern | Công ty Ứng dụng Thanh Sơn Demo | 06/2025 - 12/2025',[
 'Thực hiện chức năng đặt lịch bằng Java và Spring Boot dưới sự hướng dẫn của thành viên chính thức.',
 'Lưu dữ liệu PostgreSQL, dùng Redis cho mã xác nhận và Docker cho môi trường phát triển.',
 'Sửa lỗi kiểm tra thời gian đặt lịch, viết tài liệu API và cập nhật mã nguồn qua Git.'])],
 ['Đại học Công nghệ Minh Hòa Demo','Cử nhân','Chuyên ngành: Công nghệ thông tin','Tốt nghiệp: 2025'],[
 'BookingLab Demo: đồ án nhóm 3 người, có đặt lịch, hủy lịch, thống kê và kiểm tra lịch bị trùng.',
 'Đã tự thực hiện bộ dữ liệu thử gồm lịch hợp lệ, lịch quá hạn và hai yêu cầu đặt cùng thời điểm.']),
cv('CV05','Pham Gia Huy','Backend Developer',['Java','Spring Boot','PostgreSQL','Docker','Redis','Git'],5.0,'Không dấu và tên kỹ năng biến thể',
 'Lap trinh vien backend co kinh nghiem xay dung dich vu quan ly ban hang. Uu tien ma nguon de doc, xu ly loi ro rang va ban giao co tai lieu.',[
 ('Backend Developer | Cong ty Giai phap Dong Xanh Demo | 01/2021 - 01/2026',[
 'Phat trien RESTful API bang JAVA va springboot cho quy trinh tao don, thanh toan va doi soat.',
 'Thiet ke bang postgres, su dung DOCKER de dong goi dich vu va Redis de luu dem ket qua tra cuu.',
 'Ra soat ma nguon qua Git, phoi hop kiem thu truong hop thieu du lieu va gui yeu cau lap lai.',
 'Ket qua du an gia lap: xu ly on dinh 300 yeu cau dong thoi trong kich ban tai noi bo.'])],
 ['Dai hoc Ky thuat Dong Ha Demo','Cu nhan','Chuyen nganh: Cong nghe thong tin','Tot nghiep: 2020'],[
 'SalesService Demo: phu trach luong tao don, kiem tra so luong va luu vet thay doi.',
 'Viet huong dan khoi dong dich vu, du lieu mau va cac buoc kiem tra sau khi cap nhat.']),
cv('CV06','Emily Carter','Frontend Engineer',['React','TypeScript','Next.js','Tailwind CSS','Git','JavaScript','HTML','CSS','Playwright'],5.0,'Frontend mạnh bằng tiếng Anh',
 'Frontend engineer building accessible dashboards and customer portals. Experienced in turning product requirements into reusable interfaces with clear loading and error states.',[
 ('Frontend Engineer | Northstar Product Studio Demo | 01/2023 - 01/2026',[
 'Built customer dashboards using React.js, TypeScript and NextJS with reusable components and typed data models.',
 'Implemented responsive layouts with TailwindCSS and reviewed changes through Git.',
 'Added Playwright checks for sign-in, form validation and table filtering; improved keyboard navigation.',
 'Synthetic project outcome: reduced the dashboard first-load bundle by 28 percent through route splitting.']),
 ('Frontend Developer | Harbor Digital Demo | 01/2021 - 01/2023',[
 'Maintained React interfaces, HTML and CSS; worked with designers to document component states.',
 'Delivered form validation, paginated tables and clear feedback when requests failed.'])],
 ['Maple Technology University Demo','Bachelor of Computer Science','Major: Computer Science','Graduated: 2020'],[
 'InsightBoard Demo: an analytics interface with date filters, accessible dialogs and downloadable reports.',
 'PortalKit Demo: a component library for buttons, form fields, empty states and loading skeletons.']),
cv('CV07','Đỗ Ngọc Mai','Frontend Developer',['React','JavaScript','HTML','CSS','Git'],2.0,'Frontend thiếu TypeScript bắt buộc',
 'Lập trình viên giao diện có kinh nghiệm xây dựng website giới thiệu dịch vụ và trang quản trị quy mô nhỏ. Mong muốn làm việc cùng nhóm thiết kế và cải thiện trải nghiệm người dùng.',[
 ('Frontend Developer | Công ty Thiết kế Cánh Buồm Demo | 01/2024 - 01/2026',[
 'Xây dựng giao diện ReactJS và JavaScript cho trang quản trị danh mục, bài viết và thông tin liên hệ.',
 'Viết HTML5, CSS3 đáp ứng màn hình điện thoại; kiểm tra biểu mẫu và trình bày thông báo lỗi dễ hiểu.',
 'Quản lý thay đổi qua Git; sửa lỗi bố cục và phối hợp nghiệm thu với nhóm nội dung.',
 'Hoàn thiện 16 màn hình giả lập, gồm trạng thái có dữ liệu, rỗng và không tải được dữ liệu.'])],
 ['Cao đẳng Công nghệ Hải An Demo','Cao đẳng','Chuyên ngành: Thiết kế và phát triển website','Tốt nghiệp: 2023'],[
 'ContentDesk Demo: trang quản trị danh mục, bài viết và hình ảnh, có tìm kiếm và phân trang.',
 'ServiceSite Demo: trang giới thiệu dịch vụ, biểu mẫu liên hệ và bố cục thích ứng điện thoại.']),
cv('CV08','Bùi Đức Phúc','Python Data Engineer',['Python','pandas','NumPy','SQL','Docker','Git','pytest'],4.0,'Python dữ liệu đầy đủ và có bằng cử nhân',
 'Kỹ sư dữ liệu tập trung làm sạch, kiểm tra và tổng hợp dữ liệu giao dịch. Quan tâm tính tái lập của pipeline và khả năng giải thích chất lượng đầu vào.',[
 ('Data Engineer | Công ty Phân tích Ánh Dương Demo | 01/2022 - 01/2026',[
 'Xây dựng pipeline Python sử dụng pandas và NumPy để chuẩn hóa dữ liệu bán hàng theo ngày.',
 'Viết SQL đối soát số liệu, kiểm tra dữ liệu trùng và tổng hợp chỉ số theo cửa hàng.',
 'Đóng gói pipeline bằng Docker; bổ sung pytest cho quy tắc làm sạch và phép tính tổng hợp.',
 'Kết quả giả lập: phát hiện 1.800 bản ghi trùng trong tập 500.000 bản ghi trước khi tạo báo cáo.'])],
 ['Đại học Khoa học Dữ liệu Nam Việt Demo','Cử nhân','Chuyên ngành: Computer Science','Tốt nghiệp: 2021'],[
 'DailySales Demo: pipeline theo lịch, kiểm tra chất lượng, tổng hợp báo cáo và ghi nhận lỗi từng bước.',
 'QualityCheck Demo: bộ quy tắc phát hiện giá trị trống, mã cửa hàng sai và giao dịch ngoài khoảng ngày.']),
cv('CV09','Hồ sơ đã ẩn thông tin liên hệ','Backend Developer',['Java','Spring Boot','PostgreSQL','Git'],3.0,'Thiếu liên hệ, kinh nghiệm trùng thời gian và kỹ năng lạ',
 'Hồ sơ chia sẻ cho vòng đánh giá chuyên môn, thông tin cá nhân đã được ẩn. Có kinh nghiệm làm ứng dụng backend và tham gia một dự án bán thời gian song song.',[
 ('Backend Developer | Công ty Dịch vụ Nam Phong Demo | 01/2022 - 01/2024',[
 'Phát triển Java và Spring Boot cho nghiệp vụ quản lý yêu cầu hỗ trợ khách hàng.',
 'Thiết kế PostgreSQL, phân trang danh sách và ghi nhận thay đổi trạng thái.']),
 ('Part-time Backend Developer | Nhóm Sản phẩm Sao Bắc Demo | 01/2023 - 01/2025',[
 'Tham gia bán thời gian vào một sản phẩm quản lý công việc, sử dụng Java, Spring Boot và Git.',
 'Hai công việc có khoảng thời gian làm song song; nhiệm vụ được bàn giao theo cuối tuần.'])],
 ['Cao đẳng Công nghệ Hải An Demo','Cao đẳng','Chuyên ngành: Công nghệ thông tin','Tốt nghiệp: 2021'],[
 'TaskSpace Demo: kiểm tra dữ liệu, tìm kiếm yêu cầu và xuất thống kê hoạt động.',
 'Đã thử nghiệm công cụ QzFlow trong một dự án nội bộ nhỏ; cần trao đổi thêm trước khi xác nhận kỹ năng này.'],email=False),
]
JOBS=[
dict(code='JD01',title='Java Backend Developer',minExperienceYears=2,educationRequirements='',humanEducation='Ưu tiên ngành công nghệ thông tin; chấp nhận năng lực tương đương qua dự án',location='Hà Nội - hybrid 3 ngày tại văn phòng',salary='25-35 triệu đồng/tháng, mức giả lập',
 skills=[('Java',3,True),('Spring Boot',3,True),('PostgreSQL',2,False),('Docker',1,False),('Redis',1,False)],
 description='Phát triển REST API bằng Java và Spring Boot cho hệ thống quản lý đơn hàng. Thiết kế PostgreSQL, tối ưu truy vấn và giao dịch. Đóng gói ứng dụng bằng Docker và sử dụng Redis cho dữ liệu tra cứu. Viết kiểm thử, xử lý lỗi nghiệp vụ và phối hợp rà soát mã nguồn.',
 duties=['Thiết kế API tạo đơn, cập nhật trạng thái, tra cứu và đối soát dữ liệu.','Kiểm tra quyền truy cập, kiểm soát giao dịch và xử lý yêu cầu được gửi lặp.','Viết kiểm thử cho luồng chính và luồng lỗi; bàn giao tài liệu chạy thử.'],
 outcomes=['Trong 30 ngày: hiểu mô hình dữ liệu và sửa một nhóm lỗi có kiểm thử.','Trong 60 ngày: bàn giao một luồng nghiệp vụ có tài liệu API.','Trong 90 ngày: tham gia tối ưu một truy vấn và theo dõi chất lượng vận hành.']),
dict(code='JD02',title='Frontend Engineer React TypeScript',minExperienceYears=1,educationRequirements='',humanEducation='Không bắt buộc bằng cấp nếu chứng minh được kinh nghiệm',location='Đà Nẵng - hybrid',salary='20-30 triệu đồng/tháng, mức giả lập',
 skills=[('React',3,True),('TypeScript',3,True),('Next.js',2,False),('Tailwind CSS',1,False),('Git',1,False)],
 description='Build responsive dashboards with React and TypeScript. Develop pages using Next.js and Tailwind CSS. Collaborate through Git, implement accessible components, form validation, loading states and clear error feedback. Work with designers and backend developers to deliver tested customer interfaces.',
 duties=['Phát triển giao diện từ thiết kế, tối ưu bố cục điện thoại và điều hướng bàn phím.','Tích hợp API, quản lý dữ liệu biểu mẫu và các trạng thái tải/lỗi/rỗng.','Rà soát mã nguồn, kiểm tra luồng đăng nhập và lọc danh sách trước bàn giao.'],
 outcomes=['Trong 30 ngày: nắm thư viện giao diện và hoàn thiện một biểu mẫu.','Trong 60 ngày: bàn giao một màn danh sách có lọc và phân trang.','Trong 90 ngày: cải thiện một chỉ số tải trang hoặc khả năng truy cập.']),
dict(code='JD03',title='Python Data Engineer',minExperienceYears=1,educationRequirements='Bachelor',humanEducation='Có bằng cử nhân; ưu tiên ngành khoa học máy tính hoặc công nghệ thông tin',location='TP Hồ Chí Minh - làm việc tại văn phòng',salary='22-32 triệu đồng/tháng, mức giả lập',
 skills=[('Python',3,True),('pandas',3,True),('NumPy',2,False),('SQL',1,False),('Docker',1,False)],
 description='Xây dựng pipeline Python sử dụng pandas và NumPy để làm sạch dữ liệu giao dịch. Viết SQL đối soát và tổng hợp báo cáo bán hàng. Đóng gói pipeline bằng Docker, kiểm tra dữ liệu trùng và giá trị trống, bổ sung kiểm thử và nhật ký cho từng bước xử lý.',
 duties=['Chuẩn hóa định dạng, phát hiện dữ liệu trùng, thiếu và giá trị ngoài khoảng.','Đối soát tổng số bản ghi và chỉ số tổng hợp giữa đầu vào và đầu ra.','Bổ sung kiểm thử và tài liệu để pipeline chạy lại được sau lỗi.'],
 outcomes=['Trong 30 ngày: hiểu nguồn dữ liệu và mô tả các quy tắc kiểm tra.','Trong 60 ngày: hoàn thiện một pipeline có báo cáo chất lượng.','Trong 90 ngày: tự vận hành, đối soát và xử lý một tình huống chạy lại.'])]

def jsonfile(path,data): path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
seed=json.loads(Path('src/main/resources/skills.json').read_text(encoding='utf-8-sig'))
dictionary=[dict(id=i,canonical=s['canonicalName'],aliases=s['aliases'],category=s['category']) for i,s in enumerate(seed,1)]
manifest=[]
for i,c in enumerate(CVS,1):
    noaccent=c['code']=='CV05'
    name=c['name']; header=[f"{'Ho ten' if noaccent else 'Name' if i==6 else 'Họ tên'}: {name}"] if c['email'] else ['Backend Developer']
    if c['email']: header += [f"Email: candidate{i:02}@ats-demo.example.invalid", f"{'Phone' if i==6 else 'Dien thoai' if noaccent else 'Điện thoại'}: 0900 000 {i:03}"]
    header += [c['role']]
    sections=[]
    skills_line=', '.join(c['skills'])
    if i==5: skills_line='JAVA, springboot, postgres, DOCKER, Redis, Git'
    if i==6: skills_line='React.js, TypeScript, NextJS, TailwindCSS, Git, JavaScript, HTML5, CSS3, Playwright'
    if i==7: skills_line='ReactJS, JavaScript, HTML5, CSS3, Git'
    if i==9: skills_line += ', QzFlow'
    titles=['SUMMARY','SKILLS','WORK EXPERIENCE','EDUCATION','PROJECTS'] if i==6 else ['GIOI THIEU','KY NANG','KINH NGHIEM LAM VIEC','HOC VAN','DU AN'] if noaccent else ['GIỚI THIỆU','KỸ NĂNG','KINH NGHIỆM LÀM VIỆC','HỌC VẤN','DỰ ÁN']
    sections=[(titles[0],[c['summary']]),(titles[1],[skills_line]),(titles[2],[line for heading,bullets in c['jobs'] for line in [heading,*bullets]]),(titles[3],c['education']),(titles[4],c['projects'])]
    story=[para(header[0],TITLE),*[para(h,SMALL) for h in header[1:]]]
    text='\n'.join(header)+'\n\n'
    for title,lines in sections:
        story+=section(title,lines);text+=title+'\n'+'\n'.join(lines)+'\n\n'
    path=ROOT/'cv'/f"{c['code']}.pdf";pdf(path,story)
    (ROOT/'text'/f"{c['code']}.txt").write_text(text,encoding='utf-8')
    extracted='\n'.join(p.extract_text() or '' for p in PdfReader(path).pages)
    assert len(extracted)>500
    jsonfile(ROOT/'nlp-requests'/f"{c['code']}.json",dict(cvId=i,rawText=extracted,languageHint='auto',skillDictionary=dictionary))
    manifest.append(dict(code=c['code'],name=c['name'],file=f"cv/{c['code']}.pdf",purpose=c['case'],pages=len(PdfReader(path).pages)))
    d=pdfium.PdfDocument(str(path))
    for n,page in enumerate(d): page.render(scale=1.15).to_pil().save(QA/f"{c['code']}-{n+1}.png")
    d.close()
# CV10 chứa ảnh của CV01, không có lớp văn bản hay OCR.
scan=ROOT/'cv'/'CV10.pdf';can=canvas.Canvas(str(scan),pagesize=A4)
can.drawImage(str(QA/'CV01-1.png'),0,0,width=A4[0],height=A4[1]);can.save()
assert not ''.join(p.extract_text() or '' for p in PdfReader(scan).pages).strip()
manifest.append(dict(code='CV10',name='Bản scan của CV01',file='cv/CV10.pdf',purpose='PDF ảnh không có OCR, mong đợi phân tích thất bại',pages=1))

for j in JOBS:
    story=[para(j['title'],TITLE),para('Công ty Sản phẩm Hướng Việt Demo',H),para(f"Địa điểm: {j['location']}"),para(f"Thu nhập tham khảo: {j['salary']}"),para('01 vị trí toàn thời gian. Mọi dữ liệu về doanh nghiệp và quyền lợi trong tài liệu này đều là giả lập.',SMALL)]
    story+=section('MÔ TẢ CÔNG VIỆC',[j['description']])+section('TRÁCH NHIỆM CHÍNH',j['duties'])
    story+=section('YÊU CẦU ỨNG VIÊN',[f"Kinh nghiệm tối thiểu: {j['minExperienceYears']} năm thực tế; thời gian làm song song không cộng hai lần.",j['humanEducation'],'Có thể trình bày phần việc đã trực tiếp thực hiện, lựa chọn kỹ thuật và cách xử lý lỗi.'])
    rows=[[para(x,SMALL) for x in ['Kỹ năng','Mức ưu tiên','Mức yêu cầu']]]+[[para(n,SMALL),str(w),para('Bắt buộc' if m else 'Ưu tiên',SMALL)] for n,w,m in j['skills']]
    table=Table(rows,colWidths=[270,90,110],repeatRows=1);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf1f8')),('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#d5dfe8')),('FONTNAME',(0,0),(-1,-1),'ArialDemo'),('FONTSIZE',(0,0),(-1,-1),9),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story+=[para('KỸ NĂNG VÀ MỨC ƯU TIÊN',H),table,para('Mức 3 ảnh hưởng gấp 3 lần mức 1 trong phần điểm kỹ năng. Thiếu kỹ năng bắt buộc vẫn có điểm nhưng chưa đáp ứng điều kiện tuyển dụng.',SMALL)]
    story+=section('KẾT QUẢ MONG ĐỢI',j['outcomes'])+section('QUY TRÌNH TRAO ĐỔI',['Sàng lọc hồ sơ, trao đổi kỹ thuật theo dự án đã làm và phỏng vấn nhóm tuyển dụng.','Không yêu cầu thông tin nhạy cảm hoặc dữ liệu khách hàng từ các dự án trước.'])
    pdf(ROOT/'jd'/f"{j['code']}.pdf",story)
    source={k:j[k] for k in ['code','title','description','minExperienceYears','educationRequirements']}
    source['requiredSkills']=[dict(canonicalName=n,weight=w,mandatory=m) for n,w,m in j['skills']]
    jsonfile(ROOT/'jd'/f"{j['code']}-source.json",source)
    for target,mapping_file in [('backend-8082','demo-local-skill-ids.json'),('docker-demo-8083','demo-docker-skill-ids.json')]:
        mapping={s['canonical_name']:s['skill_id'] for s in json.loads((Path('tmp/pdfs')/mapping_file).read_text(encoding='utf-8-sig'))}
        body={k:j[k] for k in ['title','description','minExperienceYears','educationRequirements']}
        body['requiredSkills']=[dict(skillId=mapping[n],mandatory=m,weight=w) for n,w,m in j['skills']]
        jsonfile(ROOT/'api'/target/f"{j['code']}-create.json",body)
jsonfile(ROOT/'api'/'scoring-skill-only.json',dict(jaccardWeight=1.0,cosineWeight=0.0,educationWeight=0.0))
jsonfile(ROOT/'api'/'scoring-balanced.json',dict(jaccardWeight=0.6,cosineWeight=0.3,educationWeight=0.1))
jsonfile(ROOT/'manifest.json',manifest)
jsonfile(ROOT/'expected'/'ground-truth.json',dict(candidates=[{k:c[k] for k in ['code','name','skills','years','case']} for c in CVS],jobs=JOBS))
print(json.dumps(dict(files=len(list(ROOT.rglob('*'))),cvPages=[(x['code'],x['pages']) for x in manifest]),ensure_ascii=True))
