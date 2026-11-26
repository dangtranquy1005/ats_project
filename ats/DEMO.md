# Demo ATS bằng Docker

Các mốc đã nối thành luồng thật: đăng nhập → tạo JD → tải CV → đọc kết quả → chấm điểm → đánh giá tuyển dụng → quản lý từ điển → xuất CSV.

## Chạy trọn bộ

Cần Docker Desktop chạy Linux containers. Giữ ba thư mục `ats`, `frontend`, `nlpservice` cùng cấp.

```powershell
cd D:\CDTH\ATS-project\ats
# Lần đầu: sao chép file mẫu và thay ba mật khẩu/khóa bằng giá trị riêng.
Copy-Item .env.demo.example .env.demo
docker compose --env-file .env.demo -f compose.demo.yaml up --build -d
docker compose --env-file .env.demo -f compose.demo.yaml ps
```

Nếu `.env.demo` đã được tạo, giữ file đó; không ghi đè mật khẩu của database đã có volume.

- Giao diện: http://localhost:8090
- Swagger backend demo: http://localhost:8083/swagger-ui/index.html
- PostgreSQL, MinIO và NLP giao tiếp trong mạng Docker, không cần chạy PostgreSQL trên máy.
- Database `ats_demo` và volume `ats-demo_demo-db`, `ats-demo_demo-pdf` dành riêng cho bộ này. Backend hiện tại ở 8082 vẫn dùng cấu hình `.env.docker` riêng.
- Lần khởi động đầu có thể lâu vì tải image, thư viện và mô hình NLP. `ps` phải cho thấy NLP healthy và backend đã chạy. Nếu chưa vào được giao diện, xem `logs --tail 80 backend nlpservice`.
- Sau lần nạp từ điển đầu tiên, đổi `DEMO_SEED_ENABLED=false` trong `.env.demo`, rồi chạy `up -d --force-recreate backend`. Điều này giúp các thay đổi/xóa từ điển không bị bộ seed thêm lại khi restart.
- Dữ liệu giữ trong volume khi restart hoặc `down`. Không dùng `down -v` nếu muốn giữ dữ liệu.

## Cập nhật sau khi sửa mã nguồn

```powershell
docker compose --env-file .env.demo -f compose.demo.yaml up --build --force-recreate -d
```

Frontend Docker phục vụ bản build, cần build lại để lấy thay đổi JSX. Khi phát triển trực tiếp, dùng `npm.cmd run dev` trong frontend.

## Tài khoản quản trị từ điển

Đăng ký qua giao diện tạo tài khoản nhà tuyển dụng. API công khai không cấp quyền quản trị theo trường `role` gửi lên.
Người vận hành có thể cấp quyền cho một tài khoản đã đăng ký trong **database demo**:

```powershell
docker compose --env-file .env.demo -f compose.demo.yaml exec db psql -U ats -d ats_demo
```

Trong psql, thay email bằng đúng tài khoản bạn muốn quản trị:

```sql
SELECT id, email, role FROM tbl_users WHERE email = 'email-quan-tri-cua-ban';
UPDATE tbl_users SET role = 1 WHERE email = 'email-quan-tri-cua-ban';
\q
```

`role=1` là ADMIN trong enum hiện tại; `role=0` là RECRUITER. Đăng xuất rồi đăng nhập lại để giao diện tải vai trò mới. Tài khoản nhà tuyển dụng được tra cứu từ điển; chỉ ADMIN thêm/sửa/xóa và xem mục cần bổ sung. Việc này chỉ áp dụng database demo, không tự đổi quyền tài khoản trong database trên máy.

## Kịch bản nghiệm thu

1. Đăng ký tài khoản A; tạo JD Java Backend, kinh nghiệm 0, học vấn không bắt buộc. Chọn Java mức ưu tiên 3, bắt buộc; Spring Boot mức 3, ưu tiên; Docker mức 2, ưu tiên. Chọn ưu tiên chấm điểm 100% kỹ năng để dễ đối chiếu.
2. Tải `output/pdf/demo-cv-01-backend-strong.pdf` và `demo-cv-03-junior-typos.pdf`. Theo dõi đến Đã phân tích, mở thông tin từ CV và đọc PDF gốc.
3. Bấm chấm điểm. Điểm kỹ năng bằng tổng mức ưu tiên kỹ năng có trong CV chia cho tổng mức ưu tiên của JD. Đối chiếu bảng kỹ năng và kết quả Swagger cùng JD.
4. Mở hồ sơ, chọn Phù hợp, lưu ghi chú. Tải lại trình duyệt, mở lại CV rồi chấm lại: ghi chú và lựa chọn vẫn còn. Lọc Phù hợp trong xếp hạng.
5. Xuất CSV: file chứa toàn bộ kết quả của **bộ lọc đã áp dụng**, kể cả các trang chưa mở. Điểm trong CSV theo thang 100, không chứa ghi chú tuyển dụng.
6. Dùng tài khoản ADMIN thêm nhóm, kỹ năng, cách viết khác; sửa rồi tải lại. Không được mất nhóm hoặc alias. Thêm trùng phải báo lỗi; xóa nhóm còn kỹ năng hoặc kỹ năng đang được CV/JD dùng phải bị chặn.
7. Mục Cần bổ sung lấy từ snapshot NLP đã lưu, đếm số CV khác nhau có mục đó. Chọn rõ kỹ năng đích để gắn cách viết, hoặc tạo kỹ năng mới. Mục đã có trong từ điển sẽ hết xuất hiện. Thay đổi từ điển áp dụng cho **lần phân tích CV tiếp theo**, không tự viết lại kết quả cũ.
8. Đăng ký tài khoản B: không xem JD/CV/PDF/review/CSV của A; sửa từ điển và xem Cần bổ sung bị từ chối. Gửi `role=ADMIN` khi đăng ký vẫn không có quyền ADMIN.
9. Sửa ghi chú chưa lưu rồi đổi trang: Hủy phải giữ bản nháp. Hai cửa sổ cùng sửa một CV: lần lưu phiên bản cũ phải báo xung đột.
10. Thử PDF scan `demo-cv-05-scan-only.pdf`, file rỗng, sai định dạng, quá 10MB: thông báo thật, không báo phân tích thành công. Retry dùng kết quả của pipeline thật.
11. Tạm dừng NLP bằng `stop nlpservice`, tải CV; quan sát chờ/lỗi; `start nlpservice`, thử lại khi hồ sơ báo lỗi. Không upload lại chỉ vì chưa xác nhận được request trước.
12. Xóa JD bằng hộp thoại xác nhận: vị trí bị ẩn; trạng thái là CLOSED, CV/PDF/đánh giá còn trong database. Khởi động lại stack: dữ liệu giữ nguyên.

## Kiểm tra tự động

```powershell
# Frontend
cd D:\CDTH\ATS-project\frontend
npm.cmd run build
npm.cmd run lint
node --test src/services/scoringPresentation.test.js

# Backend: kiểm thử DB dùng cấu hình PostgreSQL local của dự án, fixture tự dọn.
cd D:\CDTH\ATS-project\ats
$env:ATS_RUN_DB_TESTS='true'
mvn -o -Dtest=UnknownSkillQueryTests,RankingCsvTests,SkillManagementServiceTests,CvUploadIntegrationTests,MilestoneOneIntegrationTests,ScoringServiceImplTests test
```

Mục Cần bổ sung tổng hợp snapshot CV lúc đọc, phù hợp quy mô demo. Khi số CV lớn, nên chuyển sang bảng occurrence có chỉ mục và phân trang trực tiếp tại PostgreSQL.
