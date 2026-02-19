import { useState, useRef, useEffect } from 'react'
import { AgentState, Action } from '../types'

interface AgentViewProps {
  state: AgentState
  onGoalSubmit: (goal: string) => void
  onExecute: () => void
  onReset: () => void
}

export default function AgentView({ state, onGoalSubmit, onExecute, onReset }: AgentViewProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      
      recognitionRef.current = recognition
    }
  }, [])

  const handleVoiceToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onGoalSubmit(input.trim())
    }
  }

  const getStatusColor = () => {
    switch (state.status) {
      case 'listening': return 'bg-red-500'
      case 'analyzing': return 'bg-yellow-500'
      case 'planning': return 'bg-blue-500'
      case 'executing': return 'bg-purple-500'
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusText = () => {
    switch (state.status) {
      case 'idle': return 'Ready for your goal'
      case 'listening': return 'Listening...'
      case 'analyzing': return 'Analyzing screen...'
      case 'planning': return 'Generating action plan...'
      case 'executing': return `Executing step ${(state.currentStep ?? 0) + 1}/${state.actions.length}...`
      case 'completed': return 'Execution complete!'
      case 'error': return state.error || 'Something went wrong'
      default: return state.status
    }
  }

  return (
    <div className="glass rounded-xl p-5">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${isListening ? 'animate-pulse' : ''}`}></div>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        {state.goal && (
          <span className="text-xs text-slate-400">
            Goal: {state.goal.length > 40 ? state.goal.slice(0, 40) + '...' : state.goal}
          </span>
        )}
      </div>

      {/* Input Section - Only show when idle or planning */}
      {state.status === 'idle' || state.status === 'planning' ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your goal... (e.g., 'Find a product under $50, add to cart, apply coupon SAVE20, checkout as guest')"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:border-agent-primary transition-colors"
              disabled={state.status !== 'idle' && state.status !== 'planning'}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2 rounded-lg transition-colors ${
                  isListening ? 'bg-red-500 text-white' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title="Voice input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-agent-primary hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Analyze
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            🎤 Click microphone to speak, or type your goal above
          </p>
        </form>
      ) : null}

      {/* Execute/Reset Buttons */}
      {state.status === 'planning' && state.actions.length > 0 && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={onExecute}
            className="flex-1 bg-agent-success hover:bg-emerald-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Execute Plan
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Action Plan */}
      {state.actions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="text-agent-accent">📋</span>
            Action Plan
          </h3>
          <div className="space-y-2">
            {state.actions.map((action, idx) => (
              <ActionItem key={action.id} action={action} isActive={state.currentStep === idx} />
            ))}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {state.logs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="text-agent-primary">📜</span>
            Execution Log
          </h3>
          <div className="bg-slate-900 rounded-lg p-3 max-h-48 overflow-y-auto">
            {state.logs.slice().reverse().map((log, idx) => (
              <div key={idx} className="text-xs mb-1">
                <span className="text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {' '}
                <span className={
                  log.status === 'success' ? 'text-green-400' :
                  log.status === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }>
                  [{log.status.toUpperCase()}]
                </span>
                {' '}
                {log.action}
                {log.details && <span className="text-slate-500"> - {log.details}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionItem({ action, isActive }: { action: Action; isActive: boolean }) {
  const getIcon = () => {
    switch (action.type) {
      case 'click': return '👆'
      case 'type': return '⌨️'
      case 'select': return '📋'
      case 'navigate': return '🧭'
      case 'scroll': return '📜'
      default: return '⚡'
    }
  }

  const getStatusBadge = () => {
    switch (action.status) {
      case 'pending': return 'bg-slate-600'
      case 'analyzing': return 'bg-yellow-600'
      case 'ready': return 'bg-blue-600'
      case 'executing': return 'bg-purple-600 animate-pulse'
      case 'completed': return 'bg-green-600'
      case 'failed': return 'bg-red-600'
      default: return 'bg-slate-600'
    }
  }

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
      isActive ? 'bg-slate-800 border border-agent-accent' : 'bg-slate-800/50'
    }`}>
      <span className="text-lg">{getIcon()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{action.description}</p>
        {action.reason && (
          <p className="text-xs text-slate-500">{action.reason}</p>
        )}
      </div>
      <span className={`text-xs px-2 py-1 rounded ${getStatusBadge()}`}>
        {action.status}
      </span>
    </div>
  )
}
