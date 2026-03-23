import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
    clearTimeout(timers.current[id]);
  }, []);

  const toast = useCallback((message, type = 'info', duration = 3800) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience helpers
  toast.success = (msg, ms) => toast(msg, 'success', ms);
  toast.error   = (msg, ms) => toast(msg, 'error',   ms);
  toast.warning = (msg, ms) => toast(msg, 'warning',  ms);
  toast.info    = (msg, ms) => toast(msg, 'info',    ms);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast--${t.type}${t.leaving ? ' toast--out' : ''}`}
            role="status"
          >
            <span className="toast-icon" aria-hidden="true">
              {t.type === 'success' && '✓'}
              {t.type === 'error'   && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info'    && 'ℹ'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
