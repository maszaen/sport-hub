import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Dikonfirmasi', className: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-50 text-red-600' },
  completed: { label: 'Selesai', className: 'bg-gray-100 text-gray-600' },
};

export default function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, venue:venues(*)')
      .order('created_at', { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  }

  if (selected) {
    return <BookingDetail booking={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex-1 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="pt-6 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Riwayat Booking</h1>
          <p className="text-sm text-gray-500 mt-0.5">Semua riwayat pemesanan lapangan Anda</p>
        </div>

        {loading ? (
          <div className="space-y-3 pb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium">Belum ada booking</p>
            <p className="text-sm text-gray-400 mt-1">Mulai booking lapangan olahraga favoritmu</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {bookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
              return (
                <button
                  key={booking.id}
                  onClick={() => setSelected(booking)}
                  className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {booking.venue?.name ?? 'Lapangan'}
                        </h3>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{booking.venue?.address}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-600">{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-600">{booking.start_time} – {booking.end_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">{formatPrice(booking.total_price)}</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingDetail({ booking, onBack }: { booking: Booking; onBack: () => void }) {
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;

  return (
    <div className="flex-1 bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Detail Booking</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        {/* Venue */}
        <div className="mt-5 flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          {booking.venue?.image_url && (
            <img
              src={booking.venue.image_url}
              alt={booking.venue.name}
              className="w-20 h-16 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{booking.venue?.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{booking.venue?.address}</p>
            </div>
            <span className={`inline-flex mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
          {[
            { label: 'Tanggal', value: formatDate(booking.booking_date) },
            { label: 'Waktu', value: `${booking.start_time} – ${booking.end_time}` },
            { label: 'Nama pemesan', value: booking.booker_name || '-' },
            { label: 'Telepon', value: booking.phone || '-' },
            ...(booking.notes ? [{ label: 'Catatan', value: booking.notes }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* Payment */}
        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pembayaran</h3>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-900">{formatPrice(booking.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronLeft({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
