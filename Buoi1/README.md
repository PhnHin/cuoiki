# Website quản lý đơn hàng

Ứng dụng HTML, CSS/SCSS và JavaScript thuần để chọn mặt hàng, nhập thêm tồn kho, tạo đơn, tìm kiếm và lọc đơn hàng.

## Tệp chính
- `order-management-site/index.html`: giao diện đặt hàng và theo dõi đơn.
- `order-management-site/css/order-management-dashboard.css`: stylesheet chạy trên trình duyệt.
- `order-management-site/js/order-entry.js`: giỏ hàng, tồn kho, tạo đơn, LocalStorage và Fetch API.
- `order-management-site/scss/main.scss`: entrypoint SCSS.
- `order-management-site/scss/_dashboard.scss`: style SCSS của ứng dụng.

Đơn hàng, giỏ hàng và tồn kho được lưu trong LocalStorage. Tỷ giá USD/VND được tải bất đồng bộ qua Fetch API, có xử lý lỗi.