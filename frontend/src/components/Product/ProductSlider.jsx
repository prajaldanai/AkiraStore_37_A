import React, { useRef, useEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "./ProductCard";

export default function ProductSlider({ items = [] }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  const stableItems = useMemo(() => items, [items]);
  const hasEnoughSlides = stableItems.length >= 3;

  useEffect(() => {
    if (
      swiperRef.current &&
      prevRef.current &&
      nextRef.current
    ) {
      swiperRef.current.params.navigation.prevEl = prevRef.current;
      swiperRef.current.params.navigation.nextEl = nextRef.current;

      swiperRef.current.navigation.destroy();
      swiperRef.current.navigation.init();
      swiperRef.current.navigation.update();
    }
  }, [stableItems.length]);

  return (
    <div className="slider-wrapper full-slider">
      <button ref={prevRef} className="slider-nav-btn slider-prev">
        ❮
      </button>

      <button ref={nextRef} className="slider-nav-btn slider-next">
        ❯
      </button>

      <Swiper
        modules={[Navigation]}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        slidesPerView={3}
        spaceBetween={30}
        loop={hasEnoughSlides}
        centeredSlides={false}
        breakpoints={{
          320: { slidesPerView: 1, spaceBetween: 10 },
          640: { slidesPerView: 2, spaceBetween: 15 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
        }}
      >
        {stableItems.map((item) => (
          <SwiperSlide key={item.id} className="full-slide-card">
            <ProductCard item={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
