import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { Calendar, Clock, MapPin, ChevronRight, AlertCircle, X, Star, MessageSquare } from 'lucide-react';

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
    return (
      <BookingDetail
        booking={selected}
        onBack={() => setSelected(null)}
        onStatusChange={() => {
          fetchBookings();
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="flex-1 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
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

function BookingDetail({ booking, onBack, onStatusChange }: { booking: Booking; onBack: () => void; onStatusChange: () => void }) {
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    checkExistingReview();
  }, [booking.id]);

  const checkExistingReview = async () => {
    // Only check if completed
    if (booking.status !== 'completed') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('reviews').select('id').eq('user_id', user.id).eq('venue_id', booking.venue_id).maybeSingle();
    if (data) setReviewDone(true);
  };

  const calculateRefund = () => {
    const matchDate = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const diffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return { percentage: 0, amount: 0, msg: 'Kurang dari 2 jam (Tidak ada refund)' };
    } else if (diffHours < 24) {
      return { percentage: 50, amount: booking.total_price * 0.5, msg: 'Kurang dari 1 hari (Potongan 50%)' };
    } else if (diffHours < 48) {
      return { percentage: 80, amount: booking.total_price * 0.8, msg: 'Kurang dari 2 hari (Potongan 20%)' };
    } else {
      return { percentage: 100, amount: booking.total_price, msg: 'Lebih dari 2 hari (Refund penuh 100%)' };
    }
  };

  const refund = calculateRefund();

  const handleCancel = async () => {
    setCancelling(true);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
    setCancelling(false);
    setShowModal(false);
    onStatusChange();
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('reviews').insert({
        user_id: user.id,
        venue_id: booking.venue_id,
        rating,
        comment
      });
      setReviewDone(true);
    }
    setSubmittingReview(false);
    setShowReviewModal(false);
  };

  return (
    <div className="flex-1 bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Detail Booking</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-8">
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

        {/* Action */}
        {booking.status === 'confirmed' && (
          <div className="mt-8">
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3.5 bg-white text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-sm shadow-sm"
            >
              Batalkan Booking
            </button>
          </div>
        )}
        
        {booking.status === 'completed' && !reviewDone && (
          <div className="mt-8">
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors text-sm shadow-sm"
            >
              <MessageSquare size={16} /> Tulis Ulasan Lapangan
            </button>
          </div>
        )}
        {booking.status === 'completed' && reviewDone && (
          <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-xl text-center">
            <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
              <Star size={16} className="fill-green-600 text-green-600" /> Anda sudah memberikan ulasan
            </p>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                <h3 className="font-semibold">Konfirmasi Pembatalan</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin membatalkan pemesanan lapangan ini?
              </p>
              
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-800 mb-1">Ketentuan Refund:</p>
                <p className="text-xs text-red-600 mb-2">{refund.msg}</p>
                <div className="flex justify-between items-center border-t border-red-100 pt-2 mt-2">
                  <span className="text-sm font-medium text-red-900">Total Refund:</span>
                  <span className="text-sm font-bold text-red-900">{formatPrice(refund.amount)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Kembali
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                {cancelling ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900">
                <Star size={20} className="fill-amber-400 text-amber-400" />
                <h3 className="font-semibold">Beri Ulasan</h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 text-center mb-2">
                Bagaimana pengalaman Anda bermain di <b>{booking.venue?.name}</b>?
              </p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star size={28} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ceritakan pengalamanmu..."
                className="w-full mt-4 p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 focus:bg-white transition-all h-24 resize-none"
              />
            </div>

            <div className="p-5 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || comment.trim().length === 0}
                className="flex-1 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        </div>
      )}
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
