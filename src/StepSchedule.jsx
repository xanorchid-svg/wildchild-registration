import { useMemo } from 'react'
import './Step.css'
import './StepSchedule.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const DAY_PRICES = { '3': 260, '4': 345, '5': 420 }

// Generate next 52 weeks from today
function generateWeeks() {
  const weeks = []
  const today = new Date()
  // Start from next Monday
  const start = new Date(today)
  start.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))

  for (let i = 0; i < 52; i++) {
    const monday = new Date(start)
    monday.setDate(start.getDate() + i * 7)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const key = monday.toISOString().split('T')[0]

    weeks.push({
      key,
      label: `${fmt(monday)} – ${fmt(friday)}`,
      month: monday.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })
  }
  return weeks
}

export default function StepSchedule({ data, update, onNext, onBack }) {
  const weeks = useMemo(() => generateWeeks(), [])

  const toggleWeek = (key) => {
    const selected = data.selectedWeeks.includes(key)
      ? data.selectedWeeks.filter(w => w !== key)
      : [...data.selectedWeeks, key].sort()
    update({ selectedWeeks: selected })
  }

  const toggleDay = (day) => {
    const lower = day.toLowerCase()
    const selected = data.selectedDays.includes(lower)
      ? data.selectedDays.filter(d => d !== lower)
      : [...data.selectedDays, lower]
    update({ selectedDays: selected })
  }

  const setDaysPerWeek = (n) => {
    update({ daysPerWeek: n, selectedDays: [] })
  }

  const requiredDays = parseInt(data.daysPerWeek) || 0
  const daysValid = data.selectedDays.length === requiredDays
  const valid = data.selectedWeeks.length > 0 && data.daysPerWeek && daysValid

  // Group weeks by month for display
  const grouped = weeks.reduce((acc, w) => {
    if (!acc[w.month]) acc[w.month] = []
    acc[w.month].push(w)
    return acc
  }, {})

  const weeklyPrice = DAY_PRICES[data.daysPerWeek] || 0
  const totalWeeks = data.selectedWeeks.length

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Choose Your Schedule</h2>
        <p>Select the weeks and days that work for your family. We're open year-round.</p>
      </div>

      {/* Days per week */}
      <div className="form-section">
        <h3 className="section-title">Days per week *</h3>
        <div className="day-option-grid">
          {[
            { val: '3', label: '3 Days', price: '$260 / week', desc: 'Choose any 3 days' },
            { val: '4', label: '4 Days', price: '$345 / week', desc: '3 days + 1 extra day ($85)' },
            { val: '5', label: '5 Days', price: '$420 / week', desc: 'Full week, Mon–Fri' },
          ].map(opt => (
            <button
              key={opt.val}
              className={`day-option ${data.daysPerWeek === opt.val ? 'selected' : ''}`}
              onClick={() => setDaysPerWeek(opt.val)}
            >
              <span className="day-option-label">{opt.label}</span>
              <span className="day-option-price">{opt.price}</span>
              <span className="day-option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Which days */}
      {data.daysPerWeek && (
        <div className="form-section">
          <h3 className="section-title">
            Which days? *
            <span className="section-hint">Select exactly {data.daysPerWeek}</span>
          </h3>
          <div className="days-grid">
            {DAYS.map(day => {
              const lower = day.toLowerCase()
              const isSelected = data.selectedDays.includes(lower)
              const maxReached = data.selectedDays.length >= requiredDays && !isSelected
              return (
                <button
                  key={day}
                  className={`day-pill ${isSelected ? 'selected' : ''} ${maxReached ? 'disabled' : ''}`}
                  onClick={() => !maxReached && toggleDay(day)}
                  disabled={maxReached}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Week picker */}
      <div className="form-section">
        <h3 className="section-title">
          Which weeks? *
          <span className="section-hint">{totalWeeks} week{totalWeeks !== 1 ? 's' : ''} selected</span>
        </h3>
        <p className="section-desc">Tap to select the weeks your child will attend. You can choose as many as you like.</p>

        <div className="months-list">
          {Object.entries(grouped).map(([month, mweeks]) => (
            <div key={month} className="month-group">
              <div className="month-label">{month}</div>
              <div className="weeks-grid">
                {mweeks.map(w => (
                  <button
                    key={w.key}
                    className={`week-pill ${data.selectedWeeks.includes(w.key) ? 'selected' : ''}`}
                    onClick={() => toggleWeek(w.key)}
                  >
                    {w.label}
                    {data.selectedWeeks.includes(w.key) && <span className="week-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price preview */}
      {totalWeeks > 0 && data.daysPerWeek && (
        <div className="price-preview">
          <div className="price-row">
            <span>{totalWeeks} week{totalWeeks !== 1 ? 's' : ''} × ${weeklyPrice}/week</span>
            <span>${(totalWeeks * weeklyPrice).toLocaleString()}</span>
          </div>
          <p className="price-note">+ Optional organic lunch ($10/day) — you'll choose on the next step.</p>
        </div>
      )}

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-primary" onClick={onNext} disabled={!valid}>
          Continue →
        </button>
      </div>
      {!valid && data.daysPerWeek && !daysValid && (
        <p className="field-hint center">Please select exactly {data.daysPerWeek} days.</p>
      )}
    </div>
  )
}
