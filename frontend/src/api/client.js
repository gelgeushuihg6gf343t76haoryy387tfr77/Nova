const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
console.log("API_BASE:", API_BASE);

function getToken() {
  return localStorage.getItem("auth_token");
}

function getBusinessId() {
  return localStorage.getItem("selected_business_id");
}

const TIMEOUT_MS = 15000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const businessId = getBusinessId();
  if (businessId && !path.startsWith("/auth") && !path.startsWith("/businesses")) {
    headers["X-Business-Id"] = businessId;
  }

  let response;
  try {
    console.log(`Making request to: ${API_BASE}${path}`);
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
    console.log(`Response status: ${response.status}`);
  } catch (error) {
    console.error('Fetch error:', error);
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s. Backend may be unreachable.`);
    }
    throw new Error(`Cannot connect to API at ${API_BASE}. Make sure backend is running.`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function withQuery(path, params) {
  if (!params) return path;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return path;
  return `${path}?${new URLSearchParams(entries).toString()}`;
}

async function requestMultipart(path, formData) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const businessId = getBusinessId();
  if (businessId && !path.startsWith("/auth") && !path.startsWith("/businesses")) {
    headers["X-Business-Id"] = businessId;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData, signal: controller.signal });
  } catch {
    clearTimeout(timeout);
    throw new Error(`Cannot connect to API at ${API_BASE}. Make sure backend is running.`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path, params) => request(withQuery(path, params)),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  postMultipart: (path, formData) => requestMultipart(path, formData),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
