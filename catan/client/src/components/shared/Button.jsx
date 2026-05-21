export default function Button({ children, onClick, disabled, variant = 'primary', style }) {
  const base = {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1, transition: 'opacity 0.15s',
  };
  const variants = {
    primary: { background: '#f39c12', color: '#111' },
    secondary: { background: '#2c3e50', color: '#eee' },
    danger: { background: '#e74c3c', color: '#fff' },
    ghost: { background: 'transparent', color: '#aaa', border: '1px solid #444' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }}
      onClick={disabled ? undefined : onClick} disabled={disabled}>
      {children}
    </button>
  );
}
