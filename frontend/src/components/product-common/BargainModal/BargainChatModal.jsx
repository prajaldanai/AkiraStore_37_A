import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  calculateBargainResponse,
  acceptCounterOffer,
} from "../../../services/buyNowService";
import styles from "./BargainChatModal.module.css";

const MAX_ATTEMPTS = 3;

/**
 * Format timestamp for chat messages
 */
function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Generate unique message ID
 */
function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function BargainChatModal({
  open,
  subtotal,
  initialChatLog = [],
  onComplete,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(null);
  const [pendingCounterOffer, setPendingCounterOffer] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with existing chat log or welcome message
  useEffect(() => {
    if (initialChatLog.length > 0) {
      setMessages(initialChatLog);
      // Count existing user attempts
      const userAttempts = initialChatLog.filter(m => m.sender === "user" && m.type === "offer").length;
      setAttemptCount(userAttempts);
      // Check if already complete
      const lastMessage = initialChatLog[initialChatLog.length - 1];
      if (lastMessage?.accepted) {
        setIsComplete(true);
        setDiscount(lastMessage.discount || 0);
        setFinalPrice(lastMessage.finalPrice || null);
      }
    } else {
      // Welcome message from owner - DO NOT reveal max discount
      const welcomeMessage = {
        id: generateId(),
        sender: "owner",
        text: `Welcome! 👋 The price is Rs. ${subtotal.toLocaleString()}. Make me an offer and let's see if we can work something out!`,
        time: formatTime(new Date()),
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [initialChatLog, subtotal]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && !isComplete) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, isComplete]);

  // Handle sending an offer
  const handleSendOffer = useCallback(() => {
    const value = inputValue.trim();
    if (!value || isComplete) return;

    // Parse the offer price
    const offerPrice = parseFloat(value.replace(/[^\d.]/g, ""));

    if (isNaN(offerPrice) || offerPrice <= 0) {
      // Invalid input message
      const errorMessage = {
        id: generateId(),
        sender: "owner",
        text: "Please enter a valid price amount.",
        time: formatTime(new Date()),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setInputValue("");
      return;
    }

    // Add user message
    const userMessage = {
      id: generateId(),
      sender: "user",
      type: "offer",
      text: `I can pay Rs. ${offerPrice.toLocaleString()}`,
      offerPrice,
      time: formatTime(new Date()),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    // Calculate response
    const response = calculateBargainResponse(subtotal, offerPrice, newAttemptCount);

    // Add owner response after a short delay (simulate typing)
    setTimeout(() => {
      const ownerMessage = {
        id: generateId(),
        sender: "owner",
        text: response.message,
        time: formatTime(new Date()),
        timestamp: Date.now(),
        accepted: response.accepted,
        discount: response.discount,
        counterOffer: response.counterOffer,
        canAcceptCounter: response.canAcceptCounter,
      };

      setMessages(prev => [...prev, ownerMessage]);

      if (response.accepted) {
        setIsComplete(true);
        setDiscount(response.discount);
        setFinalPrice(subtotal - response.discount);
      } else if (response.canAcceptCounter) {
        setPendingCounterOffer(response.counterOffer);
      }

      // If final and not accepted, show that they can accept counter offer
      if (response.isFinal && !response.accepted && response.canAcceptCounter) {
        // They can still accept the counter offer
      }
    }, 800);
  }, [inputValue, isComplete, attemptCount, subtotal]);

  // Handle accepting counter offer
  const handleAcceptCounterOffer = useCallback(() => {
    if (!pendingCounterOffer || isComplete) return;

    // Add user acceptance message
    const userMessage = {
      id: generateId(),
      sender: "user",
      type: "accept",
      text: `Okay, I'll take Rs. ${pendingCounterOffer.toLocaleString()}`,
      time: formatTime(new Date()),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    const result = acceptCounterOffer(subtotal, pendingCounterOffer);

    // Add owner confirmation
    setTimeout(() => {
      const ownerMessage = {
        id: generateId(),
        sender: "owner",
        text: `${result.message} 🎉`,
        time: formatTime(new Date()),
        timestamp: Date.now(),
        accepted: true,
        discount: result.discount,
        finalPrice: result.finalPrice,
      };

      setMessages(prev => [...prev, ownerMessage]);
      setIsComplete(true);
      setDiscount(result.discount);
      setFinalPrice(result.finalPrice);
      setPendingCounterOffer(null);
    }, 600);
  }, [pendingCounterOffer, isComplete, subtotal]);

  // Handle declining and closing
  const handleDecline = useCallback(() => {
    // User doesn't want to bargain
    onComplete(0, null, messages);
    onClose();
  }, [messages, onComplete, onClose]);

  // Handle confirming the bargain
  const handleConfirm = useCallback(() => {
    onComplete(discount, finalPrice, messages);
    onClose();
  }, [discount, finalPrice, messages, onComplete, onClose]);

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendOffer();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.ownerAvatar}>🛍️</div>
            <div>
              <h3 className={styles.title}>Akira Store</h3>
              <p className={styles.subtitle}>
                {isComplete ? "Bargain Complete" : "Let's negotiate!"}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Price Info Bar - NO max discount shown */}
        <div className={styles.priceBar}>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Original Price</span>
            <span className={styles.priceValue}>Rs. {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className={`${styles.priceItem} ${styles.priceItemSuccess}`}>
              <span className={styles.priceLabel}>Your Discount</span>
              <span className={styles.priceValue}>Rs. {discount.toLocaleString()}</span>
            </div>
          )}
          {finalPrice && (
            <div className={`${styles.priceItem} ${styles.priceItemSuccess}`}>
              <span className={styles.priceLabel}>Final Price</span>
              <span className={styles.priceValue}>Rs. {finalPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.sender === "user" ? styles.userMessage : styles.ownerMessage}
            >
              <span className={styles.messageText}>{msg.text}</span>
              <span className={styles.time}>{msg.time}</span>
            </div>
          ))}
          
          {/* Counter offer accept button */}
          {pendingCounterOffer && !isComplete && (
            <div className={styles.counterOfferBar}>
              <span>Owner's offer: Rs. {pendingCounterOffer.toLocaleString()}</span>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={handleAcceptCounterOffer}
              >
                Accept Offer
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Attempts indicator */}
        {!isComplete && (
          <div className={styles.attemptsBar}>
            <span>Offers: {attemptCount}/{MAX_ATTEMPTS}</span>
            {attemptCount >= MAX_ATTEMPTS && !pendingCounterOffer && (
              <span className={styles.attemptsWarning}>No more offers allowed</span>
            )}
          </div>
        )}

        {/* Input Area */}
        {!isComplete ? (
          <div className={styles.inputArea}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your offer price (e.g., 1500)"
              className={styles.input}
              disabled={attemptCount >= MAX_ATTEMPTS && !pendingCounterOffer}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={handleSendOffer}
              disabled={!inputValue.trim() || (attemptCount >= MAX_ATTEMPTS && !pendingCounterOffer)}
            >
              Send
            </button>
          </div>
        ) : (
          <div className={styles.completeArea}>
            <div className={styles.completeMessage}>
              {discount > 0 ? (
                <>🎉 You saved Rs. {discount.toLocaleString()}!</>
              ) : (
                <>No discount applied</>
              )}
            </div>
            <div className={styles.completeButtons}>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleConfirm}
              >
                Apply Discount
              </button>
            </div>
          </div>
        )}

        {/* Footer with decline option */}
        {!isComplete && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.declineButton}
              onClick={handleDecline}
            >
              Skip Bargaining
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
