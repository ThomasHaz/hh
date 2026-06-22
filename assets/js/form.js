/*
 * formhandler client — drop-in progressive enhancement.
 *
 * Mark up your form with the two URLs from the admin "Embed snippets" panel:
 *   <form data-endpoint="https://forms.example.com/f/<id>"
 *         data-token="https://forms.example.com/api/f/<id>/token"> ... </form>
 *   <script src="/form.js" defer></script>
 *
 * Any input/textarea with a name is sent. A token is fetched on first
 * interaction and included on submit. No dependencies.
 */
(function () {
  "use strict";

  function init(form) {
    var endpoint = form.getAttribute("data-endpoint");
    var tokenUrl = form.getAttribute("data-token");
    if (!endpoint) return;

    var statusEl = form.querySelector("[data-formhandler-status]");
    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    var token = null, fetching = null;

    function setStatus(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.dataset.kind = kind || "";
    }

    function ensureToken() {
      if (!tokenUrl) return Promise.resolve(null);
      if (token) return Promise.resolve(token);
      if (fetching) return fetching;
      fetching = fetch(tokenUrl, { method: "GET", mode: "cors" })
        .then(function (r) { return r.json(); })
        .then(function (d) { token = d.token; fetching = null; return token; })
        .catch(function () { fetching = null; return null; });
      return fetching;
    }

    form.addEventListener("focusin", ensureToken, { once: true });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("Sending…", "pending");
      if (submitBtn) submitBtn.disabled = true;

      ensureToken().then(function (tok) {
        var payload = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (el.name && el.type !== "submit") payload[el.name] = el.value;
        });
        if (tok) payload.token = tok;

        return fetch(endpoint, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) {
          return r.json().then(function (d) { return { ok: r.ok, body: d }; });
        });
      }).then(function (res) {
        if (res && res.ok && res.body && res.body.ok) {
          form.reset();
          setStatus("Thanks — your message has been sent.", "success");
        } else {
          setStatus((res && res.body && res.body.error) || "Something went wrong. Please try again.", "error");
        }
      }).catch(function () {
        setStatus("Network error. Please try again.", "error");
      }).then(function () {
        token = null; // single-use; fetch a fresh one next time
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  function boot() {
    document.querySelectorAll("form[data-endpoint]").forEach(init);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
