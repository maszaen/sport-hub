import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Venue, BookingDraft, Review } from '../types';
import { MapPin, Star, ChevronLeft, ChevronRight, Clock, Calendar, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useModal } from '../components/ModalProvider';

interface VenueDetailPageProps {
  venue: Venue;
  onBack: () => void;
  onBook: (draft: BookingDraft) => void;
}

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00',
];

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getMinDate() {
  return getTodayDate();
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function calcHours(start: string, end: string) {
  return (timeToMinutes(end) - timeToMinutes(start)) / 60;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const GALLERY = [
  'https://images.pexels.com/photos/3886521/pexels-photo-3886521.jpeg',
  'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg',
  'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg',
];

/** Scrollable container with gradient edges & nav buttons */
function ScrollableRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    check();
    const el = ref.current;
    if (el) {
      el.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
    }
    return () => {
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [check]);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="relative group/scroll">
      {/* Gradient fades */}
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
      )}
      {canRight && (
        <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
      )}

      {/* Nav buttons */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      )}

      <div ref={ref} className="flex overflow-x-auto scrollbar-none gap-2">
        {children}
      </div>
    </div>
  );
}

export default function VenueDetailPage({ venue, onBack, onBook }: VenueDetailPageProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [step, setStep] = useState<'start' | 'end'>('start');
  
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const { showAlert } = useModal();
  
  const [guestCount, setGuestCount] = useState(1);
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);
  const [dateBookings, setDateBookings] = useState<{start_time: string, end_time: string, guest_count: number}[]>([]);
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const fetchDateBookings = async () => {
      const { data } = await supabase.from('bookings').select('start_time, end_time, guest_count')
        .eq('venue_id', venue.id).eq('booking_date', selectedDate).eq('status', 'confirmed');
      if (data) setDateBookings(data as any);
    };
    fetchDateBookings();
    setLockedSlots([]);
  }, [venue.id, selectedDate]);

  useEffect(() => {
    // Setup Realtime Channel
    const ch = supabase.channel('booking_locks')
      .on('broadcast', { event: 'lock' }, payload => {
        if (payload.payload.venue_id === venue.id && payload.payload.date === selectedDate) {
           setLockedSlots(prev => [...new Set([...prev, ...payload.payload.slots])]);
        }
      })
      .on('broadcast', { event: 'unlock' }, payload => {
        if (payload.payload.venue_id === venue.id && payload.payload.date === selectedDate) {
           setLockedSlots(prev => prev.filter(s => !payload.payload.slots.includes(s)));
        }
      })
      .subscribe();
      
    channel.current = ch;
    
    return () => {
      if (channel.current) {
         channel.current.send({ type: 'broadcast', event: 'unlock', payload: { venue_id: venue.id, date: selectedDate, slots: TIME_SLOTS }});
      }
      supabase.removeChannel(ch);
    }
  }, [venue.id, selectedDate]);

  // Removed redundant setLockedSlots reset since it's now handled in the fetchDateBookings effect

  useEffect(() => {
    fetchExtras();
  }, [venue.id]);

  const fetchExtras = async () => {
    try {
      const [reviewsRes, userRes] = await Promise.all([
        supabase.from('reviews').select('*, profile:profiles(full_name, avatar_url)').eq('venue_id', venue.id).order('created_at', { ascending: false }),
        supabase.auth.getUser()
      ]);
      
      if (reviewsRes.data) {
        setReviews(reviewsRes.data);
      }
      
      if (userRes.data.user) {
        const [wlRes, profileRes] = await Promise.all([
          supabase.from('wishlists').select('id').eq('user_id', userRes.data.user.id).eq('venue_id', venue.id).maybeSingle(),
          supabase.from('profiles').select('role').eq('id', userRes.data.user.id).single()
        ]);
        if (wlRes.data) setWishlistId(wlRes.data.id);
        if (profileRes.data) setRole(profileRes.data.role);
      }
    } catch (error) {
      console.error('Error fetching extras:', error);
    } finally {
      setLoadingExtras(false);
    }
  };

  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert('Silakan login untuk menambahkan ke favorit', 'error');
      return;
    }
    
    if (wishlistId) {
      await supabase.from('wishlists').delete().eq('id', wishlistId);
      setWishlistId(null);
    } else {
      const { data } = await supabase.from('wishlists').insert({ user_id: user.id, venue_id: venue.id }).select().single();
      if (data) setWishlistId(data.id);
    }
  };

  const handleTimeClick = (slot: string) => {
    if (lockedSlots.includes(slot)) return;

    if (step === 'start') {
      setStartTime(slot);
      setEndTime(null);
      setStep('end');
      channel.current?.send({ type: 'broadcast', event: 'lock', payload: { venue_id: venue.id, date: selectedDate, slots: [slot] }});
    } else {
      if (startTime && timeToMinutes(slot) <= timeToMinutes(startTime)) {
        // Unlock old start time
        channel.current?.send({ type: 'broadcast', event: 'unlock', payload: { venue_id: venue.id, date: selectedDate, slots: [startTime] }});
        setStartTime(slot);
        setEndTime(null);
        channel.current?.send({ type: 'broadcast', event: 'lock', payload: { venue_id: venue.id, date: selectedDate, slots: [slot] }});
        return;
      }
      
      const endSlot = minutesToTime(timeToMinutes(slot) + 60);
      
      // Calculate all slots in between
      const slotsToLock = [];
      for (let m = timeToMinutes(startTime!) + 60; m <= timeToMinutes(slot); m+=60) {
        slotsToLock.push(minutesToTime(m));
      }
      
      // Check if any intermediate slots are locked
      if (slotsToLock.some(s => lockedSlots.includes(s))) {
        showAlert('Beberapa slot dalam rentang ini sudah dipilih orang lain.', 'error');
        return;
      }

      setEndTime(endSlot);
      setStep('start');
      channel.current?.send({ type: 'broadcast', event: 'lock', payload: { venue_id: venue.id, date: selectedDate, slots: slotsToLock }});
    }
  };

  const isInRange = (slot: string) => {
    if (!startTime || !endTime) return false;
    return timeToMinutes(slot) >= timeToMinutes(startTime) && timeToMinutes(slot) < timeToMinutes(endTime);
  };

  const isSlotFull = (slot: string) => {
    if (selectedDate === getTodayDate()) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (timeToMinutes(slot) <= currentMinutes) {
        return true;
      }
    }

    const slotMin = timeToMinutes(slot);
    let count = 0;
    dateBookings.forEach(b => {
      const bStart = timeToMinutes(b.start_time.substring(0, 5));
      const bEnd = timeToMinutes(b.end_time.substring(0, 5));
      if (slotMin >= bStart && slotMin < bEnd) {
        count += (b.guest_count || 1);
      }
    });
    const realtimeCount = lockedSlots.includes(slot) ? 1 : 0;
    return (count + realtimeCount + guestCount) > (venue.capacity || 1);
  };

  const hours = startTime && endTime ? calcHours(startTime, endTime) : 0;
  const totalPrice = hours * venue.price_per_hour;
  const canBook = startTime && endTime && hours > 0 && selectedDate;

  const handleBook = () => {
    if (!canBook) return;
    onBook({
      venue,
      date: selectedDate,
      startTime: startTime!,
      endTime: endTime!,
      hours,
      totalPrice,
      guestCount,
    });
  };

  const handleGuestChange = (val: number) => {
    setGuestCount(val);
    if (startTime) {
      channel.current?.send({ type: 'broadcast', event: 'unlock', payload: { venue_id: venue.id, date: selectedDate, slots: [startTime] }});
    }
    setStartTime(null);
    setEndTime(null);
    setStep('start');
  };

  return (
    <div className="flex-1 bg-white">
      {/* Hero Image */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-gray-100">
        <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 max-w-5xl mx-auto w-full pointer-events-none">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 sm:left-6 md:left-8 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors pointer-events-auto"
          >
            <ChevronLeft size={18} className="text-gray-800" />
          </button>
          <button
            onClick={toggleWishlist}
            className="absolute top-4 right-4 sm:right-6 md:right-8 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors pointer-events-auto"
          >
            <Heart size={18} className={wishlistId ? "fill-red-500 text-red-500" : "text-gray-800"} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (Details) */}
          <div className="flex-1 min-w-0">
            {/* Venue Info */}
            <div className="pb-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin size={13} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500">{venue.address}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-amber-700">{venue.rating}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Rating</p>
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(venue.price_per_hour)}</span>
                <span className="text-sm text-gray-400">/jam</span>
              </div>
            </div>

            {/* Description */}
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Deskripsi</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{venue.description}</p>
            </div>

            {/* Gallery */}
            <div className="py-6 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Foto Lapangan</h2>
              <ScrollableRow>
                <img src={venue.image_url} alt="main" className="h-28 w-40 object-cover rounded-xl shrink-0 shadow-sm" />
                {GALLERY.map((img, i) => (
                  <img key={i} src={img} alt={`gallery-${i}`} className="h-28 w-40 object-cover rounded-xl shrink-0 shadow-sm" />
                ))}
              </ScrollableRow>
            </div>

            {/* Map & Location */}
            <div className="py-6 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Lokasi Lapangan</h2>
              <div className="h-48 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                 {/* Default coordinate to Jakarta since we don't have lat/lng in DB for now */}
                 <MapContainer center={[-6.200000, 106.816666]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[-6.200000, 106.816666]}>
                    <Popup>{venue.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* Reviews */}
            <div className="py-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-amber-400 fill-amber-400" />
                <h2 className="text-base font-semibold text-gray-900">Ulasan Pengguna</h2>
                <span className="text-sm font-medium text-gray-500">({reviews.length})</span>
              </div>
              
              {loadingExtras ? (
                <p className="text-sm text-gray-500">Memuat ulasan...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Belum ada ulasan untuk lapangan ini.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <img src={r.profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (r.profile?.full_name || 'User')} alt="Avatar" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{r.profile?.full_name || 'Pengguna Anonim'}</p>
                            <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} size={12} className={star <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Booking Panel) */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md lg:sticky lg:top-24">

              {/* Date Picker */}
              <div className="pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={15} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Pilih Tanggal</h2>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  min={getMinDate()}
                  onChange={(e) => { setSelectedDate(e.target.value); setStartTime(null); setEndTime(null); setStep('start'); }}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all bg-white"
                />
                {selectedDate && (
                  <p className="text-xs text-gray-500 mt-1.5">{formatDate(selectedDate)}</p>
                )}
              </div>

              {/* Guest Count */}
              <div className="py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-gray-900">Jumlah Orang</h2>
                  <span className="text-xs text-gray-500">Maks. {venue.capacity || 1} orang per sesi</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Tentukan berapa orang yang akan bermain
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleGuestChange(Math.max(1, guestCount - 1))}
                    disabled={guestCount <= 1}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{guestCount}</span>
                  <button 
                    onClick={() => handleGuestChange(Math.min((venue.capacity || 1), guestCount + 1))}
                    disabled={guestCount >= (venue.capacity || 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div className="py-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={15} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Pilih Jam</h2>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {step === 'start' ? 'Klik untuk memilih jam mulai' : 'Klik untuk memilih jam selesai'}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isStart = slot === startTime;
                    const isEnd = endTime ? slot === minutesToTime(timeToMinutes(endTime) - 60) : false;
                    const inRange = isInRange(slot);
                    const isLocked = isSlotFull(slot) && !isStart && !inRange;

                    return (
                      <button
                        key={slot}
                        disabled={isLocked}
                        onClick={() => handleTimeClick(slot)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all text-center ${
                          isStart || isEnd
                            ? 'bg-gray-900 text-white border-gray-900'
                            : inRange
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : isLocked
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {startTime && (
                  <div className="mt-3 text-sm text-gray-600">
                    {endTime ? (
                      <span>
                        <strong>{startTime}</strong> – <strong>{endTime}</strong>
                        <span className="text-gray-400 ml-2">({hours} jam)</span>
                      </span>
                    ) : (
                      <span>Mulai: <strong>{startTime}</strong> — pilih jam selesai</span>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {canBook && (
                <div className="py-5 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Ringkasan Pesanan</h2>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tanggal</span>
                      <span className="text-gray-900 font-medium">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Waktu</span>
                      <span className="text-gray-900 font-medium">{startTime} – {endTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Durasi</span>
                      <span className="text-gray-900 font-medium">{hours} jam</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Harga/jam</span>
                      <span className="text-gray-900 font-medium">{formatPrice(venue.price_per_hour)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Total</span>
                      <span className="text-sm font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <div className="pt-5">
                {(role === 'admin' || role === 'vendor') ? (
                  <button
                    disabled
                    className="w-full py-3.5 bg-gray-200 text-gray-500 font-semibold rounded-xl cursor-not-allowed text-sm shadow-sm"
                  >
                    Hanya User Biasa Yang Dapat Menyewa
                  </button>
                ) : (
                  <button
                    onClick={handleBook}
                    disabled={!canBook}
                    className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    {canBook ? `Booking — ${formatPrice(totalPrice)}` : 'Pilih Tanggal & Waktu'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
