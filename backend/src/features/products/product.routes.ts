import { Router } from "express";
import { ProductRepository } from "./product.repository.js";
import { ProductService } from "./product.service.js";
import { ProductController } from "./product.controller.js";
import { AttributeRepository, CategoryRepository } from "../categories/category.repository.js";

export function productRoutes() {
  const router = Router();

  const controller = new ProductController(
    new ProductService(
      new ProductRepository(),
      new CategoryRepository(),
      new AttributeRepository(),
    ),
  );

  router.post("/products", controller.create);
  router.get("/products/:id", controller.get);
  router.post("/search", controller.search);

  return router;
}

