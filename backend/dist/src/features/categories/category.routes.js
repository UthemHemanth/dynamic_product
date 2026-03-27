import { Router } from "express";
import { AttributeRepository, CategoryRepository } from "./category.repository.js";
import { CategoryService } from "./category.service.js";
import { CategoryController } from "./category.controller.js";
export function categoryRoutes() {
    const router = Router();
    const service = new CategoryService(new CategoryRepository(), new AttributeRepository());
    const controller = new CategoryController(service);
    router.get("/categories", controller.list);
    router.post("/categories", controller.create);
    router.get("/categories/:id", controller.get);
    router.get("/categories/:id/attributes", controller.listAttributes);
    router.post("/categories/:id/attributes", controller.createAttribute);
    return router;
}
