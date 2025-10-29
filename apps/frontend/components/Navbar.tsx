import Link from 'next/link';

export default function Navbar() {
  return (
    <div className='flex flex-row w-full items-center text-white justify-between bg-aquamarine-700 px-20 py-8'>
      {/* Logo - Extrabold */}
      <Link className='px-4 py-2 text-xl font-extrabold' href='/'>
        CENTURA
      </Link>

      {/* Navigation - Medium weight */}
      <ul className='flex flex-row list-none gap-4'>
        <li>
          <Link
            href='/dashboard'
            className='px-4 py-2 font-medium hover:font-semibold transition-all'
          >
            Panel
          </Link>
        </li>
        <li>
          <Link
            href='/contact'
            className='px-4 py-2 font-medium hover:font-semibold transition-all'
          >
            İletişim
          </Link>
        </li>
      </ul>

      {/* Auth buttons */}
      <ul className='flex flex-row list-none gap-4'>
        <Link
          className='px-4 py-2 font-normal hover:font-medium transition-all'
          href='/signup'
        >
          Kayıt Ol
        </Link>
        <Link
          href={'/login'}
          className='px-6 py-2 font-semibold bg-aquamarine-500 hover:bg-aquamarine-600 rounded-md transition-all'
        >
          Giriş Yap
        </Link>
      </ul>
    </div>
  );
}
