# Alliance Supplier

## Cấu trúc dự án

```
src/
├── fe/          # Frontend - React + TypeScript (Vite)
└── be/          # Backend - .NET 10 Web API + Entity Framework Core + PostgreSQL
    ├── Controllers/
    │   └── HealthController.cs
    ├── Data/
    │   └── AppDbContext.cs
    ├── Properties/
    │   └── launchSettings.json
    ├── AllianceSupplier.Api.csproj
    ├── Program.cs
    └── appsettings.json
```

## Yêu cầu

- .NET 10 SDK
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
dotnet run
```

Server chạy tại `http://localhost:3000`

## Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE alliance_supplier;
```

Cấu hình connection string trong `src/be/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=alliance_supplier;Username=postgres;Password=postgres"
}
```

## Migrations (Entity Framework Core)

```bash
cd src/be
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Endpoints

| Method | Path      | Description  |
|--------|-----------|--------------|
| GET    | /health   | Health check |
