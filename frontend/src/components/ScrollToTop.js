import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Scrolls the page to the top whenever the route changes
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of page on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Use "instant" for immediate scroll, "smooth" for animated
    });
  }, [pathname]);

  return null;
}
