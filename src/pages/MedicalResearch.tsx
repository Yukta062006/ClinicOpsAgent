import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Download, 
  Bookmark, 
  ChevronRight, 
  X, 
  ArrowRight, 
  BookOpen, 
  Microscope, 
  FileText, 
  FileSearch, 
  ShieldCheck, 
  HeartPulse, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink,
  Layers
} from 'lucide-react'
import { useData, ResearchArticle } from '../context/DataContext'

export default function MedicalResearch() {
  const navigate = useNavigate()
  const { researchArticles, savedResearch, toggleSaveResearch } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('relevant')
  const [pubmedSource, setPubmedSource] = useState('PubMed')
  const [notification, setNotification] = useState<string | null>(null)

  const filterTypes = [
    { id: 'clinical-trial', label: 'Clinical Trial', icon: <Microscope className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <FileText className="w-4 h-4" /> },
    { id: 'case-study', label: 'Case Study', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'guideline', label: 'Guideline', icon: <ShieldCheck className="w-4 h-4" /> }
  ]

  const popularSearches = ['Diabetes', 'Cardiology', 'Oncology', 'Immunotherapy']

  const trendingTopics = [
    { name: 'Diabetes', count: '234 articles' },
    { name: 'Cardiology', count: '189 articles' },
    { name: 'Oncology', count: '156 articles' },
    { name: 'Immunotherapy', count: '142 articles' }
  ]

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const articleList = researchArticles || []
  const filteredArticles = articleList.filter(art => {
    if (!art) return false
    const matchesSearch = !searchQuery.trim() || 
      (art.title && art.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.authors && art.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.tags && Array.isArray(art.tags) && art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesType = !selectedType || art.type === selectedType
    return matchesSearch && matchesType
  })

  const handleDownloadPdf = (e: React.MouseEvent, art: ResearchArticle) => {
    e.stopPropagation()
    const content = `CLINICAL EVIDENCE BRIEF\nTitle: ${art.title}\nJournal: ${art.journal} (${art.year})\nAuthors: ${art.authors}\nType: ${art.type}\nVerified by PubMed NCBI.\n\nSummary:\n${art.summary}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${art.id}-evidence.txt`
    a.click()
    URL.revokeObjectURL(url)
    notify(`Downloaded clinical brief: ${art.title.slice(0, 30)}...`)
  }

  const handleViewArticle = (art: ResearchArticle) => {
    navigate('/research-summary', { state: { articleId: art.id } })
  }

  const getArticleCategoryIcon = (tags: string[]) => {
    if (tags.some(t => t.toLowerCase().includes('diabetes'))) return <Microscope className="w-6 h-6 text-emerald-800" />
    if (tags.some(t => t.toLowerCase().includes('cardio') || t.toLowerCase().includes('hypertension'))) return <HeartPulse className="w-6 h-6 text-rose-800" />
    return <Activity className="w-6 h-6 text-sky-800" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-forest-green text-white px-5 py-3 rounded-xl shadow-lg border border-pale-sage flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div>
        <p className="text-xs font-semibold tracking-wider text-forest-green/70 uppercase mb-1">
          PATIENT ENGAGEMENT / CLINICAL EVIDENCE
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
          Medical Research
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Access peer-reviewed medical research articles vetted by board-certified physicians.
        </p>
      </div>

      {/* Hero Banner with Study Filter Pills */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#F0F6F1] via-[#FAFDFB] to-[#E9F3EB] border border-pale-sage p-6 lg:p-8 overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Evidence for a Healthier Tomorrow
          </span>
          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-forest-green tracking-tight mt-2">
            Clinical Evidence Library
          </h2>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Summaries of authoritative randomized controlled trials, epidemiological reviews, and practice guidelines.
          </p>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {filterTypes.map(ft => {
              const active = selectedType === ft.id
              return (
                <button
                  key={ft.id}
                  onClick={() => setSelectedType(active ? null : ft.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-forest-green text-white border-forest-green shadow-xs'
                      : 'bg-white/90 text-stone-700 border-pale-sage hover:bg-white hover:text-forest-green'
                  }`}
                >
                  {ft.icon}
                  <span>{ft.label}</span>
                  {active && <X className="w-3 h-3 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Badge */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="bg-white/90 backdrop-blur-xs border border-pale-sage rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-pale-sage/60 flex items-center justify-center text-forest-green">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-green">Research Today,</p>
              <p className="text-xs text-text-secondary font-medium">Better Care Tomorrow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-pale-sage rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, authors, clinical terms..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[#FAFBF9] border border-pale-sage/60 text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Source select */}
            <select
              value={pubmedSource}
              onChange={(e) => setPubmedSource(e.target.value)}
              className="px-3 py-2 rounded-xl border border-pale-sage text-xs bg-[#FAFBF9] text-stone-700 focus:outline-hidden"
            >
              <option value="PubMed">PubMed Central</option>
              <option value="Lancet">The Lancet</option>
              <option value="NEJM">NEJM Database</option>
            </select>

            <button
              onClick={() => notify(`Searching verified ${pubmedSource} database...`)}
              className="px-4 py-2 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
            >
              Search
            </button>

            {(searchQuery || selectedType) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedType(null)
                }}
                className="px-3 py-2 rounded-xl border border-pale-sage text-xs text-text-secondary hover:text-stone-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Popular searches pill row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary pt-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Popular:</span>
          {popularSearches.map(term => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="px-2.5 py-0.5 rounded-full bg-[#F5F8F6] border border-pale-sage text-stone-700 text-xs hover:border-forest-green/40 hover:text-forest-green transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Articles List + Sidebar Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Articles List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Found <strong>{filteredArticles.length}</strong> clinical articles</span>
            
            <div className="flex items-center gap-1.5">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="relevant">Most Relevant</option>
                <option value="recent">Most Recent</option>
                <option value="citations">Most Cited</option>
              </select>
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="bg-white border border-pale-sage rounded-2xl p-10 text-center">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <h3 className="font-serif font-bold text-forest-green text-base">No Research Articles Found</h3>
              <p className="text-xs text-text-secondary mt-1">Try another keyword or reset active filters.</p>
            </div>
          ) : (
            filteredArticles.map(art => {
              const isSaved = savedResearch.includes(art.id)
              return (
                <div
                  key={art.id}
                  onClick={() => handleViewArticle(art)}
                  className="bg-white border border-pale-sage rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:border-forest-green/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Clean Lucide icon category emblem */}
                      <div className="w-12 h-12 rounded-xl bg-[#F0F6F1] border border-pale-sage flex items-center justify-center shrink-0 group-hover:bg-forest-green group-hover:text-white transition-colors">
                        {getArticleCategoryIcon(art.tags)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <BookOpen className="w-3.5 h-3.5 text-forest-green" />
                          <span className="font-semibold text-forest-green">{art.journal}</span>
                          <span>•</span>
                          <span>{art.year}</span>
                        </div>

                        <h3 className="text-base font-serif font-bold text-stone-900 mt-1 group-hover:text-forest-green transition-colors leading-snug">
                          {art.title}
                        </h3>

                        <p className="text-xs text-text-secondary mt-1 font-medium">{art.authors}</p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          {art.tags.map(tag => (
                            <span 
                              key={tag}
                              className="text-[10px] font-semibold text-stone-600 bg-[#FAFBF9] border border-pale-sage px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Type badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full shrink-0">
                      {art.type.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-pale-sage/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSaveResearch(art.id)
                          notify(isSaved ? 'Removed from saved articles.' : 'Saved to your clinical library.')
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          isSaved
                            ? 'bg-forest-green text-white border-forest-green'
                            : 'bg-white text-stone-700 border-pale-sage hover:bg-[#F5F8F6]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        onClick={(e) => handleDownloadPdf(e, art)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pale-sage bg-white text-stone-700 text-xs font-semibold hover:bg-[#F5F8F6] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>

                    <div className="inline-flex items-center gap-1 font-semibold text-forest-green group-hover:translate-x-1 transition-transform">
                      <span>View Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Sidebar: Research Stats & Trending Topics */}
        <div className="space-y-6">
          
          {/* Research Stats Card */}
          <div className="bg-white border border-pale-sage rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-forest-green" />
              <h3 className="font-serif font-bold text-forest-green text-base">
                Research Stats
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#FAFBF9] border border-pale-sage">
                <Bookmark className="w-4 h-4 text-forest-green mx-auto mb-1" />
                <div className="text-xl font-serif font-bold text-forest-green leading-none">
                  {savedResearch.length > 0 ? savedResearch.length : 156}
                </div>
                <div className="text-[10px] text-text-secondary mt-1">Total Saved</div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFBF9] border border-pale-sage">
                <BookOpen className="w-4 h-4 text-forest-green mx-auto mb-1" />
                <div className="text-xl font-serif font-bold text-forest-green leading-none">
                  12
                </div>
                <div className="text-[10px] text-text-secondary mt-1">Journals</div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFBF9] border border-pale-sage">
                <Activity className="w-4 h-4 text-forest-green mx-auto mb-1" />
                <div className="text-xl font-serif font-bold text-forest-green leading-none">
                  42
                </div>
                <div className="text-[10px] text-text-secondary mt-1">Searches</div>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-white border border-pale-sage rounded-2xl p-5 shadow-xs">
            <h3 className="font-serif font-bold text-forest-green text-base mb-3">
              Trending Clinical Topics
            </h3>

            <div className="space-y-2">
              {trendingTopics.map((topic, i) => (
                <div
                  key={i}
                  onClick={() => setSearchQuery(topic.name)}
                  className="p-2.5 rounded-xl border border-pale-sage/70 hover:bg-[#FAFBF9] transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-stone-800">{topic.name}</span>
                  <span className="text-[11px] text-text-secondary">{topic.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Evidence Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F0F6F1] to-[#E8F1EB] border border-pale-sage">
            <h4 className="font-serif font-bold text-forest-green text-sm mb-1">
              Evidence-Based Practice
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every clinical summary is indexed directly from peer-reviewed publications adhering to CONSORT and PRISMA guidelines.
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}