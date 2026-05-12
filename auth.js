(() => {
  const tabs = document.querySelectorAll(".form-tabs button");
  const formLogin = document.getElementById("form-login");
  const formReg = document.getElementById("form-register");

  function switchTab(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    formLogin.style.display = name === "login" ? "" : "none";
    formReg.style.display = name === "register" ? "" : "none";
  }

  tabs.forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

  const params = new URLSearchParams(location.search);
  if (params.get("mode") === "register") switchTab("register");

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("li-err");
    err.textContent = "";
    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-pass").value;
    try {
      const data = await window.tvSite.api("/auth/login", { email, password });
      window.tvSite.setSession(data.token, data.user);
      location.href = "dashboard.html";
    } catch (e) {
      err.textContent = e.message || "Ошибка входа";
    }
  });

  formReg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("rg-err");
    err.textContent = "";
    const email = document.getElementById("rg-email").value.trim();
    const name = document.getElementById("rg-name").value.trim();
    const password = document.getElementById("rg-pass").value;
    if (password.length < 6) {
      err.textContent = "Пароль минимум 6 символов";
      return;
    }
    try {
      const data = await window.tvSite.api("/auth/register", { email, name, password });
      window.tvSite.setSession(data.token, data.user);
      location.href = "dashboard.html";
    } catch (e) {
      err.textContent = e.message || "Ошибка регистрации";
    }
  });
})();
