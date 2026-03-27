import { AttributeRepository, CategoryRepository } from "../categories/category.repository.js";
import { badRequest, notFound } from "../../http/errors.js";
import type { SearchRequest, SearchFilterValue } from "./search.types.js";
import { ProductRepository } from "./product.repository.js";

type NormalizedAttrValue = {
  attributeId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueSelect?: string | null;
};

export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly attributes: AttributeRepository,
  ) {}

  async createProduct(input: {
    categoryId: string;
    title: string;
    description?: string | undefined;
    highlights: string[];
    attributes: Array<{ attributeId: string; value?: string | number | boolean }>;
  }) {
    const category = await this.categories.getById(input.categoryId);
    if (!category) throw notFound("Category not found");

    const defs = await this.attributes.listByCategory(input.categoryId);
    const defsById = new Map(defs.map((d) => [d.id, d]));

    const seen = new Set<string>();
    const normalized: NormalizedAttrValue[] = [];

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

      const nv: NormalizedAttrValue = { attributeId: item.attributeId };
      switch (def.type) {
        case "TEXT":
          if (typeof item.value !== "string") throw badRequest("Expected string", { key: def.key });
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
          if (typeof item.value !== "boolean") throw badRequest("Expected boolean", { key: def.key });
          nv.valueBoolean = item.value;
          break;
        case "SELECT":
          if (typeof item.value !== "string") throw badRequest("Expected string", { key: def.key });
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

  async getProductOrThrow(id: string) {
    const product = await this.products.getById(id);
    if (!product) throw notFound("Product not found");
    return product;
  }

  private async getCategoryDefinitions(categoryId: string) {
    const category = await this.categories.getById(categoryId);
    if (!category) throw notFound("Category not found");
    const defs = await this.attributes.listByCategory(categoryId);
    return { category, defs };
  }

  private coerceArray(v: SearchFilterValue): Array<string | number | boolean> {
    return Array.isArray(v) ? v : [v as any];
  }

  async search(req: SearchRequest) {
    const { defs } = await this.getCategoryDefinitions(req.categoryId);
    const defsByKey = new Map(defs.map((d) => [d.key, d]));
    let idx = 1;
    const params: any[] = [];
    const clauses: string[] = [];

    clauses.push(`p.category_id = $${idx++}`);
    params.push(req.categoryId);

    if (req.q && req.q.trim().length > 0) {
      clauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${req.q.trim()}%`);
      idx += 1;
    }

    for (const [key, raw] of Object.entries(req.filters ?? {})) {
      const def = defsByKey.get(key);
      if (!def) throw badRequest("Unknown filter key for category", { key });

      if (def.type === "NUMBER" && typeof raw === "object" && raw && !Array.isArray(raw)) {
        const min = (raw as any).min;
        const max = (raw as any).max;
        const attrParam = idx++;
        const minParam = min !== undefined ? idx++ : null;
        const maxParam = max !== undefined ? idx++ : null;
        clauses.push(
          `EXISTS (
             SELECT 1 FROM product_attribute_values pav
             WHERE pav.product_id = p.id
               AND pav.attribute_id = $${attrParam}
               ${minParam ? `AND pav.value_number >= $${minParam}` : ""}
               ${maxParam ? `AND pav.value_number <= $${maxParam}` : ""}
           )`,
        );
        params.push(def.id);
        if (min !== undefined) params.push(min);
        if (max !== undefined) params.push(max);
        continue;
      }

      const values = this.coerceArray(raw);
      switch (def.type) {
        case "TEXT":
          clauses.push(
            `EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_text = ANY($${idx++}::text[])
             )`,
          );
          params.push(def.id, values as string[]);
          break;
        case "SELECT":
          clauses.push(
            `EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_select = ANY($${idx++}::text[])
             )`,
          );
          params.push(def.id, values as string[]);
          break;
        case "BOOLEAN":
          clauses.push(
            `EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_boolean = ANY($${idx++}::boolean[])
             )`,
          );
          params.push(def.id, values as boolean[]);
          break;
        case "NUMBER":
          clauses.push(
            `EXISTS (
               SELECT 1 FROM product_attribute_values pav
               WHERE pav.product_id = p.id
                 AND pav.attribute_id = $${idx++}
                 AND pav.value_number = ANY($${idx++}::numeric[])
             )`,
          );
          params.push(def.id, values as number[]);
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

    const byAttrId = new Map<string, { counts: Map<string, number> }>();
    for (const a of attrs) {
      const bucket =
        byAttrId.get(a.attributeId) ??
        (() => {
          const b = { counts: new Map<string, number>() };
          byAttrId.set(a.attributeId, b);
          return b;
        })();

      let v: string | null = null;
      if (a.attributeType === "TEXT") v = a.valueText ?? null;
      if (a.attributeType === "SELECT") v = a.valueSelect ?? null;
      if (a.attributeType === "BOOLEAN") v = typeof a.valueBoolean === "boolean" ? String(a.valueBoolean) : null;
      if (a.attributeType === "NUMBER") v = a.valueNumber?.toString() ?? null;
      if (!v) continue;
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

