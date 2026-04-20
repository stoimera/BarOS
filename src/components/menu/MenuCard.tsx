import { MenuItem } from '@/types/menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface MenuCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
  added?: boolean;
}

export function MenuCard({ item, onAdd, added }: MenuCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="flex flex-col h-full border border-amber-200 rounded-lg overflow-hidden">
      {item.image_url && (
        <div className="relative w-full h-32 sm:h-40 rounded-t overflow-hidden">
          {imageLoading && (
            <Skeleton className="w-full h-32 sm:h-40 absolute inset-0" />
          )}
          {!imageError ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="w-full h-32 sm:h-40 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs sm:text-sm">Image unavailable</span>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm sm:text-lg font-semibold text-amber-700 truncate flex-1 mr-2">{item.name}</h2>
          <span className="font-bold text-amber-700 text-sm sm:text-base flex-shrink-0">{item.price.toFixed(2)} €</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-400 font-weight-400 mb-3 flex-1 line-clamp-2">{item.description}</p>
        {onAdd && (
          <Button
            size="sm"
            className="mt-auto w-full text-xs sm:text-sm"
            variant={added ? "secondary" : "default"}
            onClick={() => onAdd(item)}
            disabled={added}
            aria-label={added ? `${item.name} already added` : `Add ${item.name} to booking`}
          >
            {added ? "Added" : "Add to Booking"}
          </Button>
        )}
      </div>
    </Card>
  );
} 