// components/SafeImage.tsx
import Image from 'next/image';
import { useState } from 'react';

export function SafeImage({ src, alt, ...props }: any) {
  const [useNative, setUseNative] = useState(false);

  if (useNative || !src) {
   const propsWithoutFill = { ...props };
   delete propsWithoutFill.fill;
    return <img src={src} alt={alt} {...propsWithoutFill} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      unoptimized
      onError={() => setUseNative(true)}
    />
  );
}