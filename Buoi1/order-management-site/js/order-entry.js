const PRODUCTS_DEFAULT = [
  { id: "tee", name: "Áo thun Essential", category: "Thời trang", price: 189000, stock: 18 },
  { id: "mug", name: "Cốc gốm Studio", category: "Đồ gia dụng", price: 145000, stock: 12 },
  { id: "tote", name: "Túi canvas Daily", category: "Phụ kiện", price: 220000, stock: 9 },
  { id: "bottle", name: "Bình nước Move", category: "Phụ kiện", price: 265000, stock: 14 },
  { id: "notebook", name: "Sổ tay Kraft", category: "Văn phòng phẩm", price: 79000, stock: 24 },
  { id: "desk-lamp", name: "Đèn bàn Mini", category: "Đồ gia dụng", price: 329000, stock: 7 },
  { id: "headphones", name: "Tai nghe Wave", category: "Điện tử", price: 459000, stock: 6 },
  { id: "thermos", name: "Bình giữ nhiệt Terra", category: "Phụ kiện", price: 179000, stock: 15 },
];

const ORDER_KEY = "order-desk-orders-v1";
const CART_KEY = "order-desk-cart-v1";
const PRODUCT_KEY = "order-desk-products-v1";
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const orderForm = document.querySelector("#checkout-form");
const productSearchInput = document.querySelector("#product-search");
const productCategoryFilter = document.querySelector("#product-category-filter");
const searchInput = document.querySelector("#order-search");
const statusFilter = document.querySelector("#status-filter");
const ordersList = document.querySelector("#orders-list");
const storageStatus = document.querySelector("#storage-status");

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    console.error(`Không thể đọc ${key} từ LocalStorage:`, error);
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    storageStatus.textContent = "Đã lưu trên thiết bị";
  } catch (error) {
    console.error(`Không thể lưu ${key} vào LocalStorage:`, error);
    storageStatus.textContent = "Không thể lưu dữ liệu trên thiết bị";
  }
}

function createSampleOrders() {
  const now = Date.now();
  return [
    { id: "DH-24018", customer: "Linh Nguyễn", phone: "0912 345 678", address: "12 Nguyễn Huệ, Quận 1", note: "Gọi trước khi giao", status: "pending", createdAt: new Date(now - 38 * 60000).toISOString(), items: [{ id: "tee", name: "Áo thun Essential", price: 189000, quantity: 2 }], total: 378000 },
    { id: "DH-24017", customer: "Minh Trần", phone: "0988 220 145", address: "45 Lê Lợi, Quận 3", note: "", status: "completed", createdAt: new Date(now - 4 * 3600000).toISOString(), items: [{ id: "mug", name: "Cốc gốm Studio", price: 145000, quantity: 1 }, { id: "tote", name: "Túi canvas Daily", price: 220000, quantity: 1 }], total: 365000 },
    { id: "DH-24016", customer: "An Phạm", phone: "0903 561 789", address: "8 Trần Phú, Bình Thạnh", note: "", status: "pending", createdAt: new Date(now - 22 * 3600000).toISOString(), items: [{ id: "bottle", name: "Bình nước Move", price: 265000, quantity: 1 }], total: 265000 },
  ];
}

let orders = readStorage(ORDER_KEY, null);
if (!Array.isArray(orders)) orders = createSampleOrders();
let products = readStorage(PRODUCT_KEY, null);
if (!Array.isArray(products)) products = PRODUCTS_DEFAULT;
else {
  const savedProductIds = new Set(products.map((product) => product.id));
  products = [...products, ...PRODUCTS_DEFAULT.filter((product) => !savedProductIds.has(product.id))];
}
products = products.map((product) => ({ ...product, stock: Number.isInteger(product.stock) ? product.stock : 0 }));
let cart = readStorage(CART_KEY, null);
if (!cart) cart = readStorage(`${CART_KEY}:customer-demo`, readStorage(`${CART_KEY}:admin-demo`, {}));
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};

function formatMoney(value) {
  return money.format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function renderProducts() {
  const list = document.querySelector("#product-list");
  list.replaceChildren();
  const selectedCategory = productCategoryFilter.value;
  const categories = [...new Set(products.map((product) => product.category.trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, "vi"));
  productCategoryFilter.replaceChildren(new Option("Tất cả danh mục", "all"));
  categories.forEach((category) => productCategoryFilter.add(new Option(category, category)));
  productCategoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : "all";

  const query = productSearchInput.value.trim().toLocaleLowerCase("vi");
  const filteredProducts = products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category}`.toLocaleLowerCase("vi").includes(query);
    return matchesQuery && (productCategoryFilter.value === "all" || product.category === productCategoryFilter.value);
  });
  document.querySelector("#product-results-count").textContent = `${filteredProducts.length} mặt hàng`;

  if (!filteredProducts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-products";
    empty.textContent = "Không tìm thấy mặt hàng phù hợp.";
    list.append(empty);
    return;
  }

  filteredProducts.forEach((product, index) => {
    const item = document.createElement("article");
    item.className = "product-row";
    const number = document.createElement("span");
    number.className = "product-index";
    number.textContent = String(index + 1).padStart(2, "0");
    const info = document.createElement("div");
    info.className = "product-info";
    const name = document.createElement("h3");
    name.textContent = product.name;
    const category = document.createElement("p");
    category.textContent = `${product.category} · Còn ${Math.max(0, product.stock - (Number(cart[product.id]) || 0))}`;
    const price = document.createElement("strong");
    price.textContent = formatMoney(product.price);
    const add = document.createElement("button");
    add.className = "add-product";
    add.type = "button";
    add.textContent = "+";
    add.setAttribute("aria-label", `Thêm ${product.name} vào giỏ`);
    add.disabled = product.stock <= (Number(cart[product.id]) || 0);
    add.addEventListener("click", () => {
      if ((Number(cart[product.id]) || 0) >= product.stock) return;
      cart[product.id] = (Number(cart[product.id]) || 0) + 1;
      saveStorage(CART_KEY, cart);
      renderCart();
      renderProducts();
    });
    info.append(name, category);
    item.append(number, info, price, add);
    list.append(item);
  });
}

productSearchInput.addEventListener("input", renderProducts);
productCategoryFilter.addEventListener("change", renderProducts);

function renderCart() {
  const list = document.querySelector("#cart-items");
  const entries = products.filter((product) => Number(cart[product.id]) > 0);
  const count = entries.reduce((sum, product) => sum + Number(cart[product.id]), 0);
  const total = entries.reduce((sum, product) => sum + product.price * Number(cart[product.id]), 0);
  const stockIssue = entries.some((product) => Number(cart[product.id]) > product.stock);
  list.replaceChildren();
  document.querySelector("#cart-count").textContent = String(count).padStart(2, "0");
  document.querySelector("#cart-total").textContent = formatMoney(total);

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-cart";
    empty.textContent = "Chưa có sản phẩm trong giỏ.";
    list.append(empty);
  }

  entries.forEach((product) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    const description = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;
    const lineTotal = document.createElement("span");
    lineTotal.textContent = formatMoney(product.price * Number(cart[product.id]));
    description.append(name, lineTotal);
    const quantity = document.createElement("div");
    quantity.className = "quantity-control";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Giảm số lượng ${product.name}`);
    decrease.addEventListener("click", () => changeQuantity(product.id, -1));
    const value = document.createElement("span");
    value.textContent = cart[product.id];
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Tăng số lượng ${product.name}`);
    increase.disabled = Number(cart[product.id]) >= product.stock;
    increase.addEventListener("click", () => changeQuantity(product.id, 1));
    quantity.append(decrease, value, increase);
    row.append(description, quantity);
    list.append(row);
  });

  document.querySelector("#checkout-submit").disabled = count === 0 || stockIssue;
  document.querySelector("#checkout-status").textContent = stockIssue
    ? "Giỏ hàng vượt quá tồn kho hiện tại. Vui lòng điều chỉnh số lượng."
    : count === 0
      ? "Thêm ít nhất một mặt hàng vào giỏ để tạo đơn."
      : "";
}

function changeQuantity(productId, amount) {
  cart[productId] = (Number(cart[productId]) || 0) + amount;
  if (cart[productId] <= 0) delete cart[productId];
  saveStorage(CART_KEY, cart);
  renderCart();
  renderProducts();
}

function renderStats() {
  document.querySelector("#stat-orders").textContent = orders.length;
  document.querySelector("#stat-pending").textContent = orders.filter((order) => order.status === "pending").length;
  document.querySelector("#stat-revenue").textContent = formatMoney(
    orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + Number(order.total || 0), 0),
  );
}

function renderOrders() {
  const query = searchInput.value.trim().toLocaleLowerCase("vi");
  const selectedStatus = statusFilter.value;
  const filtered = orders.filter((order) => {
    const text = [order.id, order.customer, order.phone, order.address, ...order.items.map((item) => item.name)]
      .join(" ")
      .toLocaleLowerCase("vi");
    return (!query || text.includes(query)) && (selectedStatus === "all" || order.status === selectedStatus);
  });
  ordersList.replaceChildren();
  document.querySelector("#results-count").textContent = `${filtered.length} đơn hàng`;
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-orders";
    empty.textContent = "Chưa có đơn hàng phù hợp.";
    ordersList.append(empty);
    return;
  }

  filtered.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-row";
    const main = document.createElement("div");
    main.className = "order-main";
    const identity = document.createElement("div");
    identity.className = "order-identity";
    const id = document.createElement("strong");
    id.textContent = order.id;
    const badge = document.createElement("span");
    badge.className = `status-badge ${order.status}`;
    badge.textContent = order.status === "completed" ? "Hoàn thành" : "Đang xử lý";
    identity.append(id, badge);
    const customer = document.createElement("p");
    customer.textContent = `${order.customer} · ${order.phone}`;
    const details = document.createElement("p");
    details.className = "order-details";
    details.textContent = `${order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm · ${formatDate(order.createdAt)}`;
    main.append(identity, customer, details);
    const amount = document.createElement("strong");
    amount.className = "order-amount";
    amount.textContent = formatMoney(order.total);
    card.append(main, amount);
    ordersList.append(card);
  });
}

function saveOrders() {
  saveStorage(ORDER_KEY, orders);
  renderOrders();
  renderStats();
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(orderForm);
  const items = products.filter((product) => Number(cart[product.id]) > 0)
    .map((product) => ({ id: product.id, name: product.name, price: product.price, quantity: Number(cart[product.id]) }));
  if (!items.length || items.some((item) => item.quantity > products.find((product) => product.id === item.id).stock)) return;

  orders.unshift({
    id: `DH-${String(Date.now()).slice(-6)}`,
    customer: String(data.get("customer")).trim(),
    phone: String(data.get("phone")).trim(),
    address: String(data.get("address")).trim(),
    note: String(data.get("note")).trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  });
  items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.id);
    product.stock -= item.quantity;
  });
  cart = {};
  saveStorage(PRODUCT_KEY, products);
  saveStorage(CART_KEY, cart);
  orderForm.reset();
  renderCart();
  renderProducts();
  saveOrders();
  document.querySelector("#checkout-status").textContent = "Đơn hàng đã được tạo.";
});

document.querySelector("#clear-cart").addEventListener("click", () => {
  cart = {};
  saveStorage(CART_KEY, cart);
  renderCart();
  renderProducts();
});
searchInput.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);

async function loadExchangeRate() {
  const rate = document.querySelector("#exchange-rate");
  const status = document.querySelector("#exchange-status");
  status.textContent = "Đang cập nhật";
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) throw new Error(`API phản hồi lỗi (${response.status}).`);
    const data = await response.json();
    if (data.result !== "success" || !Number.isFinite(data.rates?.VND)) throw new Error("Dữ liệu tỷ giá không hợp lệ.");
    rate.textContent = `${Math.round(data.rates.VND).toLocaleString("vi-VN")} ₫`;
    status.textContent = "Nguồn: ExchangeRate-API";
  } catch (error) {
    console.error("Không thể tải tỷ giá:", error);
    rate.textContent = "Chưa khả dụng";
    status.textContent = "Không thể kết nối API";
  }
}

renderProducts();
renderCart();
renderOrders();
renderStats();
saveStorage(PRODUCT_KEY, products);
saveStorage(ORDER_KEY, orders);
loadExchangeRate();
