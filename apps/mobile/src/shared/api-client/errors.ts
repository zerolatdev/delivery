export type ApiErrorKind = "network" | "timeout" | "http" | "contract";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    /** null si la petición nunca llegó al servidor. */
    readonly status: number | null,
    message: string,
    /** Cuerpo de la respuesta ya parseado como JSON, si lo hubo. */
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
