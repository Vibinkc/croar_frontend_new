import { PublicClientApplication, Configuration, RedirectRequest } from "@azure/msal-browser";

const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_MS_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MS_TENANT_ID || 'common'}`,
        redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/enterprise/login` : "",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    } as Configuration["cache"]
};

let msalInstance: PublicClientApplication | null = null;

export const getMsalInstance = async () => {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    }
    return msalInstance;
};

export const loginWithMicrosoft = async () => {
    const instance = await getMsalInstance();
    
    try {
        // Redirect the current window to Microsoft
        await instance.loginRedirect({
            scopes: ["User.Read", "openid", "profile", "email"],
            prompt: "select_account"
        });
    } catch (error: any) {
        console.error("Microsoft Login Error:", error);
        throw error;
    }
};

// Add a helper to handle the response after redirection
export const handleMicrosoftRedirect = async () => {
    const instance = await getMsalInstance();
    try {
        const result = await instance.handleRedirectPromise();
        if (result) {
            return result.idToken;
        }
        return null;
    } catch (error) {
        console.error("Error handling Microsoft redirect:", error);
        return null;
    }
};
