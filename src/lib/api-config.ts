export const getApiUrl = () => {
    // 1. Check environment variable first (baked in at build time)
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Client-side auto-discovery (The "No Hardcoding" magic)
    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;
        
        // If we are on the default Next.js port 3000, assume API is on 8000
        if (port === '3000') {
            return `${protocol}//${hostname}:8000`;
        }
        
        // If we are on a production domain without port 3000, 
        // we might be using a reverse proxy where /api is mapped.
        // For now, let's stick to the 8000 logic for your IP setup.
        if (hostname === '100.31.6.242') {
            return `http://100.31.6.242:8000`;
        }
    }
    
    // 3. Fallback to env or localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
