import './Step.css'
import './StepSummary.css'

const DAY_PRICES = { '3': 260, '4': 345, '5': 420 }
const DAY_LABELS = { '3': '3 days/week', '4': '4 days/week', '5': '5 days/week' }

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatWeek(key) {
  const d = new Date(key + 'T12:00:00')
  const friday = new Date(d)
  friday.setDate(d.getDate() + 4)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(d)} – ${fmt(friday)}`
}

export default function StepSummary({ data, onBack, onSubmit }) {
  const weeklyRate = DAY_PRICES[data.daysPerWeek] || 0
  const totalWeeks = data.selectedWeeks.length
  const daysPerWeek = parseInt(data.daysPerWeek) || 0
  const totalDays = totalWeeks * daysPerWeek
  const lunchTotal = data.includeLunch ? totalDays * 10 : 0
  const scheduleTotal = totalWeeks * weeklyRate
  const grandTotal = scheduleTotal + lunchTotal

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Review & Submit</h2>
        <p>Everything looks good? Complete your registration below.</p>
      </div>

      {/* Child */}
      <div className="summary-block">
        <div className="summary-block-title">Child</div>
        <div className="summary-row"><span>Name</span><span>{data.childName}</span></div>
        <div className="summary-row"><span>Date of Birth</span><span>{data.childDob}</span></div>
        {data.allergies && <div className="summary-row"><span>Allergies</span><span>{data.allergies}</span></div>}
        {data.notes && <div className="summary-row"><span>Notes</span><span>{data.notes}</span></div>}
      </div>

      {/* Parent */}
      <div className="summary-block">
        <div className="summary-block-title">Parent / Guardian</div>
        <div className="summary-row"><span>Name</span><span>{data.parentName}</span></div>
        <div className="summary-row"><span>Email</span><span>{data.parentEmail}</span></div>
        <div className="summary-row"><span>Phone</span><span>{data.parentPhone}</span></div>
        {data.emergencyName && (
          <div className="summary-row"><span>Emergency contact</span><span>{data.emergencyName} · {data.emergencyPhone}</span></div>
        )}
      </div>

      {/* Schedule */}
      <div className="summary-block">
        <div className="summary-block-title">Schedule</div>
        <div className="summary-row">
          <span>Days per week</span>
          <span>{DAY_LABELS[data.daysPerWeek]}</span>
        </div>
        <div className="summary-row">
          <span>Days</span>
          <span>{data.selectedDays.map(capitalize).join(', ')}</span>
        </div>
        <div className="summary-row">
          <span>Weeks ({totalWeeks})</span>
          <span className="weeks-summary">
            {data.selectedWeeks.slice(0, 3).map(formatWeek).join(', ')}
            {data.selectedWeeks.length > 3 && ` + ${data.selectedWeeks.length - 3} more`}
          </span>
        </div>
      </div>

      {/* Waiver */}
      <div className="summary-block">
        <div className="summary-block-title">Waiver</div>
        <div className="summary-row"><span>Liability & Risk</span><span className="check-yes">✓ Agreed</span></div>
        <div className="summary-row"><span>Medical Consent</span><span className="check-yes">✓ Agreed</span></div>
        <div className="summary-row"><span>Media Release</span><span>{data.waiverMedia === 'yes' ? 'Permission granted' : 'Permission declined'}</span></div>
        <div className="summary-row"><span>Excursions</span><span>{data.waiverExcursion === 'yes' ? 'Permission granted' : 'Permission declined'}</span></div>
        <div className="summary-row"><span>Signed by</span><span className="signature-preview">{data.waiverSignature}</span></div>
      </div>

      {/* Pricing */}
      <div className="summary-block summary-pricing">
        <div className="summary-block-title">Total</div>
        <div className="summary-row">
          <span>{totalWeeks} week{totalWeeks !== 1 ? 's' : ''} × ${weeklyRate}/week ({DAY_LABELS[data.daysPerWeek]})</span>
          <span>${scheduleTotal.toLocaleString()}</span>
        </div>
        {data.includeLunch && (
          <div className="summary-row">
            <span>Organic lunch ({totalDays} days × $10)</span>
            <span>${lunchTotal}</span>
          </div>
        )}
        <div className="summary-total">
          <span>Total due</span>
          <span>${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="payment-note">
        <span>🔒</span>
        <p>You'll be taken to a secure Stripe checkout to complete payment. We accept all major credit cards.</p>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-submit" onClick={onSubmit}>
          Complete Registration & Pay ${grandTotal.toLocaleString()} →
        </button>
      </div>
    </div>
  )
}
