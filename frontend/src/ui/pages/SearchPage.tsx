import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type AttributeDefinition, type Category, type Product } from "../api";

type Facet = {
  attribute: AttributeDefinition;
  options: Array<{ value: string; count: number }>;
};

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialCategoryId = params.get("categoryId") ?? "";

  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [q, setQ] = useState<string>("");
  const [defs, setDefs] = useState<AttributeDefinition[]>([]);
  const [filters, setFilters] = useState<Record<string, string[]>>({}); // key -> selected values
  const [items, setItems] = useState<Product[]>([]);
  const [facets, setFacets] = useState<Facet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCategories()
      .then((r) => setCats(r.items))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setError(null);
    if (!categoryId) {
      setDefs([]);
      setItems([]);
      setFacets([]);
      return;
    }
    api
      .listAttributes(categoryId)
      .then((r) => {
        setDefs(r.items);
        setFilters({});
      })
      .catch((e) => setError(e.message));
  }, [categoryId]);

  const requestBody = useMemo(() => {
    const f: Record<string, any> = {};
    for (const [k, arr] of Object.entries(filters)) {
      if (arr.length > 0) f[k] = arr;
    }
    return { categoryId, q: q.trim() ? q.trim() : undefined, filters: f, page: 1, pageSize: 20 };
  }, [categoryId, q, filters]);

  async function runSearch() {
    if (!categoryId) return;
    setError(null);
    try {
      const res = await api.search(requestBody);
      setItems(res.items ?? []);
      setFacets(res.facets ?? []);
      setParams((p) => {
        if (categoryId) p.set("categoryId", categoryId);
        else p.delete("categoryId");
        return p;
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    // initial run when arriving with categoryId
    if (categoryId) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  function toggleFilter(key: string, value: string) {
    setFilters((prev) => {
      const curr = new Set(prev[key] ?? []);
      if (curr.has(value)) curr.delete(value);
      else curr.add(value);
      return { ...prev, [key]: [...curr] };
    });
  }

  const facetsByKey = useMemo(() => {
    const m = new Map<string, Facet>();
    for (const f of facets) m.set(f.attribute.key, f);
    return m;
  }, [facets]);

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ margin: 0 }}>Search</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Filters are generated dynamically by the backend for the selected category (facets).
        </p>
        {error && (
          <div className="pill" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
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
            <label>Query</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description…" />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn primary" disabled={!categoryId} onClick={runSearch}>
            Search
          </button>
          <button
            className="btn"
            disabled={!categoryId}
            onClick={() => {
              setFilters({});
              setQ("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h3 style={{ margin: 0 }}>Filters</h3>
          {!categoryId ? (
            <p className="muted">Select a category.</p>
          ) : defs.length === 0 ? (
            <p className="muted">No attributes for this category.</p>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {defs.map((d) => {
                const facet = facetsByKey.get(d.key);
                const selected = new Set(filters[d.key] ?? []);

                // For demo: show checkboxes for non-NUMBER types using facet options.
                if (d.type === "NUMBER") {
                  return (
                    <div key={d.id}>
                      <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                        {d.name} (number)
                      </div>
                      <div className="muted">Numeric range filtering is supported by the API, but this UI keeps it simple.</div>
                    </div>
                  );
                }

                const opts = facet?.options ?? [];
                return (
                  <div key={d.id}>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                      {d.name}
                    </div>
                    {opts.length === 0 ? (
                      <div className="muted">No facet values yet.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {opts.slice(0, 20).map((o) => (
                          <label key={o.value} style={{ display: "flex", gap: 10, alignItems: "center", margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={selected.has(o.value)}
                              onChange={() => toggleFilter(d.key, o.value)}
                              style={{ width: 16, height: 16 }}
                            />
                            <span className="muted" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                              <span>{o.value}</span>
                              <span>({o.count})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {categoryId && (
            <div style={{ marginTop: 14 }}>
              <button className="btn primary" onClick={runSearch}>
                Apply filters
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ margin: 0 }}>Results</h3>
          {items.length === 0 ? (
            <p className="muted" style={{ marginTop: 10 }}>
              No results yet.
            </p>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {items.map((p) => (
                <div key={p.id} className="kv">
                  <div>
                    <b>{p.title}</b>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {p.category.name}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link className="btn" to={`/products/${p.id}`}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

