import { ChatPanel } from "@/components/chat-panel";
import { InfoIcon } from "lucide-react";

export const metadata = { title: "Chat com a IA | Fhemigo Responde" };

export default function ChatPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Chat com a IA</h1>
      <div className="flex items-start gap-2 rounded-md bg-accent px-4 py-3 text-sm">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Assistente em desenvolvimento. Suas perguntas já ficam salvas no
          histórico e serão respondidas quando o agente for conectado.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
