FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Chạy lệnh build của Vite để tạo ra thư mục /dist
RUN npm run build

# --- Giai đoạn 2: Chạy với Nginx ---
FROM nginx:alpine

# Xóa trang web mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Lấy thư mục /dist ở giai đoạn 1 bỏ vào Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Cấu hình Nginx để React Router không bị lỗi 404 khi F5
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]