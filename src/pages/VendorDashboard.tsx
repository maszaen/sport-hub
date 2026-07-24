import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Venue, Booking, Sport } from '../types';
import { Plus, Trash2, Edit, X, Save, Upload, Store, MapPin, Calendar, Clock, CreditCard, XCircle, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useModal } from '../components/ModalProvider';

const SPORTS: Sport[] = ['Padel', 'Futsal', 'Tennis', 'Mini Soccer', 'Bulu Tangkis'];

export default function VendorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useModal();
  
  const [activeTab, setActiveTab] = useState<'venues'|'bookings'>('venues');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState<Sport>('Futsal');
  const [price, setPrice] = useState(100000);
  const [capacity, setCapacity] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Closure Form State
  const [showClosure, setShowClosure] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchData(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchData = async (userId: string) => {
    try {
      const [venuesRes, bookingsRes] = await Promise.all([
        supabase.from('venues').select('*').eq('vendor_id', userId).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, venue:venues!inner(*)').eq('venues.vendor_id', userId).order('created_at', { ascending: false })
      ]);
      if (venuesRes.data) setVenues(venuesRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setEditId('');
    setName('');
    setAddress('');
    setDescription('');
    setSport('Futsal');
    setPrice(100000);
    setCapacity(1);
    setImageUrl('');
    setImageFile(null);
    setShowForm(true);
  };

  const handleEdit = (v: Venue) => {
    setIsEditing(true);
    setEditId(v.id);
    setName(v.name);
    setAddress(v.address);
    setDescription(v.description);
    setSport(v.sport);
    setPrice(v.price_per_hour);
    setCapacity(v.capacity);
    setImageUrl(v.image_url);
    setImageFile(null);
    setShowForm(true);
  };

  const handleRequestClosure = (v: Venue) => {
    setEditId(v.id);
    setClosureReason('');
    setShowClosure(true);
  };

  const submitClosure = async () => {
    if (!closureReason) {
      showAlert('Alasan penutupan harus diisi', 'error');
      return;
    }
    setFormLoading(true);
    try {
      await supabase.from('venues').update({
        status: 'closure_requested',
        status_reason: closureReason
      }).eq('id', editId);
      setShowClosure(false);
      if (user) fetchData(user.id);
      showAlert('Pengajuan penutupan berhasil dikirim', 'success');
    } catch (error) {
      showAlert('Gagal mengajukan penutupan', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    showConfirm('Batalkan pesanan ini? User akan diberitahu.', async () => {
      try {
        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
        if (user) fetchData(user.id);
        showAlert('Pesanan dibatalkan', 'success');
      } catch (error) {
        showAlert('Gagal membatalkan pesanan', 'error');
      }
    });
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('venues').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('venues').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name,
        address,
        description,
        sport,
        price_per_hour: price,
        capacity,
        image_url: finalImageUrl,
        vendor_id: user.id
      };

      if (isEditing) {
        await supabase.from('venues').update(payload).eq('id', editId);
      } else {
        await supabase.from('venues').insert({ ...payload, status: 'pending' });
      }
      setShowForm(false);
      fetchData(user.id);
      showAlert('Lapangan berhasil disimpan', 'success');
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('Terjadi kesalahan saat menyimpan lapangan.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat dashboard vendor...</div>;
  }

  return (
    <div className="flex-1 bg-gray-50/50 min-h-screen pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Store size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendor Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Kelola lapangan Anda dan tangani pesanan pelanggan</p>
            </div>
          </div>
          <div className="flex gap-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('venues')}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'venues' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lapangan Saya
              {activeTab === 'venues' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'bookings' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pemesanan Masuk
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
              <h2 className="text-base font-semibold text-gray-900">Lapangan ({venues.length})</h2>
              <button 
                onClick={handleAdd}
                className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={16} /> Tambah Baru
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {venues.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Anda belum memiliki lapangan terdaftar.</div>
              ) : venues.map(v => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors group">
                  <img src={v.image_url} alt={v.name} className="w-full sm:w-32 h-24 sm:h-20 object-cover rounded-xl border border-gray-100 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{v.name}</h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        v.status === 'active' ? 'bg-green-100 text-green-700' : 
                        v.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        v.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {v.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md"><MapPin size={12}/> {v.sport}</span>
                      <span className="flex items-center gap-1"><CreditCard size={12}/> Rp{v.price_per_hour.toLocaleString('id-ID')}/jam</span>
                      <span className="flex items-center gap-1">Kapasitas: {v.capacity}</span>
                    </div>
                    {v.status_reason && (
                      <p className="text-xs text-red-600 truncate mb-1"><AlertCircle size={12} className="inline mr-1"/> {v.status_reason}</p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(v)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={14}/> Edit</button>
                    {v.status === 'active' && (
                      <button onClick={() => handleRequestClosure(v)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"><XCircle size={14}/> Tutup</button>
                    )}
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
              <h2 className="text-base font-semibold text-gray-900">Pemesanan di Lapangan Anda</h2>
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
                  <div className="flex items-center gap-4">
                    <div className="text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Pemesan</p>
                      <p className="text-sm font-medium text-gray-900">{b.booker_name}</p>
                      <p className="text-xs text-gray-600">{b.phone}</p>
                    </div>
                    {b.status === 'confirmed' && new Date(`${b.booking_date}T${b.end_time}`) > new Date() && (
                      <button onClick={() => handleCancelBooking(b.id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded hover:bg-red-100">
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Venue */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-gray-900">{isEditing ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lapangan</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none h-20" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Olahraga</label>
                  <select value={sport} onChange={e => setSport(e.target.value as Sport)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp/jam)</label>
                  <input required type="number" min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                  <input required type="number" min="1" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Lapangan</label>
                <div className="flex items-center gap-3">
                  {imageFile ? (
                    <span className="text-xs text-gray-600 truncate flex-1">{imageFile.name}</span>
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="h-10 w-16 object-cover rounded" />
                  ) : (
                    <span className="text-xs text-gray-400 flex-1">Belum ada gambar</span>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 flex items-center gap-1">
                    <Upload size={14} /> Pilih File
                  </button>
                  {(imageFile || imageUrl) && (
                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(''); }} className="px-3 py-1.5 border border-red-300 text-red-600 rounded text-xs font-medium hover:bg-red-50 flex items-center gap-1">
                      <Trash2 size={14} /> Hapus
                    </button>
                  )}
                </div>
                {!isEditing && <p className="text-xs text-amber-600 mt-2">Lapangan baru akan masuk ke antrean persetujuan Admin sebelum tayang.</p>}
              </div>

            </form>

            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Batal</button>
              <button onClick={handleSubmit} disabled={formLoading} className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} /> {formLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Closure */}
      {showClosure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Ajukan Penutupan</h3>
              <button onClick={() => setShowClosure(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penutupan</label>
              <textarea 
                required 
                value={closureReason} 
                onChange={e => setClosureReason(e.target.value)} 
                placeholder="Contoh: Renovasi lantai lapangan"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none h-24 mb-4" 
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowClosure(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Batal</button>
                <button onClick={submitClosure} disabled={formLoading} className="flex-1 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 text-sm disabled:opacity-50">
                  {formLoading ? 'Loading...' : 'Ajukan Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
