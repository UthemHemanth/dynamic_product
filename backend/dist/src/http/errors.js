export class HttpError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (message, details) => new HttpError(404, message, details);
