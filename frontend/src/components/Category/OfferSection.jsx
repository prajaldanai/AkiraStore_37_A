import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import "./style/offer.css";

import womenOffer from "../../assets/images/model.png";
import menOffer from "../../assets/images/Image-Source-PlusPNG.com.png";
import kidsOffer from "../../assets/images/11481915.png";

/* ✅ MUST MATCH DATABASE */
const CATEGORY_ID_MAP = {
  men: 1,
  women: 2,
  kids: 3,
  shoes: 4,        // ✅ ADD THIS
  electronics: 7,  // ✅ OPTIONAL (future)
};

export default function OfferSection({ category, onOffersLoaded }) {
  const [offers, setOffers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  const countdownIntervalRef = useRef(null);
  const expiryTimeoutRef = useRef(null);

  const OFFER_IMAGE_MAP = {
    women: womenOffer,
    men: menOffer,
    kids: kidsOffer,
    shoes: womenOffer, // ✅ REUSE WOMEN IMAGE FOR SHOES
    electronics: womenOffer,// can change later if wanted

  };

  const offerImage = OFFER_IMAGE_MAP[category] || womenOffer;

  const fetchOffers = useCallback(async () => {
    if (!category) return;

    try {
      const res = await fetch(
        "http://localhost:5000/api/user/products/exclusive-offers"
      );
      const data = await res.json();

      const now = Date.now();
      const categoryId = CATEGORY_ID_MAP[category];

      const activeOffers = Array.isArray(data)
        ? data.filter(
            o =>
              o.category_id === categoryId &&
              o.exclusive_offer_end &&
              new Date(o.exclusive_offer_end).getTime() > now
          )
        : [];

      setOffers(activeOffers);

      if (onOffersLoaded) onOffersLoaded(activeOffers);
    } catch (err) {
      console.error("❌ Exclusive offer fetch failed", err);
      setOffers([]);
      if (onOffersLoaded) onOffersLoaded([]);
    } finally {
      setLoading(false);
    }
  }, [category, onOffersLoaded]);

  useEffect(() => {
    setLoading(true);
    fetchOffers();

    return () => {
      clearInterval(countdownIntervalRef.current);
      clearTimeout(expiryTimeoutRef.current);
    };
  }, [fetchOffers]);

  const nearestEnd = useMemo(() => {
    if (!offers.length) return null;
    return Math.min(
      ...offers.map(o => new Date(o.exclusive_offer_end).getTime())
    );
  }, [offers]);

  useEffect(() => {
    clearInterval(countdownIntervalRef.current);
    clearTimeout(expiryTimeoutRef.current);

    if (!nearestEnd) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const diff = nearestEnd - Date.now();

      if (diff <= 0) {
        setOffers([]);
        setTimeLeft(null);
        fetchOffers();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    expiryTimeoutRef.current = setTimeout(
      fetchOffers,
      nearestEnd - Date.now()
    );

    return () => {
      clearInterval(countdownIntervalRef.current);
      clearTimeout(expiryTimeoutRef.current);
    };
  }, [nearestEnd, fetchOffers]);

  if (loading) {
    return (
      <section className="offer-wrapper no-offer">
        <p className="no-offer-text">⏳ Loading exclusive offers…</p>
      </section>
    );
  }

  if (!offers.length) {
    return (
      <section className="offer-wrapper no-offer">
        <p className="no-offer-text">
          🌟 <strong>New exclusive offers are coming soon!</strong>
          <br />
          Stay tuned for exciting deals and limited-time discounts.
        </p>
      </section>
    );
  }

  return (
    <section className="offer-wrapper">
      <div className="offer-left">
        <img src={offerImage} alt="Exclusive Offer" />
      </div>

      <div className="offer-right">
        <h2>Exclusive Offers</h2>
        <p>Unlock the ultimate style upgrade with our exclusive offers</p>

        {timeLeft && (
          <div className="countdown">
            <span className="ends-label">Ends in:</span>

            <div className="box"><span>{timeLeft.days}</span>Days</div>
            <div className="box"><span>{timeLeft.hours}</span>hrs</div>
            <div className="box"><span>{timeLeft.minutes}</span>min</div>
            <div className="box"><span>{timeLeft.seconds}</span>sec</div>
          </div>
        )}

        <p className="offer-count">
          🔥 {offers.length} exclusive deal
          {offers.length > 1 ? "s" : ""} live now
        </p>
      </div>
    </section>
  );
}
