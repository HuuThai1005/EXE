# Mekong Story Box

MVP full-stack cho một Cultural Experience Platform: mỗi Story Box là một chuyến về miền Tây, được mở khóa bằng QR và tiếp nối bằng Digital Passport.

## Đã có trong MVP

- Frontend React + TypeScript + Vite, responsive mobile-first
- Homepage, Story Box, Mekong Journal, QR Journey, Digital Passport, Cart, Checkout và Admin overview
- Đăng ký, đăng nhập, khôi phục phiên bằng JWT và đăng xuất
- Passport khởi tạo rỗng; mỗi mã QR là token ngẫu nhiên dùng một lần (ACTIVE → USED, hoặc REVOKED khi admin thu hồi): người quét đầu tiên được cộng điểm, mọi lượt quét lại đều bị từ chối
- Scanner QR dùng camera thật qua `html5-qrcode`; QR có thể chứa URL `/experience/qr/{token}` hoặc token trực tiếp
- Backend Spring Boot 3 / Java 21 với REST health endpoint, stateless security, BCrypt, CORS, OpenAPI dependency và Flyway
- Microsoft SQL Server schema cho users, roles, products, locations, stories, passports và QR tokens
- Axios instance có interceptor cho JWT và xử lý 401

## Chạy frontend

Yêu cầu Node.js 20+ và npm:

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. API URL có thể đổi trong `.env` dựa trên `.env.example`.

## Chạy PostgreSQL

Tạo file `.env` từ `.env.example` và bổ sung `DB_PASSWORD`. Hoặc chạy:

```bash
docker compose up -d postgres
```

PostgreSQL dùng cổng `5432`. Database mặc định là `mekong_story_box`.

## Chạy backend bằng Maven và JDK 21

Backend yêu cầu JDK 21 và Maven 3.9+. POM đã khóa compiler release 21 và Maven Enforcer sẽ dừng build nếu dùng JDK khác:

```bash
cd backend
mvn spring-boot:run
```

Hoặc build/run bằng Docker, không cần Maven cài trên máy:

```bash
docker compose up --build backend
```

Flyway chạy migration khi ứng dụng khởi động. `spring.jpa.hibernate.ddl-auto` được đặt là `validate`, không dùng Hibernate để tự tạo schema.

- Health: `GET http://localhost:8080/api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Passport: `GET /api/passport` (authenticated)
- QR: `POST /api/qr/verify` (authenticated; khóa dòng token khi quét nên mỗi mã chỉ được dùng đúng một lần, kể cả khi quét đồng thời)
- Admin: `GET /api/admin/overview`, `POST /api/admin/products`, `POST /api/admin/stories` (ADMIN role)
- Admin QR: `POST /api/admin/qr-tokens` với `{ productId, quantity }` (1–200) phát hành một lô mã ngẫu nhiên cho sản phẩm, `POST /api/admin/qr-tokens/{id}/revoke` thu hồi mã chưa quét

Khi chạy trên điện thoại, camera yêu cầu HTTPS. `localhost` được trình duyệt cho phép trong môi trường phát triển. Mã QR được tạo và in từ trang Admin › Quản lý mã QR; khi test trên máy local có thể mở trực tiếp `http://localhost:5173/experience/qr/<token>`.
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Demo QR token: `demo-can-tho-001`

## Kiến trúc

Frontend gọi REST JSON qua Axios. Backend giữ business logic ở service layer, dùng DTO ở biên API, repository/JPA cho dữ liệu và Spring Security cho authorization. Giá sản phẩm, điểm gamification và tính hợp lệ QR phải được tính/kiểm tra phía backend khi hoàn thiện các module tiếp theo.

## Tài khoản demo

UI hiện có Demo Journey không cần đăng nhập để trình bày luồng pitch. Khi nối đầy đủ auth, seed admin/user nên được cung cấp qua migration hoặc biến môi trường, không commit password thật.

Để cấp quyền quản trị cho một tài khoản đã đăng ký, chạy câu lệnh SQL sau trong database:

```sql
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id
FROM users u CROSS JOIN roles r
WHERE u.email = 'admin@example.com' AND r.name = 'ADMIN'
	AND NOT EXISTS (
		SELECT 1 FROM user_roles existing
		WHERE existing.user_id = u.id AND existing.role_id = r.id
	);
```

Sau khi đăng nhập lại, mở `http://localhost:5173/admin`. Mua hàng chỉ tạo đơn hàng demo; passport chỉ tăng exploration khi người dùng xác thực QR hợp lệ.

## Lộ trình tiếp theo

1. Thêm entity/repository/service cho auth, catalog, cart, order và passport.
2. Thêm `JwtAuthenticationFilter`, register/login/refresh và RBAC ADMIN.
3. Tách các mock content trong frontend sang các service Axios tương ứng.
4. Thêm test JUnit cho QR replay protection, points calculation, order pricing và admin access.
