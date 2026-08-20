# Internal Ops Hub Frontend

Frontend của **Internal Ops Hub**, ứng dụng web nội bộ hỗ trợ Operation Team trong việc quản lý ca trực, bàn giao sự cố và lưu trữ kiến thức vận hành.

Ứng dụng được xây dựng theo mô hình **Single Page Application (SPA)**, sử dụng React và Vite, kết nối với Backend thông qua REST API.

## Tính năng chính

* **Quản lý ca trực và bàn giao:** theo dõi sự cố, công việc và trạng thái xử lý giữa các ca trực.
* **Quản lý công việc:** hỗ trợ giao và theo dõi task theo vai trò của người dùng.
* **Kho tài liệu:** lưu trữ và tra cứu tài liệu nghiệp vụ dưới dạng Markdown, hỗ trợ hình ảnh.
* **Đào tạo và hỏi đáp:** quản lý bộ câu hỏi, đáp án và kiến thức phục vụ đào tạo nội bộ.
* **Xác thực người dùng:** đăng nhập bằng tài khoản Microsoft thông qua Microsoft Entra ID và phân quyền theo vai trò.

## Công nghệ sử dụng

* React
* Vite
* React Router
* Axios
* Microsoft MSAL
* React Markdown
* Docker
* Nginx

## Kiến trúc tổng quan

```text
User
  ↓
Microsoft Entra ID
  ↓
React Frontend
  ↓
REST API
  ↓
FastAPI Backend
  ↓
MongoDB
```

## Cấu trúc project

```text
ops-frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── Dockerfile
├── .env.example
├── package.json
└── vite.config.js
```

## Cấu hình môi trường

Tạo file `.env` dựa trên `.env.example` và cấu hình các thông tin cần thiết cho:

* Microsoft Entra ID
* Dịch vụ lưu trữ hình ảnh

Không commit các thông tin nhạy cảm vào Git.

## Chạy project

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

```bash
copy .env.example .env
```

Sau đó cập nhật các giá trị cần thiết trong `.env`.

### 3. Chạy môi trường development

```bash
npm run dev
```

Ứng dụng mặc định chạy tại:

```text
http://localhost:5173
```

## Build production

```bash
npm run build
```

Thư mục `dist/` chứa kết quả build production.

## Docker

Frontend được đóng gói thành Docker image và chạy dưới Nginx.

```bash
docker build -t ops-frontend .
docker run -p 80:80 ops-frontend
```

Ứng dụng có thể truy cập tại:

```text
http://localhost
```

## CI/CD

Frontend sử dụng **GitHub Actions** để tự động hóa quá trình build và triển khai.

Quy trình tổng quát:

```text
GitHub
   ↓
GitHub Actions
   ↓
Docker Image
   ↓
Azure Container Registry
   ↓
Azure App Service
```

Pipeline được kích hoạt khi mã nguồn được cập nhật lên nhánh `main`.

## Triển khai

Frontend hiện được triển khai trong môi trường Docker trên nền tảng Azure và kết nối với Backend thông qua REST API.

## Trạng thái

Các chức năng chính của frontend đã được hoàn thiện và triển khai thử nghiệm, bao gồm:

* Xác thực Microsoft
* Quản lý ca trực và bàn giao
* Quản lý công việc
* Kho tài liệu kiến thức
* Đào tạo và hỏi đáp
* Docker và CI/CD
