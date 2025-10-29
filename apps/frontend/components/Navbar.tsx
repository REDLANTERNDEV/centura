'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Panel' },
    { href: '/contact', label: 'İletişim' },
  ];

  return (
    <>
      {/* Navbar */}
      <header
        id='navbar'
        className='sticky top-0 left-0 right-0 z-100 bg-background/80 backdrop-blur-md border-b border-border'
      >
        <nav className='mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4'>
          <Link href='/' className='text-2xl font-black text-primary uppercase'>
            Centura
          </Link>

          <ul className='hidden md:flex items-center gap-6 text-sm'>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className='hidden md:flex items-center gap-3'>
            <Link
              href='/signup'
              className='px-4 py-2 text-sm rounded-md text-foreground/90 hover:text-primary transition'
            >
              Kayıt Ol
            </Link>
            <Link
              href='/login'
              className='px-4 py-2 text-sm rounded-md font-semibold bg-primary text-primary-foreground shadow hover:brightness-95 transition'
            >
              Giriş Yap
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className='md:hidden inline-flex items-center justify-center cursor-pointer p-2 rounded-md bg-card/70 border border-border text-foreground'
            aria-label='Toggle menu'
          >
            {open ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <button
        tabIndex={open ? 0 : -1}
        aria-label='Close menu'
        onKeyDown={e => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className={`fixed inset-0 z-90 cursor-pointer bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[260px] bg-background/95 border-l border-border backdrop-blur-md z-[100] transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='p-6 flex flex-col h-full'>
          <div className='flex items-center justify-between mb-8'>
            <span className='text-2xl font-black text-primary uppercase'>
              Centura
            </span>
            <button onClick={() => setOpen(false)} aria-label='Close menu'>
              <X className='h-5 w-5 text-muted-foreground cursor-pointer' />
            </button>
          </div>

          <nav className='flex flex-col gap-4'>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className='text-sm text-foreground hover:text-primary py-2'
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className='mt-auto flex flex-col gap-3'>
            <Link
              href='/signup'
              onClick={() => setOpen(false)}
              className='px-4 py-2 text-sm text-center rounded-md border border-border text-foreground/90 hover:text-primary transition'
            >
              Kayıt Ol
            </Link>
            <Link
              href='/login'
              onClick={() => setOpen(false)}
              className='px-4 py-2 text-sm text-center rounded-md bg-primary text-primary-foreground hover:brightness-95 transition'
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
