# Dịch vụ phân tích CV cho ATS

Bộ thử biến thể nằm trong `examples/variants`. Các file 01–10 là body JSON cho
POST /nlp/extract. `expected.json` chứa kết quả kỳ vọng và `results.json` lưu kết
quả lần chạy với mô hình đầy đủ. Hai file này dùng để đối chiếu, không gửi làm body.
Các ID trong bộ thử đều là ID minh họa.

Hoa/thường, alias viết liền có sẵn và khoảng trắng dư được nhận diện. Các trường
hợp không dấu hoặc viết liền chưa có alias cố ý kỳ vọng không có skill. File 10
thêm hai alias để minh họa cách kết quả thay đổi. File 08 cho thấy Java vẫn được
tìm trong toàn bộ text dù tiêu đề viết liền `kynang` chưa được tách thành mục
kỹ năng. Tất cả ca đạt kỳ vọng không có nghĩa là mọi biến thể đều được nhận diện.

FastAPI nhận văn bản CV do PDFBox trích xuất và trả thông tin liên hệ, kỹ năng đã
chuẩn hóa, kinh nghiệm, học vấn, token và thực thể NER. Spring Boot lưu kết quả vào
PostgreSQL và dùng dữ liệu này để lọc cứng, chấm điểm và xếp hạng.

## Chạy demo trên Windows

Mở PowerShell tại thư mục này. Môi trường `.venv` hiện đã được tạo và cài thư viện
trên máy phát triển. Chạy lệnh sau để khởi động chế độ đầy đủ.

```powershell
cd D:\CDTH\ATS-project\nlpservice
$env:PYTHONIOENCODING = "utf-8"
$env:NLP_MODE = "full"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Chờ thông báo `Application startup complete`. Lần đầu nạp mô hình có thể mất thời
gian. Mở [Swagger UI](http://127.0.0.1:8000/docs) hoặc gọi
[health](http://127.0.0.1:8000/health). Health phải trả `mode: full`,
`englishModel: en_core_web_sm` và `vietnameseModel: underthesea`.

Mở một PowerShell khác và gửi mẫu tiếng Việt.

```powershell
cd D:\CDTH\ATS-project\nlpservice
$body = Get-Content -Raw -Encoding utf8 .\examples\extract-vi.json
$result = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/nlp/extract" -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
$result.person
$result.skills | Format-Table skillId, raw, canonical, matchMethod
$result.experiences | Format-Table companyName, jobTitle, startDate, endDate, isCurrent
$result.educations | Format-List
$result.unknownSkills | ConvertTo-Json -Depth 6
```

Kết quả cần đối chiếu gồm tên Nguyễn Văn An, email an@example.com, số điện thoại
0901234567, các kỹ năng Java, Spring Boot, PostgreSQL, hai công việc và học vấn
Kỹ sư ngành Công nghệ thông tin. `PostgreSQlX` được đưa vào danh sách kỹ năng chưa
xác định kèm gợi ý PostgreSQL. Fuzzy matching tạo gợi ý để kiểm tra và bổ sung alias.
Các gợi ý không được thêm tự động vào danh sách kỹ năng đã xác nhận.

Đổi đường dẫn body sang `examples\extract-en.json` để demo tiếng Anh. Kết quả
cần có Jane Doe, Example Ltd, thời gian 01/2022–12/2024 và bằng Bachelor.
Trong Swagger, mở POST /nlp/extract, nhấn Try it out và dán nội dung JSON của một
trong hai file mẫu rồi Execute.

## Cài lại môi trường

Dùng Python 3.12 trên máy mới, rồi thực hiện các lệnh sau.

```powershell
cd D:\CDTH\ATS-project\nlpservice
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m spacy download en_core_web_sm
```

Mô hình tiếng Việt được underthesea nạp khi service khởi động. Chế độ mặc định
là `full`, ứng dụng sẽ báo lỗi startup nếu thiếu mô hình. Để thử API bằng quy tắc
khi chưa cài mô hình tiếng Anh, đặt `$env:NLP_MODE = "rules"` trước khi chạy
uvicorn. Health và trường `warnings` sẽ thông báo NER bị tắt trong chế độ này.

## Hợp đồng với Spring Boot

Gọi `POST /nlp/extract` với `Content-Type: application/json`. Dữ liệu đầu vào là
text UTF-8, tối đa 200.000 ký tự, với `languageHint` bằng `vi`, `en` hoặc `auto`.
`rawText` được chấp nhận như tên thay thế cho `text`, tương thích AnalyzeRequest
hiện tại của Java. Service nhận thêm `cvId` và `fileType`.

```json
{
  "cvId": 1,
  "rawText": "Name: Jane Doe\nSkills: Java, SpringBoot, Postgres",
  "languageHint": "en",
  "skillDictionary": [
    {"id": 101, "canonical": "Java", "aliases": []},
    {"id": 102, "canonical": "Spring Boot", "aliases": ["SpringBoot"]},
    {"id": 103, "canonical": "PostgreSQL", "aliases": ["Postgres"]}
  ]
}
```

Các ID 101–103 trong ví dụ chỉ dùng minh họa. Spring Boot phải đọc ID thật, tên
chuẩn, nhóm và alias từ PostgreSQL rồi gửi trong `skillDictionary`.
`skillId`/`canonicalName` cũng được chấp nhận thay cho `id`/`canonical`.
Từ điển rỗng được tôn trọng. Khi bỏ trường từ điển, service dùng
`data/skills.json`, bản sao bộ 70 kỹ năng của backend tại thời điểm tạo service.
Bản sao này chứa `key` và không chứa ID PostgreSQL. Trong trường hợp đó,
`skillId` đầu ra là null và có cảnh báo để tránh ghi nhầm quan hệ vào DB.

Các trường trả về phục vụ tích hợp như sau.

| Trường | Nội dung |
|---|---|
| person | name, email, phone, links |
| candidateName, email, phone | Các trường tương thích AnalyzeResponse của Java |
| skills | skillId, key, raw, canonical, category, matchMethod, confidence, start, end |
| experiences | companyName, jobTitle, startDate, endDate, độ chính xác ngày, isCurrent, description, sourceText |
| educations | institution, degree, field, graduationYear, sourceText |
| experienceText | Toàn bộ mục kinh nghiệm để Java tính điểm tương đồng |
| rawTokens, entities | Kết quả tokenizer và NER |
| unknownSkills | Mục lạ trong phần kỹ năng, kèm gợi ý fuzzy |
| normalizedText | Văn bản sau chuẩn hóa, dùng làm hệ tọa độ của start/end trong skills |
| warnings, modelVersion | Cảnh báo và phiên bản pipeline |
| rawNlpResult | Chuỗi JSON để Java lưu lại, không chứa bản sao đệ quy của chính nó |

Java hiện có AnalyzeRequest/AnalyzeResponse sơ bộ. Cần bổ sung DTO cụ thể để đọc
`experienceText`, độ chính xác ngày và cảnh báo khi tích hợp. Trong phạm vi service
này, lời gọi HTTP và luồng lưu dữ liệu ở Java vẫn là bước triển khai tiếp theo.

Backend chạy trên máy host gọi `http://127.0.0.1:8000/nlp/extract`.
Nếu cả hai chạy trong cùng mạng Docker Compose, dùng
`http://nlpservice:8000/nlp/extract`. Chạy NLP trong mạng nội bộ khi triển khai.
Spring Boot điều phối các CV bằng tác vụ nền, áp dụng timeout và cập nhật trạng
thái khi HTTP trả lỗi. Python không ghi PostgreSQL.

## Cách trích xuất và giới hạn

spaCy dùng mô hình en_core_web_sm cho tiếng Anh. underthesea tách từ và nhận diện
thực thể tiếng Việt. Quy tắc bổ sung nhận diện email, điện thoại, tên có nhãn,
các mục CV, khoảng thời gian và bằng cấp. Bộ so khớp kỹ năng dò tên chuẩn/alias
trực tiếp trên text, tôn trọng ranh giới từ và ưu tiên cụm dài hơn.

Kinh nghiệm được tách theo khoảng thời gian trong mục Experience/Kinh nghiệm.
Mẫu vai trò và công ty được hỗ trợ tốt nhất có dạng
`Backend Developer | Công ty ABC | 01/2022 - 12/2024`, hoặc vai trò/công ty
ở tối đa hai dòng ngay trước dòng ngày. Bản hiện tại nhận MM/YYYY và YYYY.
Ngày tháng được biểu diễn bằng ngày đầu tháng, năm đơn lẻ dùng 01/01 kèm
`startDatePrecision/endDatePrecision`. Java cần giữ thông tin độ chính xác này
khi tính số năm. Các khoảng công việc trùng nhau được giữ nguyên để Java hợp nhất.
Thời gian hiện tại có endDate null và isCurrent true. Ngày đảo ngược được để null.

Mỗi khối học vấn được ngăn bằng một dòng trống. Năm tốt nghiệp chỉ được ghi khi
có nhãn như Graduated hoặc Tốt nghiệp. Trường không xác định được để null và giữ
sourceText để HR đối chiếu. Confidence 1.0 biểu thị khớp từ điển, không chứng minh
ứng viên thành thạo kỹ năng đó. Việc nhận diện một kỹ năng trong text cần được
đối chiếu thêm với ngữ cảnh khi dùng để ra quyết định tuyển dụng.

Text bị đảo thứ tự từ CV nhiều cột, CV thiếu tiêu đề mục, tên mơ hồ, phủ định kỹ
năng và các định dạng ngày khác cần dữ liệu thực để cải thiện. NER có thể bỏ sót
hoặc gán nhãn sai. PDF scan và PDF có mật khẩu được Spring Boot xử lý ở bước PDFBox.
Mục tiêu 5–10 giây/CV trong report cần đo lại trên bộ PDF và máy chạy đồ án.

## Docker và kiểm thử

```powershell
docker compose up --build -d
docker compose logs -f nlpservice
```

Compose này ánh xạ cổng 8000 vào loopback của máy để demo. Dockerfile tải mô hình
trong lúc build. Khi ghép với backend, đưa service vào cùng mạng nội bộ.

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Các kiểm thử API dùng chế độ rules để kiểm tra hợp đồng dữ liệu độc lập với mô
hình. Kiểm tra chế độ full bằng các file ví dụ như phần demo, đồng thời kiểm tra
health để xác nhận hai mô hình đã nạp.

Tham khảo cách tải mô hình tại [spaCy Models](https://spacy.io/usage/models)
và các hàm tokenization/NER tại
[underthesea](https://underthesea.readthedocs.io/en/latest/readme.html).
