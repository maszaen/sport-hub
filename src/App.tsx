import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Venue, BookingDraft } from './types';
import { User } from '@supabase/supabase-js';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import VenueDetailPage from './pages/VenueDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import { Notification } from './types';
import { Search, History, LogOut, Home, UserCircle, Settings, Heart, Bell } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  // Shared state (could also be moved to Context or URL params, but keeping it simple for the refactor)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfileRole = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      setIsAdmin(data?.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
      if (data) setNotifications(data);
    } catch {
      // ignore
    }
  };

  const markNotifRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileRole(session.user.id);
        fetchNotifications(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchProfileRole(newUser.id);
        fetchNotifications(newUser.id);
      } else {
        setIsAdmin(false);
        setNotifications([]);
      }
      // Jika user baru login dan sedang di halaman auth, redirect ke home
      if (newUser && window.location.pathname === '/login') {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setSelectedVenue(null);
    setBookingDraft(null);
    setIsAdmin(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Khusus route /login dirender penuh tanpa header
  if (location.pathname === '/login') {
    return <AuthPage onAuth={() => navigate('/')} />;
  }

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    navigate('/detail');
  };

  const handleBook = (draft: BookingDraft) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookingDraft(draft);
    navigate('/checkout');
  };

  const handleCheckoutSuccess = () => {
    navigate('/history');
    setBookingDraft(null);
    setSelectedVenue(null);
  };

  const goHome = () => {
    navigate('/');
    setSelectedVenue(null);
    setBookingDraft(null);
  };

  const displayName = user
    ? ((user.user_metadata?.full_name as string | undefined)
      ? (user.user_metadata.full_name as string).split(' ')[0]
      : user.email?.split('@')[0] ?? 'User')
    : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={goHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <img src="/assets/symbol.svg" alt="SportHub Logo" className="w-5 h-5" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">SportHub</span>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 shrink-0">
              {user ? (
                <>
                  <span className="text-xs text-gray-500 hidden sm:block mr-1 font-medium">Hi, {displayName}</span>
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      title="Admin Dashboard"
                      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/admin' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      <Settings size={16} />
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotif(!showNotif)}
                      title="Notifikasi"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative"
                    >
                      <Bell size={16} />
                      {notifications.some(n => !n.is_read) && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                      )}
                    </button>
                    {showNotif && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-100 font-semibold text-gray-900">Notifikasi</div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">Belum ada notifikasi</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} onClick={() => markNotifRead(n.id)} className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                                <h4 className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/wishlist')}
                    title="Favorit"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/wishlist' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <Heart size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/history')}
                    title="Riwayat Booking"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/history' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <History size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    title="Profil"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/profile' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <UserCircle size={16} />
                  </button>
                  <button
                    onClick={goHome}
                    title="Home"

                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <Home size={16} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    title="Keluar"
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <UserCircle size={16} />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex flex-col flex-1">
        <Routes>
          <Route path="/" element={<HomePage onSelectVenue={handleSelectVenue} />} />
          <Route path="/detail" element={
            selectedVenue ? (
              <VenueDetailPage
                venue={selectedVenue}
                onBack={goHome}
                onBook={handleBook}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                Data lapangan tidak ditemukan.{' '}
                <button onClick={goHome} className="text-blue-600 font-semibold hover:underline">
                  Kembali ke Beranda
                </button>
              </div>
            )
          } />
          <Route path="/checkout" element={
            bookingDraft ? (
              <CheckoutPage
                draft={bookingDraft}
                onBack={() => navigate('/detail')}
                onSuccess={handleCheckoutSuccess}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                Data pesanan kosong.{' '}
                <button onClick={goHome} className="text-blue-600 font-semibold hover:underline">
                  Kembali ke Beranda
                </button>
              </div>
            )
          } />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <div className="p-8 text-center text-red-500">Akses Ditolak</div>} />
        </Routes>
      </main>
    </div>
  );
}
