# Cấu hình Supabase Authentication

## Tắt Email Confirmation (cho development)

Nếu bạn muốn test nhanh mà không cần xác thực email, có thể tắt tính năng này:

### Bước 1: Vào Supabase Dashboard
1. Đăng nhập vào https://supabase.com
2. Chọn project của bạn
3. Vào **Authentication** > **Settings**

### Bước 2: Tắt Email Confirmation
1. Tìm phần **"Email confirmation"**
2. **Bỏ tick** ở **"Enable email confirmations"**
3. Click **Save**

### Bước 3: Cấu hình Email Templates (optional)
Trong **Authentication** > **Email Templates**, bạn có thể:
- Customise email confirmation template
- Customise password reset template
- Thay đổi ngôn ngữ sang tiếng Việt

## Cấu hình Production

Khi deploy production, **NÊN BẬT LẠI** email confirmation để bảo mật:

1. **Enable email confirmations** ✅
2. **Enable email change confirmations** ✅  
3. **Enable phone confirmations** (nếu dùng SMS)

## Redirect URLs

Thêm các URL sau vào **Redirect URLs**:
- `http://localhost:5173/**` (development)
- `https://yourdomain.com/**` (production)

## Email Provider

Để gửi email production, config email provider:
- **SendGrid**
- **AWS SES** 
- **Custom SMTP**

Mặc định Supabase dùng built-in email service (có giới hạn).

## Rate Limiting

Cấu hình rate limiting để tránh spam:
- **Max emails per hour**: 30
- **Max SMS per hour**: 30