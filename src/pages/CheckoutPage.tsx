import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookingDraft } from '../types';
import { ChevronLeft, CheckCircle, MapPin, Calendar, Clock } from 'lucide-react';

interface CheckoutPageProps {
  draft: BookingDraft;
  onBack: () => void;
  onSuccess: () => void;
}

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const SERVICE_FEE = 13000;

export default function CheckoutPage({ draft, onBack, onSuccess }: CheckoutPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const total = draft.totalPrice + SERVICE_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi habis, silakan masuk kembali');

      const { error } = await supabase.from('bookings').insert({
        venue_id: draft.venue.id,
        booking_date: draft.date,
        start_time: draft.startTime,
        end_time: draft.endTime,
        total_price: total,
        booker_name: name,
        phone,
        notes,
        status: 'confirmed',
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat booking');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Berhasil!</h2>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{draft.venue.name}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {formatDate(draft.date)} · {draft.startTime} – {draft.endTime}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nama pemesan</span>
              <span className="font-medium text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total pembayaran</span>
              <span className="font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="text-green-600 font-medium">Confirmed</span>
            </div>
          </div>
          <button
            onClick={onSuccess}
            className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors text-sm"
          >
            Lihat Riwayat Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">CheckOut</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        {/* Venue summary card */}
        <div className="mt-5 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex gap-0">
            <img
              src={draft.venue.image_url}
              alt={draft.venue.name}
              className="w-28 h-24 object-cover shrink-0"
            />
            <div className="p-3 flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{draft.venue.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500 truncate">{draft.venue.address}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-600">{new Date(draft.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-600">{draft.startTime} – {draft.endTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Data Pemesan</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk pengelola lapangan..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all resize-none"
            />
          </div>

          {/* Order Summary */}
          <div className="mt-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Ringkasan Pembayaran</h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sewa lapangan ({draft.hours} jam)</span>
                <span className="text-gray-900 font-medium">{formatPrice(draft.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Biaya layanan</span>
                <span className="text-gray-900 font-medium">{formatPrice(SERVICE_FEE)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
          >
            {loading ? 'Memproses...' : `Bayar ${formatPrice(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
