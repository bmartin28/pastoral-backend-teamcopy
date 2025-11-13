import { Client } from "@microsoft/microsoft-graph-client";
import { DeviceCodeCredential, DeviceCodeInfo } from "@azure/identity";

export interface DelegatedAuthConfig {
  tenantId: string;
  clientId: string;
  userEmail: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function createDelegatedGraphClient(
  tenantId: string,
  clientId: string,
  userEmail: string
): Promise<Client> {
  // For personal Microsoft accounts, use "common" or "consumers" as tenant
  const effectiveTenantId = tenantId === "common" || tenantId === "consumers" ? tenantId : tenantId;
  
  console.log(`[Delegated Auth] Initializing with tenantId=${effectiveTenantId}, clientId=${clientId}`);
  
  const credential = new DeviceCodeCredential({
    tenantId: effectiveTenantId,
    clientId,
    userPromptCallback: (info: DeviceCodeInfo) => {
      // Log all properties to debug
      console.log("\n" + "=".repeat(70));
      console.log("=== DEVICE CODE AUTHENTICATION REQUIRED ===");
      console.log("=".repeat(70));
      console.log("\nDevice Code Info Properties:");
      console.log("  userCode:", info.userCode);
      console.log("  verificationUri:", info.verificationUri);
      console.log("  message:", info.message);
      
      // Use the message if it contains the info, otherwise use individual properties
      if (info.message) {
        console.log("\n" + info.message);
      } else {
        console.log("\nTo sign in with your personal Microsoft account:");
        console.log("\n1. Open this URL in your browser:");
        console.log("   " + (info.verificationUri || 'https://microsoft.com/devicelogin'));
        console.log("\n2. Enter this code:");
        console.log("   " + (info.userCode || 'UNKNOWN'));
      }
      
      console.log("\n3. Sign in with your personal Microsoft account");
      console.log("4. Grant permissions when prompted");
      console.log("\n" + "=".repeat(70));
      console.log("Waiting for authentication (this may take up to 15 minutes)...");
      console.log("=".repeat(70) + "\n");
    },
  });

  const authProvider = {
    getAccessToken: async () => {
      // Check if we have a valid cached token
      if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
        return cachedToken.token;
      }

      // Get a new token - use delegated scopes for personal accounts
      try {
        console.log('[Delegated Auth] Requesting token with scopes: Mail.Read, User.Read');
        const token = await credential.getToken([
          "https://graph.microsoft.com/Mail.Read",
          "https://graph.microsoft.com/User.Read"
        ]);
        if (token) {
          cachedToken = {
            token: token.token,
            expiresAt: token.expiresOnTimestamp,
          };
          console.log('[Delegated Auth] Token obtained successfully');
          return token.token;
        }
        return "";
      } catch (error: any) {
        console.error('[Delegated Auth] Error getting token:', error.message);
        if (error.message?.includes('invalid_grant')) {
          console.error('[Delegated Auth] Invalid grant - this usually means:');
          console.error('  1. The device code hasn\'t been used yet (complete sign-in first)');
          console.error('  2. The device code expired (wait up to 15 minutes)');
          console.error('  3. Azure app not configured for personal accounts');
          console.error('     - Check: Azure Portal > App Registration > Authentication');
          console.error('     - Supported account types should include "Personal Microsoft accounts"');
        }
        throw error;
      }
    },
  };

  return Client.initWithMiddleware({ authProvider });
}

