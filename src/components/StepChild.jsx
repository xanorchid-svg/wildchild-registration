import './Step.css'

export default function StepChild({ data, update, onNext }) {
  const valid = data.childName && data.childDob && data.parentName && data.parentEmail && data.parentPhone

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>About Your Child</h2>
        <p>Let's start with some information about your family.</p>
      </div>

      <div className="form-section">
        <h3 className="section-title">Child Information</h3>

        <div className="field">
          <label>Child's Full Legal Name *</label>
          <input
            type="text"
            value={data.childName}
            onChange={e => update({ childName: e.target.value })}
            placeholder="First and last name"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={data.childDob}
              onChange={e => update({ childDob: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Age</label>
            <input
              type="text"
              value={data.childAge}
              onChange={e => update({ childAge: e.target.value })}
              placeholder="e.g. 4"
            />
          </div>
        </div>

        <div className="field">
          <label>Allergies or dietary needs</label>
          <input
            type="text"
            value={data.allergies}
            onChange={e => update({ allergies: e.target.value })}
            placeholder="None, or describe..."
          />
        </div>

        <div className="field">
          <label>Anything else we should know?</label>
          <textarea
            value={data.notes}
            onChange={e => update({ notes: e.target.value })}
            placeholder="Medical notes, special needs, anything that helps us welcome your child..."
            rows={3}
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Parent / Guardian</h3>

        <div className="field">
          <label>Full Name *</label>
          <input
            type="text"
            value={data.parentName}
            onChange={e => update({ parentName: e.target.value })}
            placeholder="Your full name"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Email *</label>
            <input
              type="email"
              value={data.parentEmail}
              onChange={e => update({ parentEmail: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
          <div className="field">
            <label>WhatsApp / Phone *</label>
            <input
              type="tel"
              value={data.parentPhone}
              onChange={e => update({ parentPhone: e.target.value })}
              placeholder="+506..."
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Emergency Contact</h3>
        <div className="field-row">
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={data.emergencyName}
              onChange={e => update({ emergencyName: e.target.value })}
              placeholder="Emergency contact name"
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              type="tel"
              value={data.emergencyPhone}
              onChange={e => update({ emergencyPhone: e.target.value })}
              placeholder="+506..."
            />
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={onNext} disabled={!valid}>
          Continue to Schedule →
        </button>
        {!valid && <p className="field-hint">Please fill in all required fields to continue.</p>}
      </div>
    </div>
  )
}
