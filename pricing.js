(() => {
  document.querySelectorAll("[data-checkout]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!window.tvSite.getToken()) {
        location.href = "auth.html?mode=register&next=pricing";
        return;
      }
      const period = btn.dataset.checkout;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Создаём сессию...";
      try {
        const data = await window.tvSite.api("/billing/checkout", { period });
        location.href = data.url;
      } catch (e) {
        alert(e.message || "Ошибка биллинга");
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });
})();
