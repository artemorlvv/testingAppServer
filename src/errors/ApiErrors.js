export default class ApiErrors extends Error {
  constructor(status, message) {
    super()
    this.status = status
    this.message = message
  }

  static badRequest(message) {
    return new ApiErrors(400, message)
  }

  static conflict(message) {
    return new ApiErrors(409, message)
  }

  static unauthorized(message) {
    return new ApiErrors(401, message)
  }

  static forbidden(message) {
    return new ApiErrors(403, message)
  }
}
