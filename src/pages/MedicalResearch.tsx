import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  BookOpenIcon,
  ScaleIcon,
  XMarkIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  DocumentTextIcon as DocumentTextIcon2,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface ResearchArticle {
  id: string
  title: string
  authors: string
  journal: string
  year: string
  type: 'clinical-trial' | 'review' | 'case-study' | 'guideline'
  tags: string[]
  url: string
  abstract: string
  findings: string[]
  limitations: string[]
}

export default function MedicalResearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ResearchArticle | null>(null)
  const [savedArticles, setSavedArticles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [articleTypes] = useState({
    'clinical-trial': { label: 'Clinical Trial', color: 'bg-blue-100 text-blue-800' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-800' },
    'case-study': { label: 'Case Study', color: 'bg-yellow-100 text-yellow-800' },
    'guideline': { label: 'Guideline', color: 'bg-purple-100 text-purple-800' }
  })
  
  const { 
    researchArticles, 
    savedResearch, 
    toggleSaveResearch,
    getSavedArticles
  } = useData()

  // Initialize saved articles from context
  useEffect(() => {
    setSavedArticles(savedResearch)
    setLoading(false)
  }, [savedResearch])

  // Filter articles
  const filteredArticles = researchArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType ? article.type === filterType : true
    return matchesSearch && matchesType
  })

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType(null)
  }

  const handleSaveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSaveResearch(id)
  }

  const handleDownloadPDF = (article: ResearchArticle, e: React.MouseEvent) => {
    e.stopPropagation()
    const content = `
      ${article.title}
      Authors: ${article.authors}
      Journal: ${article.journal}
      Year: ${article.year}
      
      Abstract: ${article.abstract}
      
      Findings: ${article.findings.join(' ')}
      
      Limitations: ${article.limitations.join(' ')}
    `
    
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${article.id}-research.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Medical Research</h1>
          <p className="text-text-secondary">Access peer-reviewed medical research articles</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="flex items-center space-x-2 bg-forest-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
        >
          <ScaleIcon className="w-5 h-5" />
          <span>Clear Filters</span>
        </motion.button>
      </div>

      {/* Type Filter Buttons */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center space-x-2 mb-6 flex-wrap"
      >
        {Object.entries(articleTypes).map(([type, { label, color }]) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterType(filterType === type ? null : type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === type
                ? `${color} ring-2 ring-offset-2 ring-forest-green`
                : 'bg-warm-cream text-text-secondary hover:bg-light-green'
            }`}
          >
            {label}
          </motion.button>
        ))}
      </motion.div>

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
            placeholder="Search articles, authors, or tags..."
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-2">
            <span className="text-sm text-text-secondary">PubMed</span>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-text-secondary">Popular searches:</span>
          {['Diabetes', 'Cardiology', 'Oncology', 'Immunotherapy'].map((term, index) => (
            <motion.button
              key={index}
              onClick={() => setSearchQuery(term)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 bg-pale-sage text-white text-sm rounded-full hover:bg-forest-green transition-colors"
            >
              {term}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <span className="text-sm text-text-secondary">Found {filteredArticles.length} articles</span>
      </motion.div>

      {/* Articles List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredArticles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage transition-shadow cursor-pointer"
            onClick={() => setSelectedArticle(article)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <BookOpenIcon className="w-5 h-5 text-pale-sage" />
                <span className="font-bold text-forest-green">{article.journal}</span>
                <span className="text-sm text-text-secondary">• {article.year}</span>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${articleTypes[article.type].color}`}>
                  {articleTypes[article.type].label}
                </span>
              </motion.div>
            </div>

            <h3 className="text-xl font-serif font-bold text-forest-green mb-2">
              {article.title}
            </h3>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-text-secondary">{article.authors}</span>
            </div>

            <div className="flex items-center space-x-2 mb-4 flex-wrap">
              {article.tags.map((tag, tagIndex) => (
                <span key={tagIndex} className="px-3 py-1 bg-light-green text-text-secondary text-sm rounded-full border border-pale-sage/50">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-light-green">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleSaveToggle(article.id, e)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  savedArticles.includes(article.id) 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-light-green text-text-secondary hover:bg-pale-sage/50'
                }`}
              >
                <HeartIcon className={`w-5 h-5 ${savedArticles.includes(article.id) ? 'fill-current' : ''}`} />
                <span>{savedArticles.includes(article.id) ? 'Saved' : 'Save'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleDownloadPDF(article, e)}
                className="flex items-center space-x-2 px-4 py-2 bg-light-green text-text-secondary rounded-lg hover:bg-pale-sage/50 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>PDF</span>
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-forest-green text-white rounded-lg hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                <span>View Article</span>
              </motion.a>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pale-sage/30 rounded-lg text-pale-sage">
              <DocumentTextIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-forest-green">156</div>
          <div className="text-sm text-text-secondary">Total Articles Saved</div>
        </div>

        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pale-sage/30 rounded-lg text-pale-sage">
              <HeartIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-forest-green">{savedArticles.length}</div>
          <div className="text-sm text-text-secondary">Favorite Publications</div>
        </div>

        <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pale-sage/30 rounded-lg text-pale-sage">
              <BookOpenIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-forest-green">42</div>
          <div className="text-sm text-text-secondary">Recent Searches</div>
        </div>
      </motion.div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-light-green sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpenIcon className="w-6 h-6 text-pale-sage" />
                    <div>
                      <h2 className="text-xl font-serif font-bold text-forest-green">{selectedArticle.journal}</h2>
                      <span className="text-sm text-text-secondary">{selectedArticle.year}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold mb-4 text-forest-green">
                  {selectedArticle.title}
                </h3>

                <div className="flex items-center space-x-2 mb-6 text-sm text-text-secondary">
                  <span>{selectedArticle.authors}</span>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${articleTypes[selectedArticle.type].color}`}>
                    {articleTypes[selectedArticle.type].label}
                  </span>
                  {selectedArticle.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-light-green text-text-secondary text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif font-bold mb-2 text-forest-green">Abstract</h4>
                    <p className="text-text-secondary leading-relaxed">{selectedArticle.abstract}</p>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold mb-2 text-forest-green">Key Findings</h4>
                    <ul className="space-y-2">
                      {selectedArticle.findings.map((finding, index) => (
                        <li key={index} className="flex items-start space-x-2 text-text-secondary">
                          <CheckBadgeIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold mb-2 text-forest-green">Limitations</h4>
                    <ul className="space-y-2">
                      {selectedArticle.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2 text-text-secondary">
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleSaveToggle(selectedArticle.id, e)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      savedArticles.includes(selectedArticle.id) 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-light-green text-text-secondary'
                    }`}
                  >
                    <HeartIcon className={`w-5 h-5 ${savedArticles.includes(selectedArticle.id) ? 'fill-current' : ''}`} />
                    <span>{savedArticles.includes(selectedArticle.id) ? 'Saved' : 'Save'}</span>
                  </motion.button>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-forest-green text-white rounded-lg hover:bg-green-600 transition-all"
                  >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    <span>View Original</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}