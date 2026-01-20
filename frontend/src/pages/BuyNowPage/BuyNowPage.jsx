import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import BargainChatModal from "../../components/product-common/BargainModal/BargainChatModal";
import {
  getBuyNowSession,
  createOrder,
  calculateBargainResponse,
  acceptCounterOffer,
} from "../../services/buyNowService";
import styles from "./BuyNowPage.module.css";

const API_BASE = "http://localhost:5000";
const GIFT_BOX_FEE = 20;

export default function BuyNowPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Session data
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [customerForm, setCustomerForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    province: "",
    city: "",
    address: "",
    phone: "",
  });

  // Order options
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [giftBox, setGiftBox] = useState(false);

  // Bargain state
  const [bargainEnabled, setBargainEnabled] = useState(false);
  const [bargainDiscount, setBargainDiscount] = useState(0);
  const [bargainFinalPrice, setBargainFinalPrice] = useState(null);
  const [bargainChatLog, setBargainChatLog] = useState([]);
  const [showBargainModal, setShowBargainModal] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSession() {
      try {
        setLoading(true);
        const result = await getBuyNowSession(sessionId);
        
        if (!isMounted) return;
        
        if (result.success && result.session) {
          setSession(result.session);
          // Auto-select first shipping option
          if (result.session.shippingOptions?.length > 0) {
            setSelectedShipping(result.session.shippingOptions[0]);
          }
        } else {
          setError("Session not found or expired");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load session");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();
    return () => { isMounted = false; };
  }, [sessionId]);

  // Handle form changes
  const handleFormChange = useCallback((field, value) => {
    setCustomerForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [formErrors]);

  // Handle shipping selection
  const handleShippingSelect = useCallback((option) => {
    setSelectedShipping(option);
  }, []);

  // Handle bargain toggle - reset bargain when disabled
  const handleBargainToggle = useCallback((enabled) => {
    setBargainEnabled(enabled);
    if (!enabled) {
      setBargainDiscount(0);
      setBargainFinalPrice(null);
      setBargainChatLog([]);
    } else {
      setShowBargainModal(true);
    }
  }, []);

  // Handle bargain result from modal
  const handleBargainComplete = useCallback((discount, finalPrice, chatLog) => {
    setBargainDiscount(discount);
    setBargainFinalPrice(finalPrice);
    setBargainChatLog(chatLog);
    setShowBargainModal(false);
  }, []);

  // Calculate totals
  const subtotal = session ? (session.unitPrice * session.quantity) : 0;
  const shippingCharge = selectedShipping?.amount || 0;
  const giftBoxFee = giftBox ? GIFT_BOX_FEE : 0;
  const taxAmount = 0; // For future use
  const total = subtotal - bargainDiscount + shippingCharge + giftBoxFee + taxAmount;

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!customerForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!customerForm.firstName.trim()) errors.firstName = "First name is required";
    if (!customerForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!customerForm.province.trim()) errors.province = "Province is required";
    if (!customerForm.city.trim()) errors.city = "City is required";
    if (!customerForm.address.trim()) errors.address = "Address is required";
    
    if (!customerForm.phone.trim()) errors.phone = "Phone is required";
    else if (customerForm.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Phone must have at least 10 digits";
    }

    if (!selectedShipping) errors.shipping = "Please select a shipping option";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const orderData = {
        sessionId,
        shippingType: selectedShipping.label,
        shippingCharge: selectedShipping.amount,
        giftBox,
        bargainDiscount,
        bargainFinalPrice,
        bargainChatLog,
        customerEmail: customerForm.email,
        customerFirstName: customerForm.firstName,
        customerLastName: customerForm.lastName,
        customerProvince: customerForm.province,
        customerCity: customerForm.city,
        customerAddress: customerForm.address,
        customerPhone: customerForm.phone,
      };

      const result = await createOrder(orderData);

      if (result.success) {
        // Navigate to order confirmation page
        navigate(`/order-confirmation/${result.order.id}`);
      }
    } catch (err) {
      setFormErrors({ submit: err.message || "Failed to place order" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className={styles.page}>
          <div className={styles.loading}>Loading checkout...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <Layout>
        <div className={styles.page}>
          <div className={styles.error}>
            <h2>Session Error</h2>
            <p>{error || "Session not found"}</p>
            <button onClick={() => navigate(-1)} className={styles.backButton}>
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        {/* Back Button - Top Left */}
        <button
          type="button"
          className={styles.backButtonTop}
          onClick={() => navigate(-1)}
        >
          <svg 
            className={styles.backIcon} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>BACK</span>
        </button>

        <h1 className={styles.pageTitle}>Checkout</h1>

        <div className={styles.content}>
          {/* Left: Customer Details Form */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Customer Details</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  className={`${styles.input} ${formErrors.email ? styles.inputError : ""}`}
                  placeholder="your@email.com"
                />
                {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name *</label>
                  <input
                    type="text"
                    value={customerForm.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                    className={`${styles.input} ${formErrors.firstName ? styles.inputError : ""}`}
                    placeholder="John"
                  />
                  {formErrors.firstName && <span className={styles.errorText}>{formErrors.firstName}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    value={customerForm.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                    className={`${styles.input} ${formErrors.lastName ? styles.inputError : ""}`}
                    placeholder="Doe"
                  />
                  {formErrors.lastName && <span className={styles.errorText}>{formErrors.lastName}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Province *</label>
                  <input
                    type="text"
                    value={customerForm.province}
                    onChange={(e) => handleFormChange("province", e.target.value)}
                    className={`${styles.input} ${formErrors.province ? styles.inputError : ""}`}
                    placeholder="Bagmati"
                  />
                  {formErrors.province && <span className={styles.errorText}>{formErrors.province}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>City *</label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={(e) => handleFormChange("city", e.target.value)}
                    className={`${styles.input} ${formErrors.city ? styles.inputError : ""}`}
                    placeholder="Kathmandu"
                  />
                  {formErrors.city && <span className={styles.errorText}>{formErrors.city}</span>}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address *</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => handleFormChange("address", e.target.value)}
                  className={`${styles.textarea} ${formErrors.address ? styles.inputError : ""}`}
                  placeholder="Street address, apartment, etc."
                  rows={3}
                />
                {formErrors.address && <span className={styles.errorText}>{formErrors.address}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contact Number *</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className={`${styles.input} ${formErrors.phone ? styles.inputError : ""}`}
                  placeholder="98XXXXXXXX"
                />
                {formErrors.phone && <span className={styles.errorText}>{formErrors.phone}</span>}
              </div>
            </div>

            {/* Shipping Options */}
            <div className={styles.shippingSection}>
              <h3 className={styles.subSectionTitle}>Shipping Method</h3>
              {formErrors.shipping && <span className={styles.errorText}>{formErrors.shipping}</span>}
              
              <div className={styles.shippingOptions}>
                {session.shippingOptions?.map((option) => (
                  <label
                    key={option.id}
                    className={`${styles.shippingOption} ${selectedShipping?.id === option.id ? styles.shippingSelected : ""}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.id === option.id}
                      onChange={() => handleShippingSelect(option)}
                      className={styles.radioInput}
                    />
                    <div className={styles.shippingInfo}>
                      <span className={styles.shippingLabel}>{option.label}</span>
                      <span className={styles.shippingDesc}>{option.description}</span>
                    </div>
                    <span className={styles.shippingPrice}>Rs. {option.amount}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Order Summary */}
          <aside className={styles.summarySection}>
            {/* Product Preview */}
            <div className={styles.productPreview}>
              {session.productImage && (
                <img
                  src={`${API_BASE}${session.productImage}`}
                  alt={session.productName}
                  className={styles.productImage}
                />
              )}
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{session.productName}</h3>
                {session.selectedSize && (
                  <p className={styles.productSize}>Size: {session.selectedSize}</p>
                )}
                <p className={styles.productQty}>Qty: {session.quantity}</p>
              </div>
            </div>

            {/* Order Summary Card */}
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Price ({session.quantity} item{session.quantity > 1 ? "s" : ""})</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>Rs. {shippingCharge.toLocaleString()}</span>
                </div>
                {giftBox && (
                  <div className={styles.summaryRow}>
                    <span>Gift Box</span>
                    <span>Rs. {giftBoxFee.toLocaleString()}</span>
                  </div>
                )}
                {bargainDiscount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span>Bargain Discount</span>
                    <span>- Rs. {bargainDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.totalRow}>
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>

              {/* Gift Box Toggle */}
              <label className={styles.optionToggle}>
                <input
                  type="checkbox"
                  checked={giftBox}
                  onChange={(e) => setGiftBox(e.target.checked)}
                />
                <span>Add gift box (+Rs. {GIFT_BOX_FEE})</span>
              </label>

              {/* Bargain Toggle */}
              <label className={styles.optionToggle}>
                <input
                  type="checkbox"
                  checked={bargainEnabled}
                  onChange={(e) => handleBargainToggle(e.target.checked)}
                />
                <span>Bargain your price</span>
              </label>

              {bargainEnabled && bargainDiscount > 0 && (
                <div className={styles.bargainSummary}>
                  ✅ You saved Rs. {bargainDiscount.toLocaleString()}!
                  <button
                    type="button"
                    className={styles.bargainEditButton}
                    onClick={() => setShowBargainModal(true)}
                  >
                    Edit
                  </button>
                </div>
              )}

              {bargainEnabled && bargainDiscount === 0 && (
                <button
                  type="button"
                  className={styles.startBargainButton}
                  onClick={() => setShowBargainModal(true)}
                >
                  Start Bargaining
                </button>
              )}

              {/* Submit Error */}
              {formErrors.submit && (
                <div className={styles.submitError}>{formErrors.submit}</div>
              )}

              {/* Next Button */}
              <button
                type="button"
                className={styles.nextButton}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </aside>
        </div>

        {/* Bargain Modal */}
        {showBargainModal && (
          <BargainChatModal
            open={showBargainModal}
            subtotal={subtotal}
            initialChatLog={bargainChatLog}
            onComplete={handleBargainComplete}
            onClose={() => setShowBargainModal(false)}
          />
        )}
      </div>
    </Layout>
  );
}
