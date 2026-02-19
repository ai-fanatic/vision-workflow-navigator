// Gemini Vision API integration for screen understanding
import { GoogleGenerativeAI } from '@google/generative-ai'
import { UIElement } from '../types'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

const genAI = new GoogleGenerativeAI(API_KEY)

export interface AnalysisResult {
  elements: UIElement[]
  summary: string
  suggestedActions: string[]
}

export async function analyzeScreen(
  imageData: string,
  goal: string
): Promise<AnalysisResult> {
  if (!API_KEY) {
    // Return mock data if no API key
    return generateMockAnalysis(goal)
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
      }
    })

    // Convert base64 to base64url
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '')
    
    const prompt = `
You are a vision-based UI automation agent. Analyze this screenshot of a web page.

User's goal: "${goal}"

Task:
1. Identify all clickable/interactive elements (buttons, links, inputs, dropdowns, etc.)
2. For each element, provide: tag type, visible text, and bounding box (as percentage coordinates 0-100)
3. Suggest a sequence of actions to achieve the user's goal

Respond in this JSON format:
{
  "elements": [
    {
      "id": "unique-id",
      "tag": "button|input|a|div|...",
      "text": "visible text or description",
      "boundingBox": { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100 },
      "clickable": true|false,
      "inputable": true|false
    }
  ],
  "summary": "What the page contains in 1-2 sentences",
  "suggestedActions": ["action 1", "action 2", ...]
}
`

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      },
      prompt
    ])

    const responseText = result.response.text()
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        elements: parsed.elements || [],
        summary: parsed.summary || '',
        suggestedActions: parsed.suggestedActions || []
      }
    }
    
    return generateMockAnalysis(goal)
  } catch (error) {
    console.error('Gemini API error:', error)
    return generateMockAnalysis(goal)
  }
}

function generateMockAnalysis(goal: string): AnalysisResult {
  const goalLower = goal.toLowerCase()
  
  const elements: UIElement[] = []
  
  if (goalLower.includes('product') || goalLower.includes('find')) {
    elements.push({
      id: 'prod-1',
      tag: 'div',
      text: 'Product - Wireless Headphones - $49.99',
      boundingBox: { x: 5, y: 15, width: 25, height: 20 },
      clickable: true
    })
    elements.push({
      id: 'prod-2',
      tag: 'div', 
      text: 'Product - USB-C Cable - $12.99',
      boundingBox: { x: 35, y: 15, width: 25, height: 20 },
      clickable: true
    })
  }
  
  if (goalLower.includes('cart') || goalLower.includes('add')) {
    elements.push({
      id: 'add-cart-btn',
      tag: 'button',
      text: 'Add to Cart',
      boundingBox: { x: 40, y: 55, width: 15, height: 5 },
      clickable: true
    })
  }
  
  if (goalLower.includes('coupon')) {
    elements.push({
      id: 'coupon-input',
      tag: 'input',
      text: 'Coupon code',
      boundingBox: { x: 25, y: 65, width: 25, height: 4 },
      inputable: true
    })
    elements.push({
      id: 'apply-coupon-btn',
      tag: 'button',
      text: 'Apply',
      boundingBox: { x: 52, y: 65, width: 8, height: 4 },
      clickable: true
    })
  }
  
  if (goalLower.includes('checkout')) {
    elements.push({
      id: 'checkout-btn',
      tag: 'button',
      text: 'Proceed to Checkout',
      boundingBox: { x: 30, y: 80, width: 20, height: 6 },
      clickable: true
    })
    elements.push({
      id: 'guest-checkout',
      tag: 'button',
      text: 'Checkout as Guest',
      boundingBox: { x: 35, y: 40, width: 18, height: 5 },
      clickable: true
    })
  }
  
  // Always add navigation
  elements.push({
    id: 'nav-cart',
    tag: 'a',
    text: 'Cart (0)',
    boundingBox: { x: 80, y: 5, width: 10, height: 4 },
    clickable: true
  })
  
  return {
    elements,
    summary: 'E-commerce product listing page with multiple products, shopping cart, and checkout options',
    suggestedActions: [
      'Click on first product under $50',
      'Click Add to Cart',
      'Enter coupon code',
      'Click Apply',
      'Proceed to checkout as guest'
    ]
  }
}

export async function generateActionPlan(
  analysis: AnalysisResult,
  goal: string
): Promise<string> {
  if (!API_KEY) {
    return analysis.suggestedActions.join('\n')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `
Given this analysis of a web page:
${JSON.stringify(analysis, null, 2)}

And this user goal: "${goal}"

Create a numbered list of specific actions to achieve this goal. 
Each action should be in format: "[number]. [action type] [target description]"
Action types: click, type, wait, scroll, select

Keep it concise - maximum 5-6 steps.
`

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Error generating action plan:', error)
    return analysis.suggestedActions.join('\n')
  }
}
