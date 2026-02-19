// Playwright execution engine
import { chromium, Browser, Page } from 'playwright'
import { Action, UIElement, ExecutionLog } from '../types'

export interface ExecutionResult {
  success: boolean
  logs: ExecutionLog[]
  screenshot?: string
}

let browser: Browser | null = null
let page: Page | null = null

export async function initBrowser(): Promise<void> {
  if (!browser) {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox']
    })
  }
}

export async function navigateTo(url: string): Promise<void> {
  if (!browser) {
    await initBrowser()
  }
  page = await browser!.newPage()
  await page.goto(url)
}

export async function captureScreen(): Promise<string> {
  if (!page) throw new Error('No page initialized')
  
  const screenshot = await page.screenshot({ 
    type: 'png'
  })
  
  // Convert Uint8Array to base64
  const base64 = btoa(String.fromCharCode(...screenshot))
  return `data:image/png;base64,${base64}`
}

export async function findElement(element: UIElement): Promise<string | null> {
  if (!page) return null
  
  // Try different selectors based on element attributes
  const selectors = [
    `text=${element.text}`,
    `[aria-label*="${element.text}"]`,
    `button:has-text("${element.text}")`,
    `a:has-text("${element.text}")`,
    `input[placeholder*="${element.text}"]`
  ]
  
  for (const selector of selectors) {
    try {
      const found = await page.$(selector)
      if (found) return selector
    } catch {
      continue
    }
  }
  
  return null
}

export async function executeAction(action: Action): Promise<ExecutionLog> {
  if (!page) {
    return {
      timestamp: new Date().toISOString(),
      action: action.description,
      status: 'error',
      details: 'No page initialized'
    }
  }

  const startTime = Date.now()
  
  try {
    switch (action.type) {
      case 'click': {
        const selector = action.target?.selector || await findElement(action.target!)
        if (selector) {
          await page.click(selector)
        } else {
          // Fallback: click by coordinates (from bounding box)
          const box = action.target?.boundingBox
          if (box) {
            await page.mouse.click(
              (box.x + box.width / 2) / 100 * 800, // Assuming 800px viewport
              (box.y + box.height / 2) / 100 * 600
            )
          }
        }
        break
      }
      
      case 'type': {
        const selector = action.target?.selector || await findElement(action.target!)
        if (selector && action.value) {
          await page.fill(selector, action.value)
        }
        break
      }
      
      case 'wait': {
        await page.waitForTimeout(1000)
        break
      }
      
      case 'scroll': {
        await page.evaluate(() => window.scrollBy(0, 300))
        break
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      timestamp: new Date().toISOString(),
      action: action.description,
      status: 'success',
      details: `Completed in ${duration}ms`
    }
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      action: action.description,
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function executeWorkflow(
  actions: Action[],
  onStep?: (step: number, action: Action) => void
): Promise<ExecutionResult> {
  const logs: ExecutionLog[] = []
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    onStep?.(i, action)
    
    const log = await executeAction(action)
    logs.push(log)
    
    if (log.status === 'error') {
      // Continue on error or stop? For demo, we continue
      await page?.waitForTimeout(500)
    }
  }
  
  const finalScreenshot = await captureScreen().catch(() => undefined)
  
  return {
    success: logs.every(l => l.status !== 'error'),
    logs,
    screenshot: finalScreenshot
  }
}

export function generatePlaywrightScript(actions: Action[]): string {
  const lines = [
    "import { test, expect } from '@playwright/test';",
    "",
    "test('Automated workflow from vision analysis', async ({ page }) => {",
    `  // Navigate to target site`,
    `  await page.goto('https://demo.playwright.dev/todomvc');`,
    ""
  ]
  
  actions.forEach((action, idx) => {
    const comment = `  // Step ${idx + 1}: ${action.description}`
    lines.push(comment)
    
    switch (action.type) {
      case 'click':
        lines.push(`  await page.click('#selector-${idx + 1}');`)
        break
      case 'type':
        lines.push(`  await page.fill('#selector-${idx + 1}', '${action.value}');`)
        break
      case 'wait':
        lines.push(`  await page.waitForTimeout(1000);`)
        break
      case 'scroll':
        lines.push(`  await page.evaluate(() => window.scrollBy(0, 300));`)
        break
    }
    lines.push('')
  })
  
  lines.push('});')
  
  return lines.join('\n')
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
    page = null
  }
}
