import { badRequest, notFound } from "../../http/errors.js";
import { AttributeRepository, CategoryRepository } from "./category.repository.js";

export class CategoryService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly attributes: AttributeRepository,
  ) {}

  async listCategories() {
    return this.categories.list();
  }

  async createCategory(name: string) {
    return this.categories.create(name);
  }

  async getCategoryOrThrow(id: string) {
    const category = await this.categories.getById(id);
    if (!category) throw notFound("Category not found");
    return category;
  }

  async listAttributes(categoryId: string) {
    await this.getCategoryOrThrow(categoryId);
    return this.attributes.listByCategory(categoryId);
  }

  async createAttribute(categoryId: string, data: any) {
    await this.getCategoryOrThrow(categoryId);
    if (data.type !== "SELECT" && (data.options?.length ?? 0) > 0) {
      throw badRequest("options are only allowed for SELECT attributes");
    }
    if (data.type === "SELECT" && (data.options?.length ?? 0) === 0) {
      throw badRequest("SELECT attributes must define non-empty options");
    }
    return this.attributes.create(categoryId, data);
  }
}

