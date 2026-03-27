export const API_BASE = "http://localhost:4000/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json && (json.error as string)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export type Category = { id: string; name: string };
export type AttributeDefinition = {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT";
  unit?: string | null;
  required: boolean;
  options: string[];
};

export type Product = {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  highlights: string[];
  category: Category;
  attributes: Array<{
    id: string;
    attributeId: string;
    valueText?: string | null;
    valueNumber?: string | null;
    valueBoolean?: boolean | null;
    valueSelect?: string | null;
    attribute: AttributeDefinition;
  }>;
};

export const api = {
  listCategories: () => http<{ items: Category[] }>("/categories"),
  createCategory: (name: string) => http<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
  listAttributes: (categoryId: string) => http<{ items: AttributeDefinition[] }>(`/categories/${categoryId}/attributes`),
  createAttribute: (categoryId: string, body: Omit<AttributeDefinition, "id" | "categoryId">) =>
    http<AttributeDefinition>(`/categories/${categoryId}/attributes`, { method: "POST", body: JSON.stringify(body) }),
  createProduct: (body: {
    categoryId: string;
    title: string;
    description?: string;
    highlights: string[];
    attributes: Array<{ attributeId: string; value: string | number | boolean }>;
  }) => http<Product>("/products", { method: "POST", body: JSON.stringify(body) }),
  getProduct: (id: string) => http<Product>(`/products/${id}`),
  search: (body: any) => http<any>("/search", { method: "POST", body: JSON.stringify(body) }),
};

