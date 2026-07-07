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

type Page = 'home' | 'detail' | 'checkout' | 'history' | 'auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<Page>('home');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      // Jika user baru login dan sedang di halaman auth, redirect ke home
      if (newUser && page === 'auth') {
        setPage('home');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPage('home');
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

  // Render AuthPage sebagai overlay jika page === 'auth'
  if (page === 'auth') {
    return <AuthPage onAuth={() => setPage('home')} />;
  }

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setPage('detail');
  };

  const handleBook = (draft: BookingDraft) => {
    // Kalau belum login, redirect ke auth dulu
    if (!user) {
      setPage('auth');
      return;
    }
    setBookingDraft(draft);
    setPage('checkout');
  };

  const handleCheckoutSuccess = () => {
    setPage('history');
    setBookingDraft(null);
    setSelectedVenue(null);
  };

  const goHome = () => {
    setPage('home');
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
              className="text-xl font-bold text-gray-900 tracking-tight hover:opacity-80 transition-opacity shrink-0"
            >
              SportHub
            </button>
            {(page === 'home' || page === 'detail') && (
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
            {(page === 'checkout' || page === 'history') && (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {user ? (
                <>
                  <span className="text-xs text-gray-500 hidden sm:block mr-1 font-medium">Hi, {displayName}</span>
                  <button
                    onClick={() => setPage('history')}
                    title="Riwayat Booking"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${page === 'history' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <History size={16} />
                  </button>
                  <button
                    onClick={goHome}
                    title="Home"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${page === 'home' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
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
                  onClick={() => setPage('auth')}
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
        {page === 'home' && (
          <HomePage onSelectVenue={handleSelectVenue} />
        )}
        {page === 'detail' && selectedVenue && (
          <VenueDetailPage
            venue={selectedVenue}
            onBack={goHome}
            onBook={handleBook}
          />
        )}
        {page === 'checkout' && bookingDraft && (
          <CheckoutPage
            draft={bookingDraft}
            onBack={() => setPage('detail')}
            onSuccess={handleCheckoutSuccess}
          />
        )}
        {page === 'history' && (
          <HistoryPage />
        )}
      </main>
    </div>
  );
}
