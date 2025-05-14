import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import ChatList from "../_components/chat-list";
import FormChat from "../_components/from";

export default async function Conversations({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const conversationId = (await params).id;
  const { userId } = await auth();

  const preloadMessages = await preloadQuery(api.chats.getMessages, {
    conversationId: conversationId as Id<"conversations">,
  });

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatList userId={userId} preloadedMessages={preloadMessages} />
        <FormChat conversationId={conversationId} userId={userId} />
      </div>
    </div>
  );
}
