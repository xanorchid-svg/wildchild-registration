import './StepIndicator.css'

export default function StepIndicator({ steps, current }) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => (
        <div key={step.id} className="step-item">
          <div className={`step-dot ${current === step.id ? 'active' : ''} ${current > step.id ? 'done' : ''}`}>
            {current > step.id ? '✓' : step.id}
          </div>
          <span className={`step-label ${current === step.id ? 'active' : ''}`}>{step.label}</span>
          {i < steps.length - 1 && (
            <div className={`step-line ${current > step.id ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
