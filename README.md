# Alliance Supplier

## Cấu trúc dự án

```
src/
├── fe/          # Frontend - React + TypeScript (Vite)
└── be/          # Backend - Node.js + Express + TypeScript + Prisma + PostgreSQL
    ├── src/
    │   ├── app.ts
    │   ├── server.ts
    │   └── lib/
    │       └── prisma.ts
    └── prisma/
        └── schema.prisma
```

## Yêu cầu

- Node.js 18+
- PostgreSQL 14+

## Khởi chạy

### Frontend

```bash
cd src/fe
npm install
npm run dev
```

### Backend

```bash
cd src/be
npm install
npm run dev
```

## Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE alliance_supplier;
```

Cấu hình connection string trong `src/be/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alliance_supplier?schema=public"
```

Chạy migration:

```bash
cd src/be
npm run db:migrate
```
"# alliance-suplier" 
