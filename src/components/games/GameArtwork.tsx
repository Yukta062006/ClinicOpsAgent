import React from 'react'

export type GameArtKey = 
  | 'nutrition' 
  | 'medicine' 
  | 'anatomy' 
  | 'memory' 
  | 'habits'
  | 'tictactoe'
  | 'sliding'
  | 'jigsaw'
  | 'wordsearch'
  | 'sorting'

interface GameArtworkProps {
  gameId: GameArtKey
  className?: string
}

const svgProps = {
  viewBox: '0 0 400 240',
  preserveAspectRatio: 'xMidYMid slice',
  xmlns: 'http://www.w3.org/2000/svg'
}

function NutritionArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Balanced plate illustration">
      <defs>
        <linearGradient id="nut-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9FBF4" />
          <stop offset="100%" stopColor="#CBE2CE" />
        </linearGradient>
        <linearGradient id="nut-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFF5EA" />
        </linearGradient>
        <radialGradient id="nut-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="240" fill="url(#nut-bg)" />
      <circle cx="70" cy="44" r="58" fill="#FFFFFF" opacity="0.35" />
      <circle cx="342" cy="202" r="72" fill="#9FC7A6" opacity="0.25" />
      <circle cx="196" cy="130" r="118" fill="url(#nut-glow)" />

      {/* Botanical sprigs */}
      <g stroke="#3F7256" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.55">
        <path d="M20 214 C44 190 64 170 82 132" />
        <path d="M34 196 q-14 -12 -8 -30 q18 4 24 22" fill="#8FBE97" stroke="none" opacity="0.7" />
        <path d="M52 176 q-2 -20 12 -30 q10 16 2 32" fill="#B4D3B4" stroke="none" opacity="0.8" />
        <path d="M30 70 q16 8 20 26 q-20 -2 -28 -18" fill="#A9CDA9" stroke="none" />
      </g>
      <g stroke="#3F7256" strokeWidth="2" fill="none" opacity="0.5">
        <path d="M372 52 q-22 18 -28 42" />
        <path d="M360 66 q-20 0 -28 -14 q18 -10 30 2" fill="#8FBE97" stroke="none" />
      </g>

      {/* Plate shadow + plate */}
      <ellipse cx="198" cy="150" rx="106" ry="66" fill="#7FA184" opacity="0.22" />
      <ellipse cx="198" cy="136" rx="104" ry="68" fill="url(#nut-plate)" stroke="#C9DCC9" strokeWidth="2" />
      <ellipse cx="198" cy="136" rx="86" ry="53" fill="#F7FAF1" stroke="#DCE9D9" strokeWidth="1.5" />

      {/* Greens */}
      <g>
        <path d="M150 126 C132 112 128 94 138 84 C154 92 162 110 158 128 Z" fill="#2F7D52" />
        <path d="M166 122 C158 102 168 86 182 82 C190 100 184 118 172 128 Z" fill="#4C9A6A" />
        <path d="M182 128 C182 108 196 94 210 96 C212 114 200 128 188 134 Z" fill="#63AE7B" />
        <path d="M158 138 C146 128 140 112 148 100 C160 108 166 124 164 138 Z" fill="#3B8A5D" />
      </g>

      {/* Tomato */}
      <circle cx="222" cy="112" r="15" fill="#E2554A" />
      <circle cx="217" cy="107" r="4" fill="#F58C80" opacity="0.85" />
      <path d="M222 96 l5 6 -8 1 z" fill="#2F7D52" />

      {/* Carrot */}
      <g transform="rotate(24 246 132)">
        <path d="M240 116 L256 116 L249 146 Z" fill="#F09A3E" />
        <path d="M242 122 h12 M243 130 h9" stroke="#D97C22" strokeWidth="2" strokeLinecap="round" />
        <path d="M248 116 q-4 -10 2 -14 q4 8 2 14 M250 116 q2 -12 10 -12 q-2 10 -6 13" fill="#4C9A6A" />
      </g>

      {/* Beet / grain */}
      <circle cx="178" cy="150" r="13" fill="#8C5AA8" />
      <path d="M174 143 l4 6 4 -6" stroke="#F1DFF6" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="214" cy="150" r="10" fill="#E9C46A" />
      <circle cx="232" cy="146" r="8" fill="#F4D58D" />
      <circle cx="204" cy="158" r="6" fill="#DDB347" />

      {/* Egg / protein */}
      <ellipse cx="200" cy="136" rx="22" ry="16" fill="#FFFFFF" stroke="#E4EBDD" strokeWidth="1.5" />
      <circle cx="200" cy="136" r="8" fill="#F2B84B" />

      {/* Fork */}
      <g transform="translate(58 78)" stroke="#5C7A64" strokeWidth="3" strokeLinecap="round">
        <path d="M14 112 V18" />
        <path d="M8 18 v20 M14 18 v20 M20 18 v20" />
        <path d="M8 38 q6 8 12 0" fill="none" />
      </g>

      {/* Water glass */}
      <g transform="translate(330 92)">
        <path d="M0 0 h30 l-4 66 h-22 z" fill="#EAF5F2" stroke="#BFD9D0" strokeWidth="2" />
        <path d="M4 18 h22 l-3 44 h-16 z" fill="#9ED8CB" opacity="0.7" />
        <path d="M6 28 q8 4 16 0" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" fill="none" />
      </g>

      {/* Sparkles */}
      <g fill="#FFFFFF">
        <path d="M300 54 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" opacity="0.9" />
        <path d="M104 60 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" opacity="0.7" />
        <path d="M340 170 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.65" />
      </g>
    </svg>
  )
}

function MedicineArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Medicine and capsules illustration">
      <defs>
        <linearGradient id="med-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#123528" />
          <stop offset="55%" stopColor="#21503C" />
          <stop offset="100%" stopColor="#3A7157" />
        </linearGradient>
        <linearGradient id="med-capsule" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDFBF3" />
          <stop offset="100%" stopColor="#E4EEDA" />
        </linearGradient>
        <linearGradient id="med-capsule-cap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8C676" />
          <stop offset="100%" stopColor="#C99A38" />
        </linearGradient>
        <radialGradient id="med-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8FE3B7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8FE3B7" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="240" fill="url(#med-bg)" />
      <circle cx="196" cy="118" r="132" fill="url(#med-glow)" />
      <g stroke="#7FB598" strokeWidth="1" opacity="0.25">
        <path d="M0 48 H400 M0 96 H400 M0 144 H400 M0 192 H400" />
        <path d="M80 0 V240 M160 0 V240 M240 0 V240 M320 0 V240" />
      </g>

      {/* Medicine bottle */}
      <g>
        <rect x="46" y="88" width="82" height="118" rx="15" fill="#F4F8EC" stroke="#D7E6D6" strokeWidth="2" />
        <rect x="58" y="72" width="58" height="22" rx="7" fill="#DCEBDD" />
        <rect x="64" y="64" width="46" height="12" rx="5" fill="#1B3E2F" />
        <rect x="58" y="116" width="58" height="54" rx="9" fill="#E7F1E4" />
        <rect x="83" y="126" width="8" height="34" rx="3" fill="#1B3E2F" />
        <rect x="70" y="139" width="34" height="8" rx="3" fill="#1B3E2F" />
        <path d="M66 184 h42" stroke="#BFD5C0" strokeWidth="3" strokeLinecap="round" />
        <path d="M66 192 h30" stroke="#CFE0CF" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="60" y="98" width="26" height="6" rx="3" fill="#BFD5C0" />
      </g>

      {/* Golden capsule */}
      <g transform="rotate(-24 254 118)">
        <rect x="186" y="94" width="140" height="54" rx="27" fill="url(#med-capsule)" stroke="#D5E3CD" strokeWidth="2" />
        <path d="M256 94 h43 a27 27 0 0 1 0 54 h-43 z" fill="url(#med-capsule-cap)" />
        <path d="M199 106 q30 -12 52 -2" stroke="#FFFFFF" strokeWidth="5" opacity="0.55" fill="none" strokeLinecap="round" />
        <path d="M256 96 v50" stroke="#B99634" strokeWidth="2" opacity="0.5" />
      </g>

      {/* Loose tablets */}
      <g>
        <circle cx="288" cy="184" r="17" fill="#F6F9EE" stroke="#CFE0CF" strokeWidth="2" />
        <path d="M288 171 v26" stroke="#AFCBAF" strokeWidth="2" />
        <circle cx="234" cy="194" r="11" fill="#D7B45A" />
        <path d="M234 186 v16" stroke="#B7943D" strokeWidth="2" />
        <circle cx="318" cy="150" r="9" fill="#EDF5E8" opacity="0.9" />
      </g>

      {/* Shield with cross */}
      <g transform="translate(318 46)">
        <path d="M24 0 L48 10 V32 C48 50 24 62 24 62 C24 62 0 50 0 32 V10 Z" fill="#2E6349" stroke="#8FD3A9" strokeWidth="2" />
        <rect x="20" y="16" width="8" height="28" rx="2.5" fill="#DDF3E3" />
        <rect x="10" y="26" width="28" height="8" rx="2.5" fill="#DDF3E3" />
      </g>

      {/* Sparkles + bubbles */}
      <g fill="#C8F1D6">
        <path d="M140 40 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" opacity="0.9" />
        <path d="M352 100 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" opacity="0.6" />
        <circle cx="120" cy="58" r="3" opacity="0.55" />
        <circle cx="90" cy="40" r="2" opacity="0.4" />
      </g>
    </svg>
  )
}

function AnatomyArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Anatomical heart and pulse illustration">
      <defs>
        <linearGradient id="ana-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F2F24" />
          <stop offset="100%" stopColor="#245640" />
        </linearGradient>
        <linearGradient id="ana-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="55%" stopColor="#E14B5A" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
        <radialGradient id="ana-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFB4B4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFB4B4" stopOpacity="0" />
        </radialGradient>
        <filter id="ana-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width="400" height="240" fill="url(#ana-bg)" />
      <circle cx="200" cy="106" r="140" fill="url(#ana-glow)" />

      {/* Rib arcs */}
      <g stroke="#8FC9A8" strokeWidth="2" fill="none" opacity="0.22">
        <path d="M104 180 C74 154 70 112 92 82" />
        <path d="M116 190 C80 164 74 116 100 80" />
        <path d="M296 180 C326 154 330 112 308 82" />
        <path d="M284 190 C320 164 326 116 300 80" />
      </g>

      {/* Lungs */}
      <g fill="#5E9B7A" opacity="0.22">
        <path d="M148 78 C120 84 108 116 112 156 C130 150 148 128 152 98 Z" />
        <path d="M252 78 C280 84 292 116 288 156 C270 150 252 128 248 98 Z" />
      </g>

      {/* Vessels */}
      <g stroke="#F0B4B8" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M200 58 C196 42 184 34 168 30" />
        <path d="M200 58 C206 40 220 32 236 28" />
        <path d="M200 58 C200 40 200 30 200 20" />
      </g>
      <g stroke="#B91C3C" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M168 30 C156 22 142 20 132 24" />
        <path d="M236 28 C250 20 264 20 276 26" />
        <path d="M200 20 C198 10 204 6 212 6" />
      </g>

      {/* Heart */}
      <path
        d="M200 190 C146 154 110 128 110 94 C110 66 132 48 156 48 C176 48 192 60 200 78 C208 60 224 48 244 48 C268 48 290 66 290 94 C290 128 254 154 200 190 Z"
        fill="url(#ana-heart)"
      />
      <path
        d="M200 78 C192 60 176 48 156 48 C132 48 110 66 110 94 C110 104 114 113 121 122 C126 92 154 76 176 86 C190 92 197 104 200 118 Z"
        fill="#FF9D9D"
        opacity="0.35"
      />
      <path
        d="M160 82 C174 74 188 80 196 96 C186 100 172 98 162 92"
        stroke="#FCA5A5"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M216 104 C224 118 232 130 244 138"
        stroke="#7F1D3A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* ECG line */}
      <path
        d="M24 210 H116 l10 -18 12 34 12 -52 13 68 12 -32 h31 l12 -14 10 14 h142"
        stroke="#71E0AE"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d="M24 210 H116 l10 -18 12 34 12 -52 13 68 12 -32 h31 l12 -14 10 14 h142"
        stroke="#71E0AE"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        opacity="0.18"
        filter="url(#ana-soft)"
      />

      {/* Medical plus marks */}
      <g fill="#A7E8C4" opacity="0.75">
        <rect x="58" y="54" width="18" height="6" rx="3" />
        <rect x="64" y="48" width="6" height="18" rx="3" />
        <rect x="330" y="72" width="14" height="5" rx="2.5" />
        <rect x="334.5" y="67.5" width="5" height="14" rx="2.5" />
      </g>
      <g fill="#FFFFFF">
        <path d="M312 26 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" opacity="0.8" />
        <path d="M84 132 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.55" />
      </g>
    </svg>
  )
}

function MemoryArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Matching memory cards illustration">
      <defs>
        <linearGradient id="mem-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F8EC" />
          <stop offset="100%" stopColor="#BCD9C0" />
        </linearGradient>
        <linearGradient id="mem-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F6EC" />
        </linearGradient>
        <radialGradient id="mem-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="240" fill="url(#mem-bg)" />
      <circle cx="200" cy="118" r="132" fill="url(#mem-glow)" />
      <circle cx="200" cy="120" r="88" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.55" strokeDasharray="4 10" />

      {/* Back card */}
      <g transform="rotate(-16 132 128)">
        <rect x="82" y="66" width="98" height="126" rx="16" fill="#24503B" stroke="#1B3E2F" strokeWidth="2" />
        <g stroke="#6FAF86" strokeWidth="2" opacity="0.6" fill="none">
          <path d="M100 92 h60 M100 106 h60 M100 120 h60 M100 134 h60 M100 148 h60" />
        </g>
        <circle cx="131" cy="128" r="18" fill="#2E6349" stroke="#8FCFA4" strokeWidth="2" />
        <path d="M131 119 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#DDF3E3" />
      </g>

      {/* Middle card: heart */}
      <g transform="rotate(-6 202 120)">
        <rect x="154" y="50" width="100" height="132" rx="17" fill="url(#mem-card)" stroke="#D3E3D2" strokeWidth="2" />
        <path
          d="M204 142 C184 128 170 116 170 102 C170 90 180 82 190 82 C198 82 202 86 204 92 C206 86 210 82 218 82 C228 82 238 90 238 102 C238 116 224 128 204 142 Z"
          fill="#E15252"
        />
        <path d="M186 96 C190 92 196 94 200 100" stroke="#F9A8A8" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M204 88 l4 6 -8 0 z" fill="#2F7D52" />
        <circle cx="178" cy="160" r="4" fill="#DCE9D9" />
        <circle cx="230" cy="160" r="4" fill="#DCE9D9" />
      </g>

      {/* Front card: leaf + pill */}
      <g transform="rotate(11 286 126)">
        <rect x="240" y="58" width="98" height="128" rx="17" fill="url(#mem-card)" stroke="#D3E3D2" strokeWidth="2" />
        <path d="M289 132 C266 116 266 92 289 80 C312 92 312 116 289 132 Z" fill="#3E8B5F" />
        <path d="M289 80 V130" stroke="#BFE3C6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M276 102 q8 -6 16 -4" stroke="#9CD1A8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g transform="rotate(-28 289 160)">
          <rect x="268" y="154" width="42" height="16" rx="8" fill="#F3C766" stroke="#D9AE4F" strokeWidth="1.5" />
          <path d="M289 154 v16" stroke="#D9AE4F" strokeWidth="1.5" />
        </g>
      </g>

      {/* Connectors */}
      <path d="M130 84 C164 44 242 40 278 84" stroke="#2F7D52" strokeWidth="2" strokeDasharray="3 7" fill="none" opacity="0.5" />
      <path d="M138 178 C172 210 248 210 282 178" stroke="#2F7D52" strokeWidth="2" strokeDasharray="3 7" fill="none" opacity="0.4" />

      {/* Sparkles */}
      <g fill="#FFFFFF">
        <path d="M96 44 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" opacity="0.95" />
        <path d="M330 44 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" opacity="0.8" />
        <path d="M70 176 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.7" />
      </g>
    </svg>
  )
}

function HabitsArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Daily habits calendar illustration">
      <defs>
        <linearGradient id="hab-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7FAF0" />
          <stop offset="100%" stopColor="#C6E0CA" />
        </linearGradient>
        <linearGradient id="hab-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C6449" />
          <stop offset="100%" stopColor="#1B3E2F" />
        </linearGradient>
        <radialGradient id="hab-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="240" fill="url(#hab-bg)" />
      <circle cx="200" cy="120" r="136" fill="url(#hab-glow)" />

      {/* Calendar */}
      <g>
        <rect x="46" y="52" width="202" height="156" rx="18" fill="#FFFFFF" stroke="#D2E2D1" strokeWidth="2" />
        <path d="M46 70 a18 18 0 0 1 18 -18 h166 a18 18 0 0 1 18 18 v18 H46 Z" fill="url(#hab-head)" />
        <rect x="76" y="36" width="9" height="26" rx="4.5" fill="#2F7D52" />
        <rect x="208" y="36" width="9" height="26" rx="4.5" fill="#2F7D52" />
        <rect x="66" y="58" width="48" height="6" rx="3" fill="#A7D8B8" opacity="0.8" />

        {/* Day grid */}
        {[0, 1, 2, 3, 4].map((col) => (
          <g key={col} transform={`translate(${68 + col * 34} 0)`}>
            {[0, 1, 2, 3].map((row) => {
              const done = col < 4 || (col === 4 && row < 2)
              return (
                <g key={row} transform={`translate(0 ${104 + row * 24})`}>
                  <circle cx="10" cy="10" r="9" fill={done ? '#DDF2E2' : '#F1F5EC'} stroke={done ? '#8FCDA4' : '#DCE8D9'} strokeWidth="1.5" />
                  {done && (
                    <path d="M6 10 l3 3 5 -6" stroke="#1F6B48" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </g>
              )
            })}
          </g>
        ))}
        <rect x="62" y="188" width="76" height="6" rx="3" fill="#DCE8D9" />
      </g>

      {/* Progress ring */}
      <g transform="translate(310 92)">
        <circle cx="0" cy="0" r="48" fill="#FFFFFF" stroke="#D2E2D1" strokeWidth="2" />
        <circle cx="0" cy="0" r="38" fill="none" stroke="#E4EFE1" strokeWidth="10" />
        <circle
          cx="0"
          cy="0"
          r="38"
          fill="none"
          stroke="#2F7D52"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="179 239"
          transform="rotate(-90)"
        />
        <text x="0" y="7" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fontWeight="700" fill="#1B3E2F">
          75%
        </text>
        <text x="0" y="25" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" fill="#5A6D62" letterSpacing="1">
          DAILY
        </text>
      </g>

      {/* Floating wellness icons */}
      <g transform="translate(286 30)">
        <circle cx="0" cy="0" r="16" fill="#F6E3AE" opacity="0.9" />
        <circle cx="0" cy="0" r="9" fill="#F2C14E" />
        <g stroke="#F2C14E" strokeWidth="2" strokeLinecap="round">
          <path d="M0 -14 v-4 M0 14 v4 M-14 0 h-4 M14 0 h4 M-10 -10 l-3 -3 M10 10 l3 3 M10 -10 l3 -3 M-10 10 l-3 3" />
        </g>
      </g>
      <g transform="translate(344 176)">
        <circle cx="0" cy="0" r="15" fill="#DDF0F2" />
        <path d="M0 -8 C6 -1 7 3 4 6 C1 9 -4 8 -5 4 C-6 1 -3 -3 0 -8 Z" fill="#5BA9BD" />
      </g>
      <g transform="translate(110 24)">
        <circle cx="0" cy="0" r="15" fill="#E7F1E2" stroke="#C9DEC6" strokeWidth="1.5" />
        <path d="M-7 1 h14 M-3 1 v-4 M3 1 v-4" stroke="#2F7D52" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="-10" y="-6" width="3" height="8" rx="1.5" fill="#2F7D52" />
        <rect x="7" y="-6" width="3" height="8" rx="1.5" fill="#2F7D52" />
      </g>

      {/* Leaves */}
      <g stroke="#3F7256" strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round">
        <path d="M360 214 q-10 -18 2 -34 q12 12 8 30" fill="#9CC6A3" />
        <path d="M32 206 q18 -12 34 -2 q-14 14 -30 10" fill="#A9CDA9" />
      </g>

      <g fill="#FFFFFF">
        <path d="M272 48 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" opacity="0.8" />
      </g>
    </svg>
  )
}

function TicTacToeArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Tic-Tac-Toe Game Illustration">
      <defs>
        <linearGradient id="ttt-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5F9F6" />
          <stop offset="100%" stopColor="#CDE4D3" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ttt-bg)" />
      {/* 3x3 Grid lines */}
      <g stroke="#1B3E2F" strokeWidth="4" strokeLinecap="round" opacity="0.4">
        <line x1="160" y1="40" x2="160" y2="200" />
        <line x1="240" y1="40" x2="240" y2="200" />
        <line x1="90" y1="90" x2="310" y2="90" />
        <line x1="90" y1="150" x2="310" y2="150" />
      </g>
      {/* X Marks */}
      <g stroke="#1B3E2F" strokeWidth="6" strokeLinecap="round">
        <line x1="108" y1="52" x2="142" y2="78" />
        <line x1="142" y1="52" x2="108" y2="78" />
        <line x1="188" y1="110" x2="212" y2="132" />
        <line x1="212" y1="110" x2="188" y2="132" />
      </g>
      {/* O Marks */}
      <circle cx="200" cy="65" r="16" fill="none" stroke="#059669" strokeWidth="5" />
      <circle cx="275" cy="120" r="16" fill="none" stroke="#059669" strokeWidth="5" />
      <circle cx="125" cy="175" r="16" fill="none" stroke="#059669" strokeWidth="5" />
      {/* Sparkles */}
      <circle cx="70" cy="50" r="4" fill="#10B981" />
      <circle cx="330" cy="190" r="5" fill="#047857" />
    </svg>
  )
}

function SlidingArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Sliding Puzzle Illustration">
      <defs>
        <linearGradient id="sld-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F8F4" />
          <stop offset="100%" stopColor="#D2E8D8" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sld-bg)" />
      <g transform="translate(130, 40)">
        <rect x="0" y="0" width="140" height="140" rx="16" fill="#1B3E2F" opacity="0.1" />
        {/* Tile 1 */}
        <rect x="6" y="6" width="38" height="38" rx="8" fill="#FFFFFF" stroke="#CBE2CE" strokeWidth="2" />
        <text x="25" y="30" fontSize="16" fontWeight="bold" fill="#1B3E2F" textAnchor="middle">1</text>
        {/* Tile 2 */}
        <rect x="50" y="6" width="38" height="38" rx="8" fill="#FFFFFF" stroke="#CBE2CE" strokeWidth="2" />
        <text x="69" y="30" fontSize="16" fontWeight="bold" fill="#1B3E2F" textAnchor="middle">2</text>
        {/* Tile 3 */}
        <rect x="94" y="6" width="38" height="38" rx="8" fill="#FFFFFF" stroke="#CBE2CE" strokeWidth="2" />
        <text x="113" y="30" fontSize="16" fontWeight="bold" fill="#1B3E2F" textAnchor="middle">3</text>
        {/* Tile 4 */}
        <rect x="6" y="50" width="38" height="38" rx="8" fill="#FFFFFF" stroke="#CBE2CE" strokeWidth="2" />
        <text x="25" y="74" fontSize="16" fontWeight="bold" fill="#1B3E2F" textAnchor="middle">4</text>
        {/* Tile 5 (sliding motion) */}
        <rect x="50" y="50" width="38" height="38" rx="8" fill="#1B3E2F" />
        <text x="69" y="74" fontSize="16" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">5</text>
        {/* Empty slot */}
        <rect x="94" y="94" width="38" height="38" rx="8" fill="none" stroke="#A7CBB0" strokeWidth="2" strokeDasharray="4 4" />
      </g>
    </svg>
  )
}

function JigsawArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Jigsaw Puzzle Illustration">
      <defs>
        <linearGradient id="jig-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3F8F5" />
          <stop offset="100%" stopColor="#C9E3CE" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#jig-bg)" />
      <g transform="translate(140, 50)">
        {/* Puzzle piece 1 (Top Left) */}
        <path d="M0,0 H50 C55,10 65,10 70,0 H120 V50 C110,55 110,65 120,70 V120 H70 C65,110 55,110 50,120 H0 V70 C10,65 10,55 0,50 Z" 
              fill="#1B3E2F" opacity="0.9" stroke="#FFFFFF" strokeWidth="2" />
        {/* Center Cross emblem */}
        <rect x="50" y="35" width="20" height="50" rx="3" fill="#FFFFFF" opacity="0.9" />
        <rect x="35" y="50" width="50" height="20" rx="3" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  )
}

function WordSearchArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Word Search Illustration">
      <defs>
        <linearGradient id="ws-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5F9F6" />
          <stop offset="100%" stopColor="#CBE4D3" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ws-bg)" />
      <g transform="translate(100, 45)" fontSize="16" fontWeight="bold" fontFamily="monospace" fill="#1B3E2F">
        {/* Highlight band */}
        <rect x="-8" y="2" width="200" height="24" rx="8" fill="#10B981" opacity="0.35" />
        <text x="0" y="20">H  E  A  L  T  H  Y</text>
        <text x="0" y="50">C  A  R  D  I  A  C</text>
        <text x="0" y="80">V  I  T  A  M  I  N</text>
        <text x="0" y="110">D  O  C  T  O  R  S</text>
      </g>
    </svg>
  )
}

function SortingArt() {
  return (
    <svg {...svgProps} className="w-full h-full" role="img" aria-label="Healthy Food Sorting Illustration">
      <defs>
        <linearGradient id="sort-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6FAF6" />
          <stop offset="100%" stopColor="#CCE4D2" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sort-bg)" />
      {/* Left Basket: Healthy */}
      <g transform="translate(110, 100)">
        <ellipse cx="0" cy="40" rx="45" ry="18" fill="#A7CBAE" opacity="0.4" />
        <path d="M-40,30 Q0,55 40,30 L32,65 Q0,85 -32,65 Z" fill="#1B3E2F" />
        <circle cx="-15" cy="15" r="18" fill="#22C55E" />
        <circle cx="15" cy="10" r="16" fill="#EF4444" />
        <path d="M-15, -4 Q-10,-12 -6,-4" stroke="#166534" strokeWidth="3" fill="none" />
      </g>
      {/* Right Basket: Treats */}
      <g transform="translate(290, 100)">
        <ellipse cx="0" cy="40" rx="45" ry="18" fill="#FDE68A" opacity="0.4" />
        <path d="M-40,30 Q0,55 40,30 L32,65 Q0,85 -32,65 Z" fill="#D97706" />
        <circle cx="0" cy="15" r="16" fill="#F59E0B" />
        <circle cx="0" cy="15" r="6" fill="#FFFBEB" />
      </g>
    </svg>
  )
}

export default function GameArtwork({ gameId, className = '' }: GameArtworkProps) {
  return (
    <div className={className}>
      {gameId === 'nutrition' && <NutritionArt />}
      {gameId === 'medicine' && <MedicineArt />}
      {gameId === 'anatomy' && <AnatomyArt />}
      {gameId === 'memory' && <MemoryArt />}
      {gameId === 'habits' && <HabitsArt />}
      {gameId === 'tictactoe' && <TicTacToeArt />}
      {gameId === 'sliding' && <SlidingArt />}
      {gameId === 'jigsaw' && <JigsawArt />}
      {gameId === 'wordsearch' && <WordSearchArt />}
      {gameId === 'sorting' && <SortingArt />}
    </div>
  )
}
