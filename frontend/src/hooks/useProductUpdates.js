import { useEffect } from "react";

export default function useProductUpdates(onUpdate) {
  useEffect(() => {
    const eventSource = new EventSource(
      "http://localhost:5000/api/products/subscribe"
    );

    eventSource.addEventListener("product-update", () => {
      console.log("🔄 Product update received");
      onUpdate(); // refetch products
    });

    eventSource.onerror = () => {
      console.warn("❌ SSE connection lost");
    };

    return () => {
      eventSource.close();
    };
  }, [onUpdate]);
}
