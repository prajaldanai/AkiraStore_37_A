import { useEffect } from "react";

export default function useGlobalSSE() {
  useEffect(() => {
    const es = new EventSource(
      "http://localhost:5000/api/products/subscribe"
    );

    es.addEventListener("product-update", () => {
      // 🔥 Notify entire app
      window.dispatchEvent(new Event("PRODUCT_UPDATED"));
    });

    es.onerror = () => {
      console.warn("🔴 Global SSE disconnected");
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);
}
