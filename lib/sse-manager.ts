// SSE Manager for handling real-time connections
export class SSEManager {
  private static instance: SSEManager
  private connections = new Map<string, ReadableStreamDefaultController>()

  private constructor() {}

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager()
    }
    return SSEManager.instance
  }

  addConnection(userId: string, controller: ReadableStreamDefaultController) {
    this.connections.set(userId, controller)
    console.log(`SSE connection added for user: ${userId}. Total connections: ${this.connections.size}`)
  }

  removeConnection(userId: string) {
    this.connections.delete(userId)
    console.log(`SSE connection removed for user: ${userId}. Total connections: ${this.connections.size}`)
  }

  sendToUser(userId: string, data: any): boolean {
    const controller = this.connections.get(userId)
    if (controller) {
      try {
        console.log('Broadcasting to user:', userId, data)
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        return true
      } catch (error) {
        console.error('Error broadcasting to user:', userId, error)
        this.connections.delete(userId)
        return false
      }
    }
    console.log('No connection found for user:', userId, 'Active connections:', Array.from(this.connections.keys()))
    return false
  }

  sendToUsers(userIds: string[], data: any): number {
    const results = userIds.map(userId => this.sendToUser(userId, data))
    return results.filter(Boolean).length
  }

  getActiveConnections(): number {
    return this.connections.size
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys())
  }

  cleanupConnection(userId: string) {
    const controller = this.connections.get(userId)
    if (controller) {
      try {
        controller.close()
      } catch (error) {
        // Controller already closed
      }
      this.connections.delete(userId)
    }
  }
}
