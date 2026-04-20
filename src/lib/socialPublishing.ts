export type SocialPlatform = "facebook" | "instagram" | "tiktok";

export interface SocialPlatformCredentials {
  accessToken?: string;
  pageId?: string;
  accountId?: string;
  webhookUrl?: string;
}

export interface PublishSocialPostInput {
  platform: SocialPlatform;
  content: string;
  imageUrl?: string;
  credentials?: SocialPlatformCredentials;
}

export interface PublishSocialPostResult {
  platform: SocialPlatform;
  success: boolean;
  externalPostId?: string;
  error?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function postFacebook(
  content: string,
  imageUrl?: string,
  credentials?: SocialPlatformCredentials
): Promise<string> {
  const pageId = credentials?.pageId || requiredEnv("FACEBOOK_PAGE_ID");
  const accessToken =
    credentials?.accessToken || requiredEnv("FACEBOOK_PAGE_ACCESS_TOKEN");

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v22.0/${pageId}/photos`
    : `https://graph.facebook.com/v22.0/${pageId}/feed`;

  const body = new URLSearchParams(
    imageUrl
      ? {
          url: imageUrl,
          caption: content,
          access_token: accessToken,
        }
      : {
          message: content,
          access_token: accessToken,
        }
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Facebook API error (${response.status}): ${payload}`);
  }

  const json = (await response.json()) as { id?: string; post_id?: string };
  return json.post_id ?? json.id ?? "facebook-posted";
}

async function postInstagram(
  content: string,
  imageUrl?: string,
  credentials?: SocialPlatformCredentials
): Promise<string> {
  if (!imageUrl) {
    throw new Error("Instagram publishing requires an image URL.");
  }

  const accountId =
    credentials?.accountId || requiredEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const accessToken =
    credentials?.accessToken || requiredEnv("INSTAGRAM_ACCESS_TOKEN");

  const mediaCreateBody = new URLSearchParams({
    image_url: imageUrl,
    caption: content,
    access_token: accessToken,
  });

  const mediaCreateRes = await fetch(
    `https://graph.facebook.com/v22.0/${accountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: mediaCreateBody,
    }
  );

  if (!mediaCreateRes.ok) {
    const payload = await mediaCreateRes.text();
    throw new Error(`Instagram media creation failed (${mediaCreateRes.status}): ${payload}`);
  }

  const mediaCreateJson = (await mediaCreateRes.json()) as { id?: string };
  if (!mediaCreateJson.id) {
    throw new Error("Instagram media container ID was not returned.");
  }

  const publishBody = new URLSearchParams({
    creation_id: mediaCreateJson.id,
    access_token: accessToken,
  });

  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${accountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody,
    }
  );

  if (!publishRes.ok) {
    const payload = await publishRes.text();
    throw new Error(`Instagram publish failed (${publishRes.status}): ${payload}`);
  }

  const publishJson = (await publishRes.json()) as { id?: string };
  return publishJson.id ?? mediaCreateJson.id;
}

async function postTikTok(
  content: string,
  imageUrl?: string,
  credentials?: SocialPlatformCredentials
): Promise<string> {
  const webhookUrl =
    credentials?.webhookUrl || requiredEnv("TIKTOK_PUBLISH_WEBHOOK_URL");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption: content,
      imageUrl,
      requestedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`TikTok webhook failed (${response.status}): ${payload}`);
  }

  const json = (await response.json()) as { id?: string };
  return json.id ?? "tiktok-queued";
}

export async function publishSocialPost(
  input: PublishSocialPostInput
): Promise<PublishSocialPostResult> {
  try {
    switch (input.platform) {
      case "facebook": {
        const id = await postFacebook(input.content, input.imageUrl, input.credentials);
        return { platform: input.platform, success: true, externalPostId: id };
      }
      case "instagram": {
        const id = await postInstagram(input.content, input.imageUrl, input.credentials);
        return { platform: input.platform, success: true, externalPostId: id };
      }
      case "tiktok": {
        const id = await postTikTok(input.content, input.imageUrl, input.credentials);
        return { platform: input.platform, success: true, externalPostId: id };
      }
      default:
        return {
          platform: input.platform,
          success: false,
          error: "Unsupported platform.",
        };
    }
  } catch (error) {
    return {
      platform: input.platform,
      success: false,
      error: error instanceof Error ? error.message : "Unknown publishing error.",
    };
  }
}
