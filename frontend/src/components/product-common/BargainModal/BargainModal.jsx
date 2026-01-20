import React from "react";
import styles from "./BargainModal.module.css";

export default function BargainModal({
  open,
  title = "Bargain Live",
  subtitle = "Chat with us to unlock a better price.",
  messages = [],
  inputValue = "",
  suggestions = [],
  isSending = false,
  onInputChange,
  onSend,
  onSuggestionClick,
  onClose,
}) {
  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSend) onSend(inputValue);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </header>

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <p className={styles.empty}>No messages yet. Start the conversation.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={msg.sender === "user" ? styles.userMessage : styles.agentMessage}
              >
                <span className={styles.messageText}>{msg.text}</span>
                {msg.time && <span className={styles.time}>{msg.time}</span>}
              </div>
            ))
          )}
        </div>

        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                className={styles.suggestionButton}
                onClick={() => onSuggestionClick && onSuggestionClick(item)}
              >
                {item.label || item.text || String(item)}
              </button>
            ))}
          </div>
        )}

        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange && onInputChange(event.target.value)}
            placeholder="Type your offer or question"
            className={styles.input}
          />
          <button type="submit" className={styles.sendButton} disabled={isSending}>
            {isSending ? "Sending" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
