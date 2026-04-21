import { useState } from 'react'
import StepIndicator from './StepIndicator'
import StepChild from './StepChild'
import StepSchedule from './StepSchedule'
import StepMeals from './StepMeals'
import StepWaiver from './StepWaiver'
import StepSummary from './StepSummary'
import Header from './Header'
import './RegistrationForm.css'

const INITIAL_DATA = {
  // Child info
  childName: '',
  childDob: '',
  childAge: '',
  allergies: '',
  notes: '',
  // Parent info
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  emergencyName: '',
  emergencyPhone: '',
  // Schedule
  selectedWeeks: [],
  daysPerWeek: '', // '3', '4', '5'
  selectedDays: [], // ['monday', 'tuesday', etc]
  // Meals
  includeLunch: false,
  // Waiver
  waiverLiability: false,
  waiverMedical: false,
  waiverMedia: '', // 'yes' or 'no'
  waiverExcursion: '', // 'yes' or 'no'
  waiverSignature: '',
  waiverDate: '',
}

const STEPS = [
  { id: 1, label: 'Child' },
  { id: 2, label: 'Schedule' },
  { id: 3, label: 'Meals' },
  { id: 4, label: 'Waiver' },
  { id: 5, label: 'Review' },
]

export default function RegistrationForm() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(INITIAL_DATA)
  const [submitted, setSubmitted] = useState(false)

  const update = (fields) => setData(prev => ({ ...prev, ...fields }))

  const next = () => setStep(s => Math.min(s + 1, 5))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    // Placeholder — Stripe + Supabase integration comes next phase
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="registration-wrap">
        <Header />
        <div className="success-card">
          <div className="success-icon">🌿</div>
          <h2>You're registered!</h2>
          <p>Thank you, {data.parentName}. We're so excited to welcome {data.childName} to Wild Child Nosara.</p>
          <p className="success-sub">A confirmation email is on its way to {data.parentEmail}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="registration-wrap">
      <Header />
      <div className="registration-container">
        <StepIndicator steps={STEPS} current={step} />
        <div className="step-content">
          {step === 1 && <StepChild data={data} update={update} onNext={next} />}
          {step === 2 && <StepSchedule data={data} update={update} onNext={next} onBack={back} />}
          {step === 3 && <StepMeals data={data} update={update} onNext={next} onBack={back} />}
          {step === 4 && <StepWaiver data={data} update={update} onNext={next} onBack={back} />}
          {step === 5 && <StepSummary data={data} onBack={back} onSubmit={handleSubmit} />}
        </div>
      </div>
    </div>
  )
}
