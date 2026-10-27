import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  SpeakerWaveIcon, 
  ArrowDownTrayIcon, 
  ShareIcon,
  BookmarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  LanguageIcon,
  BookOpenIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { useData, ResearchArticle } from '../context/DataContext'

const fallbackArticle: ResearchArticle = {
  id: '1',
  title: 'Dietary patterns & blood pressure (The DASH Trial)',
  authors: 'Appel LJ, Moore TJ, Obarzanek E, Vollmer WM, Svetkey LP, Sacks FM',
  journal: 'New England Journal of Medicine',
  year: '1997',
  type: 'clinical-trial',
  tags: ['Nutrition', '5 min read', 'Plain-language overview'],
  url: 'https://www.nejm.org/doi/10.1056/NEJM199704173361601',
  summary: 'The DASH trial examined whether combinations of whole foods could lower systolic and diastolic blood pressure without requiring pharmaceutical antihypertensives or extreme sodium restriction.',
  abstract: 'The Dietary Approaches to Stop Hypertension (DASH) trial was a randomized multicenter trial comparing a control diet typical of standard intake with a diet rich in fruits and vegetables, and a combination diet high in fruits, vegetables, and low-fat dairy with reduced saturated fat. The combination diet significantly lowered blood pressure in both hypertensive and normotensive individuals.',
  findings: [
    'The combination DASH diet reduced systolic blood pressure by an average of 5.5 mmHg and diastolic by 3.0 mmHg compared to control',
    'Among hypertensive individuals, systolic reductions averaged 11.4 mmHg and diastolic 5.5 mmHg',
    'Blood pressure reductions occurred rapidly within 2 weeks of dietary adherence and were sustained throughout the 8-week intervention'
  ],
  limitations: [
    'Meals were fully prepared and provided in a controlled trial setting; real-world compliance may vary',
    'All participants maintained stable body weight, isolating nutritional patterns from weight reduction'
  ],
  clinicalImplications: 'A dietary pattern rich in fruits, vegetables, and low-fat dairy foods and with reduced saturated and total fat can substantially lower blood pressure and serves as a cornerstone of cardiovascular preventive therapy.',
  sampleSize: '459 adults',
  followUp: '8 weeks controlled feeding'
}

export default function ResearchSummary() {
  const navigate = useNavigate()
  const location = useLocation()
  const { researchArticles, savedResearch, toggleSaveResearch } = useData()

  const stateArticleId = (location.state as any)?.articleId

  // Selected article safely resolved
  const [article, setArticle] = useState<ResearchArticle>(() => {
    if (stateArticleId && researchArticles && researchArticles.length > 0) {
      const match = researchArticles.find(a => a.id === stateArticleId)
      if (match) return match
    }
    const saved = localStorage.getItem('clinicops_active_article')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.title) return parsed
      } catch (e) {}
    }
    return (researchArticles && researchArticles.length > 0) ? researchArticles[0] : fallbackArticle
  })

  useEffect(() => {
    if (stateArticleId && researchArticles && researchArticles.length > 0) {
      const match = researchArticles.find(a => a.id === stateArticleId)
      if (match) {
        setArticle(match)
        localStorage.setItem('clinicops_active_article', JSON.stringify(match))
      }
    }
  }, [stateArticleId, researchArticles])

  const safeArticle = article || fallbackArticle

  // Tabs: 'summary' | 'source' | 'notes'
  const [activeTab, setActiveTab] = useState<'summary' | 'source' | 'notes'>('summary')

  // Language state: 'en' | 'hi' | 'mr'
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en')
  
  // Audio playback state
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('Detecting Natural Female Voice...')
  const [shareSuccess, setShareSuccess] = useState(false)
  const [userNote, setUserNote] = useState<string>(() => localStorage.getItem(`clinicops_note_${safeArticle.id}`) || '')
  const [noteSaved, setNoteSaved] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSaved = (savedResearch || []).includes(safeArticle.id)

  // Multilingual translations for the research summary
  const translations = {
    en: {
      summaryTitle: 'Plain-language summary',
      bigPictureTitle: 'The overall eating pattern matters.',
      bigPictureSub: 'An educational overview of the original clinical trial, with the evidence close by.',
      callout: 'This is a learning summary, not a diet prescription. Your care team can help you interpret the research in the context of your own health.',
      q1Title: '01 The research question',
      q1Text: 'Could a change in whole-food dietary patterns lower blood pressure without medication or severe sodium restriction? The trial tested dietary patterns while keeping weight and sodium constant.',
      q2Title: '02 What the study explored',
      q2Control: 'A typical dietary pattern used for comparison, reflecting standard baseline intake.',
      q2Fruits: 'A pattern with increased fruits and vegetables, providing higher dietary potassium and magnesium.',
      q2Combo: 'A combination diet high in fruits, vegetables, and low-fat dairy with reduced saturated fat (the DASH diet).',
      q3Title: '03 What it means',
      q3Text: 'The combination pattern lowered blood pressure significantly compared with the control diet. This trial established that whole dietary patterns produce powerful cardiovascular improvements.',
      q4Title: '04 Important limitations',
      q4Text: safeArticle.limitations || [
        'Meals were provided in a controlled trial setting; adherence in daily life requires sustainable habit building.',
        'Body weight was deliberately kept stable to ensure changes were due to food choices rather than weight loss.'
      ],
      findingsTitle: 'Key Clinical Findings',
      findings: safeArticle.findings || [
        'Significant blood pressure reduction achieved within 14 days of beginning the combination diet.',
        'Hypertensive participants experienced systolic drops of up to 11.4 mmHg.',
        'Results proved reproducible across diverse adult age groups and ethnicities.'
      ],
      quoteText: 'Knowledge today for healthier choices tomorrow.'
    },
    hi: {
      summaryTitle: 'सरल भाषा सारांश (हिंदी)',
      bigPictureTitle: 'समग्र खान-पान की गुणवत्ता और रक्तचाप संतुलन।',
      bigPictureSub: 'नैदानिक परीक्षण का साक्ष्य-आधारित अवलोकन — आपके स्वास्थ्य के संदर्भ में।',
      callout: 'यह एक शैक्षिक स्वास्थ्य सारांश है, कोई व्यक्तिगत डॉक्टर का नुस्खा नहीं। अपनी स्वास्थ्य योजना के लिए हमेशा अपने डॉक्टर से परामर्श करें।',
      q1Title: '०१ अनुसंधान का मुख्य प्रश्न',
      q1Text: 'क्या संतुलित खान-पान और प्राकृतिक आहार के जरिए बिना अतिरिक्त दवाओं के उच्च रक्तचाप (हाइपरटेंशन) को नियंत्रित किया जा सकता है?',
      q2Title: '०२ अध्ययन में क्या जांचा गया',
      q2Control: 'सामान्य दैनिक भारतीय व वैश्विक भोजन, जिसका उपयोग तुलनात्मक नियंत्रण के लिए किया गया।',
      q2Fruits: 'ताजे फल और हरी सब्जियों से भरपूर आहार, जिसमें पोटेशियम और फाइबर प्रचुर मात्रा में था।',
      q2Combo: 'डैश (DASH) संयोजन आहार: फल, हरी पत्तेदार सब्जियां, कम वसा वाले डेयरी उत्पाद और कम संतृप्त वसा।',
      q3Title: '०३ निष्कर्ष और नैदानिक प्रभाव',
      q3Text: 'संयोजन आहार ने केवल १४ दिनों के भीतर सिस्टोलिक और डायस्टोलिक रक्तचाप में अत्यंत प्रभावी व टिकाऊ कमी दर्ज की।',
      q4Title: '०४ अध्ययन की मुख्य सीमाएं',
      q4Text: [
        'भोजन नियंत्रित परिस्थितियों में प्रदान किया गया था; दैनिक दिनचर्या में इसे नियमित आदत बनाना आवश्यक है।',
        'प्रतिभागियों का शारीरिक वजन स्थिर रखा गया ताकि सुधार केवल खान-पान के प्रभाव से परखा जा सके।'
      ],
      findingsTitle: 'प्रमुख नैदानिक निष्कर्ष',
      findings: [
        'संयोजन आहार से सिस्टोलिक रक्तचाप में औसतन ५.५ से ११.४ mmHg तक की महत्वपूर्ण कमी आई।',
        'रक्तचाप में सुधार आहार शुरू करने के पहले दो हफ्तों के भीतर ही स्पष्ट हो गया।',
        'यह आहार हृदय स्वास्थ्य और धमनियों की लचीलापन सुधारने में अत्यंत प्रभावकारी सिद्ध हुआ।'
      ],
      quoteText: 'आज का स्वास्थ्य ज्ञान, कल का निरोगी जीवन।'
    },
    mr: {
      summaryTitle: 'सोप्या भाषेतील सारांश (मराठी)',
      bigPictureTitle: 'आहाराची योग्य पद्धत आणि रक्तदाब नियंत्रण.',
      bigPictureSub: 'वैद्यकीय संशोधनाचा प्रत्यक्ष अभ्यास — सोप्या आणि विश्वासाहार्य स्वरूपात.',
      callout: 'हा केवळ माहितीपूर्ण व शैक्षणिक आढावा आहे. कोणत्याही औषधोपचार बदलासाठी आपल्या डॉक्टरांचा सल्ला नक्की घ्या.',
      q1Title: '०१ संशोधनाचा मूळ प्रश्न',
      q1Text: 'संतुलित आणि पौष्टिक आहाराच्या माध्यमातून औषधांशिवाय रक्तदाब नियंत्रित ठेवणे शक्य आहे का?',
      q2Title: '०२ संशोधनात काय अभ्यासले गेले',
      q2Control: 'पारंपरिक नेहमीचा आहार, ज्याची तुलना मुख्य घटकांशी करण्यात आली.',
      q2Fruits: 'अधिक फळे आणि भाज्यांचा समावेश असलेला पोटॅशियमयुक्त आहार.',
      q2Combo: 'डॅश (DASH) संयुक्त आहार: फळे, हिरव्या भाज्या, कमी स्निग्धता असलेले दूध व दुग्धजन्य पदार्थ.',
      q3Title: '०३ निष्कर्ष आणि महत्त्व',
      q3Text: 'संयुक्त आहार पद्धतीमुळे अवघ्या दोन आठवड्यांत उच्च रक्तदाबात अत्यंत लक्षणीय घट नोंदवली गेली.',
      q4Title: '०४ अभ्यासाच्या मर्यादा',
      q4Text: [
        'सर्व आहार नियंत्रित वातावरणात दिला गेला होता; दैनंदिन जीवनात नियमित पाळणे आवश्यक आहे.',
        'वजन बदलू न देता केवळ अन्नघटकांच्या परिणामांचा अभ्यास करण्यात आला.'
      ],
      findingsTitle: 'महत्त्वाचे वैद्यकीय निष्कर्ष',
      findings: [
        'डॅश आहाराने सिस्टोलिक रक्तदाबात सरासरी ५.५ ते ११.४ mmHg पर्यंत टिकाऊ घट नोंदवली.',
        'आहार सुरू केल्यानंतर अवघ्या १४ दिवसांत अनुकूल परिणाम दिसू लागले.',
        'हृदयविकाराचा धोका कमी करण्यासाठी ही आहार पद्धती जगभरात मान्यताप्राप्त ठरली आहे.'
      ],
      quoteText: 'आजचे आरोग्य शिक्षण, उद्याचे दीर्घायुषी भविष्य.'
    }
  }

  const currentContent = translations[selectedLanguage] || translations.en

  // Helper function to pick a natural, soft, professional female voice
  const getFemaleVoice = (lang: 'en' | 'hi' | 'mr'): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return null

    const isFemale = (v: SpeechSynthesisVoice) => {
      const lower = (v.name + ' ' + (v as any).voiceURI || '').toLowerCase()
      // Reject explicit male identifiers
      if (lower.includes('male') && !lower.includes('female')) return false
      if (lower.includes('rishi') || lower.includes('david') || lower.includes('mark') || 
          lower.includes('george') || lower.includes('james') || lower.includes('guy') || 
          lower.includes('stefan') || lower.includes('daniel')) {
        return false
      }
      // Prefer explicit female identifiers
      if (lower.includes('female') || lower.includes('zira') || lower.includes('heera') || 
          lower.includes('neerja') || lower.includes('veena') || lower.includes('swara') || 
          lower.includes('kalpana') || lower.includes('jenny') || lower.includes('samantha') || 
          lower.includes('victoria') || lower.includes('karen') || lower.includes('priya') || 
          lower.includes('sonia') || lower.includes('shree')) {
        return true
      }
      return true // Neutral fallback
    }

    if (lang === 'hi') {
      const hiFemale = voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && isFemale(v))
      if (hiFemale) return hiFemale
      const anyHi = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'))
      if (anyHi) return anyHi
    }

    if (lang === 'mr') {
      const mrFemale = voices.find(v => (v.lang === 'mr-IN' || v.lang.startsWith('mr')) && isFemale(v))
      if (mrFemale) return mrFemale
      const anyMr = voices.find(v => v.lang === 'mr-IN' || v.lang.startsWith('mr'))
      if (anyMr) return anyMr
      // Fallback to Hindi female voice for Indian Devanagari pronunciation
      const hiFemale = voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && isFemale(v))
      if (hiFemale) return hiFemale
    }

    // English: Prioritize Indian English Female voice (e.g. Heera, Neerja, Veena), then natural English female
    const inFemale = voices.find(v => (v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) && isFemale(v))
    if (inFemale) return inFemale

    const enFemale = voices.find(v => v.lang.startsWith('en') && isFemale(v))
    if (enFemale) return enFemale

    return voices[0] || null
  }

  // Voice detection on mount and language change
  useEffect(() => {
    const updateVoiceLabel = () => {
      const voice = getFemaleVoice(selectedLanguage)
      if (voice) {
        setCurrentVoiceName(`${voice.name} (${voice.lang})`)
      } else {
        setCurrentVoiceName(selectedLanguage === 'en' ? 'Natural Female Voice (English - en-IN)' : `${selectedLanguage.toUpperCase()} Voice`)
      }
    }

    updateVoiceLabel()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceLabel
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [selectedLanguage])

  // Functional Play Audio
  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.')
      return
    }

    if (audioStatus === 'paused') {
      window.speechSynthesis.resume()
      setAudioStatus('playing')
      return
    }

    window.speechSynthesis.cancel()

    // Build the narrative text purely in the selected language
    let textToRead = ''
    if (selectedLanguage === 'hi') {
      textToRead = `डैश (DASH) आहार और रक्तचाप नियंत्रण अध्ययन। ${currentContent.bigPictureTitle} ${currentContent.callout} ${currentContent.q1Title}: ${currentContent.q1Text} ${currentContent.q3Title}: ${currentContent.q3Text} ${currentContent.findingsTitle}: ${currentContent.findings.join('. ')}`
    } else if (selectedLanguage === 'mr') {
      textToRead = `डॅश (DASH) आहार आणि रक्तदाब नियंत्रण अभ्यास। ${currentContent.bigPictureTitle} ${currentContent.callout} ${currentContent.q1Title}: ${currentContent.q1Text} ${currentContent.q3Title}: ${currentContent.q3Text} ${currentContent.findingsTitle}: ${currentContent.findings.join('. ')}`
    } else {
      textToRead = `${safeArticle.title}. ${currentContent.bigPictureTitle}. ${currentContent.callout}. ${currentContent.q1Title}: ${currentContent.q1Text}. ${currentContent.q3Title}: ${currentContent.q3Text}. ${currentContent.findingsTitle}: ${currentContent.findings.join('. ')}`
    }

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utteranceRef.current = utterance

    // Language code
    if (selectedLanguage === 'hi') utterance.lang = 'hi-IN'
    else if (selectedLanguage === 'mr') utterance.lang = 'mr-IN'
    else utterance.lang = 'en-IN'

    const femaleVoice = getFemaleVoice(selectedLanguage)
    if (femaleVoice) {
      utterance.voice = femaleVoice
    }

    // Natural, clear, professional female healthcare cadence
    utterance.rate = 0.90
    utterance.pitch = 1.05
    utterance.volume = 0.85

    utterance.onstart = () => setAudioStatus('playing')
    utterance.onend = () => setAudioStatus('idle')
    utterance.onerror = () => setAudioStatus('idle')

    window.speechSynthesis.speak(utterance)
  }

  // Functional Pause Audio
  const handlePauseAudio = () => {
    if ('speechSynthesis' in window && audioStatus === 'playing') {
      window.speechSynthesis.pause()
      setAudioStatus('paused')
    }
  }

  // Functional Resume Audio
  const handleResumeAudio = () => {
    if ('speechSynthesis' in window && audioStatus === 'paused') {
      window.speechSynthesis.resume()
      setAudioStatus('playing')
    } else {
      handlePlayAudio()
    }
  }

  // Functional Stop Audio
  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setAudioStatus('idle')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: safeArticle.title,
        text: currentContent.bigPictureTitle,
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    }
  }

  const handleSaveNote = () => {
    localStorage.setItem(`clinicops_note_${safeArticle.id}`, userNote)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
      {/* Top Header Row: Breadcrumb & Language Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#829489] uppercase tracking-wider">
            PATIENT ENGAGEMENT / RESEARCH SUMMARIES
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1B3E2F] tracking-tight mt-0.5">
            {safeArticle.title}
          </h1>
          <p className="text-xs text-[#5A6D62] mt-0.5">
            {currentContent.bigPictureSub}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/patient/medical-research')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#E2ECE4] text-xs font-semibold text-[#1B3E2F] hover:bg-[#EFF5EE] transition-colors shadow-2xs"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to research</span>
          </button>
        </div>
      </div>

      {/* Meta Pills & Author Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2ECE4]">
        <div className="flex flex-wrap items-center gap-2">
          {(safeArticle.tags || ['Nutrition', '5 min read', 'Plain-language overview']).map((tag, i) => (
            <span
              key={i}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                i === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-white text-[#5A6D62] border border-[#E2ECE4]'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-xs text-[#829489] font-medium">
          {safeArticle.authors.split(',')[0]} et al. • {safeArticle.journal} • {safeArticle.year}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[#E2ECE4]">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'summary'
                ? 'bg-[#1B3E2F] text-white shadow-xs'
                : 'text-[#5A6D62] hover:text-[#1B3E2F] hover:bg-[#EFF5EE]'
            }`}
          >
            Plain-language summary
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'source'
                ? 'bg-[#1B3E2F] text-white shadow-xs'
                : 'text-[#5A6D62] hover:text-[#1B3E2F] hover:bg-[#EFF5EE]'
            }`}
          >
            Source details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-4 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'notes'
                ? 'bg-[#1B3E2F] text-white shadow-xs'
                : 'text-[#5A6D62] hover:text-[#1B3E2F] hover:bg-[#EFF5EE]'
            }`}
          >
            My notes
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-white border border-[#E2ECE4] rounded-xl p-1 shadow-2xs">
          <LanguageIcon className="w-3.5 h-3.5 text-[#1B3E2F] ml-1.5" />
          <button
            onClick={() => {
              handleStopAudio()
              setSelectedLanguage('en')
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              selectedLanguage === 'en' ? 'bg-[#1B3E2F] text-white' : 'text-[#5A6D62] hover:text-[#1B3E2F]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              handleStopAudio()
              setSelectedLanguage('hi')
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              selectedLanguage === 'hi' ? 'bg-[#1B3E2F] text-white' : 'text-[#5A6D62] hover:text-[#1B3E2F]'
            }`}
          >
            हिन्दी
          </button>
          <button
            onClick={() => {
              handleStopAudio()
              setSelectedLanguage('mr')
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              selectedLanguage === 'mr' ? 'bg-[#1B3E2F] text-white' : 'text-[#5A6D62] hover:text-[#1B3E2F]'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Natural Female AI Voice Audio Player Card */}
      <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3">
          {audioStatus === 'playing' ? (
            <button
              onClick={handlePauseAudio}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] transition-all shadow-xs"
              title="Pause playback"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : audioStatus === 'paused' ? (
            <button
              onClick={handleResumeAudio}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] transition-all shadow-xs"
              title="Resume playback"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePlayAudio}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] transition-all shadow-xs"
              title="Listen to summary"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Listen Aloud</span>
            </button>
          )}

          {audioStatus !== 'idle' && (
            <button
              onClick={handleStopAudio}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E2ECE4] text-[#5A6D62] hover:text-[#1B3E2F] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
              title="Stop and reset"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop</span>
            </button>
          )}

          <div className="text-xs text-[#5A6D62]">
            <span className="font-semibold text-[#1B3E2F]">Voice:</span> Natural Female Healthcare AI ({selectedLanguage.toUpperCase()})
          </div>
        </div>

        {/* Audio Waveform visualization */}
        <div className="flex items-center space-x-1 self-end md:self-auto">
          {[12, 22, 16, 28, 14, 24, 10, 26, 18, 12, 20].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                audioStatus === 'playing' ? 'bg-[#1B3E2F] animate-pulse' : 'bg-[#C2D4C6]'
              }`}
              style={{ height: audioStatus === 'playing' ? `${h}px` : '8px' }}
            />
          ))}
        </div>
      </div>

      {/* Main Grid: Content (8 Cols) & Source Side Panel (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (8 cols): Tab Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Big Picture Card */}
              <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
                <span className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
                  THE BIG PICTURE
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2D25] leading-snug">
                  {currentContent.bigPictureTitle}
                </h2>
                <p className="text-sm text-[#5A6D62] leading-relaxed">
                  {safeArticle.abstract || safeArticle.summary}
                </p>

                {/* Patient Cautionary Callout */}
                <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#1E2D25] leading-relaxed">
                  <InformationCircleIcon className="w-5 h-5 text-forest-green shrink-0 mt-0.5" />
                  <p>{currentContent.callout}</p>
                </div>
              </div>

              {/* 01 The research question */}
              <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-2">
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">
                  {currentContent.q1Title}
                </h3>
                <p className="text-sm text-[#5A6D62] leading-relaxed">
                  {currentContent.q1Text}
                </p>
              </div>

              {/* 02 What the study explored */}
              <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">
                  {currentContent.q2Title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl p-4 space-y-1.5">
                    <p className="text-xs font-bold text-[#1B3E2F]">Control Diet</p>
                    <p className="text-[11px] text-[#5A6D62] leading-relaxed">
                      {currentContent.q2Control}
                    </p>
                  </div>
                  <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl p-4 space-y-1.5">
                    <p className="text-xs font-bold text-[#1B3E2F]">Fruits & Vegetables</p>
                    <p className="text-[11px] text-[#5A6D62] leading-relaxed">
                      {currentContent.q2Fruits}
                    </p>
                  </div>
                  <div className="bg-[#EFF5EE] border border-pale-sage rounded-2xl p-4 space-y-1.5">
                    <p className="text-xs font-bold text-forest-green">DASH Combination</p>
                    <p className="text-[11px] text-[#1E2D25] leading-relaxed">
                      {currentContent.q2Combo}
                    </p>
                  </div>
                </div>
              </div>

              {/* 03 What it means */}
              <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-3">
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">
                  {currentContent.q3Title}
                </h3>
                <p className="text-sm text-[#5A6D62] leading-relaxed">
                  {currentContent.q3Text}
                </p>

                {/* Key Findings List */}
                <div className="mt-3 space-y-2.5 pt-3 border-t border-[#E2ECE4]">
                  <p className="text-xs font-bold text-[#1B3E2F] uppercase tracking-wider">
                    {currentContent.findingsTitle}:
                  </p>
                  {currentContent.findings.map((f, i) => (
                    <div key={i} className="flex items-start space-x-2.5 text-xs text-[#1E2D25]">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 04 Important limitations */}
              <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-3">
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">
                  {currentContent.q4Title}
                </h3>
                <div className="space-y-2">
                  {Array.isArray(currentContent.q4Text) ? (
                    currentContent.q4Text.map((l, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-[#5A6D62] bg-[#FAF9F5] p-3 rounded-xl border border-[#E2ECE4]">
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{l}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#5A6D62] leading-relaxed">{currentContent.q4Text}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'source' && (
            <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-xl text-[#1B3E2F]">
                Full Citation & Medical Metadata
              </h3>
              <div className="space-y-3 text-xs text-[#5A6D62]">
                <p><strong>Article Title:</strong> {safeArticle.title}</p>
                <p><strong>Lead Authors:</strong> {safeArticle.authors}</p>
                <p><strong>Journal:</strong> {safeArticle.journal} ({safeArticle.year})</p>
                <p><strong>Study Design:</strong> Randomized, Controlled Clinical Feeding Trial</p>
                <p><strong>Sample Size:</strong> {safeArticle.sampleSize || '459 human participants'}</p>
                <p><strong>Follow-Up Duration:</strong> {safeArticle.followUp || '8 weeks controlled intervention'}</p>
                <p><strong>Clinical Classification:</strong> Primary Prevention of Hypertension</p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">
                  My Personal Reading Notes
                </h3>
                {noteSaved && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5A6D62]">
                Record questions you want to discuss with your doctor during your upcoming consultation:
              </p>
              <textarea
                rows={5}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="e.g. Ask Dr. Sarah Sharma about incorporating potassium-rich foods given my existing prescriptions..."
                className="w-full p-3.5 rounded-2xl border border-[#E2ECE4] text-xs text-[#1E2D25] focus:outline-hidden focus:border-forest-green"
              />
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-all shadow-xs"
              >
                Save My Note
              </button>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): The Original Source Card & Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Original Source Card matching Reference Screenshot */}
          <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-5">
            <div>
              <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider mb-2">
                THE ORIGINAL SOURCE
              </p>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full uppercase">
                PUBMED / NCBI
              </span>
              <h4 className="font-serif font-bold text-base text-[#1E2D25] mt-2 leading-snug">
                A clinical trial of the effects of dietary patterns on blood pressure
              </h4>
              <p className="text-xs text-[#5A6D62] mt-1.5">
                {safeArticle.authors.split(',')[0]} LJ et al. {safeArticle.journal} {safeArticle.year} • Volume 336 • Pages 1117–1124
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E2ECE4] text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E2ECE4] flex items-center justify-center text-forest-green shrink-0 mt-0.5">
                  <BookOpenIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1E2D25]">Study design</p>
                  <p className="text-[#5A6D62]">Randomized controlled feeding trial</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E2ECE4] flex items-center justify-center text-forest-green shrink-0 mt-0.5">
                  <DocumentTextIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1E2D25]">Publication type</p>
                  <p className="text-[#5A6D62]">Clinical trial • Original research</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">DOI</p>
                <p className="text-xs font-mono text-[#5A6D62] break-all">10.1056/NEJM199704173361601</p>
              </div>
            </div>

            {/* Source CTAs */}
            <div className="space-y-2 pt-2">
              <a
                href={safeArticle.url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-forest-green hover:bg-forest-green/90 text-white rounded-xl text-xs font-semibold transition-all shadow-xs text-center"
              >
                <span>View on PubMed</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => toggleSaveResearch(safeArticle.id)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white border border-[#E2ECE4] hover:bg-[#EFF5EE] text-[#1E2D25] rounded-xl text-xs font-semibold transition-colors"
              >
                {isSaved ? <BookmarkSolidIcon className="w-4 h-4 text-rose-600" /> : <BookmarkIcon className="w-4 h-4 text-[#5A6D62]" />}
                <span>{isSaved ? 'Saved to reading shelf' : 'Save to reading shelf'}</span>
              </button>
            </div>
          </div>

          {/* On This Page Outline */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs space-y-3">
            <p className="text-xs font-bold text-[#1B3E2F] uppercase tracking-wider">
              On this page
            </p>
            <div className="space-y-2 text-xs text-[#5A6D62]">
              <p className="hover:text-forest-green cursor-pointer font-medium">01 The research question</p>
              <p className="hover:text-forest-green cursor-pointer font-medium">02 What the study explored</p>
              <p className="hover:text-forest-green cursor-pointer font-medium">03 What it means</p>
              <p className="hover:text-forest-green cursor-pointer font-medium">04 Important limitations</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}