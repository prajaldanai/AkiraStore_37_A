import React, { useEffect, useState } from "react";
import "./style/offer.css";

export default function OfferSection({ offer, config }) {
  // Hooks ALWAYS at the top
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
  });

  // Run countdown logic safely
  useEffect(() => {
    if (!offer || !offer.exclusive_offer_end) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(offer.exclusive_offer_end);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft({ days, hours, mins });
    }, 1000);

    return () => clearInterval(timer);
  }, [offer]);

  // If no offer, return nothing — this is allowed
  if (!offer) return null;

  return (
    <div className="offer-wrapper">
      <div className="offer-left">
        <img src={offer.images?.[0]} alt="Exclusive Offer" />
      </div>

      <div className="offer-right">
        <h2>Exclusive Offer</h2>

        <p className="save-text">
          Enjoy savings up to <strong>30–50%</strong> on selected items
        </p>

        <div className="countdown">
          <div className="box">
            <span>{timeLeft.days}</span>
            Days
          </div>
          <div className="box">
            <span>{timeLeft.hours}</span>
            Hours
          </div>
          <div className="box">
            <span>{timeLeft.mins}</span>
            Mins
          </div>
        </div>
      </div>
    </div>
  );
}
