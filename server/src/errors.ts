import { GoogleGenerativeAIFetchError, GoogleGenerativeAIResponseError } from '@google/generative-ai'

export function getErrorMessage(err: unknown): { message: string; code: string; status?: number } {
  // Handle Gemini API fetch errors (network/HTTP level)
  if (err instanceof GoogleGenerativeAIFetchError) {
    const status = err.status
    console.log('Gemini API Fetch Error Status:', err);

    switch (status) {
      case 400:
        if(err.errorDetails?.[0]?.reason === 'API_KEY_INVALID') {
          return { message: 'Invalid API key. Please check your configuration.', code: 'INVALID_API_KEY', status }
        }
        return { message: 'Invalid request. Unavailable service.', code: 'INVALID_ARGUMENT', status }
      case 403:
        return { message: 'API key lacks required permissions.', code: 'PERMISSION_DENIED', status }
      case 404:
        return { message: 'Model or resource not found.', code: 'NOT_FOUND', status }
      case 429:
        return { message: 'Rate limit exceeded. Please try again later.', code: 'RESOURCE_EXHAUSTED', status }
      case 500:
        return { message: 'Gemini server error. Please try again.', code: 'INTERNAL', status }
      case 503:
        return { message: 'Gemini service temporarily unavailable. Please try again.', code: 'UNAVAILABLE', status }
      case 504:
        return { message: 'Request timed out. Try a shorter message.', code: 'DEADLINE_EXCEEDED', status }
      default:
        // Network-level errors (no status code)
        if (!status) {
          return { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' }
        }
        return { message: 'Gemini API error. Please try again.', code: 'UNKNOWN_ERROR', status }
    }
  }

  // Handle Gemini API response errors (content/safety level)
  if (err instanceof GoogleGenerativeAIResponseError) {
    const blockReason = err.response?.promptFeedback?.blockReason
    if (blockReason) {
      return { message: `Response blocked: ${blockReason.toLowerCase()}.`, code: 'SAFETY_BLOCKED', status: 200 }
    }
    return { message: 'Invalid response from Gemini API.', code: 'RESPONSE_ERROR', status: 200 }
  }

  // Fallback for other Error types
  if (err instanceof Error) {
    return { message: err.message.split('\n')[0].slice(0, 200), code: 'UNKNOWN_ERROR' }
  }

  return { message: 'An unexpected error occurred. Please try again.', code: 'UNKNOWN_ERROR' }
}
