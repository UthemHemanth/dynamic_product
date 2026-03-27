import express from "express";
import cors from "cors";
import { categoryRoutes } from "./features/categories/category.routes.js";
import { productRoutes } from "./features/products/product.routes.js";
import { errorHandler, notFoundHandler } from "./http/middleware.js";
export function createApp() {
    const app = express();
    app.use(cors({
        origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
        credentials: false,
    }));
    app.use(express.json({ limit: "1mb" }));
    app.get("/health", (_req, res) => res.json({ ok: true }));
    app.use("/api", categoryRoutes());
    app.use("/api", productRoutes());
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
