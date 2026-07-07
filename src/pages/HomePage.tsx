import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Venue, Sport } from '../types';
import { MapPin, Star, Search, ChevronRight } from 'lucide-react';

const SPORTS: Sport[] = ['Padel', 'Futsal', 'Tennis', 'Mini Soccer', 'Bulu Tangkis'];

const HERO_IMAGES: Record<Sport, string> = {
  Padel: 'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg',
  Futsal: 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg',
  Tennis: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg',
  'Mini Soccer': 'https://images.pexels.com/photos/918798/pexels-photo-918798.jpeg',
  'Bulu Tangkis': 'https://images.pexels.com/photos/2202685/pexels-photo-2202685.jpeg',
};

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

interface HomePageProps {
  onSelectVenue: (venue: Venue) => void;
}

export default function HomePage({ onSelectVenue }: HomePageProps) {
  const [selectedSport, setSelectedSport] = useState<Sport>('Futsal');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVenues();
  }, [selectedSport]);

  async function fetchVenues() {
    setLoading(true);
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('sport', selectedSport)
      .order('rating', { ascending: false });
    setVenues(data ?? []);
    setLoading(false);
  }

  const filtered = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={HERO_IMAGES[selectedSport]}
          alt={selectedSport}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-8">
          <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">Temukan Lapangan</p>
          <h2 className="text-white text-2xl font-bold leading-tight">{selectedSport}</h2>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Search */}
        <div className="relative mt-4 mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
          />
        </div>

        {/* Sport Tabs */}
        <nav className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto scrollbar-none">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => { setSelectedSport(sport); setSearch(''); }}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                selectedSport === sport
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </nav>

        {/* Venue Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Tidak ada lapangan ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
            {filtered.map((venue) => (
              <button
                key={venue.id}
                onClick={() => onSelectVenue(venue)}
                className="group text-left flex gap-0 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <img
                  src={venue.image_url}
                  alt={venue.name}
                  className="w-36 h-28 object-cover shrink-0"
                />
                <div className="flex flex-col justify-between p-3 flex-1 min-w-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                      {venue.name}
                    </h3>
                    <div className="flex items-start gap-1 mt-1">
                      <MapPin size={11} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{venue.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-600 font-medium">{venue.rating}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-semibold text-gray-900">
                        {formatPrice(venue.price_per_hour)}
                      </span>
                      <span className="text-xs text-gray-400">/jam</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center pr-2 text-gray-300 group-hover:text-gray-500 transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
