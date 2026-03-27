import { createAttributeSchema, createCategorySchema } from "./category.schemas.js";
export class CategoryController {
    service;
    constructor(service) {
        this.service = service;
    }
    list = async (_req, res) => {
        const categories = await this.service.listCategories();
        res.json({ items: categories });
    };
    create = async (req, res) => {
        const body = createCategorySchema.parse(req.body);
        const category = await this.service.createCategory(body.name);
        res.status(201).json(category);
    };
    get = async (req, res) => {
        const category = await this.service.getCategoryOrThrow(req.params.id);
        res.json(category);
    };
    listAttributes = async (req, res) => {
        const items = await this.service.listAttributes(req.params.id);
        res.json({ items });
    };
    createAttribute = async (req, res) => {
        const body = createAttributeSchema.parse(req.body);
        const attr = await this.service.createAttribute(req.params.id, body);
        res.status(201).json(attr);
    };
}
