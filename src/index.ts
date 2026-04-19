/**
 * OutReply — official Node.js / TypeScript SDK
 * https://outreply.com/developers
 */
import { HttpClient, type ClientOptions } from "./http.js";
import { AccountResource } from "./resources/account.js";
import { BrandsResource } from "./resources/brands.js";
import { PagesResource } from "./resources/pages.js";
import { PostsResource } from "./resources/posts.js";
import { CommentsResource } from "./resources/comments.js";
import { MediaResource } from "./resources/media.js";
import { WebhooksResource } from "./resources/webhooks.js";

export * from "./errors.js";
export * from "./types.js";
export type { ClientOptions } from "./http.js";
export { verifyWebhookSignature, constructEvent } from "./webhooks.js";
export type { VerifyOptions, WebhookPayload } from "./webhooks.js";

export class OutReply {
  readonly account: AccountResource;
  readonly brands: BrandsResource;
  readonly pages: PagesResource;
  readonly posts: PostsResource;
  readonly comments: CommentsResource;
  readonly media: MediaResource;
  readonly webhooks: WebhooksResource;

  constructor(apiKeyOrOptions: string | ClientOptions) {
    const options: ClientOptions =
      typeof apiKeyOrOptions === "string" ? { apiKey: apiKeyOrOptions } : apiKeyOrOptions;
    const http = new HttpClient(options);

    this.account = new AccountResource(http);
    this.brands = new BrandsResource(http);
    this.pages = new PagesResource(http);
    this.posts = new PostsResource(http);
    this.comments = new CommentsResource(http);
    this.media = new MediaResource(http);
    this.webhooks = new WebhooksResource(http);
  }
}

export default OutReply;
