import React, { useState, useEffect } from 'react'
import { 
  VideoCameraIcon, 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  PlayIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface Video {
  id: string
  title: string
  channel: string
  duration: string
  views: string
  verified: boolean
  category: string
  description: string
  url: string
  thumbnail: string
  saved: boolean
}

export default function MedicalVideos() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([])
  const [savedVideos, setSavedVideos] = useState<string[]>([])
  
  const { 
    videos: contextVideos, 
    toggleSaveVideo,
    subscribeToChannel
  } = useData()

  // Sync saved videos from context
  useEffect(() => {
    const saved = contextVideos.filter(v => v.saved).map(v => v.id)
    setSavedVideos(saved)
  }, [contextVideos])

  const categories = ['all', 'Diabetes', 'Cardiology', 'Nutrition', 'Mental Health', 'Vaccines', 'Fitness']

  const filteredVideos = contextVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.channel.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || video.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const handleSubscribe = (channel: string, e: React.MouseEvent) => {
    e.stopPropagation()
    subscribeToChannel(channel)
    setSubscribedChannels(prev => [...prev, channel])
  }

  const handleSaveToggle = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSaveVideo(video.id)
    // Toggle locally for immediate feedback
    setSavedVideos(prev => 
      prev.includes(video.id) 
        ? prev.filter(id => id !== video.id) 
        : [...prev, video.id]
    )
  }

  const handleWatch = (video: Video) => {
    setSelectedVideo(video)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Medical Videos</h1>
          <p className="text-text-secondary">Educational health videos from verified sources</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-forest-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
        >
          <VideoCameraIcon className="w-5 h-5" />
          <span>Subscribe</span>
        </motion.button>
      </div>

      {/* Search Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage mb-8"
      >
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-light-green border border-light-green rounded-lg focus:outline-none focus:ring-2 focus:ring-pale-sage transition-all text-lg"
            placeholder="Search health videos..."
          />
        </div>
        
        {/* Category Filter */}
        <div className="mt-4 flex items-center space-x-2 flex-wrap">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-forest-green text-white' 
                  : 'bg-warm-cream/50 text-text-secondary hover:bg-pale-sage/50'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Verified Badge */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200"
      >
        <CheckBadgeIcon className="w-5 h-5" />
        <span>All videos are from verified medical sources and educational institutions</span>
      </motion.div>

      {/* Video Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden group"
          >
            {/* Video Thumbnail */}
            <div 
              className="relative h-48 bg-pale-sage/30 flex items-center justify-center overflow-hidden border border-pale-sage cursor-pointer"
              onClick={() => handleWatch(video)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <PlayIcon className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-200" />
              
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded backdrop-blur-sm">
                  {video.duration}
                </span>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  video.verified 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {video.category}
                </span>
                {video.verified && (
                  <CheckBadgeIcon className="w-5 h-5 text-green-500" title="Verified Source" />
                )}
              </div>

              <h3 
                className="text-lg font-serif font-bold text-forest-green mb-2 group-hover:text-pale-sage transition-colors cursor-pointer"
                onClick={() => handleWatch(video)}
              >
                {video.title}
              </h3>

              <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                <span className="font-medium">{video.channel}</span>
                <span>{video.views}</span>
              </div>

              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {video.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-light-green">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleSaveToggle(video, e)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    savedVideos.includes(video.id)
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-light-green text-text-secondary hover:bg-pale-sage/50'
                  }`}
                >
                  <HeartIcon className={`w-4 h-4 ${savedVideos.includes(video.id) ? 'fill-current' : ''}`} />
                  <span className="text-sm">{savedVideos.includes(video.id) ? 'Saved' : 'Like'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWatch(video)}
                  className="flex items-center space-x-2 px-4 py-2 bg-forest-green text-white rounded-lg hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
                >
                  <VideoCameraIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Watch</span>
                </motion.button>
              </div>
              
              {/* Subscribe Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleSubscribe(video.channel, e)}
                className={`w-full mt-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  subscribedChannels.includes(video.channel)
                    ? 'bg-green-100 text-green-800 cursor-default'
                    : 'bg-light-green text-text-secondary hover:bg-pale-sage/50'
                }`}
                disabled={subscribedChannels.includes(video.channel)}
              >
                {subscribedChannels.includes(video.channel) ? 'Subscribed' : 'Subscribe'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="w-12 h-12 bg-pale-sage/30 rounded-lg flex items-center justify-center mb-4 text-pale-sage">
            <CheckBadgeIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold mb-2 text-forest-green">Verified Sources</h3>
          <p className="text-sm text-text-secondary">All videos come from verified medical institutions and educational channels</p>
        </div>

        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="w-12 h-12 bg-pale-sage/30 rounded-lg flex items-center justify-center mb-4 text-pale-sage">
            <PlayIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold mb-2 text-forest-green">Educational Content</h3>
          <p className="text-sm text-text-secondary">Comprehensive health education videos covering various medical topics</p>
        </div>

        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="w-12 h-12 bg-pale-sage/30 rounded-lg flex items-center justify-center mb-4 text-pale-sage">
            <InformationCircleIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold mb-2 text-forest-green">Regular Updates</h3>
          <p className="text-sm text-text-secondary">New educational content added weekly from trusted medical sources</p>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage text-center">
          <div className="text-3xl font-bold text-forest-green mb-2">{filteredVideos.length}</div>
          <div className="text-sm text-text-secondary">Available Videos</div>
        </div>
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage text-center">
          <div className="text-3xl font-bold text-forest-green mb-2">2.5K+</div>
          <div className="text-sm text-text-secondary">Total Views</div>
        </div>
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage text-center">
          <div className="text-3xl font-bold text-forest-green mb-2">12</div>
          <div className="text-sm text-text-secondary">Verified Channels</div>
        </div>
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage text-center">
          <div className="text-3xl font-bold text-forest-green mb-2">156</div>
          <div className="text-sm text-text-secondary">Total Videos</div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-light-green sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-serif font-bold text-forest-green">{selectedVideo.title}</h2>
                  <button 
                    onClick={() => setSelectedVideo(null)}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Real YouTube video player */}
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
                  {selectedVideo.url.includes('youtube.com') ? (
                    <iframe
                      src={selectedVideo.url}
                      className="w-full h-full border-0"
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <p>Video player would load: {selectedVideo.url}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-forest-green">{selectedVideo.channel}</div>
                      <div className="text-sm text-text-secondary">{selectedVideo.views} • {selectedVideo.duration}</div>
                    </div>
                    {selectedVideo.verified && (
                      <div className="flex items-center space-x-1 text-green-500">
                        <CheckBadgeIcon className="w-5 h-5" />
                        <span className="text-sm">Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-light-green rounded-lg">
                    <h3 className="font-serif font-bold mb-2 text-forest-green">Description</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{selectedVideo.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-light-green">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => alert(`Playing video: ${selectedVideo.title}`)}
                      className="flex items-center space-x-2 px-6 py-2 bg-forest-green text-white rounded-lg hover:bg-green-600 transition-all shadow-card"
                    >
                      <PlayIcon className="w-5 h-5" />
                      <span>Play Now</span>
                    </motion.button>
                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-4 py-2 bg-light-green text-text-secondary rounded-lg hover:bg-pale-sage/50 transition-colors"
                      >
                        <HeartIcon className="w-5 h-5" />
                        <span>Like</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-4 py-2 bg-light-green text-text-secondary rounded-lg hover:bg-pale-sage/50 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Save</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}