'use client';

import { Button } from '@ui/components/button';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      // Set coordinates from the click event
      if (e) {
        root.style.setProperty('--x', `${e.clientX}px`);
        root.style.setProperty('--y', `${e.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [resolvedTheme, setTheme]
  );

  return (
    <Button
      variant='secondary'
      size='icon'
      className='group/toggle size-8 cursor-pointer'
      onClick={handleThemeToggle}
    >
      {/*
        Both icons are always rendered and swapped by CSS off the `dark` class
        next-themes puts on <html>. Branching on `resolvedTheme` instead would
        be wrong on the server and on the first client render — it resolves
        only after mount — giving either a hydration mismatch or a placeholder
        flash on every page load. CSS knows the answer before React does.
      */}
      <SunIcon className='dark:hidden' />
      <MoonIcon className='hidden dark:block' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
