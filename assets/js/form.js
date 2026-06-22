/*
 * formhandler client — drop-in progressive enhancement, with a mailto fallback.
 *
 *   <form data-endpoint="https://forms.example.com/f/<id>"
 *         data-fallback-email="you@example.com"> ... </form>
 *   <script src="/form.js" defer></script>
 *
 * Behaviour:
 *  - Any input/textarea with a name is sent as JSON; a single-use token is
 *    fetched on first interaction and included automatically.
 *  - If the handler responds (success, or a validation/rate-limit/origin error),
 *    that result is shown.
 *  - If the handler is UNREACHABLE (network error, timeout, 5xx, or 404) and
 *    data-fallback-email is set, the visitor's email client is opened with the
 *    message pre-filled, so a submission is never silently lost.
 *
 * Note: data-fallback-email is visible in your page source, so it can be
 * harvested by spam crawlers — the same trade-off as any mailto: link.
 */
(function () {
  "use strict";

  var TIMEOUT_MS = 8000;
  var SHOW_ERROR = [400, 403, 409, 422, 429]; // server responded meaningfully -> show it, don't fall back

  function fetchT(url, opts, ms) {
    opts = opts || {};
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    if (ctrl) opts.signal = ctrl.signal;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(url, opts).then(
      function (r) { if (timer) clearTimeout(timer); return r; },
      function (e) { if (timer) clearTimeout(timer); throw e; }
    );
  }

  function init(form) {
    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) return;
    endpoint = endpoint.replace(/\/$/, "");
    var tokenUrl = form.getAttribute("data-token") || (endpoint + "/token");
    var fallbackEmail = form.getAttribute("data-fallback-email") || "";

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
      fetching = fetchT(tokenUrl, { method: "GET", mode: "cors" }, TIMEOUT_MS)
        .then(function (r) { return r.json(); })
        .then(function (d) { token = d.token; fetching = null; return token; })
        .catch(function () { fetching = null; return null; });
      return fetching;
    }

    form.addEventListener("focusin", ensureToken, { once: true });

    // Build a mailto: from the submitted fields. Returns null if there's no
    // fallback address configured or nothing worth sending.
    function buildMailto(payload) {
      if (!fallbackEmail) return null;
      var lines = [];
      Object.keys(payload).forEach(function (k) {
        if (k === "token") return;
        var v = (payload[k] == null ? "" : String(payload[k])).trim();
        if (v) lines.push(k + ": " + v);
      });
      if (!lines.length) return null;
      var subject = ((payload.subject || "") + "").trim() || "Website enquiry";
      return "mailto:" + fallbackEmail +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\r\n"));
    }

    function fallback(payload) {
      if (!fallbackEmail) {
        setStatus("Couldn’t reach the server. Please try again later.", "error");
        return;
      }
      var url = buildMailto(payload);
      if (!url) { setStatus("Please fill in the form.", "error"); return; }
      setStatus("Couldn’t reach the server — opening your email app instead…", "pending");
      window.location.href = url;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("Sending…", "pending");
      if (submitBtn) submitBtn.disabled = true;

      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.type !== "submit") payload[el.name] = el.value;
      });

      ensureToken().then(function (tok) {
        if (tok) payload.token = tok;
        return fetchT(endpoint, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        }, TIMEOUT_MS).then(function (r) {
          return r.json().then(
            function (d) { return { status: r.status, ok: r.ok, body: d }; },
            function () { return { status: r.status, ok: r.ok, body: null }; }
          );
        });
      }).then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          form.reset();
          setStatus("Thanks — your message has been sent.", "success");
          return;
        }
        // Server responded with a reason the visitor can act on — show it.
        if (res.body && res.body.error && SHOW_ERROR.indexOf(res.status) !== -1) {
          setStatus(res.body.error, "error");
          return;
        }
        // 5xx / 404 / unparseable — treat as unreachable.
        fallback(payload);
      }).catch(function () {
        // Network error, timeout, or aborted request — unreachable.
        fallback(payload);
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
