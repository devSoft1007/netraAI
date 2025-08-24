import { QueryClient, type QueryFunction } from "@tanstack/react-query";

// Base URL configuration
const BASE_URL = process.env.NETRA_AI_ENDPOINT || 'http://localhost:8000';

// Helper function to build full URL
function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedBaseUrl = BASE_URL.replace(/\/$/, '');
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced apiRequest function supporting both JSON and file uploads
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | FormData | undefined,
): Promise<Response> {
  const fullUrl = buildUrl(url);
  
  // Determine if we're dealing with FormData (file upload)
  const isFormData = data instanceof FormData;
  
  // Determine if we're dealing with a File object directly
  const isFile = data instanceof File;
  
  let body: BodyInit | undefined;
  let headers: HeadersInit = {};

  if (isFormData) {
    // For FormData, let the browser set the Content-Type (including boundary)
    body = data;
    // Don't set Content-Type - browser will set it with proper boundary
  } else if (isFile) {
    // Convert single File to FormData
    const formData = new FormData();
    formData.append('file', data);
    body = formData;
    // Don't set Content-Type - browser will set it with proper boundary
  } else if (data) {
    // For JSON data
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Updated getQueryFn remains the same
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey.join("/");
    const fullUrl = buildUrl(endpoint);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export { BASE_URL };
