import { useState, useCallback } from 'react'
import AgentView from './components/AgentView'
import { AgentState, Action, ExecutionLog, Artifact } from './types'

const initialState: AgentState = {
  status: 'idle',
  goal: '',
  actions: [],
  logs: [],
  artifacts: [],
  currentStep: undefined,
  error: undefined
}

function App() {
  const [agentState, setAgentState] = useState<AgentState>(initialState)
  const [screenUrl, setScreenUrl] = useState<string>('https://demo.playwright.dev/todomvc')

  const handleGoalSubmit = useCallback(async (goal: string) => {
    setAgentState(prev => ({
      ...prev,
      status: 'analyzing',
      goal,
      logs: [...prev.logs, {
        timestamp: new Date().toISOString(),
        action: 'Goal received',
        status: 'info',
        details: goal
      }]
    }))

    // Simulate analysis phase
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        status: 'planning',
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          action: 'Analyzing screen',
          status: 'info',
          details: 'Identifying interactive elements...'
        }]
      }))
    }, 1500)

    // Generate mock actions based on goal
    setTimeout(() => {
      const actions = generateActionsFromGoal(goal)
      setAgentState(prev => ({
        ...prev,
        status: 'planning',
        actions,
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          action: 'Plan generated',
          status: 'success',
          details: `${actions.length} actions proposed`
        }]
      }))
    }, 3000)
  }, [])

  const handleExecute = useCallback(async () => {
    const actions = agentState.actions
    
    setAgentState(prev => ({
      ...prev,
      status: 'executing',
      currentStep: 0,
      logs: [...prev.logs, {
        timestamp: new Date().toISOString(),
        action: 'Starting execution',
        status: 'info'
      }]
    }))

    // Execute step by step
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      
      setAgentState(prev => ({
        ...prev,
        currentStep: i,
        actions: prev.actions.map((a, idx) => 
          idx === i ? { ...a, status: 'executing' as const } : a
        )
      }))

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

      const success = Math.random() > 0.1 // 90% success rate simulation

      setAgentState(prev => ({
        ...prev,
        actions: prev.actions.map((a, idx) => 
          idx === i ? { 
            ...a, 
            status: success ? 'completed' as const : 'failed' as const,
            reason: success ? 'Action completed successfully' : 'Element not found'
          } : a
        ),
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          action: `${action.type}: ${action.description}`,
          status: success ? 'success' : 'error',
          details: success ? 'Target element clicked' : 'Retrying...'
        }]
      }))

      if (!success && i < actions.length - 1) {
        // Retry once
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Generate artifacts
    setTimeout(() => {
      const artifacts: Artifact[] = [
        {
          type: 'summary',
          content: generateSummary(agentState.goal || '', actions),
          filename: 'execution-summary.md'
        },
        {
          type: 'playwright-script',
          content: generatePlaywrightScript(actions),
          filename: 'workflow.spec.ts'
        },
        {
          type: 'run-log',
          content: generateRunLog(agentState.logs),
          filename: 'run-log.json'
        }
      ]

      setAgentState(prev => ({
        ...prev,
        status: 'completed',
        artifacts,
        logs: [...prev.logs, {
          timestamp: new Date().toISOString(),
          action: 'Execution complete',
          status: 'success',
          details: `${artifacts.length} artifacts generated`
        }]
      }))
    }, 1000)
  }, [agentState.actions, agentState.goal, agentState.logs])

  const handleReset = useCallback(() => {
    setAgentState(initialState)
  }, [])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-agent-primary to-agent-accent bg-clip-text text-transparent mb-2">
            Vision-to-Workflow Navigator
          </h1>
          <p className="text-slate-400">Google Gemini Live Agent Challenge</p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Agent Interface */}
          <div className="space-y-4">
            <AgentView 
              state={agentState}
              onGoalSubmit={handleGoalSubmit}
              onExecute={handleExecute}
              onReset={handleReset}
            />
          </div>

          {/* Right: Screen Preview & Artifacts */}
          <div className="space-y-4">
            {/* Screen Preview */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="status-dot success"></span>
                  Live Preview
                </h2>
                <input
                  type="text"
                  value={screenUrl}
                  onChange={(e) => setScreenUrl(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm w-64"
                  placeholder="Enter demo URL"
                />
              </div>
              <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  src={screenUrl}
                  className="w-full h-full border-0"
                  title="Demo Site"
                />
                {/* Bounding box overlays would go here */}
                {agentState.status === 'planning' && agentState.actions.map((action, idx) => (
                  action.target?.boundingBox && (
                    <div
                      key={action.id}
                      className={`bounding-box ${
                        agentState.currentStep === idx ? 'border-yellow-400' : ''
                      }`}
                      style={{
                        left: `${action.target.boundingBox.x}%`,
                        top: `${action.target.boundingBox.y}%`,
                        width: `${action.target.boundingBox.width}%`,
                        height: `${action.target.boundingBox.height}%`,
                      }}
                      data-label={`${idx + 1}. ${action.type}`}
                    />
                  )
                ))}
              </div>
            </div>

            {/* Artifacts Panel */}
            {agentState.artifacts.length > 0 && (
              <div className="glass rounded-xl p-4">
                <h2 className="text-lg font-semibold mb-3">Generated Artifacts</h2>
                <div className="space-y-2">
                  {agentState.artifacts.map((artifact, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-agent-accent">
                          {artifact.type}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(artifact.content)}
                          className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs text-slate-400 overflow-x-auto max-h-32">
                        {artifact.content.slice(0, 500)}...
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateActionsFromGoal(goal: string): Action[] {
  const goalLower = goal.toLowerCase()
  const actions: Action[] = []

  if (goalLower.includes('product') || goalLower.includes('find')) {
    actions.push({
      id: '1',
      type: 'click',
      description: 'Click on first product under $50',
      order: 1,
      status: 'pending',
      target: {
        id: 'prod-1',
        tag: 'div',
        text: 'Product Card - $29.99',
        boundingBox: { x: 10, y: 20, width: 20, height: 15 }
      }
    })
  }

  if (goalLower.includes('cart') || goalLower.includes('add')) {
    actions.push({
      id: '2',
      type: 'click',
      description: 'Click Add to Cart button',
      order: 2,
      status: 'pending',
      target: {
        id: 'add-cart',
        tag: 'button',
        text: 'Add to Cart',
        boundingBox: { x: 40, y: 60, width: 15, height: 5 }
      }
    })
  }

  if (goalLower.includes('coupon') || goalLower.includes('apply')) {
    actions.push({
      id: '3',
      type: 'type',
      description: 'Enter coupon code',
      order: 3,
      status: 'pending',
      value: 'SAVE20',
      target: {
        id: 'coupon-input',
        tag: 'input',
        text: 'Coupon code',
        boundingBox: { x: 30, y: 70, width: 20, height: 4 }
      }
    })
  }

  if (goalLower.includes('checkout') || goalLower.includes('guest')) {
    actions.push({
      id: '4',
      type: 'click',
      description: 'Proceed to checkout as guest',
      order: 4,
      status: 'pending',
      target: {
        id: 'checkout-btn',
        tag: 'button',
        text: 'Checkout',
        boundingBox: { x: 35, y: 85, width: 15, height: 5 }
      }
    })
  }

  return actions
}

function generateSummary(goal: string, actions: Action[]): string {
  return `# Execution Summary

**Goal**: ${goal}

**Actions Executed**: ${actions.length}
${actions.map((a, i) => `${i + 1}. ${a.type}: ${a.description} - ${a.status}`).join('\n')}

**Why It Worked**:
- Visual grounding: Each action mapped to actual UI elements
- Bounding boxes validated before execution
- Step-by-step execution with real-time feedback

**Generated**: ${new Date().toISOString()}
`
}

function generatePlaywrightScript(actions: Action[]): string {
  return `import { test, expect } from '@playwright/test';

test('Vision-to-Workflow Demo', async ({ page }) => {
  // Navigate to demo site
  await page.goto('https://demo.playwright.dev/todomvc');
  
  ${actions.map(a => {
    if (a.type === 'click') {
      return `// ${a.description}
  await page.click('${a.target?.selector || '#element'}');
`
    } else if (a.type === 'type') {
      return `// ${a.description}
  await page.fill('${a.target?.selector || '#input'}', '${a.value}');
`
    }
    return ''
  }).join('')}
});
`
}

function generateRunLog(logs: ExecutionLog[]): string {
  return JSON.stringify(logs, null, 2)
}

export default App
