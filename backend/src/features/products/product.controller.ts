import type { Request, Response } from "express";
import { createProductSchema } from "./product.schemas.js";
import { searchSchema } from "./search.schemas.js";
import type { ProductService } from "./product.service.js";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  create = async (req: Request, res: Response) => {
    const body = createProductSchema.parse(req.body);
    const product = await this.service.createProduct({
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      highlights: body.highlights,
      attributes: body.attributes,
    });
    res.status(201).json(product);
  };

  get = async (req: Request, res: Response) => {
    const product = await this.service.getProductOrThrow(req.params.id);
    res.json(product);
  };

  search = async (req: Request, res: Response) => {
    const body = searchSchema.parse(req.body);
    const result = await this.service.search(body);
    res.json(result);
  };
}

