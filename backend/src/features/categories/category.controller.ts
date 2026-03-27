import type { Request, Response } from "express";
import { createAttributeSchema, createCategorySchema } from "./category.schemas.js";
import type { CategoryService } from "./category.service.js";

export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  list = async (_req: Request, res: Response) => {
    const categories = await this.service.listCategories();
    res.json({ items: categories });
  };

  create = async (req: Request, res: Response) => {
    const body = createCategorySchema.parse(req.body);
    const category = await this.service.createCategory(body.name);
    res.status(201).json(category);
  };

  get = async (req: Request, res: Response) => {
    const category = await this.service.getCategoryOrThrow(req.params.id);
    res.json(category);
  };

  listAttributes = async (req: Request, res: Response) => {
    const items = await this.service.listAttributes(req.params.id);
    res.json({ items });
  };

  createAttribute = async (req: Request, res: Response) => {
    const body = createAttributeSchema.parse(req.body);
    const attr = await this.service.createAttribute(req.params.id, body);
    res.status(201).json(attr);
  };
}

