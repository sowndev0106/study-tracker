# 📋 TÀI LIỆU YÊU CẦU DỰ ÁN (REQUIREMENTS.MD)
## Dự án: Study Tracking Calendar & Weekly Targets

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1. Bối cảnh & Mục đích
Dự án **Study Tracking Calendar** là ứng dụng web cá nhân giúp người dùng lên kế hoạch, ghi chép và theo dõi tiến độ học tập hàng ngày (Daily Tracking) thông qua giao diện lịch tương tác trực quan. Trọng tâm của ứng dụng là quản lý **mục tiêu học tập theo tuần (Weekly Targets)** — cả về **số buổi học** và **tổng thời lượng học (tiếng/tuần)** — đảm bảo tính kỷ luật và duy trì thói quen học tập đều đặn.

### 1.2. Mục tiêu trọng tâm hiện tại
1. **Theo dõi buổi học (Sessions/tuần):**
   - ☁️ **AWS Cloud:** 2 bữa / tuần
   - ⚡ **Golang:** 2 bữa / tuần
   - 🧩 **LeetCode:** 2 bữa / tuần
2. **Theo dõi tổng thời gian học (Hours/tuần):**
   - Đặt mục tiêu tổng số giờ học mỗi tuần (ví dụ: **6 - 10 tiếng/tuần**).
   - Tự động cộng dồn số phút từ từng buổi học và quy đổi ra giờ để so sánh với mục tiêu tuần.
3. **Chi tiết từng buổi học:**
   - Tracking chính xác số phút học trong từng buổi.
   - Ghi lại chủ đề và nội dung chi tiết hôm đó đã học/làm được gì (Takeaways, link tài liệu, bài tập).
4. **Hạ tầng & Triển khai:**
   - **Backend API:** Cloudflare Workers (CRUD RESTful API).
   - **Database:** Cloudflare R2 Object Storage (lưu trữ JSON records và snapshots).
   - **Hosting:** Cloudflare Workers Static Assets (Deploy toàn bộ Full-Stack chỉ với 1 lệnh).
   - **Xuất dữ liệu:** Export toàn bộ dữ liệu ra JSON (sao lưu) và CSV (mở bằng Excel/Google Sheets).

---

## 2. PHẠM VI & YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### FR1: Giao diện Lịch học tập tương tác (Calendar UI)
- **FR1.1 - Chế độ xem theo tháng:**
  - Hiển thị lưới lịch chuẩn từ Thứ Hai đến Chủ Nhật.
  - Phân biệt rõ các ngày trong tháng hiện tại và ngày của tháng trước/sau.
  - Đánh dấu nổi bật ngày hôm nay (Today Indicator).
  - Điều hướng: Tháng trước, Tháng sau, Nút quay lại "Hôm nay".
- **FR1.2 - Hiển thị hoạt động trong từng ngày:**
  - Mỗi ô ngày hiển thị danh sách các buổi học đã diễn ra.
  - Hiển thị badge màu phân loại môn học (AWS màu cam, Golang màu xanh dương, LeetCode màu vàng cam, môn khác màu riêng).
  - Hiển thị thời lượng học của từng buổi (ví dụ: `45m`, `60m`) và tổng thời lượng trong ngày.
- **FR1.3 - Tương tác trực tiếp:**
  - Rê chuột vào ngày sẽ hiển thị nút `+` để thêm nhanh buổi học.
  - Bấm vào ngày để mở Modal xem chi tiết tất cả buổi học của ngày đó.

---

### FR2: Quản lý & Theo dõi Mục tiêu theo tuần (Weekly Targets & Hours)
- **FR2.1 - Mục tiêu số buổi học theo môn (Sessions Target):**
  - Mặc định:
    - AWS Cloud: **2 buổi / tuần**
    - Golang: **2 buổi / tuần**
    - LeetCode: **2 buổi / tuần**
  - Hiển thị thanh tiến độ (Progress Bar) cho từng môn: `Số buổi đạt được / Số buổi mục tiêu` và phần trăm `%`.
  - Đánh dấu trạng thái **Đạt (Completed)** khi đạt đủ số buổi.
- **FR2.2 - Mục tiêu tổng thời lượng học trong tuần (Weekly Hours Target - Mới):**
  - Cho phép người dùng cấu hình **mục tiêu tổng số giờ học mỗi tuần** (ví dụ: `8 tiếng/tuần`).
  - Cho phép cấu hình mục tiêu giờ cho từng môn cụ thể (ví dụ: AWS tối thiểu 2h, Golang tối thiểu 2.5h...).
  - Thanh tiến độ hiển thị: `Thời gian thực tế đã học / Mục tiêu tuần (tiếng)` kèm thanh phần trăm thời lượng.
  - Phân tích cảnh báo: Đã đạt bao nhiêu giờ, còn thiếu bao nhiêu tiếng nữa để hoàn thành mục tiêu tuần.
- **FR2.3 - Điều hướng tuần (Week Navigator):**
  - Cho phép xem lại lịch sử mục tiêu của các tuần trước hoặc lên kế hoạch cho tuần sau.
  - Hiển thị rõ khoảng ngày của tuần (ví dụ: `Tuần 40: 28/09/2026 - 04/10/2026`).
- **FR2.4 - Hiệu ứng vinh danh (Gamification):**
  - Kích hoạt hiệu ứng pháo hoa (**Confetti**) khi đạt 100% mục tiêu tuần (cả về số buổi và số giờ).

---

### FR3: Ghi nhận & Quản lý Buổi học (Daily Session Management)
- **FR3.1 - Ghi nhận buổi học (Create Session):**
  - **Ngày học:** Mặc định là ngày được chọn hoặc ngày hiện tại.
  - **Môn học:** Lựa chọn AWS, Golang, LeetCode hoặc môn học tự tạo.
  - **Thời lượng học (phút):**
    - Hỗ trợ các nút chọn nhanh tiện lợi: `30m`, `45m`, `60m`, `90m`, `120m`, `+15m`.
    - Ô nhập số tùy ý (tính theo phút).
  - **Chủ đề hôm nay (Topic / Title):** Tiêu đề ngắn gọn về bài học.
  - **Nội dung chi tiết đã học (Notes):** Hỗ trợ nhiều dòng (multi-line) để ghi chú kiến thức, cú pháp mới, câu hỏi phỏng vấn, link GitHub/bài viết tham khảo.
  - **Trạng thái hoàn thành:** Checkbox đánh dấu đã hoàn thành buổi học.
- **FR3.2 - Chỉnh sửa & Xóa (Update & Delete):**
  - Chỉnh sửa lại thời lượng, chủ đề hoặc ghi chú của bất kỳ buổi học nào đã lưu.
  - Xóa buổi học (kèm xác nhận để tránh bấm nhầm).

---

### FR4: Thống kê & Báo cáo tổng hợp (Statistics & Overview)
- **FR4.1 - Thống kê tháng (Monthly Stats):**
  - Tổng số giờ học trong tháng.
  - Tổng số buổi học đã hoàn thành trong tháng.
  - Phân rã thời gian và số buổi theo từng môn (AWS, Golang, LeetCode).
- **FR4.2 - Tóm tắt nhanh:**
  - Tổng kết thời gian học trung bình mỗi buổi.

---

### FR5: Xuất & Khôi phục dữ liệu (Export & Backup)
- **FR5.1 - Xuất bảng tính CSV (Export CSV):**
  - Xuất toàn bộ dữ liệu buổi học thành file `.csv` có UTF-8 BOM, tương thích hoàn toàn với Microsoft Excel, Google Sheets.
  - Bao gồm các cột: `ID`, `Date`, `Subject`, `Subject Name`, `Duration (Minutes)`, `Title / Topic`, `Notes`, `Completed`, `Created At`.
- **FR5.2 - Sao lưu toàn bộ Database (Export JSON):**
  - Tải về tệp `.json` chứa cấu trúc đầy đủ: phiên bản, ngày xuất, danh sách mục tiêu tuần và danh sách tất cả các buổi học.
- **FR5.3 - Khôi phục dữ liệu (Import JSON):**
  - Cho phép người dùng tải lên file JSON backup để khôi phục hoặc chuyển đổi dữ liệu sang môi trường mới.
  - Tự động lưu bản snapshot trước khi ghi đè trên R2 để đảm bảo an toàn dữ liệu.

---

### FR6: Backend CRUD & Lưu trữ Cloudflare R2 (Storage & API)
- **FR6.1 - RESTful API trên Cloudflare Workers:**
  - `GET /api/health`: Kiểm tra kết nối Worker và R2 Bucket.
  - `GET /api/targets`: Lấy danh sách mục tiêu tuần và mục tiêu tổng số giờ.
  - `PUT /api/targets`: Cập nhật cấu hình mục tiêu tuần (số buổi & số giờ).
  - `GET /api/records`: Lấy danh sách các buổi học (hỗ trợ query theo `?month=`, `?date=`, `?subject=`).
  - `POST /api/records`: Tạo mới buổi học và ghi vào R2.
  - `PUT /api/records/:id`: Cập nhật buổi học theo ID.
  - `DELETE /api/records/:id`: Xóa buổi học theo ID.
  - `GET /api/export`: Tải trọn gói toàn bộ dữ liệu từ R2.
  - `POST /api/import`: Khôi phục toàn bộ dữ liệu vào R2.
- **FR6.2 - Cơ chế lưu trữ trên Cloudflare R2:**
  - `data/records.json`: Mảng chứa các bản ghi học tập `StudyRecord[]`.
  - `data/targets.json`: Danh sách cấu hình mục tiêu môn học và mục tiêu tổng giờ `WeeklyTargetConfig`.
  - `backups/`: Thư mục lưu các bản snapshot có gắn timestamp mỗi khi import.
- **FR6.3 - Chế độ Offline / Fallback (Zero Downtime):**
  - Khi chưa triển khai Worker hoặc chạy môi trường máy khách không có mạng, hệ thống tự động fallback lưu vào `localStorage`, đảm bảo người dùng không bị mất dữ liệu hay lỗi giao diện.

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| Tiêu chí | Chi tiết yêu cầu |
|---|---|
| **Hiệu năng (Performance)** | - Thời gian phản hồi API của Cloudflare Worker < 50ms nhờ mạng lưới Edge toàn cầu.<br>- Frontend tải lần đầu < 1s, bundle nhẹ, tối ưu hóa CSS và icon tree-shaking. |
| **Bảo mật & Toàn vẹn dữ liệu** | - Không chứa secret key hay thông tin nhạy cảm ở client.<br>- Cloudflare R2 lưu trữ bucket an toàn, hỗ trợ backup snapshot.<br>- Dữ liệu thuộc toàn quyền sở hữu của người dùng, không phụ thuộc bên thứ 3. |
| **Khả năng sử dụng (UX/UI)** | - Giao diện hiện đại, tối giản, màu sắc phân biệt rõ ràng cho từng môn học.<br>- Tương thích hoàn toàn trên Desktop, Tablet và Mobile.<br>- Các nút thao tác nhanh (preset thời gian, quick-add) giảm tối đa số lần nhấp chuột. |
| **Bảo trì & Mở rộng** | - Codebase viết hoàn toàn bằng TypeScript với strict typing.<br>- Frontend tách component rõ ràng theo chức năng.<br>- Dễ dàng thêm môn học mới hoặc chỉ số tracking mới. |
| **Triển khai (Deployment)** | - Fullstack gom chung trong một dự án, deploy bằng 1 lệnh duy nhất: `npm run deploy` (`wrangler deploy`). |

---

## 4. MÔ HÌNH DỮ LIỆU (DATA MODEL SPECIFICATION)

### 4.1. Bản ghi buổi học (`StudyRecord`)
```typescript
interface StudyRecord {
  id: string              // Định danh duy nhất (vd: "rec_1727781234_abc12")
  date: string            // Ngày học định dạng "YYYY-MM-DD"
  subject: string         // Mã môn: "aws" | "golang" | "leetcode" | "custom"
  subjectName: string     // Tên hiển thị: "AWS Cloud", "Golang", "LeetCode"
  durationMinutes: number // Thời lượng học (phút), vd: 45, 60, 90
  title: string           // Chủ đề học hôm nay
  notes: string           // Ghi chú chi tiết, takeaways, links
  completed: boolean      // Đã hoàn thành (tính vào mục tiêu tuần)
  createdAt: string       // ISO timestamp ngày tạo
  updatedAt: string       // ISO timestamp ngày cập nhật cuối
}
```

### 4.2. Cấu hình mục tiêu tuần (`WeeklyTargetConfig`)
```typescript
interface WeeklyTarget {
  id: string                  // Định danh mục tiêu (vd: "target-aws")
  subject: string             // Mã môn: "aws", "golang", "leetcode"
  name: string                // Tên hiển thị: "AWS Cloud"
  targetSessionsPerWeek: number // Số buổi cần đạt trong tuần (vd: 2)
  targetHoursPerWeek?: number   // [MỚI] Số giờ mục tiêu cho môn này trong tuần (vd: 2.0)
  minDurationMinutes?: number   // Thời lượng khuyến nghị mỗi buổi (vd: 45 phút)
  color: string               // Mã màu Hex (vd: "#FF9900")
  iconName?: 'cloud' | 'terminal' | 'code' | 'book'
}

interface WeeklyGoalSettings {
  totalHoursTarget: number    // [MỚI] Tổng mục tiêu số giờ học cho TOÀN BỘ các môn trong tuần (vd: 6.0 giờ)
  targets: WeeklyTarget[]     // Mục tiêu chi tiết từng môn
}
```

### 4.3. Dữ liệu Xuất / Sao lưu (`AppDataExport`)
```typescript
interface AppDataExport {
  version: string             // Phiên bản dữ liệu (vd: "1.0")
  exportedAt: string          // ISO timestamp thời điểm export
  settings?: WeeklyGoalSettings
  targets: WeeklyTarget[]
  records: StudyRecord[]
}
```

---

## 5. LỘ TRÌNH TRIỂN KHAI & CÁC BƯỚC TIẾP THEO

- [x] **Giai đoạn 1 (Đã hoàn thành):**
  - Khởi tạo thư mục dự án và cấu hình Full-Stack Cloudflare Worker + Vite React.
  - Xây dựng UI Calendar theo tháng, điều hướng ngày, hiển thị buổi học.
  - Xây dựng hệ thống mục tiêu tuần theo số buổi (AWS 2 bữa, Golang 2 bữa, LeetCode 2 bữa).
  - Tích hợp tracking thời lượng theo phút, chủ đề, ghi chú chi tiết.
  - Xây dựng tính năng Export CSV và Export/Import JSON.
  - Xây dựng Worker API và kết nối R2 Bucket `tracking-calendar-db`.
- [ ] **Giai đoạn 2 (Đang tiến hành theo yêu cầu mới):**
  - Bổ sung cấu hình **Mục tiêu tổng số giờ học mỗi tuần** (Total Weekly Hours Target) và mục tiêu số giờ cho từng môn.
  - Cập nhật UI `WeeklyGoalTracker`: hiển thị thanh tiến độ tổng số giờ học (ví dụ: `4.5h / 6.0h đạt 75%`).
  - Cập nhật `TargetConfigModal`: cho phép người dùng tùy chỉnh số giờ mục tiêu của tuần và từng môn.
  - Cập nhật Worker API & R2 để lưu trữ trường `targetHoursPerWeek` và `totalHoursTarget`.
