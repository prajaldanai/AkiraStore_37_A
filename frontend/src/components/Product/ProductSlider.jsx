import React, { useRef, useState, useEffect, memo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import styles from "./ProductSlider.module.css";
import ProductCard from "./ProductCard";

/**
 * MemoizedProductCard - Prevents re-render unless item ID changes
 * Rating state is managed internally by useRating hook.
 */
const MemoizedProductCard = memo(ProductCard, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id;
});

/**
 * ProductSlider - Swiper-based carousel for products
 * 
 * FIXED: "Cannot read properties of undefined (reading 'navigation')"
 * 
 * The error occurred because:
 * 1. prevRef.current and nextRef.current are NULL during first render
 * 2. Swiper tries to init navigation with null elements
 * 3. onBeforeInit accessed swiper.params.navigation before it was defined
 * 
 * THE FIX:
 * 1. Use useState to track when Swiper instance is ready
 * 2. Pass navigation config with refs AFTER they're mounted
 * 3. Use onSwiper callback to store Swiper instance
 * 4. Manually update navigation after both refs and Swiper are ready
 * 5. NO manual navigation.destroy/init/update calls
 */
function ProductSlider({ items = [] }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState(null);

  /**
   * Update navigation AFTER Swiper is initialized AND refs are mounted.
   * This runs once when swiperInstance becomes available.
   */
  useEffect(() => {
    if (swiperInstance && prevRef.current && nextRef.current) {
      // Assign navigation elements to Swiper params
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;
      
      // Re-initialize navigation with the new elements
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance]);

  // Don't render empty slider
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.sliderWrapper}>
      {/* Navigation Buttons - type="button" prevents form submit */}
      <button
        ref={prevRef}
        className={`${styles.navBtn} ${styles.prev}`}
        type="button"
        aria-label="Previous slide"
      >
        ❮
      </button>

      <button
        ref={nextRef}
        className={`${styles.navBtn} ${styles.next}`}
        type="button"
        aria-label="Next slide"
      >
        ❯
      </button>

      <Swiper
        modules={[Navigation]}
        onSwiper={setSwiperInstance}
        slidesPerView={3}
        spaceBetween={28}
        loop={false}              /* CRITICAL: Disabled to prevent DOM cloning */
        rewind={true}             /* Allow cycling without cloning */
        observer={false}          /* CRITICAL: Disabled to prevent rebuilds */
        observeParents={false}    /* CRITICAL: Disabled to prevent rebuilds */
        watchSlidesProgress={false}
        navigation={{
          // Placeholders - will be replaced in useEffect
          prevEl: null,
          nextEl: null,
        }}
        className={styles.swiper}
      >
        {items.map((item) => (
          <SwiperSlide key={`slide-${item.id}`} className={styles.slide}>
            <MemoizedProductCard item={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

/**
 * Memoize ProductSlider - only re-render if product IDs change.
 * This prevents Swiper rebuild when parent re-renders with same products.
 */
export default memo(ProductSlider, (prevProps, nextProps) => {
  const prevIds = (prevProps.items || []).map(i => i.id).join(',');
  const nextIds = (nextProps.items || []).map(i => i.id).join(',');
  return prevIds === nextIds;
});

