import Image from "next/image";

// The real ADU logo (cloned into /public/brand). Optionally wrapped in a white
// chip so it stays legible over dark backgrounds (e.g. the shader hero nav).
export default function Logo({
  size = 28,
  chip = false,
  className = "",
  priority = false,
}: {
  size?: number;
  chip?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const img = (
    <Image
      src="/brand/adu-logo.png"
      alt="Abu Dhabi University"
      width={Math.round(size * 1.33)}
      height={size}
      priority={priority}
      className="h-auto w-auto object-contain"
      style={{ height: size, width: "auto" }}
    />
  );
  if (!chip) return <span className={className}>{img}</span>;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm ${className}`}
    >
      {img}
    </span>
  );
}
