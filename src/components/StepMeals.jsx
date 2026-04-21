import './Step.css'
import './StepMeals.css'

export default function StepMeals({ data, update, onNext, onBack }) {
  const daysPerWeek = parseInt(data.daysPerWeek) || 0
  const totalDays = data.selectedWeeks.length * daysPerWeek
  const lunchCost = totalDays * 10

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Organic Snack & Lunch</h2>
        <p>Fresh, seasonal, and made with love by our on-site chef.</p>
      </div>

      <div className="meals-info">
        <div className="meals-detail">
          <span className="meals-icon">🥗</span>
          <div>
            <strong>What's included</strong>
            <p>Morning snack at 10:30 and a warm, nourishing lunch at 12:00. All ingredients are local, organic, and prepared fresh daily. Gluten-free focused, minimal sugar, no artificial anything.</p>
          </div>
        </div>
        <div className="meals-detail">
          <span className="meals-icon">🌱</span>
          <div>
            <strong>Our food philosophy</strong>
            <p>Meals follow proper food combining principles, with conscious protein choices — local grass-fed meats, fresh-caught fish, and plenty of garden produce from our permaculture garden.</p>
          </div>
        </div>
        <div className="meals-detail">
          <span className="meals-icon">🍯</span>
          <div>
            <strong>Dietary needs</strong>
            <p>We happily accommodate allergies and dietary requirements. Just let us know — you already mentioned this in the previous step.</p>
          </div>
        </div>
      </div>

      <div className="meals-choice">
        <h3 className="section-title">Would you like to add lunch?</h3>
        <div className="meals-options">
          <button
            className={`meal-option ${data.includeLunch ? 'selected' : ''}`}
            onClick={() => update({ includeLunch: true })}
          >
            <span className="meal-opt-top">
              <span className="meal-opt-label">Yes, include lunch</span>
              <span className="meal-opt-price">+$10 / day</span>
            </span>
            <span className="meal-opt-total">
              {totalDays} days × $10 = <strong>${lunchCost}</strong>
            </span>
          </button>
          <button
            className={`meal-option ${data.includeLunch === false && data.includeLunch !== '' ? 'selected' : ''} ${!data.includeLunch && data.includeLunch !== '' ? '' : ''}`}
            onClick={() => update({ includeLunch: false })}
          >
            <span className="meal-opt-top">
              <span className="meal-opt-label">No thanks</span>
              <span className="meal-opt-price">I'll bring my own</span>
            </span>
            <span className="meal-opt-total">No charge</span>
          </button>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-primary" onClick={onNext}>
          Continue to Waiver →
        </button>
      </div>
    </div>
  )
}
