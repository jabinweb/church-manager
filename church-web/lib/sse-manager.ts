// SSE Manager for handling real-time connections
class SSEManagerClass {
  private connections = new Map<string, ReadableStreamDefaultController>()

  addConnection(userId: string, controller: ReadableStreamDefaultController) {
    console.log(`SSE Manager: Attempting to add connection for user: ${userId}`)
    
    // Remove existing connection if any to prevent duplicates
    this.removeConnection(userId)
    
    // Add the new connection
    this.connections.set(userId, controller)
    
    // Test the connection immediately with a different approach
    try {
      const testMessage = {
        type: 'connection_test',
        data: { 
          timestamp: new Date().toISOString(),
          userId: userId,
          testId: Math.random().toString(36).substr(2, 9)
        }
      }
      const encoder = new TextEncoder()
      const messageData = `data: ${JSON.stringify(testMessage)}\n\n`
      controller.enqueue(encoder.encode(messageData))
      console.log(`SSE Manager: Test message sent successfully to user: ${userId}`)
    } catch (error) {
      console.error(`SSE Manager: Test message failed for user: ${userId}`, error)
      // Don't remove connection here, let it retry
    }
    
    // Return success status
    return true
  }

  removeConnection(userId: string) {
    const wasConnected = this.connections.has(userId)
    this.connections.delete(userId)
    
    if (wasConnected) {
      console.log(`SSE Manager: Connection removed for user: ${userId}. Total connections: ${this.connections.size}`)
      console.log(`SSE Manager: Remaining users: [${Array.from(this.connections.keys()).join(', ')}]`)
    }
  }

  sendToUser(userId: string, data: any): boolean {
    
    const controller = this.connections.get(userId)
    if (controller) {
      try {
        console.log(`SSE Manager: Controller found for user: ${userId}, attempting to send message`)
        const encoder = new TextEncoder()
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
        console.log(`SSE Manager: Message sent successfully to user: ${userId}`)
        return true
      } catch (error) {
        console.error(`SSE Manager: Error sending to user ${userId}:`, error)
        console.log(`SSE Manager: Removing failed connection for user: ${userId}`)
        this.connections.delete(userId)
        return false
      }
    }

    return false
  }

  sendToUsers(userIds: string[], data: any): number {
    let successCount = 0
    for (const userId of userIds) {
      if (this.sendToUser(userId, data)) {
        successCount++
      }
    }
    console.log(`SSE Manager: Sent to ${successCount}/${userIds.length} users`)
    return successCount
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

  // Cleanup all connections
  cleanupAllConnections() {
    console.log('SSE Manager: Cleaning up all connections')
    const userIds = Array.from(this.connections.keys())
    for (const userId of userIds) {
      const controller = this.connections.get(userId)
      if (controller) {
        try {
          controller.close()
        } catch (error) {
          // Ignore errors
        }
      }
    }
    this.connections.clear()
  }
}

// Use global variable to maintain singleton across all modules
const globalForSSE = globalThis as unknown as {
  sseManager: SSEManagerClass | undefined
}

// Always use the global instance if it exists, otherwise create a new one
if (!globalForSSE.sseManager) {
  globalForSSE.sseManager = new SSEManagerClass()
}

export const SSEManager = globalForSSE.sseManager
