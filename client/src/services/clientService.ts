import { Client } from "../types";
import { ClientRepository } from "../repositories/clientRepository";

export const ClientService = {
  getClients: async (): Promise<Client[]> => {
    return ClientRepository.getAll();
  },

  getClientById: async (id: string): Promise<Client | undefined> => {
    return ClientRepository.getById(id);
  },

  createClient: async (
    clientData: Omit<Client, "id" | "createdAt" | "status">
  ): Promise<Client> => {
    return ClientRepository.create(clientData);
  },

  updateClient: async (id: string, clientData: Partial<Client>): Promise<void> => {
    return ClientRepository.update(id, clientData);
  },

  deleteClient: async (id: string): Promise<void> => {
    return ClientRepository.delete(id);
  },

  archiveClient: async (id: string): Promise<void> => {
    return ClientRepository.archive(id);
  },
};
