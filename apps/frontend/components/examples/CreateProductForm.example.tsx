/**
 * Example: Create Product Form with Zod Validation
 * This demonstrates how to use Zod schemas in your components
 */

'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  createProductSchema,
  type CreateProductFormData,
  type ProductCategory,
  productCategorySchema,
} from '@/lib/validations';
import { validateForm } from '@/lib/validations/form-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    // Prepare data object matching the schema
    const data: CreateProductFormData = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: (formData.get('category') as ProductCategory) || undefined,
      price: Number.parseFloat(formData.get('price') as string),
      stockQuantity: Number.parseInt(
        formData.get('stockQuantity') as string,
        10
      ),
      sku: (formData.get('sku') as string) || undefined,
      barcode: (formData.get('barcode') as string) || undefined,
      lowStockThreshold: formData.get('lowStockThreshold')
        ? Number.parseInt(formData.get('lowStockThreshold') as string, 10)
        : undefined,
    };

    // Validate with Zod schema
    const validation = validateForm(createProductSchema, data);

    if (!validation.success) {
      setErrors(validation.errors);
      setIsLoading(false);
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    try {
      // validation.data is now type-safe and validated!
      await apiClient.post('/products', validation.data);
      toast.success('Ürün başarıyla oluşturuldu');

      // Reset form or redirect
      e.currentTarget.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ürün oluşturulamadı';
      toast.error(message);
      // removed console logging per project linting preferences
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4 max-w-2xl'>
      {/* Product Name */}
      <div className='space-y-2'>
        <Label htmlFor='name'>
          Ürün Adı <span className='text-red-500'>*</span>
        </Label>
        <Input
          id='name'
          name='name'
          type='text'
          placeholder='Ürün adını giriniz'
          required
          disabled={isLoading}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className='text-sm text-red-500'>{errors.name}</p>}
      </div>

      {/* Description */}
      <div className='space-y-2'>
        <Label htmlFor='description'>Açıklama</Label>
        <textarea
          id='description'
          name='description'
          placeholder='Ürün açıklaması'
          disabled={isLoading}
          className={`w-full min-h-[100px] px-3 py-2 rounded-md border ${
            errors.description ? 'border-red-500' : 'border-input'
          } bg-background`}
        />
        {errors.description && (
          <p className='text-sm text-red-500'>{errors.description}</p>
        )}
      </div>

      {/* Category */}
      <div className='space-y-2'>
        <Label htmlFor='category'>Kategori</Label>
        <select
          id='category'
          name='category'
          disabled={isLoading}
          className={`w-full px-3 py-2 rounded-md border ${
            errors.category ? 'border-red-500' : 'border-input'
          } bg-background`}
        >
          <option value=''>Seçiniz</option>
          {productCategorySchema.options.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className='text-sm text-red-500'>{errors.category}</p>
        )}
      </div>

      {/* Price and Stock - Side by side */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='price'>
            Fiyat <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='price'
            name='price'
            type='number'
            step='0.01'
            min='0.01'
            placeholder='0.00'
            required
            disabled={isLoading}
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && (
            <p className='text-sm text-red-500'>{errors.price}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='stockQuantity'>
            Stok Miktarı <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='stockQuantity'
            name='stockQuantity'
            type='number'
            min='0'
            placeholder='0'
            required
            disabled={isLoading}
            className={errors.stockQuantity ? 'border-red-500' : ''}
          />
          {errors.stockQuantity && (
            <p className='text-sm text-red-500'>{errors.stockQuantity}</p>
          )}
        </div>
      </div>

      {/* SKU and Barcode - Side by side */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='sku'>SKU</Label>
          <Input
            id='sku'
            name='sku'
            type='text'
            placeholder='PROD-001'
            disabled={isLoading}
            className={errors.sku ? 'border-red-500' : ''}
          />
          {errors.sku && <p className='text-sm text-red-500'>{errors.sku}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='barcode'>Barkod</Label>
          <Input
            id='barcode'
            name='barcode'
            type='text'
            placeholder='1234567890123'
            disabled={isLoading}
            className={errors.barcode ? 'border-red-500' : ''}
          />
          {errors.barcode && (
            <p className='text-sm text-red-500'>{errors.barcode}</p>
          )}
        </div>
      </div>

      {/* Low Stock Threshold */}
      <div className='space-y-2'>
        <Label htmlFor='lowStockThreshold'>Düşük Stok Eşiği</Label>
        <Input
          id='lowStockThreshold'
          name='lowStockThreshold'
          type='number'
          min='0'
          placeholder='10'
          disabled={isLoading}
          className={errors.lowStockThreshold ? 'border-red-500' : ''}
        />
        {errors.lowStockThreshold && (
          <p className='text-sm text-red-500'>{errors.lowStockThreshold}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className='flex gap-2'>
        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Oluşturuluyor...' : 'Ürün Oluştur'}
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setErrors({});
          }}
          disabled={isLoading}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
