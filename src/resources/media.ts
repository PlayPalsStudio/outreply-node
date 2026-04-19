import type { HttpClient } from "../http.js";
import type { MediaAsset, Paginated } from "../types.js";

export interface UploadMediaInput {
  /** Filename including extension (e.g. "promo.png"). */
  filename: string;
  /** Binary content. */
  content: Blob | Uint8Array | ArrayBuffer;
  /** Optional — inferred from filename when omitted. */
  mimeType?: string;
}

export class MediaResource {
  constructor(private readonly http: HttpClient) {}

  upload(input: UploadMediaInput, opts: { idempotencyKey?: string } = {}): Promise<MediaAsset> {
    const form = new FormData();
    const blob =
      input.content instanceof Blob
        ? input.content
        : new Blob([input.content as BlobPart], { type: input.mimeType ?? "application/octet-stream" });
    form.append("file", blob, input.filename);
    return this.http.request<MediaAsset>({
      method: "POST",
      path: "/media/upload",
      body: form,
      multipart: true,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  list(params: { cursor?: string; limit?: number } = {}): Promise<Paginated<MediaAsset>> {
    return this.http.request<Paginated<MediaAsset>>({
      method: "GET",
      path: "/media",
      query: params,
    });
  }

  retrieve(id: string): Promise<MediaAsset> {
    return this.http.request<MediaAsset>({
      method: "GET",
      path: `/media/${encodeURIComponent(id)}`,
    });
  }

  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: "DELETE",
      path: `/media/${encodeURIComponent(id)}`,
    });
  }
}
