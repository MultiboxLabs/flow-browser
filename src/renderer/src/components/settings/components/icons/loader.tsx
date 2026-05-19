export function Loader({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={className}>
      <radialGradient id="a3" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
        <stop offset="0" stopColor="#FFFFFF"></stop> <stop offset=".3" stopColor="#FFFFFF" stopOpacity=".9"></stop>
        <stop offset=".6" stopColor="#FFFFFF" stopOpacity=".6"></stop>
        <stop offset=".8" stopColor="#FFFFFF" stopOpacity=".3"></stop>
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"></stop>
      </radialGradient>
      <circle
        style={{ transformOrigin: "center" }}
        fill="none"
        stroke="url(#a3)"
        strokeWidth="30"
        strokeLinecap="round"
        strokeDasharray="200 1000"
        strokeDashoffset="0"
        cx="100"
        cy="100"
        r="70"
      >
        <animateTransform
          type="rotate"
          attributeName="transform"
          calcMode="spline"
          dur="1"
          values="360;0"
          keyTimes="0;1"
          keySplines="0 0 1 1"
          repeatCount="indefinite"
        ></animateTransform>
      </circle>
      <circle
        style={{ transformOrigin: "center" }}
        fill="none"
        opacity=".2"
        stroke="#FFFFFF"
        strokeWidth="30"
        strokeLinecap="round"
        cx="100"
        cy="100"
        r="70"
      ></circle>
    </svg>
  );
}
