import type { CSSProperties } from "react";
import styles from "./ResponsiveImage.module.css";

type BreakpointSizes = {
  mobile?: string;
  tablet?: string;
  desktop?: string;
};

type ResponsiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: BreakpointSizes;
  aspectRatio?: string;
};

export default function ResponsiveImage({
  src,
  alt,
  className = "",
  sizes,
  aspectRatio = "56.25%",
}: ResponsiveImageProps) {
  const style = {
    "--responsive-max-width-mobile": sizes?.mobile ?? "100%",
    "--responsive-max-width-tablet": sizes?.tablet ?? "720px",
    "--responsive-max-width-desktop": sizes?.desktop ?? "1200px",
    "--responsive-aspect-ratio": aspectRatio,
  } as CSSProperties;

  return (
    <div className={`${styles.imageWrapper} ${className}`} style={style}>
      <img src={src} alt={alt} className={styles.responsiveImage} />
    </div>
  );
}
