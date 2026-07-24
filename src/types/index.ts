export type Sport = 'Padel' | 'Futsal' | 'Tennis' | 'Mini Soccer' | 'Bulu Tangkis';

export interface Venue {
  id: string;
  name: string;
  address: string;
  description: string;
  sport: Sport;
  price_per_hour: number;
  image_url: string;
  rating: number;
  vendor_id: string;
  capacity: number;
  status: 'pending' | 'active' | 'rejected' | 'closure_requested' | 'closed';
  status_reason?: string;
  created_at: string;
}

export interface VenueImage {
  id: string;
  venue_id: string;
  image_url: string;
  sort_order: number;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  booker_name: string;
  phone: string;
  notes: string;
  guest_count: number;
  status: BookingStatus;
  created_at: string;
  venue?: Venue;
}

export interface BookingDraft {
  venue: Venue;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  totalPrice: number;
  guestCount: number;
}

export interface Profile {
  id: string;
  role: 'user' | 'admin' | 'vendor';
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Promo {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number;
  valid_until: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  venue_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profile?: Profile;
}

export interface Wishlist {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
  venue?: Venue;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
