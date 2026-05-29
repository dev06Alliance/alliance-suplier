using AllianceSupplier.Api.DTOs.Products;
using AllianceSupplier.Service.DTOs.Products;
using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[Authorize(Roles = "Admin")]
public class ProductsController(IProductService productService) : BaseController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] Guid? categoryId)
    {
        var result = await productService.GetAllAsync(categoryId);
        return ApiOk(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateProductRequestDto dto)
    {
        var result = await productService.CreateAsync(
            new CreateProductRequest(dto.Name, dto.CategoryId, dto.Image)
        );
        return StatusCode(201, new { success = true, data = result });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateProductRequestDto dto)
    {
        var result = await productService.UpdateAsync(
            id,
            new UpdateProductRequest(dto.Name, dto.CategoryId, dto.Image)
        );
        return ApiOk(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await productService.DeleteAsync(id);
        return ApiOk<object?>(null);
    }
}
