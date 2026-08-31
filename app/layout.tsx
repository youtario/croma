import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Croma — Descubra as cores da sua imagem',
  description: 'Envie uma imagem e descubra sua paleta principal, os nomes das cores e seus códigos HEX e RGB.',
  openGraph: { title: 'Croma — Descubra as cores da sua imagem', description: 'Transforme qualquer imagem em uma paleta de cores nomeada.', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Croma — Descubra as cores da sua imagem' }] },
  twitter: { card: 'summary_large_image', title: 'Croma', description: 'Transforme qualquer imagem em uma paleta de cores nomeada.', images: ['/og.png'] },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html> }
