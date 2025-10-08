// services/GitHubService.js
class GitHubServiceClass {
  constructor() {
    this.baseURL = "https://api.github.com"
    this.token = typeof window !== "undefined" ? localStorage.getItem("github_token") : null
    this.user = null
  }

  isConfigured() {
    return !!this.token
  }

  setToken(token) {
    this.token = token
    if (typeof window !== "undefined") localStorage.setItem("github_token", token)
  }

  removeToken() {
    this.token = null
    if (typeof window !== "undefined") localStorage.removeItem("github_token")
    this.user = null
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.token) throw new Error("GitHub token not configured")

    const url = `${this.baseURL}${endpoint}`
    const config = {
      method: "GET",
      ...options,
      headers: {
        Authorization: `token ${this.token}`, // classic PAT; works for fine-grained too
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    }

    const res = await fetch(url, config)

    let payload = null
    try {
      payload = await res.json()
    } catch (_) {
      /* ignore non-JSON */
    }

    if (!res.ok) {
      const doc = payload?.documentation_url ? ` (${payload.documentation_url})` : ""
      const msg = payload?.message || res.statusText || "Request failed"
      const err = new Error(`[${res.status}] ${msg}${doc}`)
      err.status = res.status
      err.payload = payload
      throw err
    }

    return payload
  }

  async testConnection() {
    try {
      const user = await this.makeRequest("/user")
      this.user = user
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getUser() {
    if (this.user) return this.user
    this.user = await this.makeRequest("/user")
    return this.user
  }

  async getRepositories() {
    // Repos you can access; filter to those with issues enabled and push/admin permission
    const repos = await this.makeRequest("/user/repos?sort=updated&per_page=100")
    return repos.filter((r) => (r?.permissions?.push || r?.permissions?.admin) && r?.has_issues)
  }

  async getRepository(owner, repo) {
    return await this.makeRequest(`/repos/${owner}/${repo}`)
  }

  async createIssue(repositoryFullName, issueData) {
    if (!repositoryFullName || !repositoryFullName.includes("/")) {
      throw new Error("Invalid repository. Use the full name like owner/repo.")
    }

    const [owner, repo] = repositoryFullName.split("/")

    // Preflight: check access & issues enabled (404 here usually means no access or wrong name)
    const repoInfo = await this.getRepository(owner, repo).catch((e) => {
      throw new Error(
        `Cannot access "${repositoryFullName}". Verify the name, your token scopes (private repos: classic PAT needs "repo"; fine-grained must select the repo and enable "Issues: Read and write"). ${e.message}`
      )
    })

    if (!repoInfo.has_issues) {
      throw new Error(`Issues are disabled for ${repositoryFullName}. Enable Issues in the repo settings.`)
    }

    // Map "self" to current user login
    if (issueData?.assignees?.length) {
      const idx = issueData.assignees.findIndex((a) => a === "self")
      if (idx !== -1) {
        const me = await this.getUser()
        issueData.assignees.splice(idx, 1, me.login)
      }
    }

    return await this.makeRequest(`/repos/${repositoryFullName}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels || [],
        assignees: issueData.assignees || [],
      }),
    })
  }

  async getIssues(repository, state = "open") {
    return await this.makeRequest(`/repos/${repository}/issues?state=${state}`)
  }

  async getIssue(repository, issueNumber) {
    return await this.makeRequest(`/repos/${repository}/issues/${issueNumber}`)
  }

  async updateIssue(repository, issueNumber, updateData) {
    return await this.makeRequest(`/repos/${repository}/issues/${issueNumber}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    })
  }

  async getLabels(repository) {
    return await this.makeRequest(`/repos/${repository}/labels`)
  }

  async getCollaborators(repository) {
    return await this.makeRequest(`/repos/${repository}/collaborators`)
  }

  // -------- Templates (unchanged logic, exposed helpers) --------
  generateIssueTemplate(ticket, type = "bug") {
    const templates = {
      bug: {
        title: `[BUG] ${ticket.title}`,
        labels: ["bug", "support-escalation", `priority-${ticket.priority}`],
        body: this.generateBugTemplate(ticket),
      },
      feature: {
        title: `[FEATURE] ${ticket.title}`,
        labels: ["enhancement", "support-escalation", `priority-${ticket.priority}`],
        body: this.generateFeatureTemplate(ticket),
      },
      enhancement: {
        title: `[ENHANCEMENT] ${ticket.title}`,
        labels: ["enhancement", "support-escalation", `priority-${ticket.priority}`],
        body: this.generateEnhancementTemplate(ticket),
      },
    }
    return templates[type] || templates.bug
  }

  generateBugTemplate(ticket) {
    return `## Bug Report

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Description
${ticket.description}

### Environment
- **Tenant:** ${ticket.tenant}
- **Reporter:** ${ticket.reporter}
- **Created:** ${ticket.createdAt}

### Steps to Reproduce
1. [Please add steps to reproduce the issue]
2. 
3. 

### Expected Behavior
[Describe what should happen]

### Actual Behavior
[Describe what actually happens]

### Additional Information
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Attachments:** ${ticket.attachments ? ticket.attachments.join(", ") : "None"}

### Support Context
This issue was escalated from our support system.
- **Original Ticket:** #${ticket.id}
- **Reporter:** ${ticket.reporter} (${ticket.reporterEmail})
- **Assignee:** ${ticket.assignee}
`
  }

  generateFeatureTemplate(ticket) {
    return `## Feature Request

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Description
${ticket.description}

### Use Case
**Tenant:** ${ticket.tenant}
**Requested by:** ${ticket.reporter}

### Proposed Solution
[Describe the proposed solution]

### Alternative Solutions
[Describe any alternative solutions considered]

### Additional Context
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Created:** ${ticket.createdAt}

### Support Context
This feature was requested through our support system.
- **Original Ticket:** #${ticket.id}
- **Reporter:** ${ticket.reporter} (${ticket.reporterEmail})
- **Assignee:** ${ticket.assignee}
`
  }

  generateEnhancementTemplate(ticket) {
    return `## Enhancement Request

**Support Ticket:** #${ticket.id}
**Priority:** ${ticket.priority.toUpperCase()}
**Category:** ${ticket.category.replace("-", " ")}

### Current Behavior
${ticket.description}

### Proposed Enhancement
[Describe the enhancement]

### Benefits
[Describe the benefits of this enhancement]

### Implementation Details
[Add any implementation details if known]

### Environment
- **Tenant:** ${ticket.tenant}
- **Reporter:** ${ticket.reporter}
- **Created:** ${ticket.createdAt}

### Additional Information
- **Tags:** ${ticket.tags ? ticket.tags.join(", ") : "None"}
- **Attachments:** ${ticket.attachments ? ticket.attachments.join(", ") : "None"}

### Support Context
This enhancement was requested through our support system.
- **Original Ticket:** #${ticket.id}
- **Reporter:** ${ticket.reporter} (${ticket.reporterEmail})
- **Assignee:** ${ticket.assignee}
`
  }
}

export const GitHubService = new GitHubServiceClass()