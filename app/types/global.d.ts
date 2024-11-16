import { Client } from "@/app/types";

declare global {
  interface Window {
    editClient: (client: Client) => void;
    deleteClient: (id: string) => void;
  }
}
