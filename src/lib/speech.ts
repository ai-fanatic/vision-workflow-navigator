// Speech I/O utilities for voice interaction

// Text-to-Speech using Web Speech API
export function speak(text: string): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported')
    return
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.0
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  // Try to get a natural-sounding voice
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Samantha') ||
    v.name.includes('Microsoft')
  )
  
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }
  
  window.speechSynthesis.speak(utterance)
}

// Speech Recognition using Web Speech API
export function startListening(
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): boolean {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported')
    return false
  }
  
  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = 'en-US'
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .map((result: SpeechRecognitionResult) => result[0].transcript)
      .join('')
    onResult(transcript)
  }
  
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError?.(event.error)
  }
  
  recognition.start()
  return true
}

export function stopListening(): void {
  // This would need to track the recognition instance
  // For simplicity, we'll rely on the recognition's own lifecycle
}

// Voice activity detection helpers
export function createAudioContext(): AudioContext | null {
  if (!('AudioContext' in window)) {
    return null
  }
  
  return new AudioContext()
}

// Pre-defined voice prompts for the demo
export const DEMO_PROMPTS = {
  analyze: "Analyzing the screen to identify interactive elements...",
  planning: "I've identified the elements. Here's my action plan:",
  executing: "Now executing each step with visual confirmation...",
  complete: "Workflow complete! I've generated the Playwright script and execution logs.",
  error: "I encountered an issue. Let me try again."
}

// Format actions for voice readout
export function speakActions(actions: { type: string; description: string }[]): void {
  const actionList = actions.map((a, i) => 
    `Step ${i + 1}: ${a.description}`
  ).join('. ')
  
  speak(`I have ${actions.length} steps planned. ${actionList}`)
}
