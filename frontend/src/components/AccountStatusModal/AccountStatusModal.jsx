import styles from './AccountStatusModal.module.css';

/**
 * AccountStatusModal
 * Shows a modal when user account is suspended or blocked
 */
export default function AccountStatusModal({ 
  isOpen, 
  onClose, 
  statusCode, 
  message, 
  suspendedUntil 
}) {
  if (!isOpen) return null;

  const isBlocked = statusCode === 'BLOCKED';
  const isSuspended = statusCode === 'SUSPENDED';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Icon */}
        <div className={`${styles.iconWrapper} ${isBlocked ? styles.blocked : styles.suspended}`}>
          {isBlocked ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M4.93 4.93l14.14 14.14"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className={styles.title}>
          {isBlocked ? 'Account Blocked' : 'Account Suspended'}
        </h2>

        {/* Message */}
        <p className={styles.message}>
          {message || (isBlocked 
            ? 'Your account has been blocked. Please contact support for assistance.'
            : 'Your account is temporarily suspended.'
          )}
        </p>

        {/* Suspended Until Date */}
        {isSuspended && suspendedUntil && (
          <div className={styles.dateInfo}>
            <span className={styles.dateLabel}>Suspension ends:</span>
            <span className={styles.dateValue}>{formatDate(suspendedUntil)}</span>
          </div>
        )}

        {/* Support Info */}
        <div className={styles.supportInfo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>If you believe this is a mistake, please contact our support team.</span>
        </div>

        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          Understood
        </button>
      </div>
    </div>
  );
}
