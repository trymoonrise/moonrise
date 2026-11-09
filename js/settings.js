/**
 * Settings - profile, password, notifications, session.
 */
(async function () {
  const BUCKET = "studio-avatars";
  const MAX_BYTES = 2 * 1024 * 1024;
  const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

  const err = document.getElementById("set-error");
  const ok = document.getElementById("set-ok");
  const fileInput = document.getElementById("set-avatar-file");
  const imgEl = document.getElementById("set-avatar-img");
  const initialsEl = document.getElementById("set-avatar-initials");
  const removeBtn = document.getElementById("set-avatar-remove");
  const wrapEl = document.getElementById("set-avatar-wrap");
  const notifHint = document.getElementById("set-notif-hint");
  const notifError = document.getElementById("set-notif-error");
  const notifSummary = document.getElementById("set-notif-summary");
  const notifInputs = () =>
    Array.from(document.querySelectorAll("#set-notif-panel [data-notif-key]"));

  let avatarUrl = "";
  let started = false;
  let notifBusy = false;

  function chevronFor(toggle) {
    return toggle?.closest(".ms-set-row") || toggle;
  }

  function prefersReduceMotion() {
    try {
      return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    } catch (_) {
      return false;
    }
  }

  function ensurePanelInner(panel) {
    if (!panel || panel.querySelector(":scope > .ms-set-panel-inner")) return;
    const inner = document.createElement("div");
    inner.className = "ms-set-panel-inner";
    while (panel.firstChild) inner.appendChild(panel.firstChild);
    panel.appendChild(inner);
  }

  function setPanelOpen(toggle, panel, open) {
    if (!toggle || !panel) return;
    ensurePanelInner(panel);
    const next = !!open;
    const row = chevronFor(toggle);
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
    row?.classList.toggle("is-open", next);
    panel.setAttribute("aria-hidden", next ? "false" : "true");

    if (panel._msCloseTimer) {
      window.clearTimeout(panel._msCloseTimer);
      panel._msCloseTimer = 0;
    }

    if (next) {
      panel.hidden = false;
      panel.classList.remove("is-closing");
      panel.classList.add("is-open");
      if (prefersReduceMotion()) {
        panel.classList.add("is-expanded");
        return;
      }
      panel.classList.remove("is-expanded");
      void panel.offsetHeight;
      requestAnimationFrame(() => {
        panel.classList.add("is-expanded");
      });
      return;
    }

    panel.classList.remove("is-expanded");
    panel.classList.add("is-closing");
    // Collapse nested service rows immediately so they don't fight the parent height.
    if (panel.id === "set-status-panel") {
      panel.querySelectorAll(".ms-status-detail-panel.is-open, .ms-status-fleet-panel.is-open").forEach((nested) => {
        nested.classList.remove("is-expanded", "is-open", "is-closing");
        nested.hidden = true;
        const nestedBtn = panel.querySelector('[aria-controls="' + nested.id + '"]');
        nestedBtn?.setAttribute("aria-expanded", "false");
        nestedBtn?.closest(".ms-status-item, .ms-status-fleet-item")?.classList.remove("is-open");
      });
    }
    if (prefersReduceMotion()) {
      panel.classList.remove("is-open", "is-closing");
      panel.hidden = true;
      return;
    }
    panel._msCloseTimer = window.setTimeout(() => {
      panel.classList.remove("is-open", "is-closing");
      panel.hidden = true;
      panel._msCloseTimer = 0;
    }, 320);
  }

  function bindPanelToggle(toggleId, panelId) {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return;
    ensurePanelInner(panel);
    panel.hidden = true;
    panel.classList.remove("is-open", "is-expanded");
    panel.setAttribute("aria-hidden", "true");
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const currentlyOpen = panel.classList.contains("is-open") && !panel.hidden;
      setPanelOpen(toggle, panel, !currentlyOpen);
    });
  }

  function syncProfileSummary() {
    const handle = String(document.getElementById("set-handle")?.value || "")
      .replace(/^@/, "")
      .trim();
    const display = String(document.getElementById("set-display")?.value || "").trim();
    const nameEl = document.getElementById("set-profile-name");
    const handleEl = document.getElementById("set-profile-handle");
    if (nameEl) nameEl.textContent = display || handle || "Profile";
    if (handleEl) handleEl.textContent = handle ? "@" + handle : "@moonrise";
  }

  function clearProfileSkeleton() {
    document.getElementById("set-profile-summary")?.classList.remove("is-skel");
  }

  function syncThemeSwatchPreview() {
    const preview = document.getElementById("set-theme-swatch-preview");
    if (!preview) return;
    const custom = document.getElementById("set-theme-custom");
    const active = document.querySelector('.ms-appearance-swatch[aria-checked="true"][data-color]');
    const color =
      active?.getAttribute("data-color") ||
      custom?.value ||
      getComputedStyle(document.documentElement).getPropertyValue("--ms-accent").trim() ||
      "#232427";
    preview.style.background = color;
  }

  bindPanelToggle("set-profile-toggle", "set-profile-panel");
  bindPanelToggle("set-theme-toggle", "set-theme-panel");
  bindPanelToggle("set-text-toggle", "set-text-panel");
  bindPanelToggle("set-notif-toggle", "set-notif-panel");
  bindPanelToggle("set-cal-toggle", "set-cal-panel");
  bindPanelToggle("set-status-toggle", "set-status-panel");
  bindPanelToggle("set-passkeys-toggle", "settings-passkeys");
  bindPanelToggle("set-delete-toggle", "set-delete-panel");

  document.getElementById("set-profile-summary")?.addEventListener("click", (event) => {
    if (event.target.closest("label, input, button#set-avatar-remove, #set-profile-toggle")) return;
    document.getElementById("set-profile-toggle")?.click();
  });

  function defaultAvatar() {
    return (
      (window.SITE_CONFIG && window.SITE_CONFIG.defaultAvatarUrl) ||
      "assets/profilepicture.jpg?v=20261006-blue"
    );
  }

  function friendlyMessage(err, fallback) {
    if (typeof window.StudioAuth?.friendlyNetworkMessage === "function") {
      return window.StudioAuth.friendlyNetworkMessage(err, fallback);
    }
    return String(err?.message || err || fallback || "Something went wrong.");
  }

  function setError(msg) {
    if (ok) ok.hidden = true;
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    if (!msg) {
      window.StudioToast?.clear?.();
      return;
    }
    window.StudioToast?.error?.(msg);
  }

  function setOk(msg) {
    setError("");
    if (!ok) return;
    ok.hidden = !msg;
    ok.textContent = msg || "Saved.";
  }

  function initialsFrom(name) {
    const parts = String(name || "")
      .trim()
      .replace(/^@/, "")
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function refreshPreview() {
    const handle = document.getElementById("set-handle")?.value || "";
    const display = document.getElementById("set-display")?.value || "";
    const label = display || handle || "?";
    const hasCustom = !!String(avatarUrl || "").trim();
    const displayUrl = hasCustom ? avatarUrl : defaultAvatar();

    if (initialsEl) {
      initialsEl.textContent = initialsFrom(label);
      initialsEl.hidden = true;
    }
    if (removeBtn) removeBtn.hidden = !hasCustom;
    if (!imgEl) return;

    imgEl.hidden = false;
    imgEl.alt = label + " profile picture";
    imgEl.decoding = "async";
    imgEl.setAttribute("fetchpriority", "high");

    const clearBusy = () => {
      if (!wrapEl) return;
      window.clearTimeout(wrapEl._msRevealTimer);
      wrapEl.classList.remove("is-busy");
      wrapEl.classList.add("is-avatar-ready");
      wrapEl._msRevealTimer = window.setTimeout(() => {
        wrapEl.classList.remove("is-avatar-ready");
      }, 700);
    };

    if (imgEl.getAttribute("src") === displayUrl && imgEl.complete && imgEl.naturalWidth > 0) {
      clearBusy();
      return;
    }

    if (wrapEl) wrapEl.classList.add("is-busy");

    const onLoad = async () => {
      imgEl.removeEventListener("load", onLoad);
      imgEl.removeEventListener("error", onError);
      try {
        await imgEl.decode?.();
      } catch (_) {
        /* load event is sufficient if decode() is unavailable */
      }
      clearBusy();
    };
    const onError = () => {
      imgEl.removeEventListener("load", onLoad);
      imgEl.removeEventListener("error", onError);
      clearBusy();
      if (displayUrl !== defaultAvatar() && imgEl.getAttribute("src") !== defaultAvatar()) {
        imgEl.src = defaultAvatar();
        return;
      }
      imgEl.hidden = true;
      if (initialsEl) initialsEl.hidden = false;
    };

    imgEl.addEventListener("load", onLoad);
    imgEl.addEventListener("error", onError);
    imgEl.src = displayUrl;
    if (imgEl.complete && imgEl.naturalWidth > 0) void onLoad();
  }

  function notifyShell(handle, url) {
    const clean = String(handle || "").replace(/^@/, "").trim();
    const displayName = String(document.getElementById("set-display")?.value || "").trim();
    const label = displayName || clean;
    const nameEl = document.getElementById("ms-user-name");
    if (nameEl && label) nameEl.textContent = label;
    document.dispatchEvent(
      new CustomEvent("ms:avatar-changed", {
        detail: { url: url || "", handle: clean, displayName: label },
      })
    );
  }

  function extForType(type) {
    if (type === "image/png") return "png";
    if (type === "image/webp") return "webp";
    if (type === "image/gif") return "gif";
    return "jpg";
  }

  function validateFile(file) {
    if (!file) return "Choose an image first.";
    if (!ALLOWED.has(file.type)) return "Use JPG, PNG, WebP, or GIF.";
    if (file.size > MAX_BYTES) return "Image must be 2 MB or smaller.";
    return "";
  }

  async function uploadAvatar(file, userId) {
    const invalid = validateFile(file);
    if (invalid) throw new Error(invalid);

    const client = window.SiteSupabase.getClient();
    const path = userId + "/avatar." + extForType(file.type);
    const { error } = await client.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    const url = String(data?.publicUrl || "").trim();
    if (!url) throw new Error("Upload succeeded but URL is missing.");
    return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
  }

  async function load() {
    const user = await window.StudioAuth.getUser();
    if (!user) {
      setError("Sign in to manage settings.");
      return;
    }

    await window.StudioAuth.ensureProfile?.(user);

    let profile = await window.StudioAuth.getProfile();
    if (!profile) {
      await window.StudioAuth.ensureProfile?.(user);
      profile = await window.StudioAuth.getProfile();
    }

    if (profile) {
      document.getElementById("set-handle").value = String(profile.handle || "")
        .replace(/^@/, "");
      document.getElementById("set-display").value = profile.display_name || "";
      avatarUrl = String(profile.avatar_url || "").trim();
      if (/(?:^|\/)doc\/pfp\.png(?:\?.*)?$/i.test(avatarUrl)) avatarUrl = "";
    } else {
      const fallback =
        user.user_metadata?.handle ||
        user.email?.split("@")[0] ||
        "moonrise";
      document.getElementById("set-handle").value = String(fallback)
        .replace(/^@/, "");
      document.getElementById("set-display").value = "";
      avatarUrl = "";
    }
    refreshPreview();
    syncProfileSummary();
    clearProfileSkeleton();
    syncThemeSwatchPreview();
    syncNotificationToggle(profile);
  }

  function setNotifError(msg) {
    if (notifError) {
      notifError.hidden = !msg;
      notifError.textContent = msg || "";
    }
    if (msg) window.StudioToast?.error?.(msg);
  }

  function setNotifHint(msg) {
    if (notifHint) notifHint.textContent = msg || "";
  }

  function syncNotificationToggle(profile) {
    const prefs = window.MoonrisePush?.readPrefs?.(profile?.notification_prefs) || {};
    const inputs = notifInputs();
    inputs.forEach((input) => {
      const key = input.getAttribute("data-notif-key") || "";
      input.checked = !!prefs[key];
    });
    if (notifSummary) {
      notifSummary.textContent = window.MoonrisePush?.summaryLabel?.(prefs) || "Off";
    }

    if (!window.MoonrisePush?.supported?.()) {
      inputs.forEach((input) => {
        input.disabled = true;
      });
      setNotifHint("Push alerts need a modern browser (and on iPhone, Add to Home Screen).");
      return;
    }

    inputs.forEach((input) => {
      input.disabled = false;
    });
    setNotifHint("Choose which alerts reach this device.");
  }

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    setError("");
    wrapEl?.classList.add("is-busy");
    try {
      const user = await window.StudioAuth.getUser();
      if (!user) throw new Error("Not signed in");
      const url = await uploadAvatar(file, user.id);
      avatarUrl = url;
      const { error } = await window.SiteSupabase.getClient()
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      refreshPreview();
      setOk("Photo updated.");
      notifyShell(document.getElementById("set-handle")?.value, url);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      wrapEl?.classList.remove("is-busy");
    }
  });

  removeBtn?.addEventListener("click", async () => {
    setError("");
    wrapEl?.classList.add("is-busy");
    try {
      const user = await window.StudioAuth.getUser();
      if (!user) throw new Error("Not signed in");
      avatarUrl = "";
      const { error } = await window.SiteSupabase.getClient()
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      refreshPreview();
      setOk("Photo removed.");
      notifyShell(document.getElementById("set-handle")?.value, "");
    } catch (e) {
      setError(e.message || "Could not remove photo");
    } finally {
      wrapEl?.classList.remove("is-busy");
    }
  });

  document.getElementById("set-handle")?.addEventListener("input", () => {
    refreshPreview();
    syncProfileSummary();
  });
  document.getElementById("set-display")?.addEventListener("input", () => {
    refreshPreview();
    syncProfileSummary();
  });
  document.addEventListener("ms:appearance-changed", syncThemeSwatchPreview);
  document.querySelectorAll(".ms-appearance-swatch, #set-theme-custom, #set-theme-hex").forEach((el) => {
    el.addEventListener("input", syncThemeSwatchPreview);
    el.addEventListener("change", syncThemeSwatchPreview);
    el.addEventListener("click", () => setTimeout(syncThemeSwatchPreview, 0));
  });

  document.getElementById("set-save")?.addEventListener("click", async () => {
    const btn = document.getElementById("set-save");
    setError("");
    if (btn) btn.disabled = true;
    try {
      const user = await window.StudioAuth.getUser();
      if (!user) throw new Error("Not signed in");
      const current = await window.StudioAuth.getProfile();
      const handle = window.StudioAuth.assertHandleAllowed(
        document.getElementById("set-handle").value,
        { existingHandle: current?.handle || "" }
      );
      const payload = {
        id: user.id,
        handle,
        display_name: document.getElementById("set-display").value.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await window.SiteSupabase.getClient()
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      document.getElementById("set-handle").value = payload.handle;
      refreshPreview();
      syncProfileSummary();
      setOk("Profile saved.");
      notifyShell(payload.handle, avatarUrl);
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  const pwErr = document.getElementById("set-pw-error");
  const pwOk = document.getElementById("set-pw-ok");

  function setPwError(msg) {
    if (pwOk) pwOk.hidden = true;
    if (pwErr) {
      pwErr.hidden = true;
      pwErr.textContent = "";
    }
    if (!msg) return;
    window.StudioToast?.error?.(msg);
  }

  function setPwOk(msg) {
    setPwError("");
    if (!pwOk) return;
    pwOk.hidden = !msg;
    pwOk.textContent = msg || "Password updated.";
  }

  document.getElementById("set-pw-save")?.addEventListener("click", async () => {
    const btn = document.getElementById("set-pw-save");
    const current = document.getElementById("set-pw-current")?.value || "";
    const next = document.getElementById("set-pw-new")?.value || "";
    const confirm = document.getElementById("set-pw-confirm")?.value || "";
    setPwError("");
    if (!current || !next || !confirm) {
      setPwError("Fill in all password fields.");
      return;
    }
    if (next !== confirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (btn) btn.disabled = true;
    try {
      await window.StudioAuth.changePassword(current, next);
      document.getElementById("set-pw-current").value = "";
      document.getElementById("set-pw-new").value = "";
      document.getElementById("set-pw-confirm").value = "";
      setPwOk("Password updated.");
    } catch (e) {
      setPwError(e.message || "Could not update password");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById("set-notif-panel")?.addEventListener("change", async (event) => {
    const input = event.target?.closest?.("[data-notif-key]");
    if (!input || notifBusy) return;
    const key = input.getAttribute("data-notif-key") || "";
    const wantOn = !!input.checked;
    notifBusy = true;
    notifInputs().forEach((el) => {
      el.disabled = true;
    });
    setNotifError("");
    try {
      if (!window.MoonrisePush?.setAlert) {
        throw new Error("Notification helper is not loaded.");
      }
      const prefs = await window.MoonrisePush.setAlert(key, wantOn);
      syncNotificationToggle({ notification_prefs: prefs });
      window.StudioToast?.success?.(wantOn ? "Notification enabled." : "Notification turned off.");
    } catch (e) {
      input.checked = !wantOn;
      setNotifError(e.message || "Could not update notifications");
    } finally {
      notifBusy = false;
      if (window.MoonrisePush?.supported?.()) {
        notifInputs().forEach((el) => {
          el.disabled = false;
        });
      }
    }
  });

  const passkeySection = document.getElementById("settings-passkeys");
  const passkeyList = document.getElementById("set-passkey-list");
  const passkeyEmpty = document.getElementById("set-passkey-empty");
  const passkeyUnavailable = document.getElementById("set-passkey-unavailable");
  const passkeyActions = document.getElementById("set-passkey-actions");
  const passkeyAdd = document.getElementById("set-passkey-add");
  const passkeyChange = document.getElementById("set-passkey-change");
  const passkeyErr = document.getElementById("set-passkey-error");
  const passkeyOk = document.getElementById("set-passkey-ok");

  function setPasskeyError(msg) {
    if (passkeyOk) passkeyOk.hidden = true;
    if (!passkeyErr) return;
    passkeyErr.hidden = !msg;
    passkeyErr.textContent = msg || "";
  }

  function setPasskeyOk(msg) {
    setPasskeyError("");
    if (!passkeyOk) return;
    passkeyOk.hidden = !msg;
    passkeyOk.textContent = msg || "Passkey saved.";
  }

  function formatPasskeyWhen(iso) {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (_) {
      return "";
    }
  }

  function setPasskeyControlsEnabled(enabled) {
    if (passkeyActions) passkeyActions.hidden = !enabled;
    if (passkeyAdd) passkeyAdd.disabled = !enabled;
    if (passkeyChange) passkeyChange.disabled = !enabled;
  }

  async function refreshPasskeys() {
    if (!passkeySection) return;
    const usable = !!window.StudioAuth?.canUsePasskeys?.();
    if (passkeyUnavailable) passkeyUnavailable.hidden = usable;
    if (!usable) {
      if (passkeyList) passkeyList.innerHTML = "";
      if (passkeyEmpty) passkeyEmpty.hidden = true;
      if (passkeyChange) passkeyChange.hidden = true;
      setPasskeyControlsEnabled(false);
      return;
    }
    setPasskeyControlsEnabled(true);
    try {
      const items = await window.StudioAuth.listPasskeys();
      if (passkeyList) passkeyList.innerHTML = "";
      const hasAny = Array.isArray(items) && items.length > 0;
      if (passkeyChange) passkeyChange.hidden = !hasAny;
      if (passkeyAdd) passkeyAdd.textContent = hasAny ? "Add another" : "Add passkey";
      if (!hasAny) {
        if (passkeyEmpty) passkeyEmpty.hidden = false;
        return;
      }
      if (passkeyEmpty) passkeyEmpty.hidden = true;
      items.forEach((pk) => {
        const li = document.createElement("li");
        li.className = "ms-passkey-item";
        const copy = document.createElement("div");
        copy.className = "ms-passkey-item-copy";
        const title = document.createElement("strong");
        title.textContent = pk.friendly_name || "Passkey";
        const meta = document.createElement("span");
        const created = formatPasskeyWhen(pk.created_at);
        const used = formatPasskeyWhen(pk.last_used_at);
        meta.textContent = used
          ? `Last used ${used}`
          : created
            ? `Added ${created}`
            : "Saved on this account";
        copy.appendChild(title);
        copy.appendChild(meta);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ms-passkey-remove";
        remove.textContent = "Remove";
        remove.addEventListener("click", async () => {
          if (!window.confirm("Remove this passkey? You can still sign in with the link we email you.")) {
            return;
          }
          remove.disabled = true;
          try {
            await window.StudioAuth.deletePasskey(pk.id);
            setPasskeyOk("Passkey removed.");
            await refreshPasskeys();
          } catch (e) {
            setPasskeyError(friendlyMessage(e, "Could not remove passkey"));
            remove.disabled = false;
          }
        });
        li.appendChild(copy);
        li.appendChild(remove);
        passkeyList?.appendChild(li);
      });
    } catch (e) {
      console.warn("passkeys", e);
      setPasskeyError(friendlyMessage(e, "Could not load passkeys"));
    }
  }

  passkeyAdd?.addEventListener("click", async () => {
    setPasskeyError("");
    passkeyAdd.disabled = true;
    if (passkeyChange) passkeyChange.disabled = true;
    try {
      await window.StudioAuth.registerPasskey();
      try {
        localStorage.removeItem("ms_passkey_offer_declined");
      } catch (_) {
        /* ignore */
      }
      setPasskeyOk("Passkey saved on this device.");
      window.StudioToast?.success?.("Passkey saved");
      await refreshPasskeys();
    } catch (e) {
      if (e?.code === "passkey_cancelled") {
        setPasskeyError("");
      } else {
        setPasskeyError(friendlyMessage(e, "Could not create passkey"));
      }
    } finally {
      passkeyAdd.disabled = false;
      if (passkeyChange) passkeyChange.disabled = false;
    }
  });

  passkeyChange?.addEventListener("click", async () => {
    setPasskeyError("");
    if (
      !window.confirm(
        "Create a new passkey on this device and remove your previous ones from this account?"
      )
    ) {
      return;
    }
    passkeyChange.disabled = true;
    if (passkeyAdd) passkeyAdd.disabled = true;
    const idle = passkeyChange.textContent;
    passkeyChange.textContent = "Waiting for passkey...";
    try {
      const run =
        window.StudioAuth.replacePasskey ||
        (async () => window.StudioAuth.registerPasskey());
      await run();
      try {
        localStorage.removeItem("ms_passkey_offer_declined");
      } catch (_) {
        /* ignore */
      }
      setPasskeyOk("Passkey updated on this device.");
      window.StudioToast?.success?.("Passkey changed");
      await refreshPasskeys();
    } catch (e) {
      if (e?.code === "passkey_cancelled") {
        setPasskeyError("");
      } else {
        setPasskeyError(friendlyMessage(e, "Could not change passkey"));
      }
    } finally {
      passkeyChange.disabled = false;
      passkeyChange.textContent = idle || "Change passkey";
      if (passkeyAdd) passkeyAdd.disabled = false;
    }
  });

  document.getElementById("set-sign-out")?.addEventListener("click", async () => {
    try {
      await window.StudioAuth.signOut();
    } catch (_) {
      /* ignore */
    }
    location.href = "/";
  });

  document.getElementById("set-delete-account")?.addEventListener("click", async () => {
    const btn = document.getElementById("set-delete-account");
    const input = document.getElementById("set-delete-confirm");
    const errEl = document.getElementById("set-delete-error");
    const confirm = String(input?.value || "").trim();
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = "";
    }
    if (confirm.toLowerCase() !== "delete") {
      const msg = 'Type "delete" to confirm account deletion.';
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = msg;
      }
      window.StudioToast?.error?.(msg);
      input?.focus();
      return;
    }
    const sure = window.confirm(
      "Delete your Moonrise account permanently? Sites, leads, and payout records tied to this account will be removed. This cannot be undone."
    );
    if (!sure) return;
    if (btn) btn.disabled = true;
    const idle = btn?.textContent || "Delete my account";
    if (btn) btn.textContent = "Deleting...";
    try {
      await window.StudioAuth.deleteAccount(confirm);
      window.StudioToast?.info?.("Your account was deleted.");
      location.href = "/";
    } catch (e) {
      const msg = friendlyMessage(e, "Could not delete account");
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = msg;
      }
      window.StudioToast?.error?.(msg);
      if (btn) {
        btn.disabled = false;
        btn.textContent = idle;
      }
    }
  });

  document.getElementById("set-replay-onboarding")?.addEventListener("click", async () => {
    const btn = document.getElementById("set-replay-onboarding");
    const errEl = document.getElementById("set-onboard-error");
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = "";
    }
    if (btn) btn.disabled = true;
    const target =
      "onboarding?replay=1&next=" + encodeURIComponent("settings");
    try {
      window.StudioAuth.setForceOnboardingReplay?.(true);
      try {
        localStorage.removeItem("ms_studio_onboarding_draft_v1");
      } catch (_) {
        /* ignore */
      }
      // Clear DB flag when possible, but always navigate into the wizard.
      try {
        await window.StudioAuth.clearStudioOnboardingFlag?.();
      } catch (clearErr) {
        console.warn("clearStudioOnboardingFlag", clearErr);
      }
      location.assign(target);
    } catch (e) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = e.message || "Could not start onboarding replay.";
      }
      window.StudioToast?.error?.(e.message || "Could not start onboarding replay.");
      if (btn) btn.disabled = false;
    }
  });

  const CAL_NOTES = {
    connected: "Cal.com connected.",
    cancelled: "Cal.com connection was cancelled.",
    not_approved: "Cal.com has not approved this connection yet.",
    not_configured: "Cal.com is not set up yet.",
    failed: "Cal.com could not connect. Try again.",
  };

  function workerBase() {
    if (typeof window.resolveWorkerUrl === "function") {
      const resolved = String(window.resolveWorkerUrl() || "").replace(/\/$/, "");
      if (resolved) return resolved;
    }
    return String(window.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function setCalError(msg) {
    const el = document.getElementById("set-cal-error");
    const okEl = document.getElementById("set-cal-ok");
    if (okEl) okEl.hidden = true;
    if (el) {
      el.hidden = !msg;
      el.textContent = msg || "";
    }
  }

  function setCalOk(msg) {
    setCalError("");
    const el = document.getElementById("set-cal-ok");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  function paintCalendar(conn) {
    const summary = document.getElementById("set-cal-summary");
    const hint = document.getElementById("set-cal-hint");
    const connect = document.getElementById("set-cal-connect");
    const disconnect = document.getElementById("set-cal-disconnect");
    const field = document.getElementById("set-cal-event-field");
    const select = document.getElementById("set-cal-event");
    const connected = !!conn?.connected;
    const username = String(conn?.username || "").trim();
    const types = Array.isArray(conn?.eventTypes) ? conn.eventTypes : [];
    if (summary) {
      summary.textContent = connected ? (username ? "@" + username : "Connected") : "Not connected";
    }
    if (connect) connect.hidden = connected;
    if (disconnect) disconnect.hidden = !connected;
    if (field) field.hidden = !(connected && types.length > 1);
    if (select) {
      select.innerHTML = "";
      types.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item.slug;
        const mins = Number(item.length);
        opt.textContent = mins ? item.title + " · " + mins + " min" : item.title || item.slug;
        if (item.slug === conn?.eventSlug) opt.selected = true;
        select.appendChild(opt);
      });
    }
    if (!hint) return;
    if (!connected) {
      hint.textContent = conn?.configured === false
        ? "Cal.com is not set up yet."
        : "Connect Cal.com so a customer can book you from the watermark.";
      return;
    }
    if (!types.length) {
      hint.textContent = "Cal.com is connected, but this account has no public booking page yet.";
      return;
    }
    const current = types.find((item) => item.slug === conn.eventSlug) || types[0];
    hint.textContent = types.length > 1
      ? "Customers book the page you pick here."
      : "Customers book your " + (current?.title || "Cal.com") + " page from the watermark.";
  }

  async function calendarRequest(path, options) {
    const base = workerBase();
    if (!base) throw new Error("Worker URL is not configured");
    const session = await window.StudioAuth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not signed in");
    const res = await fetch(base + path, {
      method: options?.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options?.body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Calendar request failed");
    return data;
  }

  async function loadCalendar() {
    const data = await calendarRequest("/calendar/connection");
    paintCalendar(data);
    return data;
  }

  function consumeCalendarFlag() {
    const params = new URLSearchParams(location.search);
    const flag = params.get("calendar") || "";
    if (!flag) return "";
    params.delete("calendar");
    const next = params.toString();
    history.replaceState({}, "", location.pathname + (next ? "?" + next : "") + location.hash);
    return flag;
  }

  document.getElementById("set-cal-connect")?.addEventListener("click", async () => {
    const btn = document.getElementById("set-cal-connect");
    setCalError("");
    if (btn) btn.disabled = true;
    try {
      const data = await calendarRequest("/calendar/connect");
      const dest = new URL(String(data.url || ""));
      if (dest.protocol !== "https:" || dest.hostname !== "app.cal.com") {
        throw new Error("Cal.com could not connect. Try again.");
      }
      location.href = dest.toString();
    } catch (e) {
      setCalError(e.message || "Cal.com could not connect. Try again.");
      window.StudioToast?.error?.(e.message || "Cal.com could not connect. Try again.");
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById("set-cal-disconnect")?.addEventListener("click", async () => {
    if (!window.confirm("Disconnect Cal.com? Customers will no longer book you from the watermark.")) return;
    const btn = document.getElementById("set-cal-disconnect");
    setCalError("");
    if (btn) btn.disabled = true;
    try {
      const data = await calendarRequest("/calendar/connection", { method: "DELETE" });
      paintCalendar(data);
      setCalOk("Cal.com disconnected.");
    } catch (e) {
      setCalError(e.message || "Could not disconnect Cal.com");
      window.StudioToast?.error?.(e.message || "Could not disconnect Cal.com");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById("set-cal-event")?.addEventListener("change", async (event) => {
    const slug = String(event.target?.value || "");
    if (!slug) return;
    setCalError("");
    try {
      const data = await calendarRequest("/calendar/event", {
        method: "POST",
        body: JSON.stringify({ slug }),
      });
      paintCalendar(data);
      setCalOk("Booking page saved.");
    } catch (e) {
      setCalError(e.message || "Could not save the booking page");
      window.StudioToast?.error?.(e.message || "Could not save the booking page");
    }
  });

  async function start() {
    if (started) return;
    started = true;
    try {
      await load();
      await refreshPasskeys();
      const flag = consumeCalendarFlag();
      try {
        await loadCalendar();
      } catch (calErr) {
        setCalError(calErr.message || "Could not load Calendar");
      }
      if (flag) {
        const toggle = document.getElementById("set-cal-toggle");
        const panel = document.getElementById("set-cal-panel");
        setPanelOpen(toggle, panel, true);
        const note = CAL_NOTES[flag] || CAL_NOTES.failed;
        if (flag === "connected") {
          setCalOk(note);
          window.StudioToast?.success?.(note);
        } else {
          setCalError(note);
          window.StudioToast?.error?.(note);
        }
      }
    } catch (e) {
      console.warn(e);
      clearProfileSkeleton();
      setError(friendlyMessage(e, "Could not load settings"));
    }
  }

  window.StudioBoot?.whenAuthReady?.(start) ?? start();
})();
