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
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={HERO_IMAGES[selectedSport]}
          alt={selectedSport}
          className="w-full h-full object-cover transition-all duration-700 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-8 pt-16">
            <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-2">Temukan Lapangan</p>
            <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight">{selectedSport}</h2>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Tidak ada lapangan ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {filtered.map((venue) => (
              <button
                key={venue.id}
                onClick={() => onSelectVenue(venue)}
                className="group text-left flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={venue.image_url}
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-gray-900">{venue.rating}</span>
                  </div>
                </div>
                <div className="flex flex-col p-4 flex-1 w-full">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
                      {venue.name}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{venue.address}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatPrice(venue.price_per_hour)}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">/jam</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors text-gray-400">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
