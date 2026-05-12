(() => {
  if (!window.tvSite.requireAuth()) return;

  const $ = (id) => document.getElementById(id);

  function paintUser(user) {
    $("hello").textContent = "Привет, " + (user.name || user.email);
    $("dash-email").textContent = user.email;
    $("dash-name").textContent = user.name || "—";
    if (user.created_at) {
      $("dash-created").textContent = new Date(user.created_at).toLocaleDateString();
    }
    const isPremium = user.plan === "premium";
    $("dash-plan").textContent = isPremium ? "PREMIUM" : "FREE";
    $("dash-plan-sub").textContent = isPremium ? "Активная подписка" : "Бесплатный план";
    $("btn-upgrade").style.display = isPremium ? "none" : "";
    $("btn-portal").style.display = isPremium ? "" : "none";
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

  const cached = window.tvSite.getUser();
  if (cached) paintUser(cached);
  refresh();
})();
