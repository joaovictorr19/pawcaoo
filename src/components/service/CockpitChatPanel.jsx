import React, { useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import ChatInput from "@/components/chat/ChatInput";

function ChatContent({ messages, user, scrollRef, sendMessageMutation }) {
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, scrollRef]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_email === user?.email}
                showAvatar={true}
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t bg-white shrink-0">
        <ChatInput onSendMessage={(data) => sendMessageMutation.mutate(data)} disabled={sendMessageMutation.isPending} />
      </div>
    </>
  );
}

export default function CockpitChatPanel({ isChatOpen, setIsChatOpen, otherParticipant, messages, user, scrollRef, sendMessageMutation }) {
  return (
    <>
      <div className="md:hidden">
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerContent className="h-[100dvh] flex flex-col bg-white border-0 rounded-t-3xl">
            <DrawerHeader className="border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-3xl shrink-0">
              <DrawerTitle className="text-white flex items-center gap-2">💬 Chat com {otherParticipant?.name}</DrawerTitle>
            </DrawerHeader>
            <ChatContent messages={messages} user={user} scrollRef={scrollRef} sendMessageMutation={sendMessageMutation} />
          </DrawerContent>
        </Drawer>
      </div>

      <div className="hidden md:block">
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetContent side="right" className="w-[500px] flex flex-col p-0 bg-white">
            <SheetHeader className="p-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <SheetTitle className="text-white">💬 Chat com {otherParticipant?.name}</SheetTitle>
            </SheetHeader>
            <ChatContent messages={messages} user={user} scrollRef={scrollRef} sendMessageMutation={sendMessageMutation} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}