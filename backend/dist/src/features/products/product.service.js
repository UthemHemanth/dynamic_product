import { badRequest, notFound } from "../../http/errors.js";
export class ProductService {
    products;
    categories;
    attributes;
    constructor(products, categories, attributes) {
        this.products = products;
        this.categories = categories;
        this.attributes = attributes;
    }
    async createProduct(input) {
        const category = await this.categories.getById(input.categoryId);
        if (!category)
            throw notFound("Category not found");
        const defs = await this.attributes.listByCategory(input.categoryId);
        const defsById = new Map(defs.map((d) => [d.id, d]));
        const seen = new Set();
        const normalized = [];
        for (const item of input.attributes) {
            if (seen.has(item.attributeId)) {
                throw badRequest("Duplicate attribute value", { attributeId: item.attributeId });
            }
            seen.add(item.attributeId);
            const def = defsById.get(item.attributeId);
            if (!def) {
                throw badRequest("Attribute does not belong to category", {
                    attributeId: item.attributeId,
                });
            }
            if (item.value === undefined || item.value === null) {
                throw badRequest("Attribute value is required", { key: def.key });
            }
            const nv = { attributeId: item.attributeId };
            switch (def.type) {
                case "TEXT":
                    if (typeof item.value !== "string")
                        throw badRequest("Expected string", { key: def.key });
                    nv.valueText = item.value.trim();
                    if (nv.valueText.length === 0) {
                        throw badRequest("Attribute value cannot be empty", { key: def.key });
                    }
                    break;
                case "NUMBER":
                    if (typeof item.value !== "number" || Number.isNaN(item.value)) {
                        throw badRequest("Expected valid number", { key: def.key });
                    }
                    nv.valueNumber = item.value;
                    break;
                case "BOOLEAN":
                    if (typeof item.value !== "boolean")
                        throw badRequest("Expected boolean", { key: def.key });
                    nv.valueBoolean = item.value;
                    break;
                case "SELECT":
                    if (typeof item.value !== "string")
                        throw badRequest("Expected string", { key: def.key });
                    if (item.value.trim().length === 0) {
                        throw badRequest("Attribute value cannot be empty", { key: def.key });
                    }
                    if (!def.options.includes(item.value)) {
                        throw badRequest("Invalid option", { key: def.key, value: item.value });
                    }
                    nv.valueSelect = item.value;
                    break;
            }
            normalized.push(nv);
        }
        for (const def of defs) {
            if (def.required && !seen.has(def.id)) {
                throw badRequest("Missing required attribute", { key: def.key });
            }
        }
        return this.products.create({
            categoryId: input.categoryId,
            title: input.title,
            description: input.description ?? null,
            highlights: input.highlights,
            attributeValues: normalized,
        });
    }
    async getProductOrThrow(id) {
        const product = await this.products.getById(id);
        if (!product)
            throw notFound("Product not found");
        return product;
    }
    async getCategoryDefinitions(categoryId) {
        const category = await this.categories.getById(categoryId);
        if (!category)
            throw notFound("Category not found");
        const defs = await this.attributes.listByCategory(categoryId);
        return { category, defs };
    }
    coerceArray(v) {
        return Array.isArray(v) ? v : [v];
    }
    async search(req) {
        const { defs } = await this.getCategoryDefinitions(req.categoryId);
        const defsByKey = new Map(defs.map((d) => [d.key, d]));
        let idx = 1;
        const params = [];
        const clauses = [];
        clauses.push(`p.category_id = $${idx++}`);
        params.push(req.categoryId);
        if (req.q && req.q.trim().length > 0) {
            clauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
            params.push(`%${req.q.trim()}%`);
            idx += 1;
        }
        for (const [key, raw] of Object.entries(req.filters ?? {})) {
            const def = defsByKey.get(key);
            if (!def)
                throw badRequest("Unknown filter key for category", { key });
            if (def.type === "NUMBER" && typeof raw === "object" && raw && !Array.isArray(raw)) {
                const min = raw.min;
                const max = raw.max;
                const attrParam = idx++;
                const minParam = min !== undefined ? idx++ : null;
                const maxParam = max !== undefined ? idx++ : null;
                clauses.push(`EXISTS (
             SELECT 1 FROM product_attribute_values pav
             WHERE pav.product_id = p.id
               AND pav.attribute_id = $${attrParam}
               ${minParam ? `AND pav.value_number >= $${minParam}` : ""}
               ${maxParam ? `AND pav.value_number <= $${maxParam}` : ""}
           )`);
                params.push(def.id);
                if (min !== undefined)
                    params.push(min);
                if (max !== undefined)
                    params.push(max);
                continue;
            }
            const values = this.coerceArray(raw);
            switch (def.type) {
                case "TEXT":
                    clauses.push(`EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_text = ANY($${idx++}::text[])
             )`);
                    params.push(def.id, values);
                    break;
                case "SELECT":
                    clauses.push(`EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_select = ANY($${idx++}::text[])
             )`);
                    params.push(def.id, values);
                    break;
                case "BOOLEAN":
                    clauses.push(`EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_boolean = ANY($${idx++}::boolean[])
             )`);
                    params.push(def.id, values);
                    break;
                case "NUMBER":
                    clauses.push(`EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_number = ANY($${idx++}::numeric[])
             )`);
                    params.push(def.id, values);
                    break;
            }
        }
        const whereSql = clauses.join(" AND ");
        const pageSize = req.pageSize ?? 20;
        const page = req.page ?? 1;
        const skip = (page - 1) * pageSize;
        const items = await this.products.search(whereSql, params, pageSize, skip);
        // Facets: computed from the same filtered product set (simple + clear for demo)
        const matchedIds = await this.products.findIdsBySearch(whereSql, params);
        const attrs = await this.products.getValuesForProducts(matchedIds);
        const byAttrId = new Map();
        for (const a of attrs) {
            const bucket = byAttrId.get(a.attributeId) ??
                (() => {
                    const b = { counts: new Map() };
                    byAttrId.set(a.attributeId, b);
                    return b;
                })();
            let v = null;
            if (a.attributeType === "TEXT")
                v = a.valueText ?? null;
            if (a.attributeType === "SELECT")
                v = a.valueSelect ?? null;
            if (a.attributeType === "BOOLEAN")
                v = typeof a.valueBoolean === "boolean" ? String(a.valueBoolean) : null;
            if (a.attributeType === "NUMBER")
                v = a.valueNumber?.toString() ?? null;
            if (!v)
                continue;
            bucket.counts.set(v, (bucket.counts.get(v) ?? 0) + 1);
        }
        const facets = defs.map((d) => {
            const bucket = byAttrId.get(d.id);
            const options = [...(bucket?.counts.entries() ?? [])]
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
            return { attribute: d, options };
        });
        return {
            items,
            page,
            pageSize,
            facets,
        };
    }
}
