// XPAM: live ticket pages. Core announces each change of a ticket the user may see ({type: 'ticket_changed', id})
// on /ws/tickets/events/; the page then reloads its data through the normal API (no ticket content comes over the
// socket). One socket per browser tab, shared by every listening component; it reconnects with a growing delay
// and closes when nothing listens any more. After a reconnection the listeners get {type: 'resync'}: changes may
// have been missed while the socket was down.
import { createWsUrl } from '@/utils/common'

const listeners = new Set()
let socket = null
let retryTimer = null
let attempts = 0
let wasConnected = false

function notify(event) {
  listeners.forEach((listener) => {
    try {
      listener(event)
    } catch (e) {
      // (one listener's error must not stop the others)
    }
  })
}

function connect() {
  if (socket || !listeners.size) {
    return
  }
  socket = new WebSocket(createWsUrl('/ws/tickets/events/'))
  socket.onopen = () => {
    attempts = 0
    if (wasConnected) {
      notify({ type: 'resync' })
    }
    wasConnected = true
  }
  socket.onmessage = (message) => {
    let data = null
    try {
      data = JSON.parse(message.data)
    } catch (e) {
      return
    }
    if (data && data.type === 'ticket_changed' && data.id) {
      notify(data)
    }
  }
  socket.onclose = () => {
    socket = null
    if (!listeners.size) {
      return
    }
    const delay = Math.min(30000, 1000 * 2 ** attempts)
    attempts += 1
    retryTimer = setTimeout(() => {
      retryTimer = null
      connect()
    }, delay)
  }
}

/**
 * Calls `listener` for every change of a ticket the user may see. Returns the function that stops listening.
 */
export function onTicketChanged(listener) {
  listeners.add(listener)
  connect()
  return () => {
    listeners.delete(listener)
    if (listeners.size) {
      return
    }
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (socket) {
      const closing = socket
      socket = null
      closing.onclose = null
      closing.close()
    }
    wasConnected = false
    attempts = 0
  }
}
