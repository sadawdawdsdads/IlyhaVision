(() => {
  if (!window.tvSite.requireAuth()) return;

  const $ = (id) => document.getElementById(id);

  function planLabel(plan) {
    if (plan === "ultimate") return "ULTIMATE";
    if (plan === "premium") return "PREMIUM";
    return "FREE";
  }

  function planSub(plan) {
    if (plan === "ultimate") return "Топовая подписка · все фичи";
    if (plan === "premium") return "Активная подписка";
    return "Бесплатный план";
  }

  function paintUser(user) {
    $("hello").textContent = "Привет, " + (user.name || user.email);
    $("dash-email").textContent = user.email;
    $("dash-name").textContent = user.name || "—";
    const isPaid = user.plan === "premium" || user.plan === "ultimate";
    $("dash-plan").textContent = planLabel(user.plan);
    $("dash-plan-sub").textContent = planSub(user.plan);
    $("btn-upgrade").style.display = isPaid ? "none" : "";
    $("btn-portal").style.display = isPaid && user.stripe_subscription_id ? "" : "none";
    if (user.subscriptionEndsAt) {
      $("dash-ends").textContent = new Date(user.subscriptionEndsAt).toLocaleDateString();
    } else {
      $("dash-ends").textContent = "—";
    }
    if (user.isAdmin) {
      $("admin-card").style.display = "";
      loadKeys();
    }
  }

  function paintUsage(usage) {
    $("dash-used").textContent = usage.used;
    $("dash-limit").textContent = usage.limit;
    const pct = Math.min(100, (usage.used / usage.limit) * 100);
    $("dash-bar").style.width = pct + "%";
  }

  async function refresh() {
    try {
      const me = await window.tvSite.api("/auth/me");
      paintUser(me.user);
      window.tvSite.setSession(window.tvSite.getToken(), me.user);
      const usage = await window.tvSite.api("/usage");
      paintUsage(usage);
    } catch (e) {
      if ((e.message || "").includes("401")) {
        window.tvSite.clearSession();
        location.href = "auth.html";
      }
    }
  }

  $("btn-logout").addEventListener("click", () => {
    window.tvSite.clearSession();
    location.href = "index.html";
  });

  $("btn-portal").addEventListener("click", async () => {
    try {
      const data = await window.tvSite.api("/billing/portal", {});
      location.href = data.url;
    } catch (e) {
      alert(e.message);
    }
  });

  $("btn-redeem").addEventListener("click", async () => {
    const code = $("redeem-code").value.trim().toUpperCase();
    const err = $("redeem-err");
    const ok = $("redeem-ok");
    err.textContent = "";
    ok.style.display = "none";
    if (!code) {
      err.textContent = "Введи код";
      return;
    }
    try {
      const data = await window.tvSite.api("/keys/activate", { code });
      paintUser(data.user);
      window.tvSite.setSession(window.tvSite.getToken(), data.user);
      $("redeem-code").value = "";
      ok.textContent = "Активирован! Подписка " + (data.plan === "ultimate" ? "Ultimate" : "Premium") + " до " + new Date(data.endsAt).toLocaleDateString();
      ok.style.display = "";
    } catch (e) {
      err.textContent = e.message;
    }
  });

  async function loadKeys() {
    try {
      const data = await window.tvSite.api("/admin/keys");
      renderKeys(data.keys);
    } catch (e) {
      console.warn("keys load failed", e.message);
    }
  }

  function renderKeys(keys) {
    const wrap = $("keys-list");
    if (!keys.length) {
      wrap.innerHTML = '<p style="color:var(--text-2);font-size:13px">Ключей пока нет</p>';
      return;
    }
    wrap.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' +
      keys.map((k) => {
        const used = k.used_by ? `использован (${k.used_by_email || k.used_by})` : "свободен";
        const usedColor = k.used_by ? "var(--text-2)" : "var(--success)";
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;font-size:13px">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
            <code style="font-family:monospace;font-weight:600;color:var(--text-0)" data-copy="${k.code}" class="copy-key">${k.code}</code>
            <span class="plan-pill ${k.plan}">${k.plan.toUpperCase()}</span>
            <span style="color:var(--text-2);font-size:11px">${k.duration_days}д</span>
            <span style="color:${usedColor};font-size:11px">${used}</span>
            ${k.note ? `<span style="color:var(--text-2);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${k.note}</span>` : ""}
          </div>
          ${!k.used_by ? `<button class="btn btn-ghost" data-delete="${k.code}" style="padding:4px 10px;font-size:11px">×</button>` : ""}
        </div>`;
      }).join("") + "</div>";
    wrap.querySelectorAll(".copy-key").forEach((el) => {
      el.style.cursor = "pointer";
      el.title = "Кликни чтобы скопировать";
      el.addEventListener("click", () => {
        navigator.clipboard.writeText(el.dataset.copy);
        const orig = el.textContent;
        el.textContent = "скопировано!";
        setTimeout(() => { el.textContent = orig; }, 1000);
      });
    });
    wrap.querySelectorAll("[data-delete]").forEach((b) => {
      b.addEventListener("click", async () => {
        if (!confirm("Удалить ключ?")) return;
        try {
          await window.tvSite.api("/admin/keys/" + b.dataset.delete, undefined, "DELETE");
          loadKeys();
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  $("btn-create-keys").addEventListener("click", async () => {
    const plan = $("key-plan").value;
    const durationDays = parseInt($("key-days").value, 10) || 30;
    const count = parseInt($("key-count").value, 10) || 1;
    const note = $("key-note").value.trim();
    const err = $("admin-err");
    err.textContent = "";
    try {
      await window.tvSite.api("/admin/keys", { plan, durationDays, count, note });
      $("key-note").value = "";
      loadKeys();
    } catch (e) {
      err.textContent = e.message;
    }
  });

  const cached = window.tvSite.getUser();
  if (cached) paintUser(cached);
  refresh();
})();
