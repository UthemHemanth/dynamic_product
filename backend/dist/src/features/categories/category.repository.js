import { pool } from "../../db/pool.js";
export class CategoryRepository {
    async list() {
        const res = await pool.query(`SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM categories
       ORDER BY name ASC`);
        return res.rows;
    }
    async getById(id) {
        const res = await pool.query(`SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM categories WHERE id = $1`, [id]);
        return res.rows[0] ?? null;
    }
    async create(name) {
        const res = await pool.query(`INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`, [name]);
        return res.rows[0];
    }
}
export class AttributeRepository {
    async listByCategory(categoryId) {
        const res = await pool.query(`SELECT id, category_id AS "categoryId", name, key, type, unit, required, options,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM attribute_definitions
       WHERE category_id = $1
       ORDER BY name ASC`, [categoryId]);
        return res.rows;
    }
    async create(categoryId, data) {
        const res = await pool.query(`INSERT INTO attribute_definitions
        (category_id, name, key, type, unit, required, options)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[])
       RETURNING id, category_id AS "categoryId", name, key, type, unit, required, options,
                 created_at AS "createdAt", updated_at AS "updatedAt"`, [
            categoryId,
            data.name,
            data.key,
            data.type,
            data.unit ?? null,
            data.required ?? false,
            data.options ?? [],
        ]);
        return res.rows[0];
    }
}
