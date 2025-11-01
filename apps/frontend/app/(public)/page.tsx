import Link from 'next/link';

export default function Home() {
  return (
    <div className='relative h-full md:pt-22 pt-4 pb-4 w-full overflow-hidden bg-background'>
      {/* Animasyonlu blob arka plan */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-muted/20 rounded-full blur-3xl animate-pulse delay-500' />
      </div>

      {/* Content */}
      <div className='relative z-10 flex flex-col items-center justify-center h-full px-4 text-center'>
        <div className='relative mb-6 flex items-center justify-center'>
          {/* subtle background mark for contrast */}
          <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl blur-sm opacity-18 w-[60%] md:w-[50%] h-36 md:h-44 bg-card/80 pointer-events-none' />
          <h1 className='relative z-10 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight from-primary to-accent bg-clip-text text-primary drop-shadow-[0_8px_40px_rgba(0,0,0,0.35)]'>
            Centura
          </h1>
          {/* light decorative halo behind text for emphasis */}
          <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-md opacity-10 select-none pointer-events-none text-[5rem] md:text-[8rem] bg-linear-to-br from-primary to-accent bg-clip-text text-transparent whitespace-nowrap'>
            Centura
          </span>
        </div>
        <p className='text-lg md:text-2xl text-muted-foreground mb-10 max-w-2xl animate-fade-in-delay'>
          ERP & CRM çözümlerinde uzman, işletmenize özel dijital dönüşüm
          ortağınız. Tüm süreçleriniz tek platformda, hızlı ve güvenli yönetim.
        </p>
        <div className='flex gap-4 animate-fade-in-delay-2'>
          <Link href={'/login'}>
            <button className='px-8 py-4 cursor-pointer rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform z-10'>
              Hemen Başla
            </button>
          </Link>
          <Link href={'#'}>
            <button className='px-8 py-4 cursor-pointer rounded-xl font-semibold border border-primary bg-background text-primary shadow-md hover:bg-primary/30 hover:text-primary-foreground transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-primary/60'>
              Özellikler
            </button>
          </Link>
        </div>
        {/* Yaratıcı ikonlu özellikler */}
        <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl animate-fade-in-delay-3'>
          <div className='p-6 bg-card/80 rounded-2xl border border-border shadow-md flex flex-col items-center'>
            <span className='text-4xl mb-2'>✔️</span>
            <h3 className='text-lg font-bold text-foreground mb-1'>
              Her Şey Kontrolünde
            </h3>
            <p className='text-muted-foreground text-sm'>
              Tüm iş süreçlerini tek ekrandan kolayca yönet, hiçbir detayı
              kaçırma.
            </p>
          </div>
          <div className='p-6 bg-card/80 rounded-2xl border border-border shadow-md flex flex-col items-center'>
            <span className='text-4xl mb-2'>🔒</span>
            <h3 className='text-lg font-bold text-foreground mb-1'>
              Verilerin Güvende
            </h3>
            <p className='text-muted-foreground text-sm'>
              Gizliliğiniz bizim için önemli. Verileriniz size özel kalır,
              başkalarıyla asla paylaşılmaz.
            </p>
          </div>
          <div className='p-6 bg-card/80 rounded-2xl border border-border shadow-md flex flex-col items-center'>
            <span className='text-4xl mb-2'>🤝</span>
            <h3 className='text-lg font-bold text-foreground mb-1'>
              Ekip İçi İş Birliği
            </h3>
            <p className='text-muted-foreground text-sm'>
              Tüm ekip aynı platformda buluşur, bilgi paylaşımı ve görev takibi
              kolaylaşır. Herkes aynı hedefe birlikte ilerler.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
