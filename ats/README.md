# ats-project
## Chạy Spring Boot bằng Docker

Cấu hình này chạy backend ở cổng 8082. PostgreSQL và MinIO dùng địa chỉ
host.docker.internal, NLP dùng service nlpservice trên mạng nlpservice_default.

1. Khởi động PostgreSQL và MinIO.
2. Trong thư mục nlpservice, chạy docker compose up -d để tạo service và mạng NLP.
3. Chuẩn bị .env.docker từ .env.docker.example và điền thông tin đăng nhập.
   Trên máy phát triển hiện tại, file này đã được tạo từ application.yml.
   .env.docker được gitignore. Dockerfile nhận cấu hình qua biến môi trường.
4. Trong thư mục ats, chạy các lệnh sau.

```powershell
docker compose --env-file .env.docker -f compose.app.yaml up --build -d
docker compose --env-file .env.docker -f compose.app.yaml logs -f backend
```

Mở Swagger tại http://127.0.0.1:8082/swagger-ui/index.html.
Đổi ATS_HTTP_PORT trong .env.docker nếu muốn dùng cổng host khác.
SERVER_PORT là cổng bên trong container, được đặt là 8081.

Sau khi sửa mã Java, chạy lại lệnh up --build -d.
Để dừng backend, chạy lệnh sau.

```powershell
docker compose --env-file .env.docker -f compose.app.yaml stop backend
```

Database và kho PDF tiếp tục do PostgreSQL/MinIO hiện có quản lý.
Trên máy khác, kiểm tra địa chỉ datasource, MinIO và tên mạng NLP trong .env.docker.

## Mốc 4 — đánh giá tuyển dụng

Chạy `src/main/resources/db/manual/add-hr-review.sql` trên database ứng dụng trước khi khởi động bản mới.
Migration chỉ bổ sung trường, giá trị mặc định và ràng buộc; có thể chạy lại.

`GET /api/v1/cvs/{id}/review` trả đánh giá, ghi chú, thời gian quyết định, phiên bản và quyền sửa.
`PUT /api/v1/cvs/{id}/review` nhận:

```json
{"reviewStatus":"SHORTLISTED","note":"Cần trao đổi thêm về thời gian nhận việc.","expectedVersion":0}
```

`PENDING`: chưa đánh giá; `SHORTLISTED`: phù hợp; `REJECTED`: chưa phù hợp.
Lấy `version` từ GET/lần lưu thành công gần nhất làm `expectedVersion` cho lần sau.
Lưu thành công tăng phiên bản; gửi lại đúng nội dung không làm tăng phiên bản.
Phiên bản cũ trả 409 để tránh ghi đè. Ghi chú tối đa 5.000 đơn vị UTF-16 (cùng cách đếm của JavaScript/Java).
Chỉ chủ sở hữu được đọc/sửa; CV chưa phân tích xong chỉ lưu ghi chú với PENDING; JD đã đóng chỉ đọc.
Đánh giá HR không sửa CVStatus hoặc điểm và được giữ khi chấm lại.
Ranking nhận `reviewStatus` để lọc trước khi phân trang. Danh sách CV và ranking trả nhãn đánh giá.

Kiểm thử PostgreSQL/HTTP tạo rồi dọn fixture riêng: `ATS_RUN_DB_TESTS=true`,
`mvn -o -Dtest=CvUploadIntegrationTests test`.

## Các mốc còn lại: từ điển và triển khai

Đã nối quản lý kỹ năng/nhóm/alias bằng dữ liệu thật, phân quyền ADMIN cho thao tác ghi,
trang kỹ năng chưa xác định lấy từ snapshot NLP, CSV toàn bộ kết quả lọc và thông báo lỗi API.
Nhà tuyển dụng tra cứu từ điển; API công khai không cấp ADMIN khi đăng ký.
Tài khoản LOCKED không đăng nhập hoặc tiếp tục dùng JWT cũ được.

API mới: POST/PUT/DELETE `/api/v1/skill-categories[/{id}]`,
GET `/api/v1/unknown-skills?page=0&size=25&search=...`,
GET `/api/v1/jobs/{id}/ranking/export` dùng cùng bộ lọc với ranking.

Xem `DEMO.md` cho cách chạy cả frontend–backend–NLP–PostgreSQL–MinIO bằng
`compose.demo.yaml`, cấp quyền quản trị, cập nhật Docker và kịch bản nghiệm thu.
Bộ demo mặc định dùng database/volume riêng, giao diện cổng 8090 và API cổng 8083.

## Học vấn theo trình độ tối thiểu

Dropdown JD: Không yêu cầu (`NONE`), Cao đẳng (`COLLEGE`), Đại học (`UNIVERSITY`),
Thạc sĩ (`MASTER`), Tiến sĩ (`DOCTORATE`). API giữ tên trường `educationRequirements`;
không cần đổi schema database. Các giá trị cũ như Đại học/Bachelor vẫn được ánh xạ.
Yêu cầu văn bản cũ chưa xác định được cấp học vẫn được giữ, không tự xóa khi sửa JD.

Spring Boot ánh xạ Bachelor/BSc/BEng/Cử nhân/Kỹ sư về Đại học; Associate/Cao đẳng về Cao đẳng;
Master/MSc/MBA/Thạc sĩ về Thạc sĩ; PhD/Doctorate/Tiến sĩ về Tiến sĩ.
Trình độ cao hơn đáp ứng yêu cầu thấp hơn. Chỉ xét bằng cấp, không suy từ tên trường/chuyên ngành.
Nếu bằng cấp hoặc đoạn nguồn ghi đang học/dự kiến tốt nghiệp, chưa coi là đã đạt cấp học đó.
Không yêu cầu luôn đạt dù CV thiếu học vấn. Yêu cầu có học vấn nhưng CV chưa xác định được thì không đạt.
NLP giữ bằng cấp chuẩn và nguồn gốc; quy tắc nhận dạng hỗ trợ cả tiếng Việt không dấu.

Phiên bản điểm mới `weighted-coverage-v2-education-level` buộc chấm lại kết quả cũ.
Ghi chú và quyết định HR vẫn được giữ khi chấm lại. Những bằng bị NLP bỏ sót ở lần phân tích cũ
cần phân tích/upload lại để nhận được quy tắc NLP mới; chỉ chấm lại không chạy lại NLP.
