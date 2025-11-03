'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { signupSchema, type SignupFormData } from '@/lib/validations';
import { validateForm } from '@/lib/validations/form-validation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data: SignupFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    // Validate form data with Zod
    const validation = validateForm(signupSchema, data);

    if (!validation.success) {
      setErrors(validation.errors);
      setIsLoading(false);
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    try {
      await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
      });

      toast.success('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');

      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : 'Kayıt başarısız oldu';
      toast.error(message);
      // removed console logging per project linting preferences
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-full flex items-center justify-center bg-background md:pt-32 pt-16'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Kayıt Ol
          </CardTitle>
          <CardDescription className='text-center'>
            Yeni hesap oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Ad Soyad</Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='Ahmet Yılmaz'
                required
                disabled={isLoading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-posta</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='ornek@email.com'
                required
                disabled={isLoading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className='text-sm text-red-500'>{errors.email}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Şifre</Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  required
                  disabled={isLoading}
                  className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-sm text-red-500'>{errors.password}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Şifre Tekrar</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  required
                  disabled={isLoading}
                  className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-sm text-red-500'>{errors.confirmPassword}</p>
              )}
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Zaten hesabınız var mı?{' '}
            <Link
              href='/login'
              className='font-medium text-primary hover:underline'
            >
              Giriş Yap
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
