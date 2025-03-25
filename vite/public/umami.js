// Source: https://umami.iamevan.dev/script.js
!(function () {
  "use strict";
  ((t) => {
    const {
        screen: { width: e, height: a },
        navigator: { language: r, doNotTrack: n, msDoNotTrack: i },
        location: o,
        document: c,
        history: s,
        top: u,
        doNotTrack: l
      } = t,
      { hostname: d, href: h, origin: m } = o,
      { currentScript: f, referrer: p } = c,
      g = h.startsWith("data:") ? void 0 : t.localStorage;
    if (!f) return;
    const y = "data-",
      b = "true",
      v = f.getAttribute.bind(f),
      N = v(y + "website-id"),
      S = v(y + "host-url"),
      w = v(y + "tag"),
      T = "false" !== v(y + "auto-track"),
      k = v(y + "do-not-track") === b,
      A = v(y + "exclude-search") === b,
      j = v(y + "exclude-hash") === b,
      x = v(y + "domains") || "",
      O = x.split(",").map((t) => t.trim()),
      E = `${(S || "" || f.src.split("/").slice(0, -1).join("/")).replace(/\/$/, "")}/api/send`,
      L = `${e}x${a}`,
      $ = /data-umami-event-([\w-_]+)/,
      D = y + "umami-event",
      K = 300,
      U = () => ({ website: N, screen: L, language: r, title: z, hostname: d, url: P, referrer: R, tag: w || void 0 }),
      _ = (t, e, a) => {
        a &&
          ((R = P),
          (P = new URL(a, o.href)),
          A && (P.search = ""),
          j && (P.hash = ""),
          (P = P.toString()),
          P !== R && setTimeout(C, K));
      },
      B = () =>
        F ||
        !N ||
        (g && g.getItem("umami.disabled")) ||
        (x && !O.includes(d)) ||
        (k &&
          (() => {
            const t = l || n || i;
            return 1 === t || "1" === t || "yes" === t;
          })()),
      W = async (t, e = "event") => {
        if (B()) return;
        const a = { "Content-Type": "application/json" };
        void 0 !== J && (a["x-umami-cache"] = J);
        try {
          const r = await fetch(E, {
              method: "POST",
              body: JSON.stringify({ type: e, payload: t }),
              headers: a,
              credentials: "omit"
            }),
            n = await r.json();
          n && ((F = !!n.disabled), (J = n.cache));
        } catch (t) {}
      },
      q = () => {
        M ||
          (C(),
          (() => {
            const t = (t, e, a) => {
              const r = t[e];
              return (...e) => (a.apply(null, e), r.apply(t, e));
            };
            (s.pushState = t(s, "pushState", _)), (s.replaceState = t(s, "replaceState", _));
          })(),
          (() => {
            const t = new MutationObserver(([t]) => {
                z = t && t.target ? t.target.text : void 0;
              }),
              e = c.querySelector("head > title");
            e && t.observe(e, { subtree: !0, characterData: !0, childList: !0 });
          })(),
          c.addEventListener(
            "click",
            async (t) => {
              const e = (t) => ["BUTTON", "A"].includes(t),
                a = async (t) => {
                  const e = t.getAttribute.bind(t),
                    a = e(D);
                  if (a) {
                    const r = {};
                    return (
                      t.getAttributeNames().forEach((t) => {
                        const a = t.match($);
                        a && (r[a[1]] = e(t));
                      }),
                      C(a, r)
                    );
                  }
                },
                r = t.target,
                n = e(r.tagName)
                  ? r
                  : ((t, a) => {
                      let r = t;
                      for (let t = 0; t < a; t++) {
                        if (e(r.tagName)) return r;
                        if (((r = r.parentElement), !r)) return null;
                      }
                    })(r, 10);
              if (!n) return a(r);
              {
                const { href: e, target: r } = n,
                  i = n.getAttribute(D);
                if (i)
                  if ("A" === n.tagName) {
                    const c = "_blank" === r || t.ctrlKey || t.shiftKey || t.metaKey || (t.button && 1 === t.button);
                    if (i && e)
                      return (
                        c || t.preventDefault(),
                        a(n).then(() => {
                          c || (("_top" === r ? u.location : o).href = e);
                        })
                      );
                  } else if ("BUTTON" === n.tagName) return a(n);
              }
            },
            !0
          ),
          (M = !0));
      },
      C = (t, e) =>
        W(
          "string" == typeof t
            ? { ...U(), name: t, data: "object" == typeof e ? e : void 0 }
            : "object" == typeof t
              ? t
              : "function" == typeof t
                ? t(U())
                : U()
        ),
      I = (t) => W({ ...U(), data: t }, "identify");
    t.umami || (t.umami = { track: C, identify: I });
    let J,
      M,
      P = h,
      R = p.startsWith(m) ? "" : p,
      z = c.title,
      F = !1;
    T && !B() && ("complete" === c.readyState ? q() : c.addEventListener("readystatechange", q, !0));
  })(window);
})();
