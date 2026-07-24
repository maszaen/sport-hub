import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wishlist } from '../types';
import { Heart, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VenueImage from '../components/VenueImage';

export default function WishlistPage() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      const { data, error } = await supabase
        .from('wishlists')
        .select('*, venue:venues(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setWishlists(data || []);
    } catch (error) {
      console.error('Error fetching wishlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeWishlist = async (id: string) => {
    try {
      await supabase.from('wishlists').delete().eq('id', id);
      setWishlists(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error removing wishlist:', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat favorit...</div>;

  return (
    <div className="flex-1 bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" /> Lapangan Favorit
        </h1>
        
        {wishlists.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-gray-200">
            <p className="text-gray-500 mb-4">Anda belum memiliki lapangan favorit.</p>
            <button onClick={() => navigate('/')} className="text-blue-600 font-medium hover:underline">
              Cari Lapangan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map(w => w.venue && (
              <div key={w.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
                <button 
                  onClick={() => removeWishlist(w.id)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-red-500 transition-colors z-10"
                >
                  <Heart size={18} className="fill-red-500" />
                </button>
                <VenueImage src={w.venue.image_url} alt={w.venue.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{w.venue.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                    <MapPin size={12} />
                    <span className="truncate">{w.venue.address}</span>
                  </div>
                  <div className="mt-3 text-sm font-bold text-gray-900">
                    Rp{w.venue.price_per_hour.toLocaleString('id-ID')}<span className="text-xs font-normal text-gray-500">/jam</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
