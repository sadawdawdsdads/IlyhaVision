(() => {
  function submitWayforpayForm(action, data) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    form.acceptCharset = "UTF-8";
    form.target = "_self";
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => {
          const inp = document.createElement("input");
          inp.type = "hidden";
          inp.name = k + "[]";
          inp.value = item;
          form.appendChild(inp);
        });
      } else if (v !== null && v !== undefined) {
        const inp = document.createElement("input");
        inp.type = "hidden";
        inp.name = k;
        inp.value = v;
        form.appendChild(inp);
      }
    });
    document.body.appendChild(form);
    form.submit();
  }

  document.querySelectorAll("[data-checkout]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!window.tvSite.getToken()) {
        location.href = "auth.html?mode=register&next=pricing";
        return;
      }
      const period = btn.dataset.checkout;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Готовим оплату...";
      try {
        const data = await window.tvSite.api("/wayforpay/checkout", { period });
        if (data.formAction && data.data) {
          submitWayforpayForm(data.formAction, data.data);
        } else if (data.url) {
          location.href = data.url;
        } else {
          throw new Error("Неверный ответ сервера");
        }
      } catch (e) {
        alert(e.message || "Ошибка биллинга");
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });
})();
