import { Link, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { AddProductPage } from "./pages/AddProductPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { SearchPage } from "./pages/SearchPage";

export function App() {
  return (
    <div className="container">
      <div className="nav">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/">Categories</Link>
          <Link to="/add-product">Add Product</Link>
          <Link to="/search">Search</Link>
        </div>
        <span className="pill">React Admin + backend-driven schema</span>
      </div>

      <Routes>
        <Route path="/" element={<CategoriesPage />} />
        <Route path="/add-product" element={<AddProductPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </div>
  );
}

