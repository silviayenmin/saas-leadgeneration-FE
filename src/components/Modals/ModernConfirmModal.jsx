import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, Info, CreditCard } from 'lucide-react';
import '../../pages/Pages.scss';

export default function ModernConfirmModal({
  show,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirm = true
}) {
  if (!show) return null;

  return createPortal(
    <div className="global-modal-overlay">
      <div className="modern-alert-card">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onCancel}
          title="Close dialog"
        >
          <X size={14} />
        </button>

        {/* Icon Aura */}
        <div className={`alert-icon-aura ${type === 'danger' ? 'error-aura' : type === 'credit' ? 'credit-aura' : 'info-aura'}`}>
          {type === 'danger' ? (
            <Trash2 size={28} />
          ) : type === 'credit' ? (
            <CreditCard size={28} />
          ) : (
            <Info size={28} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'center' }}>
          <h3 className="alert-title">
            {title || (type === 'danger' ? 'Confirm Action' : 'Notification')}
          </h3>
          <p className="alert-message">
            {message}
          </p>
        </div>

        <div className="alert-actions-row">
          {isConfirm ? (
            <>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={onConfirm}
                style={{
                  background: type === 'danger' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : undefined,
                  boxShadow: type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : undefined
                }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-modal-primary"
              onClick={onCancel}
              style={{ width: '100%' }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
