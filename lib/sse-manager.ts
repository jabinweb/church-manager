// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller)
  console.log(`SSE connection added for user: ${userId}. Total connections: ${connections.size}`)
}

export function removeConnection(userId: string) {
  connections.delete(userId)
  console.log(`SSE connection removed for user: ${userId}. Total connections: ${connections.size}`)
}

export function broadcastToUser(userId: string, data: any): boolean {
  const controller = connections.get(userId)
  if (controller) {
    try {
      console.log('Broadcasting to user:', userId, data)
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      return true
    } catch (error) {
      console.error('Error broadcasting to user:', userId, error)
      connections.delete(userId)
      return false
    }
  }
  console.log('No connection found for user:', userId, 'Active connections:', Array.from(connections.keys()))
  return false
}

export function broadcastToUsers(userIds: string[], data: any): number {
  const results = userIds.map(userId => broadcastToUser(userId, data))
  return results.filter(Boolean).length
}

export function getActiveConnections(): number {
  return connections.size
}

export function getConnectedUsers(): string[] {
  return Array.from(connections.keys())
}

export function cleanupConnection(userId: string) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      controller.close()
    } catch (error) {
      // Controller already closed
    }
    connections.delete(userId)
  }
}
