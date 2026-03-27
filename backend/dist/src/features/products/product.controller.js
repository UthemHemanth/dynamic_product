import { createProductSchema } from "./product.schemas.js";
import { searchSchema } from "./search.schemas.js";
export class ProductController {
    service;
    constructor(service) {
        this.service = service;
    }
    create = async (req, res) => {
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
    get = async (req, res) => {
        const product = await this.service.getProductOrThrow(req.params.id);
        res.json(product);
    };
    search = async (req, res) => {
        const body = searchSchema.parse(req.body);
        const result = await this.service.search(body);
        res.json(result);
    };
}
