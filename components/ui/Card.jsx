export default function Card({ className = "", children, padding = "p-6" }) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl ${padding} ${className}`}>
      {children}
    </div>
  );
}
