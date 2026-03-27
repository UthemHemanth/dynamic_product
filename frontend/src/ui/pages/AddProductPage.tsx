import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type AttributeDefinition, type Category } from "../api";

type AttrInput = Record<string, string>; // attributeId -> raw string

export function AddProductPage() {
  const nav = useNavigate();
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [attrs, setAttrs] = useState<AttributeDefinition[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [attrInput, setAttrInput] = useState<AttrInput>({});
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCategories()
      .then((r) => setCats(r.items))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setCreatedId(null);
    setError(null);
    if (!categoryId) {
      setAttrs([]);
      setAttrInput({});
      return;
    }
    api
      .listAttributes(categoryId)
      .then((r) => {
        setAttrs(r.items);
        const next: AttrInput = {};
        for (const a of r.items) next[a.id] = "";
        setAttrInput(next);
      })
      .catch((e) => setError(e.message));
  }, [categoryId]);

  const highlights = useMemo(
    () =>
      highlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [highlightsText],
  );

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ margin: 0 }}>Add Product</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Choose a category and the attribute fields will be generated dynamically from backend definitions.
        </p>

        {error && (
          <div className="pill" style={{ borderColor: "rgba(239,68,68,0.5)", color: "rgba(255,255,255,0.9)" }}>
            {error}
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pixel 9 128GB" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Long description…" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Highlights (one per line)</label>
          <textarea value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} placeholder="Fast processor\nGreat camera\n…" />
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: 0 }}>Dynamic attributes</h3>
        {!categoryId ? (
          <p className="muted">Select a category to see its attributes.</p>
        ) : attrs.length === 0 ? (
          <p className="muted">
            No attributes for this category yet. Create some in <Link to="/">Categories</Link>.
          </p>
        ) : (
          <div className="row" style={{ marginTop: 12 }}>
            {attrs.map((a) => {
              const raw = attrInput[a.id] ?? "";
              const common = {
                value: raw,
                onChange: (e: any) => setAttrInput((m) => ({ ...m, [a.id]: e.target.value })),
              };

              if (a.type === "SELECT") {
                return (
                  <div key={a.id}>
                    <label>
                      {a.name} {a.required ? "*" : ""} <span className="muted">({a.key})</span>
                    </label>
                    <select {...common}>
                      <option value="">Select…</option>
                      {a.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (a.type === "BOOLEAN") {
                return (
                  <div key={a.id}>
                    <label>
                      {a.name} {a.required ? "*" : ""} <span className="muted">({a.key})</span>
                    </label>
                    <select {...common}>
                      <option value="">Select…</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </div>
                );
              }

              return (
                <div key={a.id}>
                  <label>
                    {a.name} {a.required ? "*" : ""} <span className="muted">({a.key})</span>
                  </label>
                  <input
                    {...common}
                    placeholder={a.type === "NUMBER" ? `Number${a.unit ? ` (${a.unit})` : ""}` : "Text"}
                    inputMode={a.type === "NUMBER" ? "decimal" : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn primary"
            disabled={!categoryId || !title.trim()}
            onClick={async () => {
              setError(null);
              setCreatedId(null);
              try {
                const attributePairs = attrs
                  .map((a) => ({ def: a, raw: (attrInput[a.id] ?? "").trim() }))
                  .filter((x) => x.raw.length > 0);

                const attributes = attributePairs.map(({ def, raw }) => {
                  let value: string | number | boolean = raw;
                  if (def.type === "NUMBER") value = Number(raw);
                  if (def.type === "BOOLEAN") value = raw === "true";
                  return { attributeId: def.id, value };
                });

                const p = await api.createProduct({
                  categoryId,
                  title: title.trim(),
                  description: description.trim() ? description.trim() : undefined,
                  highlights,
                  attributes,
                });
                setCreatedId(p.id);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Create product
          </button>

          {createdId && (
            <>
              <Link className="btn" to={`/products/${createdId}`}>
                View details
              </Link>
              <button className="btn" onClick={() => nav(`/search?categoryId=${encodeURIComponent(categoryId)}`)}>
                Search in category
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

