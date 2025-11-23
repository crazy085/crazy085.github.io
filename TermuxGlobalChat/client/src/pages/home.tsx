import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ContactList } from "@/components/contact-list";
import { ChatArea } from "@/components/chat-area";
import { type User, type Message } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!userId || !username) {
      setLocation("/login");
    }
  }, [userId, username, setLocation]);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", userId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "history") {
        setMessages(data.messages);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [userId]);

  const handleContactSelect = (contact: User) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "getHistory",
          userId,
          contactId: contact.id,
        })
      );
    }
  };

  const handleBackToContacts = () => {
    setShowMobileChat(false);
    setSelectedContact(null);
  };

  const contacts = users.filter((user) => user.id !== userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile: Contact List */}
      <div
        className={`${showMobileChat ? "hidden" : "flex"} md:flex w-full md:w-80 flex-col border-r border-border`}
      >
        <ContactList
          contacts={contacts}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          currentUsername={username || ""}
        />
      </div>

      {/* Mobile: Chat Area with Back Button */}
      <div
        className={`${showMobileChat ? "flex" : "hidden"} md:flex flex-1 flex-col`}
      >
        {selectedContact && showMobileChat && (
          <div className="flex items-center gap-2 p-2 border-b border-border md:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleBackToContacts}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        )}
        <ChatArea
          selectedContact={selectedContact}
          messages={messages}
          ws={ws}
          currentUserId={userId || ""}
        />
      </div>
    </div>
  );
}
