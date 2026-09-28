export class BufferApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BufferApiError";
    this.status = status;
  }
}
