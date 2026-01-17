// Get HTTP error message for non-2xx responses
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please try again.'
    case 401:
      return 'Unauthorized. Please check API configuration.'
    case 403:
      return 'Access forbidden. Please check your permissions.'
    case 404:
      return 'Service not found. Please try again later.'
    case 429:
      return 'Too many requests. Please wait and try again.'
    case 500:
      return 'Server error. Please try again later.'
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.'
    default:
      return `Request failed (Error ${status}). Please try again.`
  }
}
