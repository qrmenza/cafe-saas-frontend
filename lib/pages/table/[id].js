import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { CakeIcon } from '@heroicons/react/24/outline';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function Table() {
  const router = useRouter();
  const { id } = router.query;
  const [error, setError] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  const { data: menu, error: fetchError, isLoading } = useSWR(id ? `${apiUrl}/api/menu/${id}` : null, fetcher);

  useEffect(() => {
    if (fetchError) {
      setError('Failed to load menu. Please try again.');
      router.push('/blocked');
    }
  }, [fetchError, router]);

  if (isLoading) return <div className="text-center mt-10" role="status">Loading menu...</div>;
  if (error) return <div className="text-center mt-10 text-red-500" role="alert">{error}</div>;
  if (!menu) return <div className="text-center mt-10" role="alert">Menu not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center justify-center gap-2 mb-6">
        <CakeIcon className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
        <CakeIcon className="h-6 w-6 text-blue-500" />
      </div>

      {Object.keys(menu).length === 0 ? (
        <p className="text-center text-gray-500">No menu items available.</p>
      ) : (
        Object.entries(menu).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349'}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.description || 'No description'}</p>
                  <p className="text-sm font-medium mt-2">₹{item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}