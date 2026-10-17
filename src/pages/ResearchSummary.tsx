import React, { useState, useEffect } from 'react'
import { 
  DocumentTextIcon, 
  SpeakerWaveIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface ResearchSummary {
  id: string
  title: string
  authors: string
  journal: string
  year: string
  summary: string
  findings: string[]
  limitations: string[]
  originalUrl: string
}

export default function ResearchSummary() {
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<ResearchSummary | null>(null)
  const [saved, setSaved] = useState(false)
  
  const { researchArticles } = useData()

  // Load sample article (would normally come from routing params)
  useEffect(() => {
    const article = researchArticles[0]
    if (article) {
      setCurrentArticle({
        id: article.id,
        title: article.title,
        authors: article.authors,
        journal: article.journal,
        year: article.year,
        summary: article.abstract,
        findings: article.findings,
        limitations: article.limitations,
        originalUrl: article.url
      })
    }
  }, [researchArticles])

  // Speech synthesis state
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis
      setSynthesis(synth)
      
      const loadVoices = () => {
        setVoices(synth.getVoices())
      }
      
      loadVoices()
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices
      }
    }
  }, [])

  const toggleReadAloud = () => {
    if (!synthesis) return
    
    if (audioPlaying) {
      synthesis.cancel()
      setAudioPlaying(false)
    } else {
      const text = `${currentArticle?.title}. By ${currentArticle?.authors}. ${currentArticle?.summary} ${currentArticle?.findings.join('. ')}`
      
      const newUtterance = new SpeechSynthesisUtterance(text)
      newUtterance.rate = 0.9
      newUtterance.pitch = 1.1
      newUtterance.volume = 1.0
      
      // Try to find a good English voice
      const englishVoice = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en'))
      if (englishVoice) {
        newUtterance.voice = englishVoice
      }
      
      setUtterance(newUtterance)
      synthesis.speak(newUtterance)
      setAudioPlaying(true)
      
      newUtterance.onend = () => setAudioPlaying(false)
      newUtterance.onerror = () => {
        setAudioPlaying(false)
        console.error('Speech synthesis error')
      }
    }
  }

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(!saved)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentArticle?.title || 'Medical Research',
          text: `Check out this research article from ClinicOps`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Share failed:', error)
        // Fallback to copy link
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard')
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    }
  }

  const handleDownloadPDF = () => {
    if (!currentArticle) return
    
    const content = `
      ${currentArticle.title}
      Authors: ${currentArticle.authors}
      Journal: ${currentArticle.journal}
      Year: ${currentArticle.year}
      
      Summary: ${currentArticle.summary}
      
      Findings: ${currentArticle.findings.join(' ')}
      
      Limitations: ${currentArticle.limitations.join(' ')}
    `
    
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentArticle.id}-summary.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!currentArticle) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Research Summary</h1>
          <p className="text-text-secondary">Detailed analysis and key takeaways</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-pale-sage rounded-lg hover:bg-warm-cream transition-colors"
          >
            <ShareIcon className="w-5 h-5 text-text-secondary" />
            <span className="text-sm">Share</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-pale-sage rounded-lg hover:bg-warm-cream transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-text-secondary" />
            <span className="text-sm">Save PDF</span>
          </motion.button>
        </div>
      </div>

      {/* Article Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="w-6 h-6 text-pale-sage" />
            <span className="font-bold text-forest-green">{currentArticle.journal}</span>
            <span className="text-sm text-text-secondary">• {currentArticle.year}</span>
          </div>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={currentArticle.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-pale-sage hover:text-forest-green transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            <span className="text-sm font-medium">View Original</span>
          </motion.a>
        </div>

        <h2 className="text-2xl font-serif font-bold mb-4 leading-tight text-forest-green">
          {currentArticle.title}
        </h2>

        <div className="flex items-center space-x-2 text-sm text-text-secondary mb-6">
          <span>{currentArticle.authors}</span>
        </div>

        {/* Read Aloud Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleReadAloud}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all shadow-card ${
            audioPlaying 
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-card-hover' 
              : 'bg-forest-green text-white hover:bg-green-600 hover:shadow-card-hover'
          }`}
        >
          {audioPlaying ? (
            <PauseIcon className={`w-5 h-5 animate-pulse`} />
          ) : (
            <SpeakerWaveIcon className={`w-5 h-5`} />
          )}
          <span>{audioPlaying ? 'Stop Reading' : 'Read Aloud'}</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
              <DocumentTextIcon className="w-6 h-6 mr-2" />
              Summary
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {currentArticle.summary}
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              This study demonstrates significant and sustained improvements in glycemic control for patients with type 2 diabetes. These outcomes were maintained throughout the 5-year follow-up period, suggesting durable benefits of surgical intervention compared to traditional medical management approaches.
            </p>
          </motion.div>

          {/* Key Findings */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
              <CheckBadgeIcon className="w-6 h-6 mr-2 text-green-500" />
              Key Findings
            </h3>
            <div className="space-y-3">
              {currentArticle.findings.map((finding, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={() => alert(`Details for: ${finding}`)}
                >
                  <div className="w-6 h-6 flex-shrink-0 bg-green-100 text-green-600 rounded-full flex items-center justify-center mt-1">
                    <CheckBadgeIcon className="w-4 h-4" />
                  </div>
                  <p className="text-text-secondary">{finding}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Limitations */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-yellow-500" />
              Limitations
            </h3>
            <div className="space-y-3">
              {currentArticle.limitations.map((limitation, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={() => alert(`About limitation: ${limitation}`)}
                >
                  <div className="w-6 h-6 flex-shrink-0 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mt-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  </div>
                  <p className="text-text-secondary">{limitation}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Clinical Implications */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-pale-sage/30 rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-xl font-serif font-bold mb-4 text-forest-green">Clinical Implications</h3>
            <p className="leading-relaxed text-text-secondary">
              These findings support considering bariatric surgery as an effective treatment option for patients with type 2 diabetes, particularly those who have not achieved adequate glycemic control with medical management alone. The results suggest long-term benefits beyond weight loss, including reduced cardiovascular risk and improved quality of life.
            </p>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Article Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-light-green">
                <span className="text-sm text-text-secondary">Year</span>
                <span className="font-medium text-forest-green">{currentArticle.year}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-light-green">
                <span className="text-sm text-text-secondary">Journal</span>
                <span className="font-medium text-forest-green">{currentArticle.journal}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-light-green">
                <span className="text-sm text-text-secondary">Study Type</span>
                <span className="font-medium text-forest-green">Cohort Study</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-light-green">
                <span className="text-sm text-text-secondary">Sample Size</span>
                <span className="font-medium text-forest-green">500 patients</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Follow-up</span>
                <span className="font-medium text-forest-green">5 years</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-light-green rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="w-full flex items-center space-x-3 px-3 py-2 bg-pale-sage/50 rounded-lg hover:bg-pale-sage transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
                <span>Share Article</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadPDF}
                className="w-full flex items-center space-x-3 px-3 py-2 bg-pale-sage/50 rounded-lg hover:bg-pale-sage transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Save PDF</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleReadAloud}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors shadow-card ${
                  audioPlaying 
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-card-hover' 
                    : 'bg-forest-green text-white hover:bg-green-600 hover:shadow-card-hover'
                }`}
              >
                {audioPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
                <span>{audioPlaying ? 'Stop Reading' : 'Read Aloud'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => handleSaveToggle(e)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  saved ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-pale-sage/50 text-pale-sage hover:bg-pale-sage'
                }`}
              >
                <HeartIcon className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}