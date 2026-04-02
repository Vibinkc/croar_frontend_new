import Cookies from "js-cookie";

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";
export const FRONTEND_DOMAIN = process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || (typeof window !== "undefined" ? window.location.hostname : "3.94.202.48");

if (!BACKEND_URL && typeof window !== "undefined") {
    console.warn("NEXT_PUBLIC_API_URL is not defined. API calls will likely fail.");
}

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

export const apiClient = {
    async request(path: string, options: FetchOptions = {}) {
        const token = Cookies.get("auth_");

        const headers = new Headers(options.headers);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const url = new URL(`${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`);
        if (options.params) {
            Object.keys(options.params).forEach(key =>
                url.searchParams.append(key, options.params![key])
            );
        }

        // DEBUGGING: Log request details
        console.log(`[API REQUEST] ${options.method || "GET"} ${url.toString()}`);
        // console.log("Headers:", Object.fromEntries(headers.entries()));

        try {
            const response = await fetch(url.toString(), {
                ...options,
                headers
            });

            if (!response.ok) {
                console.error(`[API ERROR] ${response.status} ${response.statusText} for ${url.toString()}`);
                // Try to read body for more info
                try {
                    const errBody = await response.clone().text();
                    console.error("Error Body:", errBody);
                } catch (e) { }
            }

            if (response.status === 401) {
                // Handle unauthorized (maybe logout)
                console.warn("Unauthorized request");
            }
            return response;
        } catch (error) {
            console.error(`[NETWORK ERROR] Failed to fetch ${url.toString()}`, error);
            throw error;
        }
    },

    get(path: string, options: FetchOptions = {}) {
        return this.request(path, { ...options, method: 'GET' });
    },

    post(path: string, body: any, options: FetchOptions = {}) {
        return this.request(path, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    put(path: string, body: any, options: FetchOptions = {}) {
        return this.request(path, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    delete(path: string, options: FetchOptions = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
};
