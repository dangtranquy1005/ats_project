> Cập nhật: CV được tự chấm sau khi phân tích; sửa tiêu chí JD sẽ tự chấm lại. Xếp hạng tự cập nhật mỗi 5 giây. Nút Chấm lại ngay chỉ là tùy chọn, các bước bấm chấm trong hướng dẫn cũ không còn bắt buộc. JD cần có ít nhất một kỹ năng và trọng số hợp lệ.
# Frontend ATS

## Chạy giao diện

```powershell
cd D:\CDTH\ATS-project\frontend
npm.cmd install
npm.cmd run dev
```

Mở http://localhost:3000. Vite proxy `/api` đến backend Docker tại `http://127.0.0.1:8082`.
Nếu chạy Java trực tiếp trên 8081, sao chép `.env.example` thành `.env.local`, đổi
`ATS_BACKEND_URL=http://127.0.0.1:8081` rồi khởi động lại Vite. Frontend dùng cùng origin
qua proxy nên không cần mở CORS. Khi deploy bản build, reverse proxy phải chuyển `/api`
đến backend hoặc cấu hình `VITE_API_BASE_URL` lúc build và CORS tương ứng ở server.

## Mốc 1 đã kết nối API

- Đăng ký, đăng nhập, đăng xuất và khôi phục phiên qua `GET /api/v1/user/me`.
- Chọn ghi nhớ: localStorage; bỏ chọn: sessionStorage. Token sai/hết hạn trả về đăng nhập.
- Danh sách, tạo, sửa, đóng/mở, xóa JD theo tài khoản; DB rỗng hiển thị rỗng.
- Chọn kỹ năng thật theo ID; lưu mandatory và weight cùng JD trong một transaction.
- Trọng số ba thành phần theo từng JD; tổng bằng 1. Lưu cấu hình yêu cầu chấm lại CV.
- API lỗi hiển thị lỗi; không dùng tài khoản demo hoặc JD mẫu để báo thành công.

## Kiểm tra thủ công

1. Khởi động PostgreSQL, MinIO và backend; đăng ký tài khoản mới rồi đăng nhập.
2. Tạo JD với kinh nghiệm 0 năm, học vấn để trống; chọn Java trọng số 2, bắt buộc,
   Docker trọng số 0.5, ưu tiên. Lưu và tải lại trình duyệt: JD và tiêu chí phải giữ nguyên.
3. Sửa mô tả/kỹ năng; đổi trọng số 0.6/0.3/0.1; tải lại và kiểm tra theo đúng JD.
4. Đóng/mở JD rồi tải lại; tạo JD thứ hai và kiểm tra trọng số riêng biệt.
5. Xóa JD (có hoặc chưa có CV): JD chuyển CLOSED, ẩn khỏi danh sách và bộ chọn kể cả sau reload; CV và kết quả chấm vẫn còn trong DB.
6. Đăng xuất, thử sai mật khẩu/email trùng; không được báo thành công. Đăng nhập tài khoản
   khác không nhìn thấy JD tài khoản trước. Token sai/hết hạn phải quay lại đăng nhập.
7. Dừng backend: hiển thị lỗi kết nối, không sinh JD giả. Chạy lại backend và bấm thử lại.

`npm.cmd run build` và `npm.cmd run lint` để kiểm tra frontend.

Đánh giá CV và quản trị từ điển đã được nối API thật ở các mốc bên dưới.

## Mốc 2: tiếp nhận và xử lý CV

- Danh sách CV thật theo JD, phân trang/lọc ở server; đọc lại từ PostgreSQL sau reload.
- Chọn/kéo thả tối đa 50 PDF/lượt, 10 MB/file; mỗi file một POST để tránh giới hạn tổng request.
- `202 + success` chỉ là đã tiếp nhận; chỉ `PARSED` mới được coi là NLP phân tích xong.
- Poll mỗi 3 giây khi còn PENDING/PARSING, dừng khi đã kết thúc. Tab ẩn tạm dừng polling;
  quay lại cửa sổ sẽ tải lại. Lỗi kết nối được báo và thử đọc lại sau 10 giây.
- Retry chỉ cho PARSED_FAILED; backend tự quyết định chạy lại PDF hay chỉ NLP.
- Xem kết quả NLP đã lưu, tải PDF gốc có JWT, xóa CV thật và dọn MinIO qua ticket bền vững.
- CV đang PARSING chưa được xóa. JD đóng không nhận thêm file.
- Lỗi mạng khi POST không tự gửi lại vì server có thể đã lưu; tải lại danh sách trước khi gửi lại.
- Hàng báo nhận/từ chối file chỉ thuộc lượt gửi hiện tại; file đã lưu luôn xem được từ danh sách DB.

### Test mốc 2

1. Chọn JD OPEN, tải 2 PDF hợp lệ và thử kéo thả file .txt, PDF rỗng, PDF >10 MB.
2. Xem từng biên nhận; các file không hợp lệ phải bị từ chối, không hiện là CV đã lưu.
3. Theo dõi trạng thái đến PARSED; mở Chi tiết NLP và tải PDF gốc.
4. Reload, chuyển JD và đăng xuất/đăng nhập: danh sách phải đúng JD và đúng tài khoản.
5. PDF hỏng hoặc PDF scan phải PARSED_FAILED kèm lý do; thử lại sẽ chạy pipeline thật.
6. NLP tắt: chờ lỗi/retry của backend; bật lại rồi bấm Thử lại. Không báo thành công giả.
7. Xóa một CV đã xong/lỗi; tải lại phải mất khỏi DB và số CV giảm. Khi MinIO lỗi,
   ticket dọn file vẫn còn để worker thử lại. CV PARSING bị chặn xóa.
8. Chọn bộ lọc, thử phân trang; đổi JD không được thấy CV của JD trước.

API thêm: `GET /api/v1/cvs?jobId=...&page=0&size=10&status=PARSED`,
`GET /api/v1/cvs/{id}`, `GET /api/v1/cvs/{id}/file`, `DELETE /api/v1/cvs/{id}`.
Mọi API đều kiểm tra tài khoản sở hữu. Chấm điểm/xếp hạng là mốc 3.

## Mốc 3: chấm điểm, xếp hạng và giải thích kết quả

- Chọn JD → Chấm điểm & Xếp hạng → Chấm / Chấm lại toàn bộ JD.
- Backend chỉ chấm PARSED/SCORED/REVIEWED. PENDING/PARSING/PARSED_FAILED được bỏ qua và báo số lượng.
- Bảng đọc điểm DB, không dùng ứng viên mẫu hoặc tự tính điểm trong JavaScript.
- Điểm API 0..1; UI 0..100. Lọc theo khoảng điểm tổng, tên/email/ID, qua/không qua lọc cứng;
  sắp theo tổng/kỹ năng/cosine/học vấn, tăng/giảm, phân trang ở server.
- CV qua lọc cứng luôn được ưu tiên trước nhóm không qua lọc. Thứ tự hiển thị là thứ tự
  trong tập đã lọc, không phải hạng toàn JD khi đang dùng bộ lọc.
- Tổng quan cho biết CV chưa chấm, điểm cũ, đang phân tích và lỗi NLP. Điểm cũ bị ẩn khỏi bảng
  sau khi sửa JD/kỹ năng/trọng số; bấm chấm lại để cập nhật.
- Giải thích điểm đọc snapshot DB: điểm thành phần, trọng số lúc chấm, kỹ năng đạt/thiếu,
  trọng số từng kỹ năng và căn cứ lọc cứng. Kết quả cũ thiếu snapshot chi tiết được ghi rõ.
- Chi tiết cho phép xem thông tin trích xuất và tải PDF thật. Đánh giá tuyển dụng được nối ở mốc 4 bên dưới.
- Không tự gửi lại POST chấm điểm khi mất mạng. Tải lại bảng để xác nhận kết quả trước khi chấm lại.

### Kiểm tra mốc 3

1. Upload PDF hợp lệ đến PARSED. Trước chấm phải thấy số CV chưa chấm, chưa có hàng điểm giả.
2. Bấm chấm JD; kiểm tra số chấm/bỏ qua, điểm thành phần, mở Giải thích điểm.
3. Dùng JD Java=3, Spring Boot=3, Docker=2; CV có Java + Spring Boot: coverage=6/8=75%.
4. CV thiếu kỹ năng bắt buộc vẫn có điểm nhưng báo Không đạt và đứng sau nhóm qua lọc.
5. Thử lọc 80..100; API phải nhận 0.8..1. Thử khoảng đảo ngược phải báo lỗi trước khi gọi API.
6. Đổi trọng số hoặc kỹ năng JD; bảng phải báo điểm cũ và không hiển thị điểm đó. Chấm lại rồi reload.
7. Chuyển JD/tài khoản: không thấy kết quả từ JD/tài khoản trước. Thử phân trang với >10 CV.
8. PDF hỏng không được chấm. Backend lỗi không được báo đã chấm thành công.

API: POST `/api/v1/jobs/{id}/rescore`, GET `/api/v1/jobs/{id}/ranking`,
GET `/api/v1/jobs/{id}/scoring-status`, GET `/api/v1/cvs/{id}/match`.
Ranking thêm `query` và `passedHardFilter`; mỗi trang tối đa 100 CV.
Kiểm tra chuyển đổi thang điểm: `node --test src/services/scoringPresentation.test.js`.

## Xóa JD bằng cách đóng trạng thái

- `DELETE /api/v1/jobs/{id}` chuyển JD sang `CLOSED`, trả 204, không xóa bản ghi hay dữ liệu CV.
- Lặp lại DELETE an toàn; vẫn kiểm tra quyền sở hữu JD.
- Giao diện chỉ hiển thị JD `OPEN`, bao gồm danh sách, bộ chọn JD và thống kê.
- Xóa JD đang chọn sẽ quay về màn JD và chọn một JD OPEN khác nếu còn.
- Thao tác đóng JD cũng cần xác nhận vì JD sẽ bị ẩn.
- API danh sách/chi tiết vẫn giữ dữ liệu CLOSED để đối chiếu. Có thể mở lại qua PATCH status OPEN;
  sau khi tải lại danh sách giao diện, JD sẽ xuất hiện lại.

## Mốc 4: xem hồ sơ và đánh giá tuyển dụng

- Mở **Xem & đánh giá** từ danh sách CV hoặc **Xem hồ sơ** từ xếp hạng.
- PDF thật được tải qua API có xác thực và hiển thị bằng PDF.js trong trang, có chuyển trang, phóng to/thu nhỏ và tải PDF gốc. Thư viện và worker được đóng gói cùng ứng dụng, không gửi CV sang dịch vụ bên ngoài.
- Chọn **Chưa đánh giá / Phù hợp / Chưa phù hợp**, nhập ghi chú tối đa 5.000 ký tự và bấm **Lưu đánh giá**.
- Quyết định tuyển dụng lưu riêng với trạng thái đọc CV và điểm. Chấm lại không xóa ghi chú hoặc lựa chọn đã lưu.
- CV chưa phân tích xong chỉ cho lưu ghi chú; CV đã phân tích có thể đánh giá dù chưa chấm điểm.
- Rời trang, đổi vị trí, đăng xuất hoặc đóng tab khi có thay đổi chưa lưu sẽ được nhắc.
- Lưu cùng hồ sơ từ hai cửa sổ dùng phiên bản đánh giá để tránh ghi đè. Khi báo xung đột, nội dung đang gõ vẫn được giữ; **Tải bản mới** yêu cầu xác nhận bỏ thay đổi.
- Xếp hạng có nhãn và bộ lọc đánh giá tuyển dụng; danh sách CV cũng hiển thị nhãn.

Backend cần chạy migration `ats/src/main/resources/db/manual/add-hr-review.sql` trước khi dùng bản này.
API: GET/PUT `/api/v1/cvs/{id}/review`; ranking nhận thêm `reviewStatus=PENDING|SHORTLISTED|REJECTED`.

### Kiểm tra mốc 4

1. Mở một CV PARSED chưa chấm: PDF và ghi chú vẫn dùng được, phần điểm báo chưa có kết quả.
2. Chọn Phù hợp, nhập ghi chú tiếng Việt, lưu; quay lại danh sách rồi mở lại: lựa chọn và ghi chú còn nguyên.
3. Chấm lại JD, mở lại hồ sơ và kiểm tra đánh giá không đổi. Lọc Phù hợp trong bảng xếp hạng.
4. Sửa ghi chú nhưng chưa lưu, chuyển màn hình/đổi JD/đăng xuất: chọn Hủy phải giữ nội dung đang gõ.
5. Mở cùng CV ở hai cửa sổ, sửa cả hai; lưu cửa sổ A rồi B: B phải báo có đánh giá mới, không ghi đè A.
6. Mất mạng lúc lưu không được báo thành công; tải bản mới để xác nhận trước khi gửi lại.
7. CV đang xử lý không chọn được Phù hợp/Chưa phù hợp. JD đã đóng chỉ đọc đánh giá; tài khoản khác không xem/sửa được.

## Hoàn tất mốc 4 và mốc 5

- Từ điển tải tên, nhóm, alias kèm ID và trạng thái đang sử dụng từ PostgreSQL; không có dữ liệu mẫu hoặc lưu thành công khi API lỗi.
- ADMIN quản lý kỹ năng, nhóm và cách viết khác; nhà tuyển dụng tra cứu. Xóa kỹ năng/nhóm đang dùng bị chặn và giải thích rõ.
- Cần bổ sung đọc các mục chưa xác định từ kết quả NLP đã lưu, đếm theo CV. Quản trị viên tự chọn kỹ năng đích; không gán tự động vào Java/Spring Boot.
- Khi đã thêm tên/alias vào từ điển, mục tương ứng không còn chờ bổ sung. NLP lấy từ điển cập nhật ở lần phân tích tiếp theo.
- Xuất CSV toàn bộ kết quả của bộ lọc đã áp dụng, theo thang 100; file được tạo từ backend sau khi kiểm tra chủ sở hữu.
- Màn tài khoản và kiểm tra kết nối dùng dữ liệu thật, không hứa tự làm mới JWT hay giữ bản nháp sau khi hết phiên.
- Dockerfile build frontend và Nginx proxy `/api` đến backend, không cần cấu hình CORS cho giao diện demo.
- Hướng dẫn trọn bộ và kịch bản happy/unhappy: `../ats/DEMO.md`. Stack đầy đủ: `../ats/compose.demo.yaml`, giao diện mặc định http://localhost:8090.


## Mức độ quan trọng của từng kỹ năng

Trong Chọn kỹ năng, người dùng chọn Bình thường, Quan trọng hoặc Rất quan trọng thay cho nhập trọng số. Ba mức tương ứng giá trị nội bộ 1, 2, 3; API và thuật toán chấm điểm giữ nguyên. Mặc định kỹ năng mới ở mức Bình thường. Bắt buộc có kỹ năng này là lựa chọn riêng.
Tên mức xuất hiện trong form JD, danh sách JD và phần giải thích điểm. Trọng số tùy chỉnh của JD cũ được giữ đến khi người dùng chọn một mức mới, không tự đổi khi mở form.
