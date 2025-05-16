import { useState } from "react";
import { getProducts } from "../services/productService";
import type { Product } from "shared-ts";

export function useProducts() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    
    getProducts()
        .then((data) => setProducts(data))
        .catch((error) => setError(error.message))
        .finally(() => setIsLoading(false));

    return { products, isLoading, error };
}