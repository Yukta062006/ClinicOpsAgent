import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  HeartIcon, 
  CheckCircleIcon,
  XMarkIcon,
  BookmarkIcon,
  VideoCameraIcon,
  EyeIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useData, Video } from '../context/DataContext'

export default function MedicalVideos() {
  const { videos, toggleSaveVideo, subscribeToChannel, subscribedChannels } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>(['2'])

  const categories = [
    'All', 
    'Surgical / Procedures',
    'Health Education',
    'Diabetes', 
    'Cardiology', 
    'Nutrition', 
    'Fitness', 
    'Mental Wellness', 
    'Women\'s Health', 
    'Child Health',
    'Preventive Healthcare'
  ]

  const videoList = videos || []
  const filteredVideos = videoList.filter(v => {
    if (!v) return false
    const matchesSearch = !searchQuery.trim() || 
      (v.title && v.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.channel && v.channel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    let matchesCat = selectedCategory === 'All'
    if (!matchesCat && v.category) {
      const vCat = v.category.toLowerCase()
      const sCat = selectedCategory.toLowerCase()
      matchesCat = vCat.includes(sCat) || sCat.includes(vCat) || 
        (sCat.includes('surg') && vCat.includes('surg')) ||
        (sCat.includes('edu') && vCat.includes('edu')) ||
        (sCat.includes('mental') && vCat.includes('mental'))
    }
    return matchesSearch && matchesCat
  })

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedVideoIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubscribe = (channel: string, e: React.MouseEvent) => {
    e.stopPropagation()
    subscribeToChannel(channel)
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#EFF5EE] via-[#E8F1E9] to-[#DFEDE2] border border-[#E2ECE4] p-7 lg:p-8 overflow-hidden shadow-2xs">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
            EDUCATIONAL HEALTH VIDEOS
          </span>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1B3E2F] tracking-tight mt-1">
            Medical Videos
          </h1>
          <p className="text-sm font-serif italic text-[#1B3E2F] mt-1">
            Trusted health videos from verified sources
          </p>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="bg-white/80 backdrop-blur-xs border border-[#E2ECE4] rounded-2xl p-4 flex items-center space-x-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-pale-sage/60 flex items-center justify-center text-forest-green">
              <VideoCameraIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B3E2F]">Learn Healthier,</p>
              <p className="text-xs font-bold text-[#5A6D62]">Live Better</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Categories */}
      <div className="space-y-3">
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-2.5 flex items-center gap-2 shadow-2xs">
          <div className="flex items-center space-x-2.5 px-3 flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#829489] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search health videos, topics, or channels..."
              className="w-full text-sm outline-none text-[#1E2D25] placeholder-[#829489]"
            />
          </div>

          <button
            onClick={() => {
              if (videos.length > 0) {
                subscribeToChannel(videos[0].channel)
                alert('Subscribed to all verified medical educational channels!')
              }
            }}
            className="px-5 py-2.5 bg-[#1B3E2F] hover:bg-[#143024] text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#1B3E2F] text-white shadow-2xs' 
                    : 'bg-white border border-[#E2ECE4] text-[#5A6D62] hover:text-[#1B3E2F] hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Verified Sources Alert */}
      <div className="p-3.5 bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl flex items-center space-x-2.5 text-xs text-[#1B3E2F] font-medium">
        <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span>All videos are from verified medical sources, accredited clinicians, and educational institutions.</span>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => {
          const isLiked = likedVideoIds.includes(video.id)
          const isSubscribed = subscribedChannels.includes(video.channel)

          return (
            <div
              key={video.id}
              className="bg-white border border-[#E2ECE4] rounded-3xl overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#1B3E2F]/30 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Video Thumbnail with Duration */}
                <div 
                  onClick={() => setActiveVideo(video)}
                  className="relative aspect-video bg-gray-900 cursor-pointer overflow-hidden group"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#1B3E2F] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayIcon className="w-6 h-6 ml-0.5" />
                    </div>
                  </div>

                  <span className="absolute bottom-2.5 left-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {video.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                      {video.category}
                    </span>
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" title="Verified Medical Source" />
                  </div>

                  <h3 
                    onClick={() => setActiveVideo(video)}
                    className="font-serif font-bold text-base text-[#1E2D25] leading-snug cursor-pointer hover:text-[#1B3E2F] transition-colors"
                  >
                    {video.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-[#5A6D62]">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center text-[10px] font-bold">
                        {video.channel.charAt(0)}
                      </div>
                      <span className="truncate max-w-[130px]">{video.channel}</span>
                    </div>
                    <span>{video.views}</span>
                  </div>

                  <p className="text-xs text-[#5A6D62] line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => toggleLike(video.id, e)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                      isLiked 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-[#FAF9F5] border-[#E2ECE4] text-[#5A6D62] hover:bg-[#EFF5EE]'
                    }`}
                  >
                    {isLiked ? <HeartSolidIcon className="w-4 h-4 text-rose-600" /> : <HeartIcon className="w-4 h-4" />}
                    <span>Like</span>
                  </button>

                  <button
                    onClick={() => setActiveVideo(video)}
                    className="py-2 px-3 bg-[#1B3E2F] hover:bg-[#143024] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Watch</span>
                  </button>
                </div>

                <button
                  onClick={(e) => handleSubscribe(video.channel, e)}
                  className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    isSubscribed 
                      ? 'bg-[#EFF5EE] text-[#1B3E2F] border-[#E2ECE4]' 
                      : 'bg-[#FAF9F5] hover:bg-[#EFF5EE] text-[#5A6D62] border-[#E2ECE4]'
                  }`}
                >
                  {isSubscribed ? 'Subscribed ✓' : 'Subscribe to Channel'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Highlights (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1B3E2F]">Verified Sources</h4>
            <p className="text-[11px] text-[#5A6D62] mt-0.5 leading-relaxed">
              All videos come from verified medical institutions and educational channels.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1B3E2F]">Educational Content</h4>
            <p className="text-[11px] text-[#5A6D62] mt-0.5 leading-relaxed">
              Comprehensive health education videos covering diverse clinical topics.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1B3E2F]">Regular Updates</h4>
            <p className="text-[11px] text-[#5A6D62] mt-0.5 leading-relaxed">
              New educational content added weekly from trusted clinical reviewers.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Metrics (4 Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-2xl font-serif font-bold text-[#1B3E2F]">{videos.length}</p>
          <p className="text-xs text-[#5A6D62] mt-0.5">Available Videos</p>
        </div>
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-2xl font-serif font-bold text-[#1B3E2F]">2.5K+</p>
          <p className="text-xs text-[#5A6D62] mt-0.5">Total Views</p>
        </div>
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-2xl font-serif font-bold text-[#1B3E2F]">12</p>
          <p className="text-xs text-[#5A6D62] mt-0.5">Verified Channels</p>
        </div>
        <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 text-center shadow-2xs">
          <p className="text-2xl font-serif font-bold text-[#1B3E2F]">156</p>
          <p className="text-xs text-[#5A6D62] mt-0.5">Total Videos</p>
        </div>
      </div>

      {/* Watch Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#E2ECE4]">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {activeVideo.category}
                </span>
                <h3 className="font-serif font-bold text-base text-[#1B3E2F] mt-1">{activeVideo.title}</h3>
              </div>
              <button 
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Iframe Player */}
            <div className="relative aspect-video bg-black w-full">
              <iframe
                src={`${activeVideo.url}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-5 flex items-center justify-between bg-[#FAF9F5]">
              <div className="text-xs text-[#5A6D62]">
                <span>Source: <strong>{activeVideo.channel}</strong></span>
                <span className="mx-2">•</span>
                <span>{activeVideo.views}</span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="px-4 py-2 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024]"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}