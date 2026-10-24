const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Common fetch wrapper that ensures credentials (cookies) are sent
 * and parses standard DevPulse API JSON envelopes.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include', // Ensure HttpOnly cookies are attached
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    }
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to DevPulse API server. Ensure backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    return null;
  }

  if (!response.ok || data.success === false) {
    const error = new Error(data?.error?.message || `Request failed with HTTP ${response.status}`);
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data.data;
}

export const authApi = {
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET'
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST'
    })
};

export const repoApi = {
  getSavedRepos: () =>
    request('/repos', {
      method: 'GET'
    }),

  saveRepo: (payload) =>
    request('/repos', {
      method: 'POST',
      body: payload
    }),

  getRepoHealth: (id) =>
    request(`/repos/${id}/health`, {
      method: 'GET'
    }),

  analyzeDirect: (payload) =>
    request('/repos/analyze', {
      method: 'POST',
      body: payload
    }),

  deleteRepo: (id) =>
    request(`/repos/${id}`, {
      method: 'DELETE'
    })
};

export const workspaceApi = {
  createWorkspace: (payload) =>
    request('/workspaces', {
      method: 'POST',
      body: payload
    }),

  getUserWorkspaces: () =>
    request('/workspaces', {
      method: 'GET'
    }),

  getWorkspaceDetails: (id) =>
    request(`/workspaces/${id}`, {
      method: 'GET'
    }),

  getWorkspaceOverview: (id) =>
    request(`/workspaces/${id}/overview`, {
      method: 'GET'
    }),

  renameWorkspace: (id, payload) =>
    request(`/workspaces/${id}`, {
      method: 'PATCH',
      body: payload
    }),

  deleteWorkspace: (id) =>
    request(`/workspaces/${id}`, {
      method: 'DELETE'
    }),

  removeMember: (workspaceId, userId) =>
    request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE'
    }),

  leaveWorkspace: (workspaceId) =>
    request(`/workspaces/${workspaceId}/leave`, {
      method: 'POST'
    }),

  listMembers: (workspaceId) =>
    request(`/workspaces/${workspaceId}/members`, {
      method: 'GET'
    }),

  createInvitation: (workspaceId) =>
    request(`/workspaces/${workspaceId}/invitations`, {
      method: 'POST'
    }),

  listPendingInvitations: (workspaceId) =>
    request(`/workspaces/${workspaceId}/invitations`, {
      method: 'GET'
    }),

  revokeInvitation: (workspaceId, inviteId) =>
    request(`/workspaces/${workspaceId}/invitations/${inviteId}`, {
      method: 'DELETE'
    }),

  // Workspace Repositories
  getWorkspaceRepos: (workspaceId) =>
    request(`/workspaces/${workspaceId}/repos`, {
      method: 'GET'
    }),

  addWorkspaceRepo: (workspaceId, payload) =>
    request(`/workspaces/${workspaceId}/repos`, {
      method: 'POST',
      body: payload
    }),

  deleteWorkspaceRepo: (workspaceId, repoId) =>
    request(`/workspaces/${workspaceId}/repos/${repoId}`, {
      method: 'DELETE'
    }),

  getWorkspaceRepoHealth: (workspaceId, repoId) =>
    request(`/workspaces/${workspaceId}/repos/${repoId}/health`, {
      method: 'GET'
    }),

  // Workspace Reports
  generateWorkspaceReport: (workspaceId, repoId) =>
    request(`/workspaces/${workspaceId}/reports`, {
      method: 'POST',
      body: { repoId }
    }),

  getWorkspaceReports: (workspaceId) =>
    request(`/workspaces/${workspaceId}/reports`, {
      method: 'GET'
    }),

  getWorkspaceReportById: (workspaceId, reportId) =>
    request(`/workspaces/${workspaceId}/reports/${reportId}`, {
      method: 'GET'
    }),

  deleteWorkspaceReport: (workspaceId, reportId) =>
    request(`/workspaces/${workspaceId}/reports/${reportId}`, {
      method: 'DELETE'
    })
};

export const inviteApi = {
  validateToken: (token) =>
    request(`/invitations/validate/${token}`, {
      method: 'GET'
    }),

  acceptInvitation: (token) =>
    request('/invitations/accept', {
      method: 'POST',
      body: { token }
    })
};

export const reportApi = {
  generatePersonalReport: (repoId) =>
    request('/reports/personal', {
      method: 'POST',
      body: { repoId }
    }),

  getPersonalReports: () =>
    request('/reports/personal', {
      method: 'GET'
    }),

  getPersonalReportById: (id) =>
    request(`/reports/personal/${id}`, {
      method: 'GET'
    }),

  deletePersonalReport: (id) =>
    request(`/reports/personal/${id}`, {
      method: 'DELETE'
    }),

  getReportById: (id) =>
    request(`/reports/${id}`, {
      method: 'GET'
    }),

  compareReports: (baseReportId, targetReportId) =>
    request(`/reports/compare?baseReportId=${baseReportId}&targetReportId=${targetReportId}`, {
      method: 'GET'
    }),

  getRepositorySnapshots: (fullName, workspaceId = null) => {
    let url = `/reports/repository-snapshots?fullName=${encodeURIComponent(fullName)}`;
    if (workspaceId) {
      url += `&workspaceId=${encodeURIComponent(workspaceId)}`;
    }
    return request(url, {
      method: 'GET'
    });
  }
};
