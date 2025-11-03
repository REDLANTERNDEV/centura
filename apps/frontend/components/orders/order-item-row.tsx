 
import React, { useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderItem } from './advanced-edit-order-dialog'; // Assuming types are exported from here

interface OrderItemRowProps {
  item: OrderItem;
  products: Array<{ id: number; name: string; price: number }>;
  onItemChange: (id: string, field: keyof OrderItem, value: any) => void;
  onRemoveItem: (id: string) => void;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({
  item,
  products,
  onItemChange,
  onRemoveItem,
}) => {
  // Internal state for the quantity to make the input controlled by this component
  const [quantity, setQuantity] = useState(item.quantity);

  // When the external item quantity changes, update the internal state
  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Number.parseInt(e.target.value, 10) || 0;
    setQuantity(newQuantity); // Update internal state immediately for responsiveness
    onItemChange(item.id, 'quantity', newQuantity); // Notify parent component
  };

  const handleProductChange = (productId: string) => {
    onItemChange(item.id, 'product_id', Number(productId)); // Convert to number
  };

  const selectedProduct = products.find(p => p.id === item.product_id);

  return (
    <div className='flex flex-col sm:grid sm:grid-cols-[2fr_120px_120px_auto] gap-3 sm:gap-4 items-start sm:items-center p-3 sm:p-2 border rounded-lg sm:border-0 sm:rounded-none sm:border-b bg-card sm:bg-transparent'>
      <div className='w-full'>
        <Select
          value={item.product_id?.toString() || ''}
          onValueChange={handleProductChange}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Ürün seçin' />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id.toString()}>
                <div className='truncate max-w-[300px]' title={product.name}>
                  {product.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center gap-2 w-full sm:w-auto'>
        <span className='text-sm font-medium sm:hidden'>Miktar:</span>
        <Input
          type='number'
          value={quantity}
          onChange={handleQuantityChange}
          className='w-full sm:w-24 text-center'
          min='1'
        />
      </div>

      <div className='flex items-center gap-2 w-full sm:w-auto'>
        <span className='text-sm font-medium sm:hidden'>Toplam:</span>
        <div className='text-sm font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto text-right sm:text-left'>
          {selectedProduct
            ? `₺${(selectedProduct.price * quantity).toFixed(2)}`
            : '₺0.00'}
        </div>
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={() => onRemoveItem(item.id)}
        className='self-end sm:self-center'
      >
        <Trash2 className='h-4 w-4 text-red-500' />
      </Button>
    </div>
  );
};

export default memo(OrderItemRow);
