import axios from "axios";
import { bufferErrorSchema } from "../schemas/buffer.schemas";
import { BufferApiError } from "../utils/BufferApiError";

/**
 * console-publisher-worker is only ever deployed at this host. Using the absolute URL
 * (rather than a relative path) means the app talks to the real Worker from any origin
 * it's served from, including localhost during development.
 */
export const BUFFER_API_ORIGIN = "https://console.gi.org.pl";

export const bufferClient = axios.create({
  baseURL: `${BUFFER_API_ORIGIN}/api/buffer`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

bufferClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const parsedBody = bufferErrorSchema.safeParse(error?.response?.data);
    const message = parsedBody.success
      ? parsedBody.data.message
      : "Nie udało się połączyć z serwisem publikacji.";
    return Promise.reject(new BufferApiError(message, error?.response?.status));
  },
);
