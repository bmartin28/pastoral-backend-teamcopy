import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";

export function createGraphClient(tenantId: string, clientId: string, clientSecret: string) {
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = {
    getAccessToken: async () => {
      const token = await credential.getToken("https://graph.microsoft.com/.default");
      return token?.token ?? "";
    },
  };
  return Client.initWithMiddleware({ authProvider });
}

