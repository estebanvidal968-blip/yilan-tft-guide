export default function HexMark({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`hex-mark ${className}`}
    >
      <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 9 L22 12.5 V19.5 L16 23 L10 19.5 V12.5 Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}
