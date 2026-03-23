# Dyventory

Dyventory is a full-stack inventory and sales management system designed for businesses with highly diverse product catalogs.

It supports:

- Perishable goods (expiry date, batch tracking)
- Non-food products (variants, SKUs)
- Living products (weight-based stock, mortality tracking)

---

## 🧠 Core Concept

### Dynamic Category Field Schema

Dyventory introduces a powerful system where each product category defines its own fields using a JSON schema.

This allows:

- Unlimited flexibility
- No hardcoded product types
- Easy adaptation to new business needs without code changes

---

## 🏗 Monorepo Structure

```

dyventory/
├── dyventory-api/ # Laravel backend (API)
├── dyventory-web/ # Next.js frontend
└── .gitignore

```

---

## 🚀 Tech Stack

### Backend (API)

- Laravel 13 (PHP 8.2+)
- PostgreSQL
- Laravel Sanctum (authentication)
- Redis (cache & queues)

### Frontend (Web)

- Next.js 16
- React 19
- Tailwind CSS
- TypeScript

---

## ⚙️ Features

### 📦 Product Management

- Dynamic attributes per category
- Product variants (size, color, etc.)
- Barcode / QR code support

### 📊 Stock Management

- Full stock movement tracking (immutable logs)
- Batch (lot) management
- FEFO (First Expired, First Out)
- Inventory sessions and adjustments

### 🐌 Living Product Support

- Weight-based stock (kg)
- Mortality tracking
- Special handling for perishable/live goods

### 💰 Sales & Invoicing

- Multi-product sales
- Discounts & promotions
- Credit sales & payment tracking
- Invoice and receipt generation

### 👥 Clients & Suppliers

- Client profiles & history
- Supplier management
- Purchase orders tracking

### 📈 Analytics & Reports

- Sales reports
- Stock reports
- Loss & waste tracking
- Forecasting (stockout prediction)

### 🔐 Security

- Role-based access control (RBAC)
- Audit trail (immutable logs)
- Secure authentication

---

## 🌍 Internationalisation

- English (default)
- French supported

All text is translation-based (no hardcoded strings).

---

## 🛠 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dyventory.git
cd dyventory
```

---

### 2. Backend Setup (Laravel)

```bash
cd dyventory-api

composer install
cp .env.example .env
php artisan key:generate

php artisan migrate --seed

php artisan serve
```

---

### 3. Frontend Setup (Next.js)

```bash
cd dyventory-web

npm install
npm run dev
```

---

## 🔗 Application URLs

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

---

## 📁 Key Architecture Highlights

- Monorepo structure for unified development
- Dynamic schema system (JSON-based fields)
- Event-based stock tracking (no direct stock mutation)
- Scalable domain-driven design (DDD-inspired)

---

## 🧪 Development

### Run both apps (recommended in separate terminals)

Backend:

```bash
cd dyventory-api && php artisan serve
```

Frontend:

```bash
cd dyventory-web && npm run dev
```

---

## 📌 Roadmap

- [ ] Authentication & RBAC
- [ ] Product & category management
- [ ] Stock movement system
- [ ] Sales module
- [ ] Reporting & analytics
- [ ] Notifications system

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

MIT License

---

## 💡 About

Dyventory is built to solve real-world inventory challenges where products have very different constraints (perishable, non-perishable, and living goods) within a single unified system.

---

```

---

# 🚀 Next Level (optional improvements)

If you want to make it even stronger later, you can add:

- Screenshots 📸
- API docs link (Swagger/Postman)
- ERD diagram
- Demo credentials
```
