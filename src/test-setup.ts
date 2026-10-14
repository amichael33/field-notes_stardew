import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// findBy*/waitFor default to 1s, which is flaky under the full parallel run
// (it gates deploys via npm test). Raise the timeout; assertions are unchanged.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
  cleanup()
  if (typeof localStorage !== 'undefined') localStorage.clear()
})

// jsdom 24 lacks HTMLDialogElement.showModal/close; add a minimal polyfill.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
