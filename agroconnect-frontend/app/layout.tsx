import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgroConnect - Agricultural Marketplace',
  description: 'Connect farmers with buyers. Trade agricultural produce with secure payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-green-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="text-2xl font-bold">
              🌾 AgroConnect
            </a>
            <div className="flex gap-4">
              <a href="/" className="hover:text-green-100">Home</a>
              <a href="/auth/login" className="hover:text-green-100">Login</a>
              <a href="/auth/register" className="hover:text-green-100">Register</a>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-6 mt-12">
          <div className="container mx-auto text-center">
            <p>&copy; 2026 AgroConnect. Connecting farmers with buyers worldwide.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
