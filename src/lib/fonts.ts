import { Manrope, Figtree, Fraunces } from 'next/font/google';

export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const fontVariables = `${manrope.variable} ${figtree.variable} ${fraunces.variable}`;
