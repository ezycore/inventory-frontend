import Image from "next/image";
import { useState } from "react";

export function SafeImage({ src, alt, ...props }: any) {
  const [useNative, setUseNative] = useState(false);

  if (useNative || !src) {
    const propsWithoutFill = { ...props };
    delete propsWithoutFill.fill;
    // eslint-disable-next-line @next/next/no-img-element -- Fallback for when Next.js Image fails
    return <img src={src} alt={alt} {...propsWithoutFill} />;
  }

  // Only set width if fill is not present
  const imageProps = props.fill
    ? { ...props }
    : { width: 200, height: 200, ...props };

  return (
    <Image
      src={src}
      alt={alt}
      {...imageProps}
      unoptimized
      onError={() => setUseNative(true)}
    />
  );
}
