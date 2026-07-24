import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Venue, Booking } from '../types';
import { Check, X, LayoutDashboard, MapPin, Calendar, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { useModal } from '../components/ModalProvider';

export default function AdminDashboard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useModal();
  
  const [activeTab, setActiveTab] = useState<'venues'|'pending_venues'|'closure_requests'|'bookings'>('venues');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [venuesRes, bookingsRes] = await Promise.all([
        supabase.from('venues').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, venue:venues(*)').order('created_at', { ascending: false })
      ]);
      if (venuesRes.data) setVenues(venuesRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVenueStatus = async (id: string, status: 'active'|'rejected'|'closed', status_reason: string = '') => {
    showConfirm(`Konfirmasi tindakan ini?`, async () => {
      try {
        await supabase.from('venues').update({ status, status_reason }).eq('id', id);
        fetchData();
        showAlert('Status lapangan berhasil diupdate', 'success');
      } catch (error) {
        showAlert('Gagal mengupdate status lapangan', 'error');
      }
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat dashboard admin...</div>;
  }

  const allVenues = venues.filter(v => v.status === 'active' || v.status === 'closed');
  const pendingVenues = venues.filter(v => v.status === 'pending');
  const closureRequests = venues.filter(v => v.status === 'closure_requested');

  return (
    <div className="flex-1 bg-gray-50/50 min-h-screen pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Pusat persetujuan lapangan dan pemantauan sistem</p>
            </div>
          </div>
          <div className="flex gap-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('venues')}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'venues' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Semua Lapangan
              {activeTab === 'venues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('pending_venues')}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending_venues' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Permintaan Lapangan Baru
              {pendingVenues.length > 0 && <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px] font-bold">{pendingVenues.length}</span>}
              {activeTab === 'pending_venues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('closure_requests')}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'closure_requests' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Permintaan Tutup
              {closureRequests.length > 0 && <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px] font-bold">{closureRequests.length}</span>}
              {activeTab === 'closure_requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'bookings' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Semua Pemesanan
              {activeTab === 'bookings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        
        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">Daftar Lapangan Aktif/Tutup ({allVenues.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {allVenues.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Tidak ada data lapangan.</div>
              ) : allVenues.map(v => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                  <img src={v.image_url} alt={v.name} className="w-full sm:w-24 h-24 sm:h-16 object-cover rounded-xl border border-gray-100 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{v.name}</h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md"><MapPin size={12}/> {v.sport}</span>
                      <span className="flex items-center gap-1">Kapasitas: {v.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Venues Tab */}
        {activeTab === 'pending_venues' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">Permintaan Lapangan Baru ({pendingVenues.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingVenues.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Tidak ada permintaan lapangan baru.</div>
              ) : pendingVenues.map(v => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                  <img src={v.image_url} alt={v.name} className="w-full sm:w-32 h-24 sm:h-20 object-cover rounded-xl border border-gray-100 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{v.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 truncate">{v.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md"><MapPin size={12}/> {v.sport}</span>
                      <span className="flex items-center gap-1"><CreditCard size={12}/> Rp{v.price_per_hour.toLocaleString('id-ID')}/jam</span>
                      <span className="flex items-center gap-1">Kapasitas: {v.capacity}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <button onClick={() => updateVenueStatus(v.id, 'active')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"><Check size={14}/> Setujui</button>
                    <button onClick={() => {
                      const reason = prompt('Alasan penolakan:');
                      if (reason !== null) updateVenueStatus(v.id, 'rejected', reason);
                    }} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><X size={14}/> Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closure Requests Tab */}
        {activeTab === 'closure_requests' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">Permintaan Penutupan Lapangan ({closureRequests.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {closureRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Tidak ada permintaan penutupan.</div>
              ) : closureRequests.map(v => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{v.name}</h3>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 mt-2 mb-2">
                      <p className="text-sm text-red-800 font-medium flex items-center gap-1.5"><AlertCircle size={14} /> Alasan Penutupan:</p>
                      <p className="text-sm text-red-600 mt-1">{v.status_reason}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <button onClick={() => updateVenueStatus(v.id, 'closed', v.status_reason)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"><Check size={14}/> Setujui Tutup</button>
                    <button onClick={() => updateVenueStatus(v.id, 'active', 'Permintaan tutup ditolak admin')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><X size={14}/> Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">Semua Pemesanan Sistem</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Belum ada pemesanan masuk.</div>
              ) : bookings.map(b => (
                <div key={b.id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-900">{b.venue?.name}</h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Calendar size={14} className="text-gray-400" /> {new Date(b.booking_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} className="text-gray-400" /> {b.start_time} - {b.end_time}</span>
                    </div>
                  </div>
                  <div className="md:text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Pemesan</p>
                    <p className="text-sm font-medium text-gray-900">{b.booker_name}</p>
                    <p className="text-xs text-gray-600">{b.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
