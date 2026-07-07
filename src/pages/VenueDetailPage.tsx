import { useState } from 'react';
import { Venue, BookingDraft } from '../types';
import { MapPin, Star, ChevronLeft, Clock, Calendar } from 'lucide-react';

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

export default function VenueDetailPage({ venue, onBack, onBook }: VenueDetailPageProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [step, setStep] = useState<'start' | 'end'>('start');

  const handleTimeClick = (slot: string) => {
    if (step === 'start') {
      setStartTime(slot);
      setEndTime(null);
      setStep('end');
    } else {
      if (startTime && timeToMinutes(slot) <= timeToMinutes(startTime)) {
        setStartTime(slot);
        setEndTime(null);
        return;
      }
      const endSlot = minutesToTime(timeToMinutes(slot) + 60);
      setEndTime(endSlot);
      setStep('start');
    }
  };

  const isInRange = (slot: string) => {
    if (!startTime || !endTime) return false;
    return timeToMinutes(slot) >= timeToMinutes(startTime) && timeToMinutes(slot) < timeToMinutes(endTime);
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
    });
  };

  return (
    <div className="flex-1 bg-white">
      {/* Hero Image */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-800" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Venue Info */}
        <div className="pt-5 pb-4 border-b border-gray-100">
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
        <div className="py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Foto Lapangan</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <img src={venue.image_url} alt="main" className="h-20 w-28 object-cover rounded-lg shrink-0" />
            {GALLERY.map((img, i) => (
              <img key={i} src={img} alt={`gallery-${i}`} className="h-20 w-28 object-cover rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Date Picker */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Pilih Tanggal</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            min={getMinDate()}
            onChange={(e) => { setSelectedDate(e.target.value); setStartTime(null); setEndTime(null); setStep('start'); }}
            className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all bg-white"
          />
          {selectedDate && (
            <p className="text-xs text-gray-500 mt-1.5">{formatDate(selectedDate)}</p>
          )}
        </div>

        {/* Time Slots */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Pilih Jam</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {step === 'start' ? 'Klik untuk memilih jam mulai' : 'Klik untuk memilih jam selesai'}
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => {
              const isStart = slot === startTime;
              const isEnd = endTime ? slot === minutesToTime(timeToMinutes(endTime) - 60) : false;
              const inRange = isInRange(slot);
              return (
                <button
                  key={slot}
                  onClick={() => handleTimeClick(slot)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    isStart || isEnd
                      ? 'bg-gray-900 text-white border-gray-900'
                      : inRange
                      ? 'bg-gray-100 text-gray-700 border-gray-200'
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
          <div className="py-4 border-b border-gray-100">
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
        <div className="py-5">
          <button
            onClick={handleBook}
            disabled={!canBook}
            className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {canBook ? `Booking — ${formatPrice(totalPrice)}` : 'Pilih Tanggal & Waktu'}
          </button>
        </div>
      </div>
    </div>
  );
}
