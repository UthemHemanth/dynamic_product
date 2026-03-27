CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_value_type') THEN
    CREATE TYPE attribute_value_type AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attribute_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  key VARCHAR(60) NOT NULL,
  type attribute_value_type NOT NULL,
  unit VARCHAR(20),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, key)
);

CREATE INDEX IF NOT EXISTS idx_attribute_definitions_category_id
  ON attribute_definitions(category_id);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(140) NOT NULL,
  description TEXT,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);

CREATE TABLE IF NOT EXISTS product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_select TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id
  ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product_id
  ON product_attribute_values(product_id);

