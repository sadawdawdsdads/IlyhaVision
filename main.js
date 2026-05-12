window.TV_API = "https://api.testvision.app";

window.tvSite = (() => {
  function getToken() {
    return localStorage.getItem("tv_token");
  }

  function setSession(token, user) {
    localStorage.setItem("tv_token", token);
    localStorage.setItem("tv_user", JSON.stringify(user));
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem("tv_user") || "null"); }
    catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem("tv_token");
    localStorage.removeItem("tv_user");
  }

  async function api(path, body, method) {
    const token = getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(window.TV_API + path, {
      method: method || (body ? "POST" : "GET"),
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error((data && data.error) || "HTTP " + res.status);
    return data;
  }

  function requireAuth() {
    if (!getToken()) {
      window.location.href = "auth.html";
      return false;
    }
    return true;
  }

  return { api, getToken, setSession, getUser, clearSession, requireAuth };
})();

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = !!window.tvSite.getToken();
  document.querySelectorAll(".nav-actions").forEach((nav) => {
    if (isLoggedIn) {
      nav.innerHTML = '<a href="dashboard.html" class="btn btn-ghost">Кабинет</a>';
    }
  });
});
