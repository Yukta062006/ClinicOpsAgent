import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Sparkles,
  BookOpen, 
  HeartPulse, 
  Check, 
  ArrowRight,
  GraduationCap,
  Award,
  Apple,
  Moon,
  Footprints,
  ChevronRight,
  CheckCircle2,
  Clock,
  Flame,
  Target
} from 'lucide-react'
import { useData } from '../context/DataContext'

export default function LearningProgress() {
  const navigate = useNavigate()
  const { 
    userPoints, 
    userStreak, 
    userScores,
    lessons,
    achievements,
    currentPatient,
    user
  } = useData()

  const displayName = user?.name || currentPatient?.name || 'Yukta Ravindra Thakur'
  const initial = displayName.charAt(0)

  const totalPts = userPoints || 840
  const milestoneTarget = 1000
  const pointsRemaining = Math.max(0, milestoneTarget - totalPts)
  const milestonePercent = Math.min(100, Math.round((totalPts / milestoneTarget) * 100))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      
      {/* Top Header Row matching Reference Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#829489] uppercase tracking-wider">
            PATIENT ENGAGEMENT / SCORES & ACHIEVEMENTS
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1B3E2F] tracking-tight mt-0.5">
            Look how far your curiosity has taken you.
          </h1>
          <p className="text-xs text-[#5A6D62] mt-0.5">
            Celebrate your learning activity, revisit a lesson and choose your next small step.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/patient/medical-research')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E2ECE4] text-xs font-semibold text-[#1B3E2F] hover:bg-[#EFF5EE] transition-colors shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-forest-green" />
            <span>Learning library</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Reference Screenshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Learning score */}
        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-1">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Learning score</span>
          </div>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1B3E2F]">
            {totalPts}
          </p>
          <p className="text-[11px] text-[#829489] font-medium mt-1">
            Points earned through learning
          </p>
        </div>

        {/* Card 2: Lessons completed */}
        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-1">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Lessons completed</span>
          </div>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1B3E2F]">
            03
          </p>
          <p className="text-[11px] text-[#829489] font-medium mt-1">
            Of 5 in Everyday wellbeing
          </p>
        </div>

        {/* Card 3: Achievements */}
        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-1">
            <Award className="w-4 h-4 text-forest-green" />
            <span>Achievements</span>
          </div>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1B3E2F]">
            03
          </p>
          <p className="text-[11px] text-[#829489] font-medium mt-1">
            One more within reach
          </p>
        </div>

        {/* Card 4: Best quiz score */}
        <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Best quiz score</span>
          </div>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1B3E2F]">
            90%
          </p>
          <p className="text-[11px] text-[#829489] font-medium mt-1">
            Sleep Basics • 9 / 10
          </p>
        </div>
      </div>

      {/* Main Grid: Left Path & Achievements (8 cols) & Right Profile (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Your current learning path */}
          <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
                  YOUR CURRENT LEARNING PATH
                </p>
                <h3 className="text-2xl font-serif font-bold text-[#1B3E2F] mt-1">
                  Everyday wellbeing
                </h3>
                <p className="text-xs text-[#5A6D62] mt-0.5">
                  Care literacy, movement, sleep and balanced eating.
                </p>
              </div>

              <button
                onClick={() => navigate('/patient/health-games')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
              >
                <span>Resume lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stepped Progress Indicator matching screenshot */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-5 gap-2.5">
                <div className="h-2 rounded-full bg-forest-green" />
                <div className="h-2 rounded-full bg-forest-green" />
                <div className="h-2 rounded-full bg-forest-green" />
                <div className="h-2 rounded-full bg-[#E2ECE4]" />
                <div className="h-2 rounded-full bg-[#E2ECE4]" />
              </div>
              <p className="text-xs text-[#5A6D62] font-medium">
                3 of 5 complete • Balanced eating basics is in progress
              </p>
            </div>
          </div>

          {/* Section: Achievements Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-xl text-[#1B3E2F]">
                Achievements
              </h3>
              <button 
                onClick={() => navigate('/patient/health-games')}
                className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1"
              >
                <span>All badges</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Badge 1 */}
              <div className="bg-[#EFF5EE] border border-pale-sage rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2ECE4] flex items-center justify-center text-forest-green mx-auto shadow-2xs">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1E2D25]">First Step</h4>
                  <p className="text-[10px] text-[#5A6D62] mt-0.5">Complete your first lesson</p>
                </div>
                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Earned 08 Oct
                </span>
              </div>

              {/* Badge 2 */}
              <div className="bg-[#EFF5EE] border border-pale-sage rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2ECE4] flex items-center justify-center text-forest-green mx-auto shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1E2D25]">Curious Mind</h4>
                  <p className="text-[10px] text-[#5A6D62] mt-0.5">Read two research summaries</p>
                </div>
                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Earned 10 Oct
                </span>
              </div>

              {/* Badge 3 */}
              <div className="bg-[#EFF5EE] border border-pale-sage rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2ECE4] flex items-center justify-center text-forest-green mx-auto shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1E2D25]">Sleep Savvy</h4>
                  <p className="text-[10px] text-[#5A6D62] mt-0.5">Finish the sleep basics quiz</p>
                </div>
                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Earned 12 Oct
                </span>
              </div>

              {/* Badge 4 - Locked / In Progress */}
              <div className="bg-white border border-[#E2ECE4] rounded-2xl p-4 text-center space-y-2 shadow-2xs opacity-90">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4] flex items-center justify-center text-[#5A6D62] mx-auto shadow-2xs">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-xs text-[#1E2D25]">Nutrition Explorer</h4>
                  <p className="text-[10px] text-[#5A6D62] mt-0.5">Finish the balanced eating quiz</p>
                </div>
                <span className="inline-block text-[10px] font-bold text-[#5A6D62] bg-[#FAF9F5] px-2 py-0.5 rounded-full border border-[#E2ECE4]">
                  3 of 5 questions
                </span>
              </div>
            </div>
          </div>

          {/* Section: Quiz Scores Table matching Screenshot */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4]">
              <h3 className="font-serif font-bold text-xl text-[#1B3E2F]">
                Quiz scores
              </h3>
              <button 
                onClick={() => navigate('/patient/health-games')}
                className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1"
              >
                <span>View history</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2ECE4] text-[#829489] uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Quiz</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Result</th>
                    <th className="pb-3 font-bold text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECE4]/60">
                  <tr className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#1E2D25]">Balanced Eating Challenge</td>
                    <td className="py-3.5 text-emerald-800 font-semibold">In progress</td>
                    <td className="py-3.5 text-[#5A6D62]">3 / 5 answered</td>
                    <td className="py-3.5 font-serif font-bold text-base text-[#1E2D25] text-right">240 pts</td>
                  </tr>
                  <tr className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#1E2D25]">Sleep Basics Quiz</td>
                    <td className="py-3.5 text-[#5A6D62]">Completed • 12 Oct</td>
                    <td className="py-3.5 text-[#5A6D62]">9 / 10 correct</td>
                    <td className="py-3.5 font-serif font-bold text-base text-[#1E2D25] text-right">180 pts</td>
                  </tr>
                  <tr className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#1E2D25]">Movement Knowledge Check</td>
                    <td className="py-3.5 text-[#5A6D62]">Completed • 10 Oct</td>
                    <td className="py-3.5 text-[#5A6D62]">8 / 10 correct</td>
                    <td className="py-3.5 font-serif font-bold text-base text-[#1E2D25] text-right">160 pts</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-[#829489] pt-2 border-t border-[#E2ECE4]/60">
              Total points also include completed lessons and reading activities.
            </p>
          </div>

        </div>

        {/* Right Column (4 cols): Profile & Goals matching Screenshot */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Your Learning Profile */}
          <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-4">
            <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
              YOUR LEARNING PROFILE
            </p>

            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2ECE4] text-forest-green flex items-center justify-center font-serif font-bold text-lg shadow-2xs">
                {initial}
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-[#1E2D25]">
                  {displayName}
                </h4>
                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Curious learner
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5A6D62] leading-relaxed">
              Growing your understanding, one small step at a time.
            </p>

            {/* Next Milestone Box */}
            <div className="pt-3 border-t border-[#E2ECE4] space-y-2">
              <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
                NEXT MILESTONE
              </p>
              <p className="text-2xl font-serif font-bold text-[#1B3E2F]">
                {milestoneTarget.toLocaleString()} points
              </p>

              <div className="w-full h-2 rounded-full bg-[#E2ECE4] overflow-hidden">
                <div
                  className="h-full bg-forest-green transition-all duration-300"
                  style={{ width: `${milestonePercent}%` }}
                />
              </div>

              <p className="text-[11px] text-[#5A6D62] font-medium">
                {totalPts} / {milestoneTarget} • {pointsRemaining} points to go
              </p>
            </div>

            <button
              onClick={() => navigate('/patient/health-games')}
              className="w-full py-2.5 px-4 bg-forest-green hover:bg-forest-green/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs text-center flex items-center justify-center gap-1.5"
            >
              <span>Continue my quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: This Week's Rhythm & Weekly Goal */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-4">
            <h4 className="font-serif font-bold text-base text-[#1E2D25]">
              This week's rhythm
            </h4>

            {/* Day of Week circles matching screenshot */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['W', 'T', 'F', 'S', 'S', 'M', 'T'].map((day, i) => {
                const isDone = i !== 2 && i !== 4
                return (
                  <div key={i} className="space-y-1">
                    <span className="text-[10px] font-bold text-[#829489]">{day}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      isDone 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-[#FAF9F5] text-[#829489] border border-[#E2ECE4]'
                    }`}>
                      {isDone ? '✓' : '–'}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-[#5A6D62] leading-relaxed">
              5 learning days in the past week. Every visit to the library counts.
            </p>

            {/* Weekly Goal Pill */}
            <div className="p-3.5 rounded-2xl bg-[#EFF5EE] border border-pale-sage flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Target className="w-5 h-5 text-forest-green shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1E2D25]">Your weekly goal</p>
                  <p className="text-[11px] text-[#5A6D62]">3 learning activities • Goal reached</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Disclaimer Note */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4] text-[11px] text-[#829489] leading-relaxed flex items-start space-x-2">
            <span className="font-bold text-forest-green">ℹ</span>
            <span>Scores and achievements celebrate learning, not health outcomes. They are not a clinical assessment or personalized medical advice.</span>
          </div>

        </div>
      </div>
    </div>
  )
}