/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the Toast hook to capture toasts
const toasts = { calls: [] }
jest.mock('../src/components/Toast', () => ({
  useToasts: () => ((msg, opts)=> toasts.calls.push({ msg, opts }))
}))

// mock flushPending helper used by the component
jest.mock('../src/lib/flushPending', () => jest.fn())
const flushPendingMock = require('../src/lib/flushPending')

// import the component after mocks
const ChatOverlay = require('../src/components/ChatOverlay').default

describe('ChatOverlay Retry all UI', ()=>{
  beforeEach(()=>{
    // put a pending item so the UI shows pending area
    localStorage.setItem('nova_chat_pending', JSON.stringify([{ entry: { q: 'hi', ts: Date.now() }, incr:0 }]))
    // ensure token present
    localStorage.setItem('nova_token', 'demo-token')
    toasts.calls = []
  })

  afterEach(()=>{
    jest.resetAllMocks()
  })

  test('Retry all disables and shows toast', async ()=>{
    // make flushPending resolve after a tick
    flushPendingMock.mockImplementation(()=>new Promise(resolve=> setTimeout(()=> resolve({ ok:true, remaining: [] }), 50)))

    render(<ChatOverlay />)
    // open overlay by clicking Chat button
    const chatBtn = screen.getByText('Chat')
    fireEvent.click(chatBtn)

    // wait for Retry all button to appear
    const retryBtn = await screen.findByText('Retry all')
    expect(retryBtn).toBeEnabled()

    // click it
    fireEvent.click(retryBtn)

    // while flushPending pending, button should be disabled
    expect(retryBtn).toBeDisabled()

    // wait for flush to finish and toast to be called
    await waitFor(()=>{
      expect(toasts.calls.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })
})
