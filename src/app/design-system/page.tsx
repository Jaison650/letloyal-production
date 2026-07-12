import { notFound } from 'next/navigation';
import Showcase from './Showcase';

export const metadata = { title: 'Design System', robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Showcase />;
}
