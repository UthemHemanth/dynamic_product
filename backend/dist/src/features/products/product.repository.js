import { pool } from "../../db/pool.js";
export class ProductRepository {
    async create(data) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const pRes = await client.query(`INSERT INTO products (category_id, title, description, highlights)
         VALUES ($1, $2, $3, $4::text[])
         RETURNING id`, [data.categoryId, data.title, data.description ?? null, data.highlights]);
            const productId = pRes.rows[0].id;
            for (const v of data.attributeValues) {
                await client.query(`INSERT INTO product_attribute_values
            (product_id, attribute_id, value_text, value_number, value_boolean, value_select)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    productId,
                    v.attributeId,
                    v.valueText ?? null,
                    typeof v.valueNumber === "number" ? v.valueNumber : null,
                    typeof v.valueBoolean === "boolean" ? v.valueBoolean : null,
                    v.valueSelect ?? null,
                ]);
            }
            await client.query("COMMIT");
            return this.getById(productId);
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    mapProductRows(rows) {
        if (rows.length === 0)
            return null;
        const first = rows[0];
        return {
            id: first.id,
            categoryId: first.categoryId,
            title: first.title,
            description: first.description,
            highlights: first.highlights ?? [],
            category: { id: first.categoryId, name: first.categoryName },
            attributes: rows
                .filter((r) => r.pavId)
                .map((r) => ({
                id: r.pavId,
                attributeId: r.attributeId,
                valueText: r.valueText,
                valueNumber: r.valueNumber,
                valueBoolean: r.valueBoolean,
                valueSelect: r.valueSelect,
                attribute: {
                    id: r.attributeId,
                    categoryId: r.categoryId,
                    name: r.attributeName,
                    key: r.attributeKey,
                    type: r.attributeType,
                    unit: r.attributeUnit,
                    required: r.attributeRequired,
                    options: r.attributeOptions ?? [],
                },
            })),
        };
    }
    async getById(id) {
        const res = await pool.query(`SELECT
          p.id, p.category_id AS "categoryId", p.title, p.description, p.highlights,
          c.name AS "categoryName",
          pav.id AS "pavId", pav.attribute_id AS "attributeId",
          pav.value_text AS "valueText", pav.value_number AS "valueNumber",
          pav.value_boolean AS "valueBoolean", pav.value_select AS "valueSelect",
          ad.name AS "attributeName", ad.key AS "attributeKey", ad.type AS "attributeType",
          ad.unit AS "attributeUnit", ad.required AS "attributeRequired", ad.options AS "attributeOptions"
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_attribute_values pav ON pav.product_id = p.id
       LEFT JOIN attribute_definitions ad ON ad.id = pav.attribute_id
       WHERE p.id = $1
       ORDER BY ad.name ASC NULLS LAST`, [id]);
        return this.mapProductRows(res.rows);
    }
    async search(whereSql, params, take, skip) {
        const baseParams = [...params, take, skip];
        const limitPlaceholder = `$${params.length + 1}`;
        const offsetPlaceholder = `$${params.length + 2}`;
        const res = await pool.query(`SELECT
          p.id, p.category_id AS "categoryId", p.title, p.description, p.highlights,
          c.name AS "categoryName",
          pav.id AS "pavId", pav.attribute_id AS "attributeId",
          pav.value_text AS "valueText", pav.value_number AS "valueNumber",
          pav.value_boolean AS "valueBoolean", pav.value_select AS "valueSelect",
          ad.name AS "attributeName", ad.key AS "attributeKey", ad.type AS "attributeType",
          ad.unit AS "attributeUnit", ad.required AS "attributeRequired", ad.options AS "attributeOptions"
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_attribute_values pav ON pav.product_id = p.id
       LEFT JOIN attribute_definitions ad ON ad.id = pav.attribute_id
       WHERE ${whereSql}
       ORDER BY p.updated_at DESC
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`, baseParams);
        const grouped = new Map();
        for (const row of res.rows) {
            const arr = grouped.get(row.id) ?? [];
            arr.push(row);
            grouped.set(row.id, arr);
        }
        return [...grouped.values()].map((rows) => this.mapProductRows(rows));
    }
    async findIdsBySearch(whereSql, params) {
        const res = await pool.query(`SELECT p.id FROM products p WHERE ${whereSql} LIMIT 5000`, params);
        return res.rows.map((r) => r.id);
    }
    async getValuesForProducts(productIds) {
        if (productIds.length === 0)
            return [];
        const sql = [
            `SELECT pav.attribute_id AS "attributeId",`,
            `       pav.value_text AS "valueText",`,
            `       pav.value_number AS "valueNumber",`,
            `       pav.value_boolean AS "valueBoolean",`,
            `       pav.value_select AS "valueSelect",`,
            `       ad.type AS "attributeType"`,
            `FROM product_attribute_values pav`,
            `JOIN attribute_definitions ad ON ad.id = pav.attribute_id`,
            `WHERE pav.product_id = ANY($1::uuid[])`,
        ].join("\n");
        const res = await pool.query(sql, [productIds]);
        return res.rows;
    }
}
