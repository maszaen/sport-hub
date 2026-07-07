import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Venue, BookingDraft } from './types';
import { User } from '@supabase/supabase-js';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import VenueDetailPage from './pages/VenueDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import HistoryPage from './pages/HistoryPage';
import { Search, History, LogOut, Home, UserCircle } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Shared state (could also be moved to Context or URL params, but keeping it simple for the refactor)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={goHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <img src="/assets/symbol.svg" alt="SportHub Logo" className="w-5 h-5" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">SportHub</span>
            </button>
            {(location.pathname === '/' || location.pathname === '/detail') && (
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari lapangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            )}
            {(location.pathname === '/checkout' || location.pathname === '/history') && (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {user ? (
                <>
                  <span className="text-xs text-gray-500 hidden sm:block mr-1 font-medium">Hi, {displayName}</span>
                  <button
                    onClick={() => navigate('/history')}
                    title="Riwayat Booking"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${location.pathname === '/history' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <History size={16} />
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
        </Routes>
      </main>
    </div>
  );
}
