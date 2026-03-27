import "dotenv/config";
import { pool } from "../src/db/pool.js";

async function ensureCategory(name: string) {
  const res = await pool.query(
    `INSERT INTO categories (name)
     VALUES ($1)
     ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [name],
  );
  return res.rows[0];
}

async function ensureAttribute(categoryId: string, data: any) {
  await pool.query(
    `INSERT INTO attribute_definitions
      (category_id, name, key, type, unit, required, options)
     VALUES ($1, $2, $3, $4, $5, $6, $7::text[])
     ON CONFLICT(category_id, key)
     DO UPDATE SET
       name = EXCLUDED.name,
       type = EXCLUDED.type,
       unit = EXCLUDED.unit,
       required = EXCLUDED.required,
       options = EXCLUDED.options`,
    [
      categoryId,
      data.name,
      data.key,
      data.type,
      data.unit ?? null,
      data.required ?? false,
      data.options ?? [],
    ],
  );
}

async function main() {
  const mobile = await ensureCategory("Mobile");
  const bangles = await ensureCategory("Bangles");

  await ensureAttribute(mobile.id, {
    name: "RAM",
    key: "ram",
    type: "SELECT",
    options: ["4GB", "6GB", "8GB", "12GB"],
    required: true,
  });
  await ensureAttribute(mobile.id, {
    name: "Processor",
    key: "processor",
    type: "TEXT",
    required: true,
  });
  await ensureAttribute(mobile.id, {
    name: "Storage",
    key: "storage",
    type: "SELECT",
    options: ["64GB", "128GB", "256GB", "512GB"],
    required: true,
  });
  await ensureAttribute(mobile.id, {
    name: "Color",
    key: "color",
    type: "SELECT",
    options: ["Black", "Blue", "White"],
    required: false,
  });

  await ensureAttribute(bangles.id, {
    name: "Color",
    key: "color",
    type: "SELECT",
    options: ["Gold", "Rose Gold", "Silver"],
    required: true,
  });
  await ensureAttribute(bangles.id, {
    name: "Size",
    key: "size",
    type: "SELECT",
    options: ["2-2", "2-4", "2-6", "2-8"],
    required: true,
  });
  await ensureAttribute(bangles.id, {
    name: "Material",
    key: "material",
    type: "SELECT",
    options: ["Gold", "Brass", "Alloy"],
    required: true,
  });
  await ensureAttribute(bangles.id, {
    name: "Weight (g)",
    key: "weight_g",
    type: "NUMBER",
    unit: "g",
    required: false,
  });

  console.log("Seed completed.");
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });

