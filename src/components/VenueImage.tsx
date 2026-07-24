import { ImageOff } from 'lucide-react';

interface VenueImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function VenueImage({ src, alt, className = '' }: VenueImageProps) {
  if (!src) {
    return (
      <div className={`bg-slate-800 flex flex-col items-center justify-center text-slate-400 ${className}`}>
        <ImageOff size={24} className="mb-2 opacity-60" />
        <span className="text-[10px] font-medium tracking-widest uppercase opacity-60">No Image</span>
      </div>
    );
  }
  
  return <img src={src} alt={alt} className={className} />;
}
