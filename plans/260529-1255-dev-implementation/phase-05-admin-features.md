---
phase: "05"
title: "Admin Features"
status: pending
effort: 4h
depends_on: phase-03-ticket-core.md
---

# Phase 05 — Admin Features

**Parent:** [plan.md](./plan.md) | **Prev:** [Phase 04](./phase-04-notifications-sse.md) | **Next:** [Phase 06](./phase-06-polish.md)
**Tech docs:** `d:\projects\alliance-suplier\Tech-docs.md`

## Overview

Admin-only endpoints + pages: Categories CRUD, Products CRUD (with image upload), Reports (date-filtered metrics), Uploads endpoint.

## Requirements

**BE:**
- `GET/POST /api/v1/categories` — list; create
- `PUT/DELETE /api/v1/categories/:id` — update; delete (FK violation → 422)
- `GET/POST /api/v1/products?categoryId=` — list (optional filter); create with optional image
- `PUT/DELETE /api/v1/products/:id` — update; delete
- `GET /api/v1/reports?date=|?from=&to=` → `{ total, confirmed, done }`
- `POST /api/v1/uploads` — 5MB max, JPEG/PNG/WEBP → `{ url }`
- `[Authorize(Roles="Admin")]` on Categories, Products, Reports controllers
- `[Authorize]` on Uploads (any authenticated user — needed for ticket free-text image)
- FluentValidation on all create/update DTOs

**FE:**
- ManageCategories page — list + create + edit + delete
- ManageProducts page — list (categoryId filter) + create/edit modal (with image) + delete
- Reports page — date range picker, 3 metric cards
- ImageUpload component — reused by ManageProducts and CreateTicket

## Architecture

### BE Files to Create

**Service layer — fill interface stubs + implementations:**

`AllianceSupplier.Service/`
- `ICategoryService.cs` — GetAllAsync, CreateAsync, UpdateAsync(id), DeleteAsync(id)
- `IProductService.cs` — GetAllAsync(categoryId?), CreateAsync, UpdateAsync(id), DeleteAsync(id)
- `IReportService.cs` — GetReportAsync(date?, from?, to?)
- `CategoryService.cs` — impl ICategoryService; inject ICategoryRepository
- `ProductService.cs` — impl IProductService; inject IProductRepository + IStorageService (upload/delete on create/update/delete)
- `ReportService.cs` — impl IReportService; inject ITicketRepository

**Domain — extend ITicketRepository:**
`AllianceSupplier.Domain/Interfaces/Repositories/ITicketRepository.cs`
- Add: `Task<(int total, int confirmed, int done)> GetCountsByStatusAsync(DateTime? from, DateTime? to)`

**Infrastructure — implement new method:**
`AllianceSupplier.Infrastructure/Repositories/TicketRepository.cs`
- Implement `GetCountsByStatusAsync` — filter by CreatedAt range, group by Status

**DTOs (in AllianceSupplier.Service/DTOs/ or AllianceSupplier.Api/DTOs/):**
- `CategoryDto` — Id, Name
- `CreateCategoryRequest` — Name
- `UpdateCategoryRequest` — Name
- `ProductDto` — Id, Name, ImageUrl, CategoryId, CategoryName
- `CreateProductRequest` — Name, CategoryId, Image (IFormFile?)
- `UpdateProductRequest` — Name, CategoryId, Image (IFormFile?)
- `ReportDto` — Total, Confirmed, Done

**Api layer:**
- `Controllers/CategoriesController.cs` — `[Authorize(Roles="Admin")]`
- `Controllers/ProductsController.cs` — `[Authorize(Roles="Admin")]`
- `Controllers/ReportsController.cs` — `[Authorize(Roles="Admin")]`
- `Controllers/UploadsController.cs` — `[Authorize]`
- `Validators/CreateCategoryRequestValidator.cs` — Name NotEmpty, MaxLength(100)
- `Validators/UpdateCategoryRequestValidator.cs` — same
- `Validators/CreateProductRequestValidator.cs` — Name NotEmpty MaxLength(200), CategoryId NotEmpty; Image if provided ≤5MB + valid MIME
- `Validators/UpdateProductRequestValidator.cs` — same

**Program.cs additions:**
```
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IReportService, ReportService>();
```
Note: `FluentValidation.DependencyInjectionExtensions` NuGet + `AddValidatorsFromAssemblyContaining<>()` must be added (tracked in Phase 06 todo if not done in Phase 02).

### FE Files to Create

`src/fe/src/`
- `hooks/useCategories.ts` — useQuery + create/update/delete mutations; invalidate `['categories']`
- `hooks/useProducts.ts` — useQuery(`['products', categoryId]`) + mutations
- `hooks/useReports.ts` — useQuery(`['reports', from, to]`)
- `pages/ManageCategories.tsx`
- `pages/ManageProducts.tsx` — category filter, image preview, modal form
- `pages/Reports.tsx` — date-fns date range, 3 metric cards
- `components/ImageUpload.tsx` — file input + preview + POST /api/v1/uploads → returns URL

**types/index.ts additions:** Category, Product, ReportData

## Implementation Steps

1. Extend `ITicketRepository` with `GetCountsByStatusAsync`
2. Implement in `TicketRepository` (EF LINQ group-by or 3 separate count queries)
3. Define full method signatures in `ICategoryService`, `IProductService`, `IReportService`
4. Create Service DTOs (CategoryDto, ProductDto, ReportDto, request records)
5. Implement `CategoryService` — delegate to ICategoryRepository; throw NotFoundException on missing entity
6. Implement `ProductService` — CRUD + IStorageService: UploadAsync on create/update with new image; DeleteAsync on update-replace or delete
7. Implement `ReportService.GetReportAsync` — parse params, call repo method
8. Add `FluentValidation.DependencyInjectionExtensions` to `AllianceSupplier.Api.csproj` (if not done)
9. Create all 4 validators
10. Create Api DTOs (JSON body + multipart form variants)
11. Implement `CategoriesController` (GET, POST, PUT :id, DELETE :id)
12. Implement `ProductsController` (GET ?categoryId=, POST multipart, PUT :id multipart, DELETE :id)
13. Implement `ReportsController` (GET with query params)
14. Implement `UploadsController` (POST multipart, IFormFile validation via multer-equivalent: file size + MIME check in validator or service)
15. Register 3 services in `Program.cs`
16. `dotnet build` — 0 errors
17. FE: implement useCategories, useProducts, useReports
18. FE: implement ManageCategories page
19. FE: implement ManageProducts page + ImageUpload component
20. FE: implement Reports page
21. Wire `/manage/products`, `/manage/categories`, `/reports` as Admin-only protected routes

## Todo

- [ ] ITicketRepository: add `GetCountsByStatusAsync`
- [ ] TicketRepository: implement count method
- [ ] Service: ICategoryService, IProductService, IReportService (full signatures)
- [ ] Service: DTOs (CategoryDto, ProductDto, ReportDto, request types)
- [ ] Service: CategoryService
- [ ] Service: ProductService (+ StorageService integration)
- [ ] Service: ReportService
- [ ] Api.csproj: FluentValidation NuGet (if missing)
- [ ] Program.cs: register 3 services + FluentValidation assembly scan
- [ ] Api: Validators (Category × 2, Product × 2)
- [ ] Api: CategoriesController
- [ ] Api: ProductsController
- [ ] Api: ReportsController
- [ ] Api: UploadsController
- [ ] FE: useCategories hook
- [ ] FE: useProducts hook
- [ ] FE: useReports hook
- [ ] FE: ManageCategories page
- [ ] FE: ManageProducts page
- [ ] FE: ImageUpload component
- [ ] FE: Reports page
- [ ] Router: Admin-only routes

## Success Criteria

- `GET /api/v1/categories` as Admin → 200 + list
- `POST /api/v1/categories` as Admin → 201 + CategoryDto
- `POST /api/v1/categories` as User → 403
- `POST /api/v1/products` (multipart + image) → 201 + ProductDto with `imageUrl`
- `DELETE /api/v1/categories/:id` with linked products → 422 (FK violation handled)
- `GET /api/v1/reports?from=2026-05-01&to=2026-05-31` → `{ total, confirmed, done }`
- `POST /api/v1/uploads` with 6MB file → 422
- `POST /api/v1/uploads` with valid JPEG → 201 + `{ url: "/uploads/..." }`
- FE: Admin can create/edit/delete categories and products
- FE: Reports page renders 3 metric cards with date filter
