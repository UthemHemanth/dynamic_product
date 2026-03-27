import { useEffect, useMemo, useState } from "react";
import { api, type AttributeDefinition, type Category } from "../api";

export function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [attrs, setAttrs] = useState<AttributeDefinition[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [attrDraft, setAttrDraft] = useState({
    name: "",
    key: "",
    type: "TEXT" as AttributeDefinition["type"],
    unit: "",
    required: false,
    options: "",
  });

  const optionsParsed = useMemo(
    () =>
      attrDraft.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [attrDraft.options],
  );

  async function reload() {
    const res = await api.listCategories();
    setCats(res.items);
    if (selected) {
      const still = res.items.find((c) => c.id === selected.id) ?? null;
      setSelected(still);
    }
  }

  useEffect(() => {
    reload().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) {
      setAttrs([]);
      return;
    }
    api
      .listAttributes(selected.id)
      .then((r) => setAttrs(r.items))
      .catch((e) => setError(e.message));
  }, [selected]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ margin: 0 }}>Categories</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Create categories and dynamic attributes. The frontend renders forms/filters from these definitions.
        </p>
        {error && (
          <div className="pill" style={{ borderColor: "rgba(239,68,68,0.5)", color: "rgba(255,255,255,0.9)" }}>
            {error}
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>New category name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Laptops" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
            <button
              className="btn primary"
              onClick={async () => {
                setError(null);
                try {
                  const c = await api.createCategory(name);
                  setName("");
                  await reload();
                  setSelected(c);
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              Create
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button
              key={c.id}
              className="btn"
              onClick={() => setSelected(c)}
              style={{
                borderColor: selected?.id === c.id ? "rgba(124,92,255,0.65)" : undefined,
                background: selected?.id === c.id ? "rgba(124,92,255,0.12)" : undefined,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: 0 }}>Attributes {selected ? <span className="muted">for {selected.name}</span> : null}</h3>
        {!selected ? (
          <p className="muted">Select a category to manage its attributes.</p>
        ) : (
          <>
            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label>Attribute name</label>
                <input value={attrDraft.name} onChange={(e) => setAttrDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div>
                <label>Key (snake_case)</label>
                <input value={attrDraft.key} onChange={(e) => setAttrDraft((d) => ({ ...d, key: e.target.value }))} />
              </div>
              <div>
                <label>Type</label>
                <select value={attrDraft.type} onChange={(e) => setAttrDraft((d) => ({ ...d, type: e.target.value as any }))}>
                  <option value="TEXT">TEXT</option>
                  <option value="NUMBER">NUMBER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="SELECT">SELECT</option>
                </select>
              </div>
              <div>
                <label>Unit (optional)</label>
                <input value={attrDraft.unit} onChange={(e) => setAttrDraft((d) => ({ ...d, unit: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Options (comma-separated, only for SELECT)</label>
                <input
                  value={attrDraft.options}
                  onChange={(e) => setAttrDraft((d) => ({ ...d, options: e.target.value }))}
                  placeholder="e.g. 64GB,128GB,256GB"
                />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={{ width: 18, height: 18 }}
                  type="checkbox"
                  checked={attrDraft.required}
                  onChange={(e) => setAttrDraft((d) => ({ ...d, required: e.target.checked }))}
                />
                <span className="muted">Required</span>
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
                <button
                  className="btn primary"
                  onClick={async () => {
                    setError(null);
                    try {
                      await api.createAttribute(selected.id, {
                        name: attrDraft.name,
                        key: attrDraft.key,
                        type: attrDraft.type,
                        unit: attrDraft.unit ? attrDraft.unit : undefined,
                        required: attrDraft.required,
                        options: optionsParsed,
                      });
                      setAttrDraft({ name: "", key: "", type: "TEXT", unit: "", required: false, options: "" });
                      const r = await api.listAttributes(selected.id);
                      setAttrs(r.items);
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  Add attribute
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }} className="kvs">
              {attrs.length === 0 ? (
                <p className="muted">No attributes yet.</p>
              ) : (
                attrs.map((a) => (
                  <div key={a.id} className="kv">
                    <div>
                      <b>{a.name}</b> <span className="muted">({a.key})</span>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {a.type} {a.unit ? `· ${a.unit}` : ""} {a.required ? "· required" : ""}
                      </div>
                    </div>
                    <div className="muted" style={{ textAlign: "right" }}>
                      {a.type === "SELECT" ? a.options.join(", ") : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

