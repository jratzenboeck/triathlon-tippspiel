const KEY = 'pendingInviteToken'

export function storeInviteToken(token) {
  localStorage.setItem(KEY, token)
}

export function getInviteToken() {
  return localStorage.getItem(KEY)
}

export function popInviteToken() {
  const token = localStorage.getItem(KEY)
  localStorage.removeItem(KEY)
  return token
}
