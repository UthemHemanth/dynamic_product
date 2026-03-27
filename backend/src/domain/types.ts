export type AttributeValueType = "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT";

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AttributeDefinition = {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: AttributeValueType;
  unit: string | null;
  required: boolean;
  options: string[];
  createdAt: string;
  updatedAt: string;
};

