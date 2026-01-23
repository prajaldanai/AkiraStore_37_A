
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductImageGallery from "../../components/ProductDetails/ImageGallery/ProductImageGallery";
import ProductInfo from "../../components/ProductDetails/ProductInfo/ProductInfo";
import ProductDescription from "../../components/ProductDetails/ProductDescription/ProductDescription";
import ProductFeatures from "../../components/ProductDetails/ProductFeatures/ProductFeatures";
import ProductShipping from "../../components/ProductDetails/ProductShipping/ProductShipping";
import ProductRecommendations from "../../components/ProductDetails/ProductRecommendations/ProductRecommendations";
import ProductComments from "../../components/ProductDetails/ProductComments/ProductComments";
import Layout from "../../components/Layout/Layout";
import styles from "./ProductDetailsPage.module.css";

const API_BASE = "http://localhost:5000/api";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const productRes = await fetch(`${API_BASE}/products/${id}`);
        const productData = await productRes.json();
        if (!productRes.ok || !productData?.success) throw new Error("Product not found");
        if (!isMounted) return;
        setProduct(productData.product);
        
        // Fetch recommendations using the new smart endpoint
        try {
          const recRes = await fetch(`${API_BASE}/user/products/product/${id}/recommendations`);
          if (recRes.ok) {
            const recData = await recRes.json();
            if (isMounted && recData.success) {
              setRecommendations(recData.recommendations || []);
            }
          } else {
            setRecommendations([]);
          }
        } catch (recErr) {
          console.error("Failed to load recommendations:", recErr);
          setRecommendations([]);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load product");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <Layout><div className={styles.page}><p>Loading product...</p></div></Layout>;
  if (error) return <Layout><div className={styles.page}><p>{error}</p></div></Layout>;
  if (!product) return <Layout><div className={styles.page}><p>Product not available</p></div></Layout>;

  const { 
    images = [], 
    features = [], 
    sizes = [], 
    shipping = null, 
    description_short = "", 
    description_long = "", 
    description_long_summary = "",
    name, 
    price, 
    old_price, 
    avg_rating, 
    rating_count, 
    stock 
  } = product;

  return (
    <Layout>
      <div className={styles.page}>
        {/* Content with padding for bordered sections */}
        <div className={styles.pageContent}>
          {/* Main Product Box: 1440x871, white bg, 1px black border */}
          <div className={styles.topSection}>
          <ProductImageGallery images={images} />
          <ProductInfo
            productId={id}
            name={name}
            price={price}
            old_price={old_price}
            avg_rating={avg_rating}
            rating_count={rating_count}
            sizes={sizes}
            stock={stock}
            image={images?.[0] ?? ""}
          />
          </div>
          
          {/* Description Section: 3-column with borders */}
          <div className={styles.descriptionContainer}>
            <h2 className={styles.descriptionMainTitle}>Description</h2>
            <div className={styles.descriptionDivider}></div>
            <div className={styles.middleSection}>
              <ProductDescription 
                productName={name}
                descriptionSummary={description_long_summary || description_long || description_short} 
              />
              <ProductFeatures features={features} />
              <ProductShipping shipping={shipping} />
            </div>
          </div>
          
          {recommendations.length > 0 && (
            <ProductRecommendations items={recommendations} />
          )}
        </div>
        
        {/* Full-width Comments Section - outside content wrapper */}
        <ProductComments productId={id} />
      </div>
    </Layout>
  );
}
