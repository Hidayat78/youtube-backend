class ApiResponse {
  constructor(statusCode, data, mesage = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
