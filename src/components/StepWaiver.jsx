import { useState } from 'react'
import './Step.css'
import './StepWaiver.css'

export default function StepWaiver({ data, update, onNext, onBack }) {
  const [expanded, setExpanded] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const valid =
    data.waiverLiability &&
    data.waiverMedical &&
    (data.waiverMedia === 'yes' || data.waiverMedia === 'no') &&
    (data.waiverExcursion === 'yes' || data.waiverExcursion === 'no') &&
    data.waiverSignature.trim().length > 2

  const handleNext = () => {
    if (!data.waiverDate) update({ waiverDate: today })
    onNext()
  }

  return (
    <div className="step-card">
      <div className="step-header">
        <h2>Waiver & Consent</h2>
        <p>Please read each section carefully and indicate your agreement before continuing.</p>
      </div>

      <div className="waiver-doc">

        {/* Section 1 */}
        <div className="waiver-section">
          <h4>1. Assumption of Risk & Release of Liability</h4>
          <p>
            I understand that Wild Child Playgarden & Wildschooling Nosara is a nature-based, outdoor educational program. Activities may include outdoor play, gardening, forest and beach exploration, physical movement, water play, use of natural materials, and exposure to uneven terrain, insects, plants, wildlife, weather conditions, sun, heat, and rain.
          </p>
          <p>
            I acknowledge that participation involves inherent risks that cannot be completely eliminated without changing the nature of the program. I knowingly and voluntarily assume all risks, both known and unknown, associated with my child's participation.
          </p>
          <p>
            To the fullest extent permitted by law, I release, waive, discharge, indemnify, and hold harmless Wild Child Playgarden & Wildschooling Nosara, its founders, directors, teachers, staff, independent contractors, volunteers, and affiliates from any and all claims, liabilities, demands, damages, or expenses arising from my child's participation, except as required by applicable law.
          </p>
          <label className="waiver-check">
            <input
              type="checkbox"
              checked={data.waiverLiability}
              onChange={e => update({ waiverLiability: e.target.checked })}
            />
            <span>I agree to the Assumption of Risk and Release of Liability.</span>
          </label>
        </div>

        {/* Section 2 */}
        <div className="waiver-section">
          <h4>2. Medical & Emergency Consent</h4>
          <p>
            I authorize Wild Child Playgarden & Wildschooling Nosara to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician, dentist, or surgeon for my child's health and safety.
          </p>
          <p>
            I understand that my child's personal medical insurance will be used when available and that all medical expenses are my responsibility, not that of Wild Child Playgarden & Wildschooling Nosara or its affiliates.
          </p>
          <label className="waiver-check">
            <input
              type="checkbox"
              checked={data.waiverMedical}
              onChange={e => update({ waiverMedical: e.target.checked })}
            />
            <span>I agree to Medical & Emergency Care Consent.</span>
          </label>
        </div>

        {/* Section 3 */}
        <div className="waiver-section">
          <h4>3. Media Release (Photos & Videos)</h4>
          <p>
            I understand that photographs and/or videos may be taken of my child during program activities. If permission is granted, these may be used for educational documentation and community or promotional purposes, including the Wild Child website and social media (Instagram, Facebook). Children's names will not be used publicly without additional consent.
          </p>
          <div className="waiver-radio-group">
            <label className="waiver-radio">
              <input
                type="radio"
                name="media"
                value="yes"
                checked={data.waiverMedia === 'yes'}
                onChange={() => update({ waiverMedia: 'yes' })}
              />
              <span>YES – I grant permission for photos/videos of my child to be taken and used.</span>
            </label>
            <label className="waiver-radio">
              <input
                type="radio"
                name="media"
                value="no"
                checked={data.waiverMedia === 'no'}
                onChange={() => update({ waiverMedia: 'no' })}
              />
              <span>NO – I do NOT grant permission for photos/videos of my child.</span>
            </label>
          </div>
        </div>

        {/* Section 4 */}
        <div className="waiver-section">
          <h4>4. Excursion & Community Outings Permission</h4>
          <p>
            I understand that Wild Child Playgarden & Wildschooling Nosara may organize supervised local outings, such as neighborhood walks, visits to nearby natural areas, beaches, farms, or community spaces, as part of the program.
          </p>
          <div className="waiver-radio-group">
            <label className="waiver-radio">
              <input
                type="radio"
                name="excursion"
                value="yes"
                checked={data.waiverExcursion === 'yes'}
                onChange={() => update({ waiverExcursion: 'yes' })}
              />
              <span>YES – I grant permission for my child to participate in supervised outings.</span>
            </label>
            <label className="waiver-radio">
              <input
                type="radio"
                name="excursion"
                value="no"
                checked={data.waiverExcursion === 'no'}
                onChange={() => update({ waiverExcursion: 'no' })}
              />
              <span>NO – I do NOT grant permission for my child to participate in outings.</span>
            </label>
          </div>
        </div>

        {/* Section 5 - Signature */}
        <div className="waiver-section waiver-sign">
          <h4>5. Parent / Guardian Acknowledgment</h4>
          <p>
            By signing below, I confirm that I am the legal parent/guardian of <strong>{data.childName || 'the child named above'}</strong>, that the information provided is accurate, and that I have read, understood, and agreed to the selections indicated.
          </p>
          <div className="field-row">
            <div className="field">
              <label>Digital Signature (type your full name) *</label>
              <input
                type="text"
                className="signature-input"
                value={data.waiverSignature}
                onChange={e => update({ waiverSignature: e.target.value })}
                placeholder="Type your full legal name"
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={data.waiverDate || today}
                onChange={e => update({ waiverDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-primary" onClick={handleNext} disabled={!valid}>
          Continue to Review →
        </button>
      </div>
      {!valid && (
        <p className="field-hint center">Please complete all waiver sections before continuing.</p>
      )}
    </div>
  )
}
