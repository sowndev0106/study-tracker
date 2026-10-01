# 📅 Study Tracker Calendar

Ứng dụng web theo dõi việc học hằng ngày (Daily Tracking Calendar) với mục tiêu theo tuần (Weekly Targets), lưu trữ trực tiếp trên **Cloudflare R2 Bucket** và backend chạy bằng **Cloudflare Worker API**.

---

## ✨ Tính năng nổi bật

1. **Giao diện Calendar trực quan:**
   - Xem theo tháng với đầy đủ các ngày trong tuần (T2 - CN).
   - Mỗi ngày hiển thị badge môn học (AWS, Golang, LeetCode...), số phút đã học, chủ đề vắn tắt.
   - Nhấp vào bất kỳ ngày nào để xem chi tiết, thêm mới hoặc chỉnh sửa/xóa buổi học.
   - Điều hướng tháng trước, tháng sau, nút quay về "Hôm nay".

2. **Mục tiêu theo tuần (Weekly Targets):**
   - Mặc định cài sẵn theo đúng yêu cầu:
     - ☁️ **AWS Cloud:** 2 bữa / tuần
     - ⚡ **Golang:** 2 bữa / tuần
     - 🧩 **LeetCode:** 2 bữa / tuần
   - Thanh tiến độ động (Progress Bar) hiển thị số buổi đã hoàn thành / mục tiêu, % tiến độ và tổng số phút đã học.
   - Hiệu ứng chúc mừng (Confetti) khi hoàn thành 100% mục tiêu tuần.
   - Cho phép tùy chỉnh mục tiêu: tăng/giảm số buổi, đổi màu sắc, thêm môn học mới qua modal cài đặt.

3. **Ghi nhận buổi học chi tiết:**
   - Chọn ngày học.
   - Chọn môn học (AWS, Golang, LeetCode...).
   - **Tracking thời lượng (phút):** Các nút chọn nhanh (30m, 45m, 60m, 90m, 120m, +15m) hoặc nhập tự do.
   - **Chủ đề hôm nay:** Ví dụ *“AWS S3 & CloudFront Cache”*, *“Goroutines & Channel Synchronization”*, *“LeetCode #15 3Sum”*.
   - **Chi tiết đã học (Notes):** Ghi chép chi tiết takeaways, cú pháp, bài tập đã làm, link tài liệu tham khảo.

4. **Xuất & Khôi phục dữ liệu (Export & Backup):**
   - **Export CSV:** Tải bảng dữ liệu dạng `.csv` có thể mở trực tiếp bằng Microsoft Excel hoặc Google Sheets.
   - **Export JSON:** Sao lưu toàn bộ Database (Records + Targets) về máy tính.
   - **Import JSON:** Khôi phục dữ liệu từ tệp sao lưu đưa ngược lên Cloudflare R2.

5. **Cloudflare Full-Stack Architecture:**
   - **Backend API:** Cloudflare Worker viết bằng TypeScript + Hono router siêu nhẹ và cực nhanh ở Edge.
   - **Database:** Lưu trữ JSON records và snapshots trên **Cloudflare R2 Object Storage**.
   - **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS, tự động bundle và triển khai cùng Worker thông qua Cloudflare Static Assets.
   - **Chế độ Offline / Fallback:** Tự động fallback lưu LocalStorage trên trình duyệt nếu chưa kết nối R2 hoặc chạy offline, không bao giờ bị mất dữ liệu.

---

## 📁 Cấu trúc thư mục

```text
tracking-calendar/
├── src/
│   ├── components/
│   │   ├── CalendarView.tsx        # UI Lịch tháng tương tác
│   │   ├── WeeklyGoalTracker.tsx   # Thanh theo dõi mục tiêu tuần (AWS, Golang, LeetCode)
│   │   ├── DayDetailModal.tsx      # Modal chi tiết các buổi học trong ngày
│   │   ├── SessionFormModal.tsx    # Modal form ghi nhận/chỉnh sửa buổi học
│   │   ├── TargetConfigModal.tsx   # Modal tùy chỉnh mục tiêu tuần
│   │   ├── ExportImportModal.tsx   # Modal xuất CSV/JSON và khôi phục dữ liệu
│   │   ├── StatsOverview.tsx       # Bảng tóm tắt thống kê theo tháng
│   │   └── Header.tsx              # Thanh điều hướng trên cùng & trạng thái R2
│   ├── services/
│   │   └── api.ts                  # Client gọi Worker API & LocalStorage Fallback
│   ├── utils/
│   │   └── helpers.ts              # Xử lý tính toán tuần, export CSV/JSON, confetti
│   ├── types.ts                    # Khai báo TypeScript types
│   ├── App.tsx                     # Component chính kết nối State & UI
│   ├── main.tsx                    # Entry point React
│   └── index.css                   # Tailwind styles
├── worker/
│   ├── index.ts                    # Cloudflare Worker API (Hono router)
│   └── r2.ts                       # Các hàm đọc/ghi/export vào Cloudflare R2
├── dist/                           # File build tĩnh (tự động tạo khi build)
├── wrangler.jsonc                  # Cấu hình Cloudflare Worker & R2 Binding
├── vite.config.ts                  # Cấu hình Vite & API Proxy
├── tailwind.config.js              # Cấu hình Tailwind CSS
├── tsconfig.json                   # Cấu hình TypeScript
└── package.json
```

---

## 🚀 Hướng dẫn chạy và phát triển (Local Development)

### 1. Cài đặt dependencies (đã cài sẵn trong folder):
```bash
npm install
```

### 2. Chạy ứng dụng ở môi trường Local:
Lệnh sau sẽ chạy đồng thời cả Frontend Vite (cổng `5173`) và Cloudflare Worker API mô phỏng R2 (cổng `8788`):
```bash
npm run dev
```
- Mở trình duyệt tại: **http://localhost:5173**
- Khi chạy local, Wrangler sẽ tự động tạo một preview R2 storage giả lập trên máy tính của bạn (`tracking-calendar-db-preview`).

---

## ☁️ Hướng dẫn Deploy lên Cloudflare

### Bước 1: Đăng nhập Cloudflare bằng Wrangler (nếu chưa đăng nhập)
```bash
npx wrangler login
```

### Bước 2: Tạo R2 Bucket trên Cloudflare
Chạy lệnh tạo bucket tên `tracking-calendar-db`:
```bash
npx wrangler r2 bucket create tracking-calendar-db
```
*(Nếu muốn tạo thêm bucket cho preview test local):*
```bash
npx wrangler r2 bucket create tracking-calendar-db-preview
```

### Bước 3: Deploy lên Cloudflare chỉ với 1 lệnh
```bash
npm run deploy
```
Lệnh này sẽ:
1. Build toàn bộ giao diện React sang thư mục `./dist`.
2. Đẩy cả static frontend và Worker API lên Cloudflare Edge Network.
3. Liên kết với Cloudflare R2 Bucket `tracking-calendar-db`.

Sau khi hoàn tất, terminal sẽ cung cấp URL public của bạn, ví dụ:
`https://tracking-calendar.<your-subdomain>.workers.dev`

---

## 🔌 Danh sách API Endpoints của Worker

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái server & R2 binding |
| `GET` | `/api/targets` | Lấy danh sách mục tiêu tuần |
| `PUT` | `/api/targets` | Cập nhật mục tiêu tuần |
| `GET` | `/api/records` | Lấy danh sách buổi học (hỗ trợ filter `?month=YYYY-MM`, `?date=YYYY-MM-DD`, `?subject=...`) |
| `POST` | `/api/records` | Tạo buổi học mới (lưu vào R2) |
| `PUT` | `/api/records/:id` | Cập nhật buổi học theo ID |
| `DELETE` | `/api/records/:id` | Xóa buổi học theo ID |
| `GET` | `/api/export` | Xuất toàn bộ Database (R2 snapshot) |
| `POST` | `/api/import` | Khôi phục toàn bộ Database vào R2 |
