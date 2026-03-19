import Navbar from '@/components/Navbar';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className='mx-auto max-w-2xl px-4 py-12 text-center'>
        <h1 className='text-3xl font-bold text-foreground'>Iletisim</h1>
        <p className='mt-3 text-muted-foreground'>
          Bize ulasmak icin GitHub sayfamizi ziyaret edebilirsiniz.
        </p>
        <a
          href='https://github.com/REDLANTERNDEV/centura'
          target='_blank'
          rel='noreferrer'
          className='mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:opacity-90'
        >
          GitHub Sayfasi
        </a>
      </main>
    </>
  );
}
