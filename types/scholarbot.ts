export interface ScholarBotMessage {
    id: string
    content: string
    sender: 'user' | 'bot'
    timestamp: Date
    data?: any
    commandType?: string
}

export interface ScholarBotRequest {
    message: string
    userId?: string
    context?: Record<string, any>
}

export interface ScholarBotResponse {
    message: string
    data: Record<string, any>
    commandType: string
    timestamp: string
}

export interface ScholarBotHealthResponse {
    status: string
    service: string
}
