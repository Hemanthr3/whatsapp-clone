import { api } from "@/convex/_generated/api";
import { WebhookEvent } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export const POST = async (request: Request) => {
  console.log("request", request);
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not defined");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id") as string;
  const svix_timestamp = headerPayload.get("svix-timestamp") as string;
  const svix_signature = headerPayload.get("svix-signature") as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing headers", { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;
  switch (eventType) {
    case "user.created":
      try {
        console.log("payload", payload);

        const userData = {
          userId: payload?.data?.id,
          email: payload?.data?.email_addresses[0]?.email_address,
          createdAt: Date.now(),
          name: `${payload?.data?.first_name ? payload?.data?.first_name : ""}`,
          profileImage: payload?.data?.profile_image_url,
        };

        await fetchMutation(api.users.createUser, userData);
        return NextResponse.json({ id }, { status: 200 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return NextResponse.json({
          status: 400,
          message: error.message,
        });
      }

    case "user.updated":
      try {
        return NextResponse.json({ id }, { status: 200 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return NextResponse.json({
          status: 400,
          message: error.message,
        });
      }

    default:
      return new Response("Invalid event type", { status: 400 });
  }
};
