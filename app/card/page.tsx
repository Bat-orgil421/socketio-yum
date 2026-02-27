import React from "react";
import { Star, Bookmark } from "lucide-react"; // Using lucide-react for icons

const SantoriniCard: React.FC = () => {
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-[#2D3643] shadow-xl font-sans">
      {/* Background Image Section */}
      <div className="relative h-[320px] w-full">
        <img
          src="/api/placeholder/400/320" // Replace with your actual Santorini image URL
          alt="Santorini Sunset"
          className="h-full w-full object-cover"
        />

        {/* Bookmark Icon */}
        <button className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <Bookmark className="h-5 w-5 text-white" />
        </button>

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D3643] via-transparent to-transparent" />
      </div>

      {/* Content Section */}
      <div className="px-6 pb-8 pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Santorini Sunset Loft
          </h2>
          <span className="text-xl font-semibold text-white">$890</span>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-gray-300">
          Experience a cliffside loft with iconic white walls, blue domes, and
          magical sunset views.
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
            <Star className="h-3 w-3 fill-current" />
            4.8
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
            Romantic Stay
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
            2 Night Trip
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full rounded-full bg-white py-4 text-center text-lg font-bold text-black transition-transform active:scale-95">
          Book now
        </button>
      </div>
    </div>
  );
};

export default SantoriniCard;
