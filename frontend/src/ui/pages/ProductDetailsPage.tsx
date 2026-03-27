import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Product } from "../api";

function renderValue(pav: Product["attributes"][number]) {
  const t = pav.attribute.type;
  if (t === "TEXT") return pav.valueText ?? "";
  if (t === "SELECT") return pav.valueSelect ?? "";
  if (t === "BOOLEAN") return typeof pav.valueBoolean === "boolean" ? String(pav.valueBoolean) : "";
  if (t === "NUMBER") return pav.valueNumber ?? "";
  return "";
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getProduct(id)
      .then((p) => setProduct(p))
      .catch((e) => setError(e.message));
  }, [id]);

  const sortedAttrs = useMemo(() => {
    if (!product) return [];
    return [...product.attributes].sort((a, b) => a.attribute.name.localeCompare(b.attribute.name));
  }, [product]);

  if (error) {
    return (
      <div className="card">
        <div className="pill" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>{product.title}</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Category: <b style={{ color: "rgba(255,255,255,0.92)" }}>{product.category.name}</b>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
            <Link className="btn" to={`/search?categoryId=${encodeURIComponent(product.categoryId)}`}>
              Search similar
            </Link>
            <Link className="btn" to="/add-product">
              Add another
            </Link>
          </div>
        </div>
      </div>

      {product.highlights.length > 0 && (
        <div className="card">
          <h3 style={{ margin: 0 }}>Highlights</h3>
          <ul>
            {product.highlights.map((h, idx) => (
              <li key={idx} className="muted" style={{ marginTop: 6 }}>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.description && (
        <div className="card">
          <h3 style={{ margin: 0 }}>Description</h3>
          <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
            {product.description}
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: 0 }}>Specifications</h3>
        {sortedAttrs.length === 0 ? (
          <p className="muted">No attributes saved for this product.</p>
        ) : (
          <div className="kvs" style={{ marginTop: 12 }}>
            {sortedAttrs.map((a) => (
              <div key={a.id} className="kv">
                <div>
                  <b>{a.attribute.name}</b> <span className="muted">({a.attribute.key})</span>
                </div>
                <div className="muted">
                  {renderValue(a)}
                  {a.attribute.unit ? ` ${a.attribute.unit}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

