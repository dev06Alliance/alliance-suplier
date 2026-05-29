using AllianceSupplier.Api.DTOs.Categories;
using AllianceSupplier.Service.DTOs.Categories;
using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[Authorize(Roles = "Admin")]
public class CategoriesController(ICategoryService categoryService) : BaseController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await categoryService.GetAllAsync();
        return ApiOk(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequestDto dto)
    {
        var result = await categoryService.CreateAsync(new CreateCategoryRequest(dto.Name));
        return StatusCode(201, new { success = true, data = result });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequestDto dto)
    {
        var result = await categoryService.UpdateAsync(id, new UpdateCategoryRequest(dto.Name));
        return ApiOk(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await categoryService.DeleteAsync(id);
        return ApiOk<object?>(null);
    }
}
