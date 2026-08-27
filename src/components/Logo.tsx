/** The app's mark: one calcáreo tile with the initial set in its centre. The
 *  colours are the drawing's own, not the theme's. */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className={`outline -outline-offset-1 outline-border ${className}`}
    >
      <rect width="200" height="200" fill="#ede6d6" />
      <g fill="#3b5b7c">
        <path d="M0 0 H56 A56 56 0 0 1 0 56 Z" />
        <path d="M200 0 V56 A56 56 0 0 1 144 0 Z" />
        <path d="M200 200 H144 A56 56 0 0 1 200 144 Z" />
        <path d="M0 200 V144 A56 56 0 0 1 56 200 Z" />
      </g>
      <g fill="#b98a2c">
        <path d="M100 6 L112 18 L100 30 L88 18 Z" />
        <path d="M194 100 L182 112 L170 100 L182 88 Z" />
        <path d="M100 194 L88 182 L100 170 L112 182 Z" />
        <path d="M6 100 L18 88 L30 100 L18 112 Z" />
      </g>
      <path d="M100 38 L162 100 L100 162 L38 100 Z" fill="#7a2b2a" />
      <path d="M100 58 L142 100 L100 142 L58 100 Z" fill="#ede6d6" />
      <text
        x="100"
        y="123"
        textAnchor="middle"
        fontSize="66"
        fill="#7a2b2a"
        className="font-display font-black"
      >
        D
      </text>
    </svg>
  );
}
