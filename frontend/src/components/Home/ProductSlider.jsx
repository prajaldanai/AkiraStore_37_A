// src/components/Home/ProductSlider.jsx
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
    if (swiperRef.current && swiperRef.current.params) {
      swiperRef.current.params.navigation.prevEl = prevRef.current;
      swiperRef.current.params.navigation.nextEl = nextRef.current;
      swiperRef.current.navigation.init();
      swiperRef.current.navigation.update();
    }
  }, []);

  return (
    <div className="slider-wrapper full-slider">

      {/* Navigation Buttons */}
      <button ref={prevRef} className="slider-nav-btn slider-prev">
        ❮
      </button>

      <button ref={nextRef} className="slider-nav-btn slider-next">
        ❯
      </button>

      {/* ALWAYS SHOW 3 FULL CARDS — NO SIDE GAPS */}
      <Swiper
        key={stableItems.length}
        modules={[Navigation]}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        slidesPerView={3}               // ⭐ Always exactly 3 full cards
        spaceBetween={30}               // ⭐ Perfect spacing
        loop={hasEnoughSlides}          // Only loop if items >= 3
        centeredSlides={false}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
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
