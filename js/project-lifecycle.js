/**
 * Project publish/delete helpers shared by Dashboard and Projects.
 */
(function (global) {
  const CLAIMED_KEY = "ms_lf_claimed_v1";

  function isClientPaidProject(project) {
    return project?.watermark_enabled === false;
  }

  function isLiveProject(project) {
    if (!project) return false;
    if (String(project.status || "").toLowerCase() === "published") return true;
    return !!String(project.vercel_url || "").trim();
  }

  function canDeleteProject() {
    return true;
  }

  function workerUrl() {
    if (typeof global.resolveWorkerUrl === "function") return global.resolveWorkerUrl();
    return String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  async function authHeaders() {
    const session = await global.StudioAuth?.getSession?.();
    if (!session?.access_token) throw new Error("Sign in required");
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    };
  }

  async function unpublishProject(projectId) {
    const base = workerUrl();
    if (!base) throw new Error("Worker URL is not configured.");
    const headers = await authHeaders();
    const body = JSON.stringify({ projectId, action: "unpublish" });

    let res = await fetch(base + "/publish", { method: "POST", headers, body });
    if (res.status === 404) {
      res = await fetch(base + "/unpublish", { method: "POST", headers, body: JSON.stringify({ projectId }) });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not unpublish project");
    return data;
  }

  /**
   * After a website is deleted, the business must show as a fresh lead again
   * if it is scanned or built. Clears local claim state for the lead.
   */
  function releaseClaimedLead(projectOrLeadId) {
    const ids = new Set();
    const mapsUrls = new Set();
    if (projectOrLeadId && typeof projectOrLeadId === "object") {
      const leadId = String(projectOrLeadId.lead_id || projectOrLeadId.leadId || "").trim();
      if (leadId) ids.add(leadId);
      const ctx = projectOrLeadId.business_context || projectOrLeadId.businessContext || {};
      const maps = String(ctx.mapsUrl || ctx.maps_url || projectOrLeadId.mapsUrl || "").trim();
      if (maps) {
        ids.add(maps);
        mapsUrls.add(maps);
      }
    } else {
      const id = String(projectOrLeadId || "").trim();
      if (id) ids.add(id);
    }
    if (!ids.size && !mapsUrls.size) return false;

    let changed = false;
    try {
      const raw = JSON.parse(localStorage.getItem(CLAIMED_KEY) || "{}");
      const map = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      Object.keys(map).forEach((key) => {
        const entry = map[key];
        const entryMaps = String(entry?.mapsUrl || "").trim();
        if (ids.has(key) || (entryMaps && mapsUrls.has(entryMaps))) {
          delete map[key];
          ids.add(key);
          changed = true;
        }
      });
      if (changed) localStorage.setItem(CLAIMED_KEY, JSON.stringify(map));
    } catch (_) {
      /* ignore */
    }

    ids.forEach((id) => {
      try {
        global.LeadHandoff?.release?.(id, { force: true });
      } catch (_) {
        /* ignore */
      }
    });
    return changed;
  }

  global.StudioProjects = {
    isClientPaidProject,
    isLiveProject,
    canDeleteProject,
    unpublishProject,
    releaseClaimedLead,
  };
})(window);
