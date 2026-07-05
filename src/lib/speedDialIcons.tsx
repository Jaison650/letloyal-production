import { Coffee, UtensilsCrossed, Pizza, IceCream, ShoppingBag, Scissors, Dumbbell, Sparkles, Shirt, Gift, IndianRupee, type LucideIcon } from 'lucide-react';
import type { SpeedDialIconKey } from '@/lib/constants';

export const SPEED_DIAL_ICON_MAP: Record<SpeedDialIconKey, LucideIcon> = {
  'coffee':       Coffee,
  'utensils':     UtensilsCrossed,
  'pizza':        Pizza,
  'ice-cream':    IceCream,
  'shopping-bag': ShoppingBag,
  'scissors':     Scissors,
  'dumbbell':     Dumbbell,
  'sparkles':     Sparkles,
  'shirt':        Shirt,
  'gift':         Gift,
};

export function getSpeedDialIcon(key?: string | null): LucideIcon {
  if (key && key in SPEED_DIAL_ICON_MAP) return SPEED_DIAL_ICON_MAP[key as SpeedDialIconKey];
  return IndianRupee;
}
