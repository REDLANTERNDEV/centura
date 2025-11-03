'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);

        toast.success('Çıkış başarılı! Yönlendiriliyorsunuz...');

        // Redirect to login page after successful logout
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } catch (error: any) {
        const message =
          error instanceof Error
            ? error.message
            : 'Çıkış işlemi başarısız oldu';
        toast.error(message);
        // removed console logging per project linting preferences

        // Still redirect to login page even if logout fails
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className='h-full flex items-center justify-center bg-background md:pt-32 pt-16'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-center mb-4'>
            <div className='rounded-full bg-primary/10 p-3'>
              <LogOut className='h-6 w-6 text-primary' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-center'>
            Çıkış Yapılıyor
          </CardTitle>
          <CardDescription className='text-center'>
            {isLoggingOut
              ? 'Hesabınızdan çıkış yapılıyor...'
              : 'Çıkış işlemi tamamlandı'}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-center'>
          {isLoggingOut && (
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
