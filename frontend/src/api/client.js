// Drop-in replacement for the Base44 SDK client.
// Same surface (`entities`, `auth`, `functions`) so existing components don't need rewrites.
//
// Reads VITE_API_BASE_URL at build time. Cookies (httpOnly access + refresh) handle auth.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body, opts = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { "Accept": "application/json", ...(opts.headers ?? {}) };
  let init = {
    method,
    credentials: "include",
    headers,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res = await fetch(url, init);

  // Auto-refresh on 401 (single retry)
  if (res.status === 401 && !opts._noRetry && !path.startsWith("/auth/")) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      res = await fetch(url, init);
    }
  }

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const code = data?.error ?? "request_failed";
    const message = data?.message ?? res.statusText;
    throw new ApiError(res.status, code, message, data?.details);
  }
  return data;
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach(x => usp.append(k, String(x)));
    else usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

// ---- Generic entity factory ----
// Matches the Base44 SDK's entity surface:
//   .list(sort, limit), .get(id), .filter(query), .create(data), .update(id, data), .delete(id)
function entity(name) {
  const base = `/${name}`;
  return {
    async list(sort, limit) {
      const params = {};
      if (limit) params.limit = limit;
      if (sort) {
        const order = sort.startsWith("-") ? "desc" : "asc";
        params.sort = sort.replace(/^-/, "");
        params.order = order;
      }
      const r = await request("GET", `${base}${buildQuery(params)}`);
      return Array.isArray(r) ? r : r.items ?? [];
    },
    async get(id) {
      return request("GET", `${base}/${encodeURIComponent(id)}`);
    },
    async filter(query, sort, limit) {
      const params = { ...query };
      if (limit) params.limit = limit;
      if (sort) {
        const order = sort.startsWith("-") ? "desc" : "asc";
        params.sort = sort.replace(/^-/, "");
        params.order = order;
      }
      const r = await request("GET", `${base}${buildQuery(params)}`);
      return Array.isArray(r) ? r : r.items ?? [];
    },
    async create(data) {
      return request("POST", base, data);
    },
    async update(id, data) {
      return request("PATCH", `${base}/${encodeURIComponent(id)}`, data);
    },
    async delete(id) {
      return request("DELETE", `${base}/${encodeURIComponent(id)}`);
    },
  };
}

// ---- Public surface ----
const apiEntityMap = {
  Lead: "leads",
  Job: "jobs",
  Customer: "customers",
  Estimate: "estimates",
  Invoice: "invoices",
  Payment: "payments",
  SmartDocument: "smartdocs",
  DocumentTemplate: "smartdocs/templates",
  SignatureEvent: "smartdocs/events",
  Contract: "contracts",
  Proposal: "proposals",
  Task: "tasks",
  Appointment: "appointments",
  Message: "messages",
  Material: "materials",
  ActivityLog: "activity",
  Inspection: "inspections",
  InsuranceClaim: "insurance-claims",
  Crew: "crews",
  Warranty: "warranties",
  Review: "reviews",
  User: "users",
};

const entities = {};
for (const [name, path] of Object.entries(apiEntityMap)) {
  entities[name] = entity(path);
}

// ---- Auth surface ----
const auth = {
  async login({ email, password }) {
    return request("POST", "/auth/login", { email, password });
  },
  async clientLogin({ jobNumber, email }) {
    return request("POST", "/auth/client-login", { job_number: jobNumber, email });
  },
  async register(data) {
    return request("POST", "/auth/register", data);
  },
  async me() {
    const r = await request("GET", "/auth/me");
    return r?.user ?? r;
  },
  async logout() {
    return request("POST", "/auth/logout");
  },
  async isAuthenticated() {
    try {
      await request("GET", "/auth/me");
      return true;
    } catch (e) {
      if (e.status === 401) return false;
      throw e;
    }
  },
};

// ---- Functions surface (matches base44.functions.invoke shape) ----
const functions = {
  async invoke(name, payload) {
    // Map old Base44 function names to new REST endpoints
    switch (name) {
      case "validateClientJobAccess":
        return { data: await request("POST", "/auth/client-login", payload) };
      case "getJobSmartData": {
        if (!payload?.jobId) throw new ApiError(400, "bad_request", "jobId required");
        return { data: await request("GET", `/jobs/${encodeURIComponent(payload.jobId)}/smart-data`) };
      }
      case "sendInvoice":
        return { data: await request("POST", `/invoices/${encodeURIComponent(payload.invoiceId)}/send`) };
      case "sendDocumentForSignature":
        return { data: await request("POST", `/smartdocs/${encodeURIComponent(payload.documentId)}/send`) };
      case "signDocument":
        return { data: await request("POST", `/smartdocs/sign/${encodeURIComponent(payload.documentId)}/${encodeURIComponent(payload.signerToken)}`, payload) };
      case "autoGenerateSmartDocument":
        return { data: await request("POST", "/smartdocs", payload) };
      case "generateSmartPDF":
        return { data: await request("POST", `/smartdocs/${encodeURIComponent(payload.documentId)}/pdf`) };
      case "sendEstimate":
        return { data: await request("POST", `/estimates/${encodeURIComponent(payload.estimateId)}/send`) };
      case "approveProposal":
        return { data: await request("POST", `/estimates/${encodeURIComponent(payload.estimateId)}/approve`, payload) };
      case "inviteEmployeeWithDetails":
        return { data: await request("POST", "/auth/register", payload) };
      case "inviteEmployee":
        return { data: await request("POST", "/auth/invite-employee", payload) };
      case "inviteClient":
        return { data: await request("POST", "/auth/invite-client", payload) };
      case "sendSMS":
      case "sendSms":
        return { data: await request("POST", "/messages/sms", payload) };
      case "initiateCall":
        return { data: await request("POST", "/messages/call", payload) };
      case "sendContractForSignature":
        return { data: await request("POST", `/contracts/${encodeURIComponent(payload.contractId)}/send`, payload) };
      case "generateContractPDF":
        return { data: await request("POST", `/contracts/${encodeURIComponent(payload.contractId)}/pdf`) };
      case "syncAbcMaterials":
        return { data: await request("POST", "/materials/sync-abc") };
      case "orderAbcMaterial":
        return { data: await request("POST", "/materials/order", payload) };
      case "fetchEagleViewReport":
        return { data: await request("POST", "/inspections/eagleview", payload) };
      case "syncQuickbooksInvoice":
        return { data: await request("POST", `/invoices/${encodeURIComponent(payload.invoiceId)}/sync-qbo`) };
      case "getSettings":
        return { data: await request("GET", "/settings") };
      case "updateSetting":
        return { data: await request("PUT", `/settings/${encodeURIComponent(payload.key)}`, { value: payload.value }) };
      case "testIntegration":
        return { data: await request("POST", `/settings/test/${encodeURIComponent(payload.integration)}`) };
      default:
        throw new ApiError(501, "not_implemented", `Function ${name} not migrated`);
    }
  },
};

// Default export mimics base44 SDK shape
export const apiClient = { entities, auth, functions, ApiError };
export { ApiError, request, buildQuery, entity };
export default apiClient;
