import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Profile } from '../types';
import { UserCircle, Save, Camera } from 'lucide-react';
import { useModal } from '../components/ModalProvider';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    setUploadingAvatar(true);
    setMessage('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setMessage('Avatar berhasil diperbarui!');
    } catch (error: any) {
      setMessage(error.message || 'Gagal mengunggah avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      setMessage('Profil berhasil diperbarui!');
    } catch (error: any) {
      setMessage(error.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat profil...</div>;

  return (
    <div className="flex-1 bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3 overflow-hidden border-2 border-white shadow-sm">
              {profile?.avatar_url ? (
                 <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <UserCircle size={48} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-3 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center shadow hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          {profile?.role === 'admin' && (
            <span className="mt-2 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Admin</span>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>

        {profile?.role === 'user' && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Punya Lapangan Olahraga?</h3>
            <p className="text-xs text-gray-500 mb-4">Daftar sebagai vendor untuk mulai menyewakan lapangan Anda di SportHub.</p>
            <button
              onClick={() => {
                showConfirm('Apakah Anda yakin ingin mendaftar sebagai Vendor?', async () => {
                  const { error } = await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user?.id);
                  if (!error) {
                    showAlert('Berhasil mendaftar! Silakan refresh halaman atau login ulang untuk mengakses Dashboard Vendor.', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                  } else {
                    showAlert('Gagal mendaftar: ' + error.message, 'error');
                  }
                });
              }}
              className="w-full py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors text-sm"
            >
              Daftar sebagai Vendor
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
