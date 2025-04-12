(() => {
  "use strict";
  function A(s) {
    var n = e[s];
    if (void 0 !== n) return n.exports;
    var i = (e[s] = { id: s, exports: {} });
    return t[s](i, i.exports, A), i.exports;
  }
  var t = {
      402: (A, t, e) => {
        e.d(t, { Z: () => a });
        var s = e(537),
          n = e.n(s),
          i = e(645),
          r = e.n(i)()(n());
        r.push([
          A.id,
          '/** Copyright (C) Microsoft Corporation. All rights reserved.\r\n * Use of this source code is governed by a BSD-style license that can be\r\n * found in the LICENSE file.\r\n */\r\n\r\n:root {\r\n\t--shadowSml: 0px 1px 0px;\r\n\t--shadowMed: 0px 3px 0px;\r\n\t--shadowLrg: 0px 5px 0px;\r\n\t--regular: 400;\r\n\t--semibold: 600;\r\n\t--bold: 700;\r\n\t--black: 900;\r\n\t--outline: 2px solid var(--modalText);\r\n\t--modalText: #000000;\r\n\t--modalTextAccent: #FFFFFF;\r\n\t--modalButton: #D6D6D6;\r\n\t--modalButtonHover: #C2C2C2;\r\n\t--modalButtonAccent: #666666;\r\n\t--modalBackplate: #FFFFFF;\r\n\t/* colors imported from theme.js */\r\n\t--meter: linear-gradient(180deg, #FFFFFF 0%, #16F5CE 25%, #4AFD76 75%, #3FCB57 100%);\r\n\t--meterBest: linear-gradient(180deg, #FFFFFF 0%, #F6E016 25%, #FDCA46 75%, #CA9A3E 100%);\r\n\t--meterIcon: linear-gradient(180deg, #4A483C 40%, #9C9A86 100%);\r\n\t--meterStar: #F6E016;\r\n}\r\n\r\n/* minimal css reset */\r\nhtml, body, div, h1, h2, h3, h4, h5, h6, a, p, img, ul, li, button {\r\n\tpadding: 0; margin: 0; border: 0; outline: 0;\r\n}\r\n\r\nbody {\r\n\theight: 100vh; /* fullscreen */\r\n\twidth: 100vw; /* fullscreen */\r\n\toverflow: hidden; /* prevent scroll */\r\n\tuser-select: none; /* prevent text highlight */\r\n\ttouch-action: pinch-zoom; /* prevent navigating back with one finger */\r\n}\r\n\r\nbody, button {\r\n\tfont-family: system-ui, sans-serif;\r\n\tfont-size: 16px;\r\n\tline-height: 1; /* force match base font-size */\r\n\tfont-weight: var(--bold);\r\n\tcolor: var(--text);\r\n\ttext-shadow: var(--shadowSml) var(--bevel); /* 1px underline */\r\n}\r\n\r\n[hidden] {\r\n\tdisplay: none !important;\r\n\tvisibility: hidden !important;\r\n\topacity: 0 !important;\r\n}\r\n\r\n\r\n\r\n/* animations */\r\n\r\n#ui-overlay, #ui-notify, #game-tint {\r\n\ttransition: opacity 0.3s; /* instant visibility */\r\n}\r\n\r\n#ui-overlay.hidden, #ui-notify.hidden, #game-tint.hidden {\r\n\ttransition: opacity 0.3s, visibility 0s 0.3s; /* delay visibility */\r\n}\r\n\r\n.toggle-display::before {\r\n\ttransition: transform 0.3s;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n\t.toggle-display::before,\r\n\t#ui-overlay, #ui-notify, #game-tint,\r\n\t#ui-overlay.hidden, #ui-notify.hidden, #game-tint.hidden {\r\n\t\ttransition: none;\r\n\t}\r\n\r\n\t.clickfx::after {\r\n\t\tanimation: none;\r\n\t}\r\n}\r\n\r\n\r\n\r\n/* button styles */\r\n\r\n.btn {\r\n\tposition: relative; /* for clickfx */\r\n\tmin-height: 32px;\r\n\tmin-width: 36px;\r\n\theight: max-content;\r\n\twidth: max-content;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\tgap: 4px;\r\n\tfont-size: 16px;\r\n\ttext-transform: uppercase;\r\n\tborder-radius: 4px;\r\n\tbackground: var(--bgHalf);\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\toutline: 2px solid rgba(0,0,0,0); /* hide */\r\n\t-webkit-tap-highlight-color: rgba(0,0,0,0); /* hide tap highlight */\r\n}\r\n\r\n.btn:focus,\r\n.focused .btn {\r\n\tbackground: var(--bgFocus);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n}\r\n\r\n.btn:focus {\r\n\toutline: var(--outline); /* show */\r\n}\r\n\r\n.btn:hover,\r\n.btn[aria-expanded="true"] {\r\n\tbackground: var(--bgFull);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n\tcursor: pointer;\r\n}\r\n\r\n.icon {\r\n\tdisplay: block; /* remove svg padding */\r\n\tpointer-events: none;\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfill: var(--text);\r\n\tfilter: drop-shadow(var(--shadowSml) var(--bevel));\r\n}\r\n\r\n\r\n\r\n/* button click effect */\r\n\r\n.btn::after {\r\n\tposition: absolute;\r\n\twidth: calc(100% + 16px);\r\n\theight: calc(100% + 16px);\r\n\tborder-radius: 8px;\r\n\tcontent: \' \';\r\n\tz-index: 1;\r\n\tpointer-events: none;\r\n\tcolor: var(--text);\r\n}\r\n\r\n.clickfx::after {\r\n\tanimation: clickfx-anim 0.2s ease forwards;\r\n}\r\n\r\n@keyframes clickfx-anim {\r\n\t0% {\r\n\t\topacity: 1;\r\n\t\ttransform: scale(1);\r\n\t\tbox-shadow: inset 0 0 0 8px; }\r\n\t100% {\r\n\t\topacity: 0;\r\n\t\ttransform: scale(1.1);\r\n\t\tbox-shadow: inset 0 0 0 0px; }\r\n}\r\n\r\n\r\n\r\n/* page structure */\r\n\r\n#game-color, #game-bg, #game-tint, #game-canvas, #game-ui, #ui-overlay {\r\n\tposition: absolute;\r\n\twidth: 100vw;\r\n\theight: 100vh;\r\n\tpointer-events: none; /* clicks pass through */\r\n}\r\n\r\n#game-color {\r\n\tz-index: 1;\r\n\tbackground: var(--background);\r\n}\r\n\r\n#game-bg {\r\n\tz-index: 2;\r\n\tbackground-repeat: repeat;\r\n\timage-rendering: pixelated;\r\n}\r\n\r\n#game-tint {\r\n\tz-index: 3;\r\n\tbackground: linear-gradient(var(--tint));\r\n}\r\n\r\n#game-canvas {\r\n\tz-index: 4;\r\n\timage-rendering: pixelated;\r\n}\r\n\r\n#game-ui {\r\n\tz-index: 5;\r\n\tpointer-events: auto; /* allow clicks in ui */\r\n}\r\n\r\n#ui-overlay {\r\n\tpointer-events: auto !important; /* allow clicks */\r\n\tz-index: 1; /* inside game-ui */\r\n\tbackground: var(--overlay);\r\n}\r\n\r\n\r\n\r\n\r\n\r\n/* game ui */\r\n\r\n#ui-stats, #ui-header, #ui-main, #ui-alt, #ui-action, #ui-notify {\r\n\tposition: absolute;\r\n\twidth: calc(100vw - 24px); /* minus padding */\r\n\tleft: 50vw; /* center */\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\ttransform: translate(-50%, -50%); /* center */\r\n}\r\n\r\n.top-container {\r\n\tz-index: 2;\r\n\tposition: absolute;\r\n\ttop: 12px;\r\n\tdisplay: flex;\r\n\tgap: 8px;\r\n\talign-items: center;\r\n}\r\n\r\n#top-left {\r\n\tleft: 12px;\r\n}\r\n\r\n#top-right {\r\n\tright: 12px;\r\n}\r\n\r\n\r\n\r\n/* stats */\r\n\r\n#ui-stats {\r\n\ttop: 44px;\r\n\twidth: 160px;\r\n\tmax-width: 440px;\r\n\tfont-size: 16px;\r\n\tjustify-content: center;\r\n\tflex-wrap: wrap;\r\n\tgap: 10px;\r\n}\r\n\r\n.stats-score {\r\n\tdisplay: flex;\r\n\talign-items: center;\r\n\torder: -1;\r\n}\r\n\r\n.score-icon {\r\n\tposition: relative;\r\n\tright: -4px;\r\n\tz-index: 1;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\twidth: 32px;\r\n\theight: 32px;\r\n\tborder-radius: 50%;\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tbackground: var(--meterIcon);\r\n}\r\n\r\n.score-icon.hidden {\r\n\tdisplay: none;\r\n}\r\n\r\n.score-icon svg {\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfill: var(--meterStar);\r\n\tfilter: drop-shadow(var(--shadowMed) var(--shadowFill));\r\n}\r\n\r\n.score-meter {\r\n\tposition: relative;\r\n\toverflow: hidden;\r\n\tleft: 0;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\theight: 24px;\r\n\twidth: 100px;\r\n\tborder-radius: 12px;\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tbackground-color: var(--bgHalf);\r\n}\r\n\r\n#ui-header .stats-score {\r\n\ttransform: scale(1.2);\r\n}\r\n\r\n.highscore .score-meter {\r\n\tleft: -4px;\r\n\tborder-radius: 0 12px 12px 0;\r\n}\r\n\r\n.score-text {\r\n\tz-index: 1;\r\n\tfont-weight: var(--black);\r\n}\r\n\r\n.score-fill {\r\n\tposition: absolute;\r\n\tleft: 0;\r\n\tz-index: 0;\r\n\theight: 100%;\r\n\twidth: 0%;\r\n\tbackground: var(--meter);\r\n\tfilter: drop-shadow(2px 0px 0px var(--shadowFill));\r\n}\r\n\r\n.highscore .score-fill {\r\n\tbackground: var(--meterBest);\r\n}\r\n\r\n.stats-icons {\r\n\tdisplay: flex;\r\n\tgap: 2px;\r\n\talign-items: center;\r\n\timage-rendering: pixelated; /* important */\r\n}\r\n\r\n.stats-icons span {\r\n\theight: 22px;\r\n\twidth: 22px;\r\n\tbackground-size: 1920px 512px;\r\n}\r\n\r\n\r\n\r\n/* title */\r\n\r\n#ui-header {\r\n\ttop: calc(40vh - 88px);\r\n\tflex-direction: column;\r\n\tgap: 8px;\r\n\ttext-align: center;\r\n\ttext-transform: uppercase;\r\n}\r\n\r\n#ui-title {\r\n\tfont-size: 36px;\r\n}\r\n\r\n#ui-subtitle {\r\n\tfont-size: 20px;\r\n}\r\n\r\n\r\n\r\n/* main, alt, action */\r\n\r\n#ui-main {\r\n\ttop: 40vh;\r\n\theight: 128px;\r\n\twidth: 288px;\r\n}\r\n\r\n#ui-alt {\r\n\ttop: calc(40vh + 88px);\r\n\tgap: 16px;\r\n\twidth: max-content; /* flexbox */\r\n\tflex-direction: column;\r\n\ttext-transform: uppercase;\r\n}\r\n\r\n#alt-select {\r\n\tmin-width: 280px;\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\tgap: 32px;\r\n\tfont-size: 20px;\r\n}\r\n\r\n#alt-info {\r\n\tdisplay: flex;\r\n\talign-items: center;\r\n\tgap: 12px;\r\n}\r\n\r\n\r\n\r\n/* action */\r\n\r\n#ui-action {\r\n\ttop: calc(40vh + 160px);\r\n\tjustify-content: center;\r\n\tflex-direction: column;\r\n\tgap: 16px;\r\n}\r\n\r\n#ui-action .btn {\r\n\tpadding: 8px;\r\n}\r\n\r\n\r\n\r\n/* edit */\r\n\r\n#edit-nav {\r\n\tdisplay: flex;\r\n\tflex-direction: row;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n}\r\n\r\n.active {\r\n\tbackground: var(--bgFull);\r\n}\r\n\r\n#edit-nav .btn:not(.active, :hover, :focus) { /* hide backplates */\r\n\tbackground: none;\r\n\tbox-shadow: none;\r\n\toutline: none;\r\n}\r\n\r\n#alt-select.color-picker {\r\n\tmin-width: auto;\r\n\tborder-radius: 4px;\r\n\tbackground: var(--bgHalf);\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tpadding: 12px;\r\n\tgap: 0;\r\n}\r\n\r\n.color {\r\n\tborder-radius: 2px;\r\n\tmin-width: 28px;\r\n\tmin-height: 28px;\r\n\tborder: var(--outline);\r\n\tbox-shadow: none !important; /* override btn class */\r\n}\r\n\r\n.color:hover,\r\n.color:focus {\r\n\tbackground: inherit;\r\n\toutline: var(--outline);\r\n\tz-index: 1;\r\n}\r\n\r\n.color:focus {\r\n\toutline: var(--outline);\r\n\tmin-height: 36px;\r\n\tz-index: 2;\r\n}\r\n\r\n.check {\r\n\twidth: 16px;\r\n\theight: 16px;\r\n\tbackground-color: var(--bgFull);\r\n\toutline: var(--outline);\r\n\tborder-radius: 50%;\r\n}\r\n\r\n.checkmark {\r\n\tposition: absolute;\r\n\tfilter: none;\r\n}\r\n\r\n\r\n\r\n/* notify */\r\n\r\n#ui-notify {\r\n\ttop: calc(40vh + 208px);\r\n\tjustify-content: center;\r\n}\r\n\r\n#notify-content {\r\n\twidth: max-content;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\tgap: 4px;\r\n\tpadding: 12px 20px;\r\n\tborder-radius: 4px;\r\n\tfont-weight: var(--semibold);\r\n\tcolor: var(--notifyText);\r\n\ttext-shadow: none;\r\n\tbackground: var(--notifyFill);\r\n}\r\n\r\n#notify-content .icon {\r\n\tfill: var(--notifyText);\r\n\tfilter: none;\r\n}\r\n\r\n\r\n\r\n/* modals */\r\n\r\n.modal {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\tgap: 12px;\r\n\tpadding: 8px 0 16px 0;\r\n\tz-index: 700;\r\n\tfont-size: 16px;\r\n\tline-height: 1.25; /* force match base font-size */\r\n\tfont-weight: var(--regular);\r\n\ttext-shadow: none;\r\n\tcolor: var(--modalText);\r\n\tborder-radius: 8px;\r\n\tbackground: var(--modalBackplate);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n}\r\n\r\n.flyout {\r\n\tposition: absolute;\r\n\ttop: 52px;\r\n\twidth: 280px;\r\n}\r\n\r\n.dialog {\r\n\tposition: absolute;\r\n\ttop: 50vh;\r\n\tleft: 50vw;\r\n\ttransform: translate(-50%, -50%);\r\n\twidth: 320px;\r\n}\r\n\r\n#flyout-share {\r\n\tright: 52px;\r\n}\r\n\r\n#flyout-settings {\r\n\tright: 8px;\r\n}\r\n\r\n#share-content {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\tz-index: 700;\r\n\twidth: max-content;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n\tpadding: 12px;\r\n}\r\n\r\n.btn.btn-full {\r\n\twidth: 100%;\r\n\tpadding: 8px 0;\r\n}\r\n\r\n#ui-action .btn span {\r\n\tpadding: 0 4px;\r\n}\r\n\r\n.btn.btn-half {\r\n\twidth: 50%;\r\n\tpadding: 8px 0;\r\n\tfont-size: 16px;\r\n}\r\n\r\n.btn.btn-small {\r\n\twidth: 100%;\r\n\tpadding: 8px 0;\r\n\tmin-height: 28px;\r\n\tfont-size: 14px;\r\n}\r\n\r\n.btn.btn-share {\r\n\tpadding: 8px 12px;\r\n\tmin-height: 28px;\r\n\tfont-size: 14px;\r\n}\r\n\r\n.modal .btn .icon {\r\n\tfill: var(--modalText);\r\n}\r\n\r\n.modal .btn:focus .icon {\r\n\tfill: var(--modalTextAccent);\r\n\tfilter: none;\r\n}\r\n\r\n.modal .btn {\r\n\tbackground: var(--modalButton);\r\n\tcolor: var(--modalText);\r\n}\r\n\r\n.modal .btn:hover {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.modal .btn:focus {\r\n\tbackground: var(--modalButtonAccent);\r\n\tcolor: var(--modalTextAccent);\r\n\ttext-shadow: none;\r\n}\r\n\r\n.modal .btn.dismiss {\r\n\tmin-height: 28px;\r\n\tmin-width: 28px;\r\n\tbox-shadow: none;\r\n\toutline-offset: 2px;\r\n}\r\n\r\n.btn.dismiss {\r\n\tbackground: none;\r\n}\r\n\r\n.btn.dismiss:hover {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.btn.dismiss .icon {\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfilter: none;\r\n\tfill: var(--modalText);\r\n}\r\n\r\n\r\n\r\n/* game stats and ui */\r\n\r\n.empty { opacity: 0; }\r\n.life-full { background-position: -1px -1px; }\r\n.life-empty { background-position: -1px -25px; }\r\n.boost-full { background-position: -25px -1px; }\r\n.boost-empty { background-position: -25px -25px; }\r\n.shield { background-position: -49px -1px; }\r\n.infinite { background-position: -49px -25px; }\r\n\r\n\r\n\r\n\r\n\r\n/* flyout */\r\n\r\n.flyout-rule {\r\n\theight: 1px;\r\n\tbackground: var(--modalButton);\r\n}\r\n\r\n.flyout-title {\r\n\tfont-size: 20px;\r\n\tfont-weight: var(--bold);\r\n}\r\n\r\n.flyout-header {\r\n\tfont-weight: var(--bold);\r\n}\r\n\r\n\r\n\r\n/* input */\r\n\r\n.modal-row {\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n\tpadding: 0 12px;\r\n}\r\n\r\n.modal-col {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\talign-items: flex-start;\r\n\tgap: 0px;\r\n\tpadding: 0 12px;\r\n}\r\n\r\n.input-title {\r\n\tflex-grow: 1;\r\n\tfont-weight: var(--semibold);\r\n}\r\n\r\n.input-label {\r\n\tfont-weight: var(--semibold);\r\n}\r\n\r\n.toggle {\r\n\tcursor: pointer;\r\n\tposition: relative;\r\n\twidth: 40px;\r\n\theight: 20px;\r\n\tborder-radius: 10px;\r\n\toverflow: hidden;\r\n}\r\n\r\n.toggle-display {\r\n\tpointer-events: none;\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tbackground: var(--modalButton);\r\n}\r\n\r\n.toggle:hover .toggle-display {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.toggle-display::before {\r\n\tposition: absolute;\r\n\tborder-radius: 50%;\r\n\tcontent: "";\r\n\theight: 12px;\r\n\twidth: 12px;\r\n\ttop: 4px;\r\n\tleft: 4px;\r\n\tbackground-color: var(--modalTextAccent);\r\n\ttransform: translateX(0px);\r\n}\r\n\r\n.toggle:focus {\r\n\toutline: var(--outline);\r\n\toutline-offset: 2px;\r\n}\r\n\r\n.toggle[aria-pressed="true"] .toggle-display {\r\n\tbackground: var(--modalButtonAccent);\r\n}\r\n\r\n.toggle[aria-pressed="true"] .toggle-display::before {\r\n\ttransform: translateX(20px);\r\n}\r\n\r\n\r\n\r\n/* right to left */\r\n\r\n[dir="rtl"] .top-container,\r\n[dir="rtl"] #ui-main,\r\n[dir="rtl"] #alt-select {\r\n\tflex-direction: row-reverse;\r\n}\r\n\r\n[dir="rtl"] .highscore .score-meter {\r\n\tright: -4px;\r\n\tborder-radius: 12px 0 0 12px;\r\n}\r\n\r\n[dir="rtl"] .score-icon {\r\n\tright: auto;\r\n\tleft: -4px;\r\n}\r\n\r\n[dir="rtl"] .score-meter {\r\n\tright: 0;\r\n}\r\n\r\n[dir="rtl"] .score-fill {\r\n\tright: 0;\r\n\tfilter: drop-shadow(-2px 0px 0px var(--shadowFill));\r\n}\r\n\r\n[dir="rtl"] .toggle-display::before {\r\n\ttransform: translateX(20px);\r\n}\r\n\r\n[dir="rtl"] .toggle[aria-pressed="true"] .toggle-display::before {\r\n\ttransform: translateX(0px);\r\n}\r\n\r\n\r\n\r\n\r\n\r\n/* minimum supported resolution: 360px wide by 480px tall */\r\n\r\n@media screen and (min-height: 560px) and (min-width: 480px) {\r\n\tbody, button { font-size: 18px; }\r\n\r\n\t.btn { min-height: 36px; min-width: 40px; font-size: 20px; }\r\n\t.color { min-height: 32px; min-width: 32px; }\r\n\t.color:focus { min-height: 40px; }\r\n\t.icon { height: 28px; width: 28px; }\r\n\t#ui-stats { top: 30px; }\r\n\r\n\t#flyout-share { right: 56px; }\r\n\r\n\t#ui-title { font-size: 44px; }\r\n\t#ui-subtitle { font-size: 22px; }\r\n\r\n\t#alt-select { font-size: 24px; }\r\n\t#alt-info { font-size: 16px; }\r\n\t#ui-action .btn { padding: 10px; }\r\n\r\n\t#share-content { gap: 12px; padding: 16px; }\r\n\r\n\t.modal { gap: 14px; padding: 10px 0 18px 0; }\r\n\t.flyout { top: 56px; }\r\n\t.dialog { width: 420px; }\r\n\t.modal-row { gap: 10px; padding: 0 14px; }\r\n\t.modal-col { gap: 2px; padding: 0 14px; }\r\n}\r\n\r\n@media screen and (min-height: 640px) and (min-width: 560px) {\r\n\tbody, button { font-size: 20px; }\r\n\r\n\t.btn { min-height: 40px; min-width: 44px; font-size: 24px; }\r\n\t.color { min-height: 36px; min-width: 36px; }\r\n\t.color:focus { min-height: 44px; }\r\n\t.icon { height: 32px; width: 32px; }\r\n\t#ui-stats { top: 32px; }\r\n\r\n\t#flyout-share { right: 60px; }\r\n\r\n\t#ui-title { font-size: 48px; }\r\n\t#ui-subtitle { font-size: 24px; }\r\n\r\n\t#alt-select { font-size: 28px; }\r\n\t#alt-info { font-size: 18px; }\r\n\t#ui-action .btn { padding: 12px; }\r\n\r\n\t#share-content { gap: 16px; padding: 20px; }\r\n\r\n\t.modal { gap: 16px; padding: 12px 0 20px 0; }\r\n\t.flyout { top: 60px; width: 300px; }\r\n\t.dialog { width: 480px; }\r\n\t.modal-row { gap: 12px; padding: 0 16px; }\r\n\t.modal-col { gap: 4px; padding: 0 16px; }\r\n}\r\n\r\n\r\n\r\n/* stats */\r\n\r\n@media screen and (min-width: 420px) {\r\n\t#alt-select { min-width: 320px; }\r\n}\r\n\r\n@media screen and (min-width: 480px) {\r\n\t#ui-main { width: 320px; }\r\n\t#ui-stats { width: 280px; justify-content: space-between; flex-wrap: nowrap; gap: 0; }\r\n\t.stats-score { order: 0; }\r\n\t#alt-select { min-width: 360px; }\r\n}\r\n\r\n@media screen and (min-width: 560px) {\r\n\t#ui-stats { width: 320px; font-size: 20px; }\r\n\t.score-icon { height: 40px; width: 40px; }\r\n\t.score-meter { height: 30px; width: 120px; border-radius: 15px; }\r\n\t.highscore .score-meter { border-radius: 0 15px 15px 0; }\r\n}\r\n\r\n@media screen and (min-width: 640px) {\r\n\t#ui-stats { width: 400px; }\r\n}\r\n\r\n\r\n\r\n/* structure */\r\n\r\n@media screen and (min-height: 500px) {\r\n\t#ui-header { top: calc(40vh - 112px); }\r\n\t#ui-alt { top: calc(40vh + 112px); }\r\n\t#ui-action { top: calc(40vh + 192px); }\r\n\t#ui-notify { top: calc(40vh + 240px); }\r\n}\r\n\r\n@media screen and (min-height: 560px) {\r\n\t#ui-header { top: calc(40vh - 128px); gap: 12px; }\r\n\t#ui-alt { top: calc(40vh + 128px); }\r\n\t#ui-action { top: calc(40vh + 224px); }\r\n\t#ui-notify { top: calc(40vh + 288px); }\r\n}\r\n\r\n@media screen and (min-height: 640px) {\r\n\t#ui-header { top: calc(40vh - 144px); gap: 16px; }\r\n\t#ui-alt { top: calc(40vh + 144px); }\r\n\t#ui-action { top: calc(40vh + 256px); }\r\n\t#ui-notify { top: calc(40vh + 320px); }\r\n}\r\n\r\n@media screen and (min-height: 720px) {\r\n\t#ui-header { top: calc(40vh - 160px); }\r\n\t#ui-alt { top: calc(40vh + 160px); gap: 32px; }\r\n\t#ui-action { top: calc(40vh + 288px); }\r\n\t#ui-notify { top: calc(40vh + 352px); }\r\n}\r\n\r\n@media screen and (min-height: 800px) {\r\n\t#ui-header { top: calc(40vh - 192px); gap: 20px; }\r\n\t#ui-alt { top: calc(40vh + 192px); }\r\n\t#ui-action { top: calc(40vh + 320px); }\r\n\t#ui-notify { top: calc(40vh + 448px); }\r\n}\r\n\r\n\r\n\r\n/* high contrast */\r\n\r\n@media (forced-colors:active), (prefers-contrast: more) { /* accessibility */\r\n\t:root {\r\n\t\t--text: CanvasText !important;\r\n\t\t--bgFull: Canvas !important;\r\n\t\t--background: Canvas !important;\r\n\t}\r\n\r\n\tbody, button {\r\n\t\ttext-shadow: none !important;\r\n\t}\r\n\r\n\t#game-color {\r\n\t\tbackground: var(--background) !important; /* match body */\r\n\t}\r\n\r\n\t.btn:not(.color) {\r\n\t\tbackground: ButtonFace !important;\r\n\t}\r\n\r\n\t.focused .btn,\r\n\t.btn:focus:not(.color),\r\n\t.btn:hover:not(.color) {\r\n\t\tforced-color-adjust: none; /* prevent default text highlight */\r\n\t\tcolor: HighlightText !important;\r\n\t\tbackground: Highlight !important;\r\n\t}\r\n\r\n\t.btn:hover,\r\n\t.color:focus,\r\n\t.toggle:focus {\r\n\t\toutline-color: Highlight !important;\r\n\t}\r\n\r\n\t.modal,\r\n\t.color-picker,\r\n\t.toggle,\r\n\t.score-meter,\r\n\t.score-icon {\r\n\t\toutline: var(--outline);\r\n\t\toutline-color: ButtonText !important;\r\n\t\tbackground: ButtonFace !important;\r\n\t}\r\n\r\n\t.score-fill {\r\n\t\tbackground: GrayText !important;\r\n\t}\r\n\t\r\n\t.highscore .score-fill {\r\n\t\tbackground: LinkText !important;\r\n\t}\r\n\r\n\t.toggle-display::before {\r\n\t\tbackground-color: ButtonText !important;\r\n\t}\r\n\r\n\t.toggle[aria-pressed="true"] .toggle-display {\r\n\t\tbackground: Highlight !important;\r\n\t}\r\n\r\n\t.toggle[aria-pressed="true"] .toggle-display::before {\r\n\t\tbackground: HighlightText !important;\r\n\t}\r\n\r\n\t.icon:not(.score-icon .icon) {\r\n\t\tfill: ButtonText !important;\r\n\t\tfilter: none !important;\r\n\t}\r\n\r\n\t.focused .btn .icon:not(.checkmark),\r\n\t.btn:focus .icon:not(.checkmark),\r\n\t.btn:hover .icon:not(.checkmark) {\t\r\n\t\tfill: HighlightText !important;\r\n\t}\r\n\r\n\t.color {\r\n\t\tforced-color-adjust: none !important; /* prevent color change */\r\n\t}\r\n}',
          "",
          {
            version: 3,
            sources: ["webpack://./src/css/style.css"],
            names: [],
            mappings:
              "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",
            sourcesContent: [
              '/** Copyright (C) Microsoft Corporation. All rights reserved.\r\n * Use of this source code is governed by a BSD-style license that can be\r\n * found in the LICENSE file.\r\n */\r\n\r\n:root {\r\n\t--shadowSml: 0px 1px 0px;\r\n\t--shadowMed: 0px 3px 0px;\r\n\t--shadowLrg: 0px 5px 0px;\r\n\t--regular: 400;\r\n\t--semibold: 600;\r\n\t--bold: 700;\r\n\t--black: 900;\r\n\t--outline: 2px solid var(--modalText);\r\n\t--modalText: #000000;\r\n\t--modalTextAccent: #FFFFFF;\r\n\t--modalButton: #D6D6D6;\r\n\t--modalButtonHover: #C2C2C2;\r\n\t--modalButtonAccent: #666666;\r\n\t--modalBackplate: #FFFFFF;\r\n\t/* colors imported from theme.js */\r\n\t--meter: linear-gradient(180deg, #FFFFFF 0%, #16F5CE 25%, #4AFD76 75%, #3FCB57 100%);\r\n\t--meterBest: linear-gradient(180deg, #FFFFFF 0%, #F6E016 25%, #FDCA46 75%, #CA9A3E 100%);\r\n\t--meterIcon: linear-gradient(180deg, #4A483C 40%, #9C9A86 100%);\r\n\t--meterStar: #F6E016;\r\n}\r\n\r\n/* minimal css reset */\r\nhtml, body, div, h1, h2, h3, h4, h5, h6, a, p, img, ul, li, button {\r\n\tpadding: 0; margin: 0; border: 0; outline: 0;\r\n}\r\n\r\nbody {\r\n\theight: 100vh; /* fullscreen */\r\n\twidth: 100vw; /* fullscreen */\r\n\toverflow: hidden; /* prevent scroll */\r\n\tuser-select: none; /* prevent text highlight */\r\n\ttouch-action: pinch-zoom; /* prevent navigating back with one finger */\r\n}\r\n\r\nbody, button {\r\n\tfont-family: system-ui, sans-serif;\r\n\tfont-size: 16px;\r\n\tline-height: 1; /* force match base font-size */\r\n\tfont-weight: var(--bold);\r\n\tcolor: var(--text);\r\n\ttext-shadow: var(--shadowSml) var(--bevel); /* 1px underline */\r\n}\r\n\r\n[hidden] {\r\n\tdisplay: none !important;\r\n\tvisibility: hidden !important;\r\n\topacity: 0 !important;\r\n}\r\n\r\n\r\n\r\n/* animations */\r\n\r\n#ui-overlay, #ui-notify, #game-tint {\r\n\ttransition: opacity 0.3s; /* instant visibility */\r\n}\r\n\r\n#ui-overlay.hidden, #ui-notify.hidden, #game-tint.hidden {\r\n\ttransition: opacity 0.3s, visibility 0s 0.3s; /* delay visibility */\r\n}\r\n\r\n.toggle-display::before {\r\n\ttransition: transform 0.3s;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n\t.toggle-display::before,\r\n\t#ui-overlay, #ui-notify, #game-tint,\r\n\t#ui-overlay.hidden, #ui-notify.hidden, #game-tint.hidden {\r\n\t\ttransition: none;\r\n\t}\r\n\r\n\t.clickfx::after {\r\n\t\tanimation: none;\r\n\t}\r\n}\r\n\r\n\r\n\r\n/* button styles */\r\n\r\n.btn {\r\n\tposition: relative; /* for clickfx */\r\n\tmin-height: 32px;\r\n\tmin-width: 36px;\r\n\theight: max-content;\r\n\twidth: max-content;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\tgap: 4px;\r\n\tfont-size: 16px;\r\n\ttext-transform: uppercase;\r\n\tborder-radius: 4px;\r\n\tbackground: var(--bgHalf);\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\toutline: 2px solid rgba(0,0,0,0); /* hide */\r\n\t-webkit-tap-highlight-color: rgba(0,0,0,0); /* hide tap highlight */\r\n}\r\n\r\n.btn:focus,\r\n.focused .btn {\r\n\tbackground: var(--bgFocus);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n}\r\n\r\n.btn:focus {\r\n\toutline: var(--outline); /* show */\r\n}\r\n\r\n.btn:hover,\r\n.btn[aria-expanded="true"] {\r\n\tbackground: var(--bgFull);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n\tcursor: pointer;\r\n}\r\n\r\n.icon {\r\n\tdisplay: block; /* remove svg padding */\r\n\tpointer-events: none;\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfill: var(--text);\r\n\tfilter: drop-shadow(var(--shadowSml) var(--bevel));\r\n}\r\n\r\n\r\n\r\n/* button click effect */\r\n\r\n.btn::after {\r\n\tposition: absolute;\r\n\twidth: calc(100% + 16px);\r\n\theight: calc(100% + 16px);\r\n\tborder-radius: 8px;\r\n\tcontent: \' \';\r\n\tz-index: 1;\r\n\tpointer-events: none;\r\n\tcolor: var(--text);\r\n}\r\n\r\n.clickfx::after {\r\n\tanimation: clickfx-anim 0.2s ease forwards;\r\n}\r\n\r\n@keyframes clickfx-anim {\r\n\t0% {\r\n\t\topacity: 1;\r\n\t\ttransform: scale(1);\r\n\t\tbox-shadow: inset 0 0 0 8px; }\r\n\t100% {\r\n\t\topacity: 0;\r\n\t\ttransform: scale(1.1);\r\n\t\tbox-shadow: inset 0 0 0 0px; }\r\n}\r\n\r\n\r\n\r\n/* page structure */\r\n\r\n#game-color, #game-bg, #game-tint, #game-canvas, #game-ui, #ui-overlay {\r\n\tposition: absolute;\r\n\twidth: 100vw;\r\n\theight: 100vh;\r\n\tpointer-events: none; /* clicks pass through */\r\n}\r\n\r\n#game-color {\r\n\tz-index: 1;\r\n\tbackground: var(--background);\r\n}\r\n\r\n#game-bg {\r\n\tz-index: 2;\r\n\tbackground-repeat: repeat;\r\n\timage-rendering: pixelated;\r\n}\r\n\r\n#game-tint {\r\n\tz-index: 3;\r\n\tbackground: linear-gradient(var(--tint));\r\n}\r\n\r\n#game-canvas {\r\n\tz-index: 4;\r\n\timage-rendering: pixelated;\r\n}\r\n\r\n#game-ui {\r\n\tz-index: 5;\r\n\tpointer-events: auto; /* allow clicks in ui */\r\n}\r\n\r\n#ui-overlay {\r\n\tpointer-events: auto !important; /* allow clicks */\r\n\tz-index: 1; /* inside game-ui */\r\n\tbackground: var(--overlay);\r\n}\r\n\r\n\r\n\r\n\r\n\r\n/* game ui */\r\n\r\n#ui-stats, #ui-header, #ui-main, #ui-alt, #ui-action, #ui-notify {\r\n\tposition: absolute;\r\n\twidth: calc(100vw - 24px); /* minus padding */\r\n\tleft: 50vw; /* center */\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\ttransform: translate(-50%, -50%); /* center */\r\n}\r\n\r\n.top-container {\r\n\tz-index: 2;\r\n\tposition: absolute;\r\n\ttop: 12px;\r\n\tdisplay: flex;\r\n\tgap: 8px;\r\n\talign-items: center;\r\n}\r\n\r\n#top-left {\r\n\tleft: 12px;\r\n}\r\n\r\n#top-right {\r\n\tright: 12px;\r\n}\r\n\r\n\r\n\r\n/* stats */\r\n\r\n#ui-stats {\r\n\ttop: 44px;\r\n\twidth: 160px;\r\n\tmax-width: 440px;\r\n\tfont-size: 16px;\r\n\tjustify-content: center;\r\n\tflex-wrap: wrap;\r\n\tgap: 10px;\r\n}\r\n\r\n.stats-score {\r\n\tdisplay: flex;\r\n\talign-items: center;\r\n\torder: -1;\r\n}\r\n\r\n.score-icon {\r\n\tposition: relative;\r\n\tright: -4px;\r\n\tz-index: 1;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\twidth: 32px;\r\n\theight: 32px;\r\n\tborder-radius: 50%;\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tbackground: var(--meterIcon);\r\n}\r\n\r\n.score-icon.hidden {\r\n\tdisplay: none;\r\n}\r\n\r\n.score-icon svg {\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfill: var(--meterStar);\r\n\tfilter: drop-shadow(var(--shadowMed) var(--shadowFill));\r\n}\r\n\r\n.score-meter {\r\n\tposition: relative;\r\n\toverflow: hidden;\r\n\tleft: 0;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\theight: 24px;\r\n\twidth: 100px;\r\n\tborder-radius: 12px;\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tbackground-color: var(--bgHalf);\r\n}\r\n\r\n#ui-header .stats-score {\r\n\ttransform: scale(1.2);\r\n}\r\n\r\n.highscore .score-meter {\r\n\tleft: -4px;\r\n\tborder-radius: 0 12px 12px 0;\r\n}\r\n\r\n.score-text {\r\n\tz-index: 1;\r\n\tfont-weight: var(--black);\r\n}\r\n\r\n.score-fill {\r\n\tposition: absolute;\r\n\tleft: 0;\r\n\tz-index: 0;\r\n\theight: 100%;\r\n\twidth: 0%;\r\n\tbackground: var(--meter);\r\n\tfilter: drop-shadow(2px 0px 0px var(--shadowFill));\r\n}\r\n\r\n.highscore .score-fill {\r\n\tbackground: var(--meterBest);\r\n}\r\n\r\n.stats-icons {\r\n\tdisplay: flex;\r\n\tgap: 2px;\r\n\talign-items: center;\r\n\timage-rendering: pixelated; /* important */\r\n}\r\n\r\n.stats-icons span {\r\n\theight: 22px;\r\n\twidth: 22px;\r\n\tbackground-size: 1920px 512px;\r\n}\r\n\r\n\r\n\r\n/* title */\r\n\r\n#ui-header {\r\n\ttop: calc(40vh - 88px);\r\n\tflex-direction: column;\r\n\tgap: 8px;\r\n\ttext-align: center;\r\n\ttext-transform: uppercase;\r\n}\r\n\r\n#ui-title {\r\n\tfont-size: 36px;\r\n}\r\n\r\n#ui-subtitle {\r\n\tfont-size: 20px;\r\n}\r\n\r\n\r\n\r\n/* main, alt, action */\r\n\r\n#ui-main {\r\n\ttop: 40vh;\r\n\theight: 128px;\r\n\twidth: 288px;\r\n}\r\n\r\n#ui-alt {\r\n\ttop: calc(40vh + 88px);\r\n\tgap: 16px;\r\n\twidth: max-content; /* flexbox */\r\n\tflex-direction: column;\r\n\ttext-transform: uppercase;\r\n}\r\n\r\n#alt-select {\r\n\tmin-width: 280px;\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\tgap: 32px;\r\n\tfont-size: 20px;\r\n}\r\n\r\n#alt-info {\r\n\tdisplay: flex;\r\n\talign-items: center;\r\n\tgap: 12px;\r\n}\r\n\r\n\r\n\r\n/* action */\r\n\r\n#ui-action {\r\n\ttop: calc(40vh + 160px);\r\n\tjustify-content: center;\r\n\tflex-direction: column;\r\n\tgap: 16px;\r\n}\r\n\r\n#ui-action .btn {\r\n\tpadding: 8px;\r\n}\r\n\r\n\r\n\r\n/* edit */\r\n\r\n#edit-nav {\r\n\tdisplay: flex;\r\n\tflex-direction: row;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n}\r\n\r\n.active {\r\n\tbackground: var(--bgFull);\r\n}\r\n\r\n#edit-nav .btn:not(.active, :hover, :focus) { /* hide backplates */\r\n\tbackground: none;\r\n\tbox-shadow: none;\r\n\toutline: none;\r\n}\r\n\r\n#alt-select.color-picker {\r\n\tmin-width: auto;\r\n\tborder-radius: 4px;\r\n\tbackground: var(--bgHalf);\r\n\tbox-shadow: var(--shadowMed) var(--shadowFill);\r\n\tpadding: 12px;\r\n\tgap: 0;\r\n}\r\n\r\n.color {\r\n\tborder-radius: 2px;\r\n\tmin-width: 28px;\r\n\tmin-height: 28px;\r\n\tborder: var(--outline);\r\n\tbox-shadow: none !important; /* override btn class */\r\n}\r\n\r\n.color:hover,\r\n.color:focus {\r\n\tbackground: inherit;\r\n\toutline: var(--outline);\r\n\tz-index: 1;\r\n}\r\n\r\n.color:focus {\r\n\toutline: var(--outline);\r\n\tmin-height: 36px;\r\n\tz-index: 2;\r\n}\r\n\r\n.check {\r\n\twidth: 16px;\r\n\theight: 16px;\r\n\tbackground-color: var(--bgFull);\r\n\toutline: var(--outline);\r\n\tborder-radius: 50%;\r\n}\r\n\r\n.checkmark {\r\n\tposition: absolute;\r\n\tfilter: none;\r\n}\r\n\r\n\r\n\r\n/* notify */\r\n\r\n#ui-notify {\r\n\ttop: calc(40vh + 208px);\r\n\tjustify-content: center;\r\n}\r\n\r\n#notify-content {\r\n\twidth: max-content;\r\n\tdisplay: flex;\r\n\tjustify-content: center;\r\n\talign-items: center;\r\n\tgap: 4px;\r\n\tpadding: 12px 20px;\r\n\tborder-radius: 4px;\r\n\tfont-weight: var(--semibold);\r\n\tcolor: var(--notifyText);\r\n\ttext-shadow: none;\r\n\tbackground: var(--notifyFill);\r\n}\r\n\r\n#notify-content .icon {\r\n\tfill: var(--notifyText);\r\n\tfilter: none;\r\n}\r\n\r\n\r\n\r\n/* modals */\r\n\r\n.modal {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\tgap: 12px;\r\n\tpadding: 8px 0 16px 0;\r\n\tz-index: 700;\r\n\tfont-size: 16px;\r\n\tline-height: 1.25; /* force match base font-size */\r\n\tfont-weight: var(--regular);\r\n\ttext-shadow: none;\r\n\tcolor: var(--modalText);\r\n\tborder-radius: 8px;\r\n\tbackground: var(--modalBackplate);\r\n\tbox-shadow: var(--shadowLrg) var(--shadowFill);\r\n}\r\n\r\n.flyout {\r\n\tposition: absolute;\r\n\ttop: 52px;\r\n\twidth: 280px;\r\n}\r\n\r\n.dialog {\r\n\tposition: absolute;\r\n\ttop: 50vh;\r\n\tleft: 50vw;\r\n\ttransform: translate(-50%, -50%);\r\n\twidth: 320px;\r\n}\r\n\r\n#flyout-share {\r\n\tright: 52px;\r\n}\r\n\r\n#flyout-settings {\r\n\tright: 8px;\r\n}\r\n\r\n#share-content {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\tz-index: 700;\r\n\twidth: max-content;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n\tpadding: 12px;\r\n}\r\n\r\n.btn.btn-full {\r\n\twidth: 100%;\r\n\tpadding: 8px 0;\r\n}\r\n\r\n#ui-action .btn span {\r\n\tpadding: 0 4px;\r\n}\r\n\r\n.btn.btn-half {\r\n\twidth: 50%;\r\n\tpadding: 8px 0;\r\n\tfont-size: 16px;\r\n}\r\n\r\n.btn.btn-small {\r\n\twidth: 100%;\r\n\tpadding: 8px 0;\r\n\tmin-height: 28px;\r\n\tfont-size: 14px;\r\n}\r\n\r\n.btn.btn-share {\r\n\tpadding: 8px 12px;\r\n\tmin-height: 28px;\r\n\tfont-size: 14px;\r\n}\r\n\r\n.modal .btn .icon {\r\n\tfill: var(--modalText);\r\n}\r\n\r\n.modal .btn:focus .icon {\r\n\tfill: var(--modalTextAccent);\r\n\tfilter: none;\r\n}\r\n\r\n.modal .btn {\r\n\tbackground: var(--modalButton);\r\n\tcolor: var(--modalText);\r\n}\r\n\r\n.modal .btn:hover {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.modal .btn:focus {\r\n\tbackground: var(--modalButtonAccent);\r\n\tcolor: var(--modalTextAccent);\r\n\ttext-shadow: none;\r\n}\r\n\r\n.modal .btn.dismiss {\r\n\tmin-height: 28px;\r\n\tmin-width: 28px;\r\n\tbox-shadow: none;\r\n\toutline-offset: 2px;\r\n}\r\n\r\n.btn.dismiss {\r\n\tbackground: none;\r\n}\r\n\r\n.btn.dismiss:hover {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.btn.dismiss .icon {\r\n\theight: 24px;\r\n\twidth: 24px;\r\n\tfilter: none;\r\n\tfill: var(--modalText);\r\n}\r\n\r\n\r\n\r\n/* game stats and ui */\r\n\r\n.empty { opacity: 0; }\r\n.life-full { background-position: -1px -1px; }\r\n.life-empty { background-position: -1px -25px; }\r\n.boost-full { background-position: -25px -1px; }\r\n.boost-empty { background-position: -25px -25px; }\r\n.shield { background-position: -49px -1px; }\r\n.infinite { background-position: -49px -25px; }\r\n\r\n\r\n\r\n\r\n\r\n/* flyout */\r\n\r\n.flyout-rule {\r\n\theight: 1px;\r\n\tbackground: var(--modalButton);\r\n}\r\n\r\n.flyout-title {\r\n\tfont-size: 20px;\r\n\tfont-weight: var(--bold);\r\n}\r\n\r\n.flyout-header {\r\n\tfont-weight: var(--bold);\r\n}\r\n\r\n\r\n\r\n/* input */\r\n\r\n.modal-row {\r\n\tdisplay: flex;\r\n\tjustify-content: space-between;\r\n\talign-items: center;\r\n\tgap: 8px;\r\n\tpadding: 0 12px;\r\n}\r\n\r\n.modal-col {\r\n\tdisplay: flex;\r\n\tflex-direction: column;\r\n\talign-items: flex-start;\r\n\tgap: 0px;\r\n\tpadding: 0 12px;\r\n}\r\n\r\n.input-title {\r\n\tflex-grow: 1;\r\n\tfont-weight: var(--semibold);\r\n}\r\n\r\n.input-label {\r\n\tfont-weight: var(--semibold);\r\n}\r\n\r\n.toggle {\r\n\tcursor: pointer;\r\n\tposition: relative;\r\n\twidth: 40px;\r\n\theight: 20px;\r\n\tborder-radius: 10px;\r\n\toverflow: hidden;\r\n}\r\n\r\n.toggle-display {\r\n\tpointer-events: none;\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tbackground: var(--modalButton);\r\n}\r\n\r\n.toggle:hover .toggle-display {\r\n\tbackground: var(--modalButtonHover);\r\n}\r\n\r\n.toggle-display::before {\r\n\tposition: absolute;\r\n\tborder-radius: 50%;\r\n\tcontent: "";\r\n\theight: 12px;\r\n\twidth: 12px;\r\n\ttop: 4px;\r\n\tleft: 4px;\r\n\tbackground-color: var(--modalTextAccent);\r\n\ttransform: translateX(0px);\r\n}\r\n\r\n.toggle:focus {\r\n\toutline: var(--outline);\r\n\toutline-offset: 2px;\r\n}\r\n\r\n.toggle[aria-pressed="true"] .toggle-display {\r\n\tbackground: var(--modalButtonAccent);\r\n}\r\n\r\n.toggle[aria-pressed="true"] .toggle-display::before {\r\n\ttransform: translateX(20px);\r\n}\r\n\r\n\r\n\r\n/* right to left */\r\n\r\n[dir="rtl"] .top-container,\r\n[dir="rtl"] #ui-main,\r\n[dir="rtl"] #alt-select {\r\n\tflex-direction: row-reverse;\r\n}\r\n\r\n[dir="rtl"] .highscore .score-meter {\r\n\tright: -4px;\r\n\tborder-radius: 12px 0 0 12px;\r\n}\r\n\r\n[dir="rtl"] .score-icon {\r\n\tright: auto;\r\n\tleft: -4px;\r\n}\r\n\r\n[dir="rtl"] .score-meter {\r\n\tright: 0;\r\n}\r\n\r\n[dir="rtl"] .score-fill {\r\n\tright: 0;\r\n\tfilter: drop-shadow(-2px 0px 0px var(--shadowFill));\r\n}\r\n\r\n[dir="rtl"] .toggle-display::before {\r\n\ttransform: translateX(20px);\r\n}\r\n\r\n[dir="rtl"] .toggle[aria-pressed="true"] .toggle-display::before {\r\n\ttransform: translateX(0px);\r\n}\r\n\r\n\r\n\r\n\r\n\r\n/* minimum supported resolution: 360px wide by 480px tall */\r\n\r\n@media screen and (min-height: 560px) and (min-width: 480px) {\r\n\tbody, button { font-size: 18px; }\r\n\r\n\t.btn { min-height: 36px; min-width: 40px; font-size: 20px; }\r\n\t.color { min-height: 32px; min-width: 32px; }\r\n\t.color:focus { min-height: 40px; }\r\n\t.icon { height: 28px; width: 28px; }\r\n\t#ui-stats { top: 30px; }\r\n\r\n\t#flyout-share { right: 56px; }\r\n\r\n\t#ui-title { font-size: 44px; }\r\n\t#ui-subtitle { font-size: 22px; }\r\n\r\n\t#alt-select { font-size: 24px; }\r\n\t#alt-info { font-size: 16px; }\r\n\t#ui-action .btn { padding: 10px; }\r\n\r\n\t#share-content { gap: 12px; padding: 16px; }\r\n\r\n\t.modal { gap: 14px; padding: 10px 0 18px 0; }\r\n\t.flyout { top: 56px; }\r\n\t.dialog { width: 420px; }\r\n\t.modal-row { gap: 10px; padding: 0 14px; }\r\n\t.modal-col { gap: 2px; padding: 0 14px; }\r\n}\r\n\r\n@media screen and (min-height: 640px) and (min-width: 560px) {\r\n\tbody, button { font-size: 20px; }\r\n\r\n\t.btn { min-height: 40px; min-width: 44px; font-size: 24px; }\r\n\t.color { min-height: 36px; min-width: 36px; }\r\n\t.color:focus { min-height: 44px; }\r\n\t.icon { height: 32px; width: 32px; }\r\n\t#ui-stats { top: 32px; }\r\n\r\n\t#flyout-share { right: 60px; }\r\n\r\n\t#ui-title { font-size: 48px; }\r\n\t#ui-subtitle { font-size: 24px; }\r\n\r\n\t#alt-select { font-size: 28px; }\r\n\t#alt-info { font-size: 18px; }\r\n\t#ui-action .btn { padding: 12px; }\r\n\r\n\t#share-content { gap: 16px; padding: 20px; }\r\n\r\n\t.modal { gap: 16px; padding: 12px 0 20px 0; }\r\n\t.flyout { top: 60px; width: 300px; }\r\n\t.dialog { width: 480px; }\r\n\t.modal-row { gap: 12px; padding: 0 16px; }\r\n\t.modal-col { gap: 4px; padding: 0 16px; }\r\n}\r\n\r\n\r\n\r\n/* stats */\r\n\r\n@media screen and (min-width: 420px) {\r\n\t#alt-select { min-width: 320px; }\r\n}\r\n\r\n@media screen and (min-width: 480px) {\r\n\t#ui-main { width: 320px; }\r\n\t#ui-stats { width: 280px; justify-content: space-between; flex-wrap: nowrap; gap: 0; }\r\n\t.stats-score { order: 0; }\r\n\t#alt-select { min-width: 360px; }\r\n}\r\n\r\n@media screen and (min-width: 560px) {\r\n\t#ui-stats { width: 320px; font-size: 20px; }\r\n\t.score-icon { height: 40px; width: 40px; }\r\n\t.score-meter { height: 30px; width: 120px; border-radius: 15px; }\r\n\t.highscore .score-meter { border-radius: 0 15px 15px 0; }\r\n}\r\n\r\n@media screen and (min-width: 640px) {\r\n\t#ui-stats { width: 400px; }\r\n}\r\n\r\n\r\n\r\n/* structure */\r\n\r\n@media screen and (min-height: 500px) {\r\n\t#ui-header { top: calc(40vh - 112px); }\r\n\t#ui-alt { top: calc(40vh + 112px); }\r\n\t#ui-action { top: calc(40vh + 192px); }\r\n\t#ui-notify { top: calc(40vh + 240px); }\r\n}\r\n\r\n@media screen and (min-height: 560px) {\r\n\t#ui-header { top: calc(40vh - 128px); gap: 12px; }\r\n\t#ui-alt { top: calc(40vh + 128px); }\r\n\t#ui-action { top: calc(40vh + 224px); }\r\n\t#ui-notify { top: calc(40vh + 288px); }\r\n}\r\n\r\n@media screen and (min-height: 640px) {\r\n\t#ui-header { top: calc(40vh - 144px); gap: 16px; }\r\n\t#ui-alt { top: calc(40vh + 144px); }\r\n\t#ui-action { top: calc(40vh + 256px); }\r\n\t#ui-notify { top: calc(40vh + 320px); }\r\n}\r\n\r\n@media screen and (min-height: 720px) {\r\n\t#ui-header { top: calc(40vh - 160px); }\r\n\t#ui-alt { top: calc(40vh + 160px); gap: 32px; }\r\n\t#ui-action { top: calc(40vh + 288px); }\r\n\t#ui-notify { top: calc(40vh + 352px); }\r\n}\r\n\r\n@media screen and (min-height: 800px) {\r\n\t#ui-header { top: calc(40vh - 192px); gap: 20px; }\r\n\t#ui-alt { top: calc(40vh + 192px); }\r\n\t#ui-action { top: calc(40vh + 320px); }\r\n\t#ui-notify { top: calc(40vh + 448px); }\r\n}\r\n\r\n\r\n\r\n/* high contrast */\r\n\r\n@media (forced-colors:active), (prefers-contrast: more) { /* accessibility */\r\n\t:root {\r\n\t\t--text: CanvasText !important;\r\n\t\t--bgFull: Canvas !important;\r\n\t\t--background: Canvas !important;\r\n\t}\r\n\r\n\tbody, button {\r\n\t\ttext-shadow: none !important;\r\n\t}\r\n\r\n\t#game-color {\r\n\t\tbackground: var(--background) !important; /* match body */\r\n\t}\r\n\r\n\t.btn:not(.color) {\r\n\t\tbackground: ButtonFace !important;\r\n\t}\r\n\r\n\t.focused .btn,\r\n\t.btn:focus:not(.color),\r\n\t.btn:hover:not(.color) {\r\n\t\tforced-color-adjust: none; /* prevent default text highlight */\r\n\t\tcolor: HighlightText !important;\r\n\t\tbackground: Highlight !important;\r\n\t}\r\n\r\n\t.btn:hover,\r\n\t.color:focus,\r\n\t.toggle:focus {\r\n\t\toutline-color: Highlight !important;\r\n\t}\r\n\r\n\t.modal,\r\n\t.color-picker,\r\n\t.toggle,\r\n\t.score-meter,\r\n\t.score-icon {\r\n\t\toutline: var(--outline);\r\n\t\toutline-color: ButtonText !important;\r\n\t\tbackground: ButtonFace !important;\r\n\t}\r\n\r\n\t.score-fill {\r\n\t\tbackground: GrayText !important;\r\n\t}\r\n\t\r\n\t.highscore .score-fill {\r\n\t\tbackground: LinkText !important;\r\n\t}\r\n\r\n\t.toggle-display::before {\r\n\t\tbackground-color: ButtonText !important;\r\n\t}\r\n\r\n\t.toggle[aria-pressed="true"] .toggle-display {\r\n\t\tbackground: Highlight !important;\r\n\t}\r\n\r\n\t.toggle[aria-pressed="true"] .toggle-display::before {\r\n\t\tbackground: HighlightText !important;\r\n\t}\r\n\r\n\t.icon:not(.score-icon .icon) {\r\n\t\tfill: ButtonText !important;\r\n\t\tfilter: none !important;\r\n\t}\r\n\r\n\t.focused .btn .icon:not(.checkmark),\r\n\t.btn:focus .icon:not(.checkmark),\r\n\t.btn:hover .icon:not(.checkmark) {\t\r\n\t\tfill: HighlightText !important;\r\n\t}\r\n\r\n\t.color {\r\n\t\tforced-color-adjust: none !important; /* prevent color change */\r\n\t}\r\n}'
            ],
            sourceRoot: ""
          }
        ]);
        const a = r;
      },
      645: (A) => {
        A.exports = function (A) {
          var t = [];
          return (
            (t.toString = function () {
              return this.map(function (t) {
                var e = "",
                  s = void 0 !== t[5];
                return (
                  t[4] && (e += "@supports (".concat(t[4], ") {")),
                  t[2] && (e += "@media ".concat(t[2], " {")),
                  s && (e += "@layer".concat(t[5].length > 0 ? " ".concat(t[5]) : "", " {")),
                  (e += A(t)),
                  s && (e += "}"),
                  t[2] && (e += "}"),
                  t[4] && (e += "}"),
                  e
                );
              }).join("");
            }),
            (t.i = function (A, e, s, n, i) {
              "string" == typeof A && (A = [[null, A, void 0]]);
              var r = {};
              if (s)
                for (var a = 0; a < this.length; a++) {
                  var o = this[a][0];
                  null != o && (r[o] = !0);
                }
              for (var c = 0; c < A.length; c++) {
                var l = [].concat(A[c]);
                (s && r[l[0]]) ||
                  (void 0 !== i &&
                    (void 0 === l[5] ||
                      (l[1] = "@layer".concat(l[5].length > 0 ? " ".concat(l[5]) : "", " {").concat(l[1], "}")),
                    (l[5] = i)),
                  e && (l[2] ? ((l[1] = "@media ".concat(l[2], " {").concat(l[1], "}")), (l[2] = e)) : (l[2] = e)),
                  n &&
                    (l[4]
                      ? ((l[1] = "@supports (".concat(l[4], ") {").concat(l[1], "}")), (l[4] = n))
                      : (l[4] = "".concat(n))),
                  t.push(l));
              }
            }),
            t
          );
        };
      },
      537: (A) => {
        A.exports = function (A) {
          var t = A[1],
            e = A[3];
          if (!e) return t;
          if ("function" == typeof btoa) {
            var s = btoa(unescape(encodeURIComponent(JSON.stringify(e)))),
              n = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(s),
              i = "/*# ".concat(n, " */"),
              r = e.sources.map(function (A) {
                return "/*# sourceURL=".concat(e.sourceRoot || "").concat(A, " */");
              });
            return [t].concat(r).concat([i]).join("\n");
          }
          return [t].join("\n");
        };
      },
      379: (A) => {
        function t(A) {
          for (var t = -1, e = 0; e < n.length; e++)
            if (n[e].identifier === A) {
              t = e;
              break;
            }
          return t;
        }
        function e(A, e) {
          for (var i = {}, r = [], a = 0; a < A.length; a++) {
            var o = A[a],
              c = e.base ? o[0] + e.base : o[0],
              l = i[c] || 0,
              g = "".concat(c, " ").concat(l);
            i[c] = l + 1;
            var d = t(g),
              h = { css: o[1], media: o[2], sourceMap: o[3], supports: o[4], layer: o[5] };
            if (-1 !== d) n[d].references++, n[d].updater(h);
            else {
              var b = s(h, e);
              (e.byIndex = a), n.splice(a, 0, { identifier: g, updater: b, references: 1 });
            }
            r.push(g);
          }
          return r;
        }
        function s(A, t) {
          var e = t.domAPI(t);
          return (
            e.update(A),
            function (t) {
              if (t) {
                if (
                  t.css === A.css &&
                  t.media === A.media &&
                  t.sourceMap === A.sourceMap &&
                  t.supports === A.supports &&
                  t.layer === A.layer
                )
                  return;
                e.update((A = t));
              } else e.remove();
            }
          );
        }
        var n = [];
        A.exports = function (A, s) {
          var i = e((A = A || []), (s = s || {}));
          return function (A) {
            A = A || [];
            for (var r = 0; r < i.length; r++) {
              var a = t(i[r]);
              n[a].references--;
            }
            for (var o = e(A, s), c = 0; c < i.length; c++) {
              var l = t(i[c]);
              0 === n[l].references && (n[l].updater(), n.splice(l, 1));
            }
            i = o;
          };
        };
      },
      569: (A) => {
        var t = {};
        A.exports = function (A, e) {
          var s = (function (A) {
            if (void 0 === t[A]) {
              var e = document.querySelector(A);
              if (window.HTMLIFrameElement && e instanceof window.HTMLIFrameElement)
                try {
                  e = e.contentDocument.head;
                } catch (A) {
                  e = null;
                }
              t[A] = e;
            }
            return t[A];
          })(A);
          if (!s)
            throw new Error(
              "Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid."
            );
          s.appendChild(e);
        };
      },
      216: (A) => {
        A.exports = function (A) {
          var t = document.createElement("style");
          return A.setAttributes(t, A.attributes), A.insert(t, A.options), t;
        };
      },
      565: (A, t, e) => {
        A.exports = function (A) {
          var t = e.nc;
          t && A.setAttribute("nonce", t);
        };
      },
      37: (A) => {
        function t(A, t, e, n) {
          var i;
          if (e) i = "";
          else {
            (i = ""),
              n.supports && (i += "@supports (".concat(n.supports, ") {")),
              n.media && (i += "@media ".concat(n.media, " {"));
            var r = void 0 !== n.layer;
            r && (i += "@layer".concat(n.layer.length > 0 ? " ".concat(n.layer) : "", " {")),
              (i += n.css),
              r && (i += "}"),
              n.media && (i += "}"),
              n.supports && (i += "}");
          }
          if (A.styleSheet) A.styleSheet.cssText = s(t, i);
          else {
            var a = document.createTextNode(i),
              o = A.childNodes;
            o[t] && A.removeChild(o[t]), o.length ? A.insertBefore(a, o[t]) : A.appendChild(a);
          }
        }
        var e,
          s =
            ((e = []),
            function (A, t) {
              return (e[A] = t), e.filter(Boolean).join("\n");
            }),
          n = { singleton: null, singletonCounter: 0 };
        A.exports = function (A) {
          var e = n.singletonCounter++,
            s = n.singleton || (n.singleton = A.insertStyleElement(A));
          return {
            update: function (A) {
              t(s, e, !1, A);
            },
            remove: function (A) {
              t(s, e, !0, A);
            }
          };
        };
      }
    },
    e = {};
  (A.n = (t) => {
    var e = t && t.__esModule ? () => t.default : () => t;
    return A.d(e, { a: e }), e;
  }),
    (A.d = (t, e) => {
      for (var s in e) A.o(e, s) && !A.o(t, s) && Object.defineProperty(t, s, { enumerable: !0, get: e[s] });
    }),
    (A.o = (A, t) => Object.prototype.hasOwnProperty.call(A, t)),
    (() => {
      function t(A, t) {
        return Math.floor(A + (t + 1 - A) * Math.random());
      }
      function e(A) {
        return Array.isArray(A) ? A[Math.floor(Math.random() * A.length)] : A;
      }
      function s(A, t = !1) {
        const e = Object.keys(A),
          s = A[e[(e.length * Math.random()) << 0]],
          n = e.find((t) => A[t] === s);
        if (t) return n;
        {
          const A = {};
          return (A[n] = s), A;
        }
      }
      function n(A, t) {
        for (const e in A) A.hasOwnProperty(e) && (t[e] = A[e]);
      }
      function i(A) {
        if ("number" != typeof A) return "----";
        let t = 14,
          e = 8;
        return A < 0 && (A = 3599), A >= 3600 && ((t = 12), (e = 10)), new Date(1e3 * A).toISOString().substr(t, e);
      }
      function r() {
        return {
          getData: (A) => (null != g && A in g.data_ ? g.data_[A] : l[A]),
          getString(A) {
            const t = this.getData(A);
            if (void 0 !== t) return t;
          },
          getStringF(...A) {
            const t = A[0],
              e = this.getString(t);
            return e ? ((A[0] = e), this.substituteString(...A)) : "";
          },
          substituteString: (...A) =>
            A[0].replace(/\$(.|$|\n)/g, function (t) {
              if (t.match(/\$[$1-9]/)) return "$$" == t ? "$" : A[t[1]];
            })
        };
      }
      function a(A, t) {
        return A <= t ? A : -1;
      }
      function o() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      }
      function c(A, t) {
        if (-1 == t) return;
        const e = { type: A, action: t };
        window.parent.postMessage(e, "*");
      }
      const l = {
        lastSelectedMode: "endless",
        lastSelectedTheme: "surf",
        lastSelectedPlayer: 2,
        reducedSpeedActive: !1,
        highVisibilityActive: !1,
        themeHorizonTitle: "Let's surf",
        themeSurfTitle: "Surf classic",
        themeSkiTitle: "Let's ski",
        themeMenuSubtitle: "Theme $1 of $2",
        modeEndlessTitle: "Endless",
        modeEndlessHowToPlay: "Travel as far as you can",
        modeTimetrialTitle: "Time trial",
        modeTimetrialHowToPlay: "Rush to the finish line",
        modeZigzagTitle: "Zig zag",
        modeZigzagHowToPlay: "Pass through every gate",
        modeCollectorTitle: "Coin grab",
        modeCollectorHowToPlay: "Collect all the coins",
        menuMainButton: "Start game",
        menuPauseButton: "Resume game",
        menuOverButton: "New game",
        menuPauseTitle: "Paused",
        menuOverTitle: "Game over",
        menuOverTitleAlt: "So close!",
        menuOverTitleHighScore: "High score!",
        gameEditPlayer: "Edit player",
        gameEditTheme: "Edit theme",
        gameShare: "Share",
        gameSettings: "Settings",
        settingsHighVisiblityToggle: "High visiblity",
        settingsReducedSpeedToggle: "Reduced speed",
        settingsReducedMotionToggle: "Reduced motion",
        settingsOn: "On",
        settingsOff: "Off",
        settingsCredits: "Game credits",
        settingsCreditsDesign: "Design team:",
        settingsCreditsEngineering: "Engineering team:",
        settingsSpecialThanks: "Special thanks:",
        settingsModifiedBy: "Modified by:",
        settingsResetAllStats: "Reset stats",
        settingsResetAllStatsDialogText:
          "Are you sure you want to reset all your game stats, including your high scores?",
        settingsResetAllStatsDialogTitle: "Reset stats",
        actionPrev: "Previous",
        actionNext: "Next",
        actionPlay: "Play",
        actionPause: "Pause",
        actionClose: "Close",
        actionCancel: "Cancel",
        actionSave: "Save changes",
        actionBack: "Back to menu",
        share: "Share with friends",
        shareCopy: "Copy link",
        shareCopySuccess: "Link copied!",
        shareLink: "http://microsoft.com/edge/surf",
        shareMobile: "Share",
        shareHeadline: "Introducing a new way to play",
        shareMessage:
          "Did you know you can play the surf game and other great games from the games menu in the Microsoft Edge sidebar?",
        shareGamesMenu: "Discover games",
        newHighScore: "New high score!",
        code: "Cheat code activated!",
        codeScoring: "Scoring turned off for this round.",
        editPlayerColor: "Color",
        editPlayerBody: "Edit Body",
        editPlayerHair: "Edit Hairstyle",
        editPlayerOutfit: "Edit Outfit",
        editPlayerExtras: "Edit Accessories",
        genericMode: "New mode",
        genericTheme: "New theme",
        genericEvent: "Special event",
        genericSeasonal: "Seasonal"
      };
      let g;
      const d = {
          setup() {
            return this.getData(), this.once();
          },
          once() {
            return new Promise((A) => {
              window.addEventListener("message", (t) => {
                console.log("Received Message in " + location.origin),
                  console.dir(t),
                  null != t.data.gameStats &&
                    ("" == t.data.gameStats
                      ? ((this.data = this.createData()), this.updateHighScores())
                      : ((this.data = JSON.parse(t.data.gameStats)), this.updateData()),
                    A(!0));
              });
            });
          },
          updateHighScores() {
            if (null == g) return;
            const A = [g.data_.old_classic_high_score, g.data_.old_speed_high_score, g.data_.old_buoy_high_score];
            (this.data.highScore.endless = Math.max(this.data.highScore.endless, A[0])),
              (this.data.highScore.zigzag = Math.max(this.data.highScore.zigzag, A[2])),
              -1 != A[1] && (this.data.highScore.timetrial = Math.min(this.data.highScore.timetrial, A[1]));
          },
          updateData() {
            const A = this.createData();
            for (const t in A)
              if (t in this.data) {
                if (!(this.data[t] instanceof Object)) {
                  A[t] = this.data[t];
                  continue;
                }
                for (const e in A[t]) null != this.data[t][e] && (A[t][e] = this.data[t][e]);
              }
            this.data = A;
          },
          getData() {
            window.parent.postMessage({ type: "getGameData" }, "*"), this.data || (this.data = this.createData());
          },
          setData() {
            window.parent.postMessage({ type: "saveGameData", stats: JSON.stringify(this.data) }, "*");
          },
          resetData() {
            (this.data = this.createData()), gA.sys.loadSessionSettings(), this.setData(), gA.sys.reset();
          },
          createData: () => ({
            settings: {
              playerBodyColor: 5,
              playerHairStyle: 1,
              playerHairColor: 5,
              playerOutfitStyle: 0,
              playerOutfitColor: 2,
              playerExtraStyle: 1,
              gameSpeed: 1,
              theme: "horizon",
              hitbox: !1,
              reducedMotion: !1
            },
            highScore: { endless: 0, timetrial: 0, zigzag: 0, collector: 0 }
          })
        },
        h = {
          name: "horizon",
          stringLookup: { title: "themeHorizonTitle" },
          setup() {
            (this.gameColor = {
              boundary: "rgba(255,255,255,0.2)",
              accent: "rgb(141,249,196)",
              fx: "rgba(255,255,255,0.6)",
              hitbox: "#000000"
            }),
              (this.menuColor = {
                text: "#000000",
                bevel: "rgba(255,255,255,0.6)",
                bgHalf: "#C3F0F7",
                bgFull: "#FFFFFF",
                bgFocus: "linear-gradient(180deg, #FFDD85 0%, #FFC356 100%)",
                background: "#00C0DE",
                shadowFill: "rgba(0,0,0,0.6)",
                notifyFill: "rgba(0,0,0,0.6)",
                notifyText: "#FFFFFF",
                overlay: "rgba(0,0,0,0.4)",
                tint: "180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%"
              }),
              (this.playerSprite = {
                head: [
                  { x: 19, y: -12 },
                  { x: 86, y: -19 },
                  { x: 150, y: -20 },
                  { x: 214, y: -21 },
                  { x: 278, y: -20 },
                  { x: 342, y: -19 },
                  { x: 400, y: 2 },
                  { x: 464, y: 2 },
                  { x: 527, y: -16 },
                  { x: 578, y: -15 }
                ]
              }),
              (this.imageSource = {
                player:
                  "data:image/webp;base64,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",
                objects:
                  "data:image/webp;base64,UklGRv5gAQBXRUJQVlA4WAoAAAAQAAAAfwcA/wEAVlA4TIlgAQAvf8d/EBUPg7ZtBCUZf9S7u38IETEBSHcQggqrmGnb47QFsWfuPrbNCNaZe1yDCug2h+wzbZG73EUQOxKfNvRRzV2lzSxV4Ik/uHE5i84Xgt4xDMGAaKbMfeEQ55dHquxuih0FsIBx7s3MSeN8gH6dGek+WVgoakJEr+QtirnFs6jSV4gKO8LsgL4i/aiVuqAzIIpCxe44b9V0BR52yDHVw1cteOEU8SzOC5QUpFZEDxXHakEcLOWYFdDmB///+7ltI137q/f769J7j1Nsp/feNM65++Ka3hNnlN573FJcrheXK+49vbvb19JcdHIvufTeOfh8Xu/X+/X5fBe7gKTMfGXtBiNOvBJlijayBny0/oBKwjPLqgHwWBDnK8lfixRBaSUQHtIzOmctmtR6sJrfAcNhKn4meashKHikMR0Yy5Ey+hkASStRfiYwOluWKWqUjCBD8grkd5cyM0vZFOaUcCTNWAJ0iGhh23ZGkt4khZTa3YV2SqlmUlbGtm3btnlm7pFt27tjHe01NurqsmdSRQvbtrOx9eZv2r9etm3btm3b68jWtu0z27a9O2ZxNX8zTd1mZZKVCeTctq3qSXD7A6413au+jjr6B7T6vqQ8OB0jt6Z7+MXdHV4deRXurh9VaN2mBMh247Z5ACyKOgLKbiDJOi0rneEH//9zu2ktZs6f5/be+71wK5x+DuV0WsoMnfRqAvHp6b2HVNq99J7ezJj03hNKeuYOl3aq03uHgyma9f1+vt/f73lW2TK3PRZoefCJtxJjirTZBI9iNsLYzthLypa2FbEvshj5sSOZ2GaLZJTF3Zgdfh7LBp2r2TYYp+nIzI71LJ0ivGdEbA7GcvAI9g0sa6UJBdm+21yzYmAL72dLB481Z49is4LZbCLjQkwN27azkXYnVTJ1B/V4puOZbTdjp2Mba9v2/tvPtm3bv9i1PbbtgAL2/4cb6fufaNremvXatm3r7LvibNvG2rZqY622GydTt7ExcdtgIufVtmVSgrtWm0yooV+dkspnpdfqC1Ou/QHe0NsbdOr17eztSFzXvwqqj9Ld4TsUaNsK2krnvVeIGgum85+goK0xsxYv5v/f323k+HLT7nrPbe+997a9t/Tetu9deu9d6XV7771f5ar33nvvPbEJfr+f76e8P5/v7/+nNFj8yKE120i3BY2zzPQRjBlCTHURXbWWOZnzGzdyIqwsx4Qx5T8SINnTNJIJjAnZ8p41Nz6imOLICmgZBzkXBKf/IwuCZW+x4aMcwScajfb89BuNFYU7TPFK5DTFh3ZGDmTbpm3N63uebdu2vZ9t27bfy2zbsW182/+Htm3Iwbbt2Jv7Q2zbyWTbtm3byea0Wye7Xyfbtm3bxvt/xe///aBY27ZMmRk0Em0P+qfZAZ3OmWQRl/ivwSPu9Tt/njXgf8YhQ7sowLYatpWuoFIcJxVKt1iy4zih/jtjZ9o/RZKjTyr4CuvJXFcem+jJY7aYmZmZmSuzYzL//39mF2RVdju9I2ZmZmZeaDFWRMVMipmZmTvE0jHznRiOcco75hMz9RzzWbPniSYg27ZtOjqxbdvuvvcp+YmklRR6Zsu2bdu2bdsuOALApo303/bgAXnA8YTTTTQz38bMfNOVGS3JsmQ7im23boB4Xw4CkbWRiIEx/CBoJwwldiQwsFu3zT1yYRRX5SCsTveNzdIDyutyyYuSuiDlvLEUAH5APudYHtU1AI7cMcbesvKuIOvnka0A8KUp2J378hhKsuy4e2cepGCVout+2LV1mqDzxtazp6Aj8qkf9F46ECHOCbt3J9Ag0VkInYj0VYVgLtunS99wRHnFLu2pRZK+DACQ3CqwxS63Cmz24C8s0/nCMi1bEibUrydHeqKmqAiSlqgRvnkA0CwlpXK0hue6L/Bct/PODSmygtDQYBm7RhGC3OlOzAOXWwU3ulUw42ENX1je4QvLO+mrBpyemwMWfTaABIP8dTHA2nliFXy6A0U1WEpsmkrNfVqYUESUSn320wKD+sfFit3nPl+jZYEkP90bvAq+eahBkrX6IEHiWaGcGUYQGihZ/kBTtwpTuFWowq1D5e5/6xC5W4cqfGFlqxtUtGBHbg919A+rvxXkHVwngVx3ILEe7B0BX/RF88AKGSQ6UwD4nn76aWlpKjKYbv7W8HmL2tJ0qsmzKfRj/FQApPU0wAf/9u3XWFJl+q4lV6CQ905+ujd4udrFQuSbGzRn70kzR+YzAbWGJZMmLSHMXt6UjBwjCHHcsDOlyi7WDXLve2MKE4Rbh4vdOvyxFUGw4gbVjBtUMTRgHAkh5LoYlF/0/hJed8MXvTtsGzbMCycgQGBEuEAG6U4/liazAYL44FNV+pcG1yHp7MpUkftsm/x0b+CyhJ3zzg2qGx461Lou2rqTJzLHgkkNRtPXMOQRBKUAS3znT9h+9SfYXz3sYbeOfOjWUQ/doFZhhqzMtoekXqv/s7b971VPAdm27Y1GPODv3ulO1z0gaGh9nhhawNEAHAkPdakq90l+usdmupplkjIVYL3ROM6iHonuaJFZQvhzzYRK80YQRIZeEBhqEWbLvUEE/kTb90Bu0CD2Im+8FuAe87H8oP0akAh0N3zsx37sFxGZh2W4kDG0Zpm6QEqRkD+c/ddVz2kQ3iy9mpQUSPcGUloHlBNHWQJq+BLj9Lgz0QwGU8jyhHF6xcoWQmBPqAwdCjbJR8Cht5n0h7ed+Ju3nfCbt5n4h50W/N34Kn83ocpt4ir8M5KZO+3kCzcjEpn/s2vrNCB/aJNSDEA2BMERgHlU++xYWct80meBhZlfsfC/Imlq4sCJ5LY/h+kk5OaBTkGQCukenyeuA0pP9RVD8RjwdaFZQktCjsxhCxbpv2POl7500BgCQyQwENVUkmgI7HDlGpfgnxjedsqP3nbyT/7CX7jhijuyt3EVWbz4Ns4iJIv3zmpPRrTx1wXBWDdqlC+aN2WuizLfBCjab5wa0tnm0m8wKDp/StKmTXJN4IUPym776lFGBpKd7vG64Ke+Apg886sDaRQD7igOCPQGAvTI0oULFZaWAuE3zQbSt8750nfM+dLi+yz+GwMdofPSntqaZW4X2gIdAAQZQVA4bgAwJ7PvJ0aKxdskXfULazNX3CbpmhuuqXGj1dV4Ys8cc8z8Jd95A+cH7de83iAC5Lor49DtEhe+aJ6U0QLjFFrotICUKiO/+PuzR6mTWc8/P1GkTZqagAetT5x4cBXxoN1uHui024OQAcBRkAHAATt+Mq2Tvt4bRkwm64DKUeI4RuRWYdVrh7j9NEvwEOdBu9TeCAL36LdvMqQJnZ30aA3P9ZpA7jGmBbaIvyej1L8/K9d/KCvXN1VHEMKbjNoaj6YULb5rGNpFlZTD2qln/X9rp56zdspZN1pfZnFSmO+zjaDpnq6MR3RnHpjZSy8Q0iO8zjPdpKkJfJ3xKlFo3g0YAByTYoSvkqHeY7a6MJmd7VJK38BHFSyWwNMe9rCHPe5ppYHOCvd4GowffKg0xJ5/tYuFtSlreK7XeukRagPsMWaKLDTB/T3CLL93l5DNCIIgtO5AmReZamjwiuPU2pnHrZ15zD+6bcZRN9pU4EYbC3Fi1nETdeN1WTfMcVOJ6Sa5Jn9Un2gTlrZg1SpgAHBCETN8nZT1HqtxelWRdH/rgD6XUsUP+OSwZdfWbz/RhmizJHU0MTKrjiNaC2djBOX1b5UHGUFQXOeUP19p3GyOeCmH22bvc9/bZu9325z9brzlihfYgVPPQ7AOmOXSqBAirScbfD4WCb2fB2Vc/zhaixwXnDRX0QVCJ52kSAkQZp/yqagJB04+6MFMu0rdbnyqX6zp6j1mohmXPqBKYEtmd+2yVtzekVfceeDR55a4BBaY7J3mucDQwtnbCsLSpSLCJnG6DSSkb8f+47buf93O/Y99vmjrOTfefh67cJ/wetRnBs0FPo2Um74gaXr7J0Ug+9pQbLA/d8O8L11JBYFeAUynX32OKBJBqAkGYdi6pY6b0ksMADpUsYGvlbbeY+VTkyZBO+wOSw3yZlueYIEY10+K3RSBoYWzpwT6m+9qIJkyxZxuQ0RO367gV7cr/NXt838VftHOk75o5wnswm0iMlYohYfUutEmLY2QwjWAHhBr7y/hgdy7L8B+Pyh2enue9GGy+Dm0Fr2sU0iREiC8/h42JeSaLOLkQYooObP5yW26eo+VpUkqVLlpWNdN7Ng7YzqruVlqxg8EWGReunSpxPONLZzt+a4vwgmmrJfyQcLbqqf0quofty/+zu1KvvdFe474ot2HsQP3guPOG414gJGsKZs3jcSMKgUqlVVQLdE0rxI96STGvn2e4Da3DBsCxKd5T5t/+JKPAhYE5X6nDRAnL4miJjhOFG47uHSYFWw0jp47AKhpYolQMUW9x0mNxCTUkkJ41yVit2k7+Kzm+kMjH1rLb0+TMO3Mzkb0Fs5euJe7VrPYz0wEhrbQBp+NKZfbl33l9qVf+qJ9+33R3gPYhdtFMFYgCLcYyG3OqFOAedv4jv07MWm+9HSInrR843rLK6976j5kvb0dP2xcDzHebvdj3narWw/4KEAQXuz7w0J28qJoaoK7eOLE36/00/z81yM9Vq1adfLJJ49d9dzQD0Sh5aeSeo+VJT8hPw+OBu8qKj9LUT6x6NEb2u82bWc1mwWsYT0ovSJF5Ut7apuvdrGweQ3P9ea6Zz7zmQcYWzjbWcSbAx+2CO5zMK06eEJKv8Oax5z7RQd2a2cH7h11v4dZg3qnSGXtolxnWhpw1bYGfTVfiC/VXMJJJ23cuH49Zr/yldddt28ftNcugQqpeWVypfxGqwCm74GkKYz5+csuu2w9IDQnwz9KdnS6ms0/taj2+Fia7bpykkNJUejaOMWGhsaNn7Txk57026FScW3w2jzS2vWg1MrTRg2jNXOc0MymhZVTxPcLJ+KP5ZovIh9akzWfF3OLqq+e8jz6W2PmoZV1nHZItV3VuxTE33HNQ4LYu3B07sWx0IoldSGAGl27ryimhmy2drua+Pa+vIpLYO7QWCVyXcpe6UzZa2xw+hc9vyJIn4mX6ngpjpCX7HjJQ0haBOCBwJUyuwl2uzJ3DovE7mkltIK3daT2l/0hUQsRHQ/putmOTbsOQEuBfiHv0ipsVr7Bg0dDn9rSMLRy5fODQKm4VvnGETGeP5wIo3Q9KC1qhwD/ruFUmDD9oXXtmELshcklkfv8LbalEZzQh25DfnsGJYrQzDs2gHsiiT6T/5Ew/bDEKVkLfmXzsksU5iiVuUdPmqPr//FGK8DDt2ucjJNOirA3rXsDe9c77wpyUF+Jl+l06+ZlOJ/7nJfuCHlpzhFHPOg3SoXwHlDCMH9Zvr/LLrnkUTA7el50DvvPSETkuXbcVpS20Qre1hElaSycu9OkvHE0aHZNfbGIz4Xa1WlUbFY+diXUK2O1ss6S/8+SuoT1ZIzMNkzXfp6XFs7eCMJ9ftPjcH6Y43fwfNxofcANu1S9X9mp7B0/9zM6W3tF75iWW8izkuQttkLJvKbCXWHLBj7KirZ9AjRbOxArE6+lU2FrRxZNZSU5cH/NRRBlTsj+x0Se+kpSFYxQCbPOA3GmeS9iH3j3Cze+cdA+Ei8fHePloUe9XPTuu14Ocs7LRl6281Evy9GieDcMo1fBfCq17YOXXUIFposuYXhOdzc5dBFaB6m0ukoreNva/GXjIh3ZI2W3a9cB3dOLISWmykzNd8GOUBBlqdysDO411CqupTeeUzXTuvZBqCxdSiL8JIZpb2qcx3to4eyPIJjpepehmKuw8dFcrr9rSxhmlu7RTDO4K6qALy0oSmqJAM8qVMdgCh7fu64S7Qft12yMR4vFNNfhqdetrw1GHIPZ5oXoH39k7J57HIe1jfpTXz4gSNC+sYlXRrxScoJXQr7rFZPlvGLkFaGDvUL0pS95BUjvAR/+ykv9t/IHo3mTrcv+OJ8hJPGcViHdd99AhNbBFqK0hrnv/p0siuWKfz3SY9wjD3cb/DBqiibtSrVxm71tlaKgVFwrEPNWY/IOtyOZA7y3cF4aBEYQft75b2KVxhoPlEMyVwcf/CQulvtmKR8HDZo4lrB1hCtu84VUcNWvzyp2Aa8d/AeRIoF2x0IRcOmxZIOAvRyFVgIm1JajbgwOnNQ0TV77IcdG7rnHcVjbpAcFmaM3nqN9E1P7ZtHKWQ3ZklWTW25hVeQVVolWYRXofFaOfsLK0DqsFOWKtIoCoQFAafvBt5EEnrt7lQqZZUBhJGlLGTf3eondNYdpiSHYyjqh4G7NFdeT14mI8Yfz6kU2q5lVWGhucD3hJOoOOMB7C2c8kgC/St7npi3iB9SNnzv3gMW0zkH18+l83tELuBJXPy+FLySggbaKYyFYewwUa2N3GRRrtq0sNovvXENirNLgttEmyMweclLQkAipYIFsiV9jHFK656Z/7MDYTfcEHNY+KLgUNTffzuitlOrld1X38NWlPWCZI24DUI7EWliNNbPXWRPbjTUy1khYA/kFqycbsDpyDaslT+dIMDtd+pQSdjVJoJwoD6vfzBMlPPiVgfhumm1SGsOWFJT3FxN0uEbHXb5rOBV3+4BErrazmrVKE9cTNiyR4vYBJD60cDZHEhBHECxLly6lUEo+o7O1d/z4jRN9Ux87hUnOeUen3NYMZA3dNK4swNuEYwGet9tjmWtnzpzZ1sYlbBpgNTa4HYuAP0UJ2NS+zUBivWmhmOOVewpBAt0vXw6dI00W+01WIaUk93iUvsGnfZ7/fPWwNpb4uFf7/wzUG3/5r7qyynE57QebHJKSl/w+yl/k5Kx/5z1LYIh5WL/3EuvzdmS93l2sx3ubdXt7sS7vI6zTY52MdTDWzq5nbex51sq2Bc8DiGmKwq5GguV/SNRCTEqYxgDgBTy2friVJeVbirqTzPOILfnSN2fnSOnF7YZF0lsSQfMkC8Ks5sc5s5pthPfmY6M7Jm67U8Y+HKDJjDvEojzR2MgIXc5sJfn6Az6js7V346FDh1IqjqVs+caZgGZFUo4OXMcq0kw45WvnQdM07V2REOh5bWLlmEtEdHpRG2NRtb1r98QANruWp85g7BRGDVIshPmNgZUrY2XPHsp1KLH1pjXTltEc6SR/bRgkucdptucrh7WxyIGgX37jYBPH5bS/UWmfH6d/yk9N4qR/j/Brn/Ip3vxJTDff6b2Try7tAcoC3hykPM/ZuGBj4j42Kv7ERsS+bFh8gg2Jf7NBwQa8m/HzAJEQzi04zjb+rCXB5D6wRmzvNylD2Cc48SAjqfar2z74EkbmQxyxZS6NUTKpCMXq6lSwSY33NrNGPWrXE4ZJbHCTqLYZzN/GtQjN2JEElKWF7J9JbrmeK1cznj/lWFgMqnPHsM48mDtowVQiLrRwFpAK1V0VqcUsJMm4UD14sEl/WJkOuZanzuBgYDDaQCDN1ntghWAEMS6lpx/96L82DB5N8JmNiILGyHFfCAqWkY1SykUXfiTvLr70feIL/9uvLu0BrFTA58Q7fFY4PiP4tGjkU+IUPinYVMAmg6+wCfEaeB4AIoVpwqYpSnsuIWRTC+Cyyy4jcHp3FnLddwdOtWeNQFOq/LZtCTZzPWLLUss0Wu9lHVBN3F4coh4JlZZE1LIXK67NrIo4BrhHBiAv6KWfI566GmFT726YxCKBK3R5smfO5TgEmHAvzC2pBstC74xzAZ3vCp2N+ase63rMMS+igjnWbWMJXbPdA9DG4NhgrETHJqoE24j139ztsm1bJN8TpRAIZRloLI2lzGAZctFB82xZHvGV3/VWm+cLEAtcccUVv+rKKpmp8eSvETzuR/Lu8oP593HVLJQnD2SEHORrAV8NvstXgmX5cnAGXwr4YrAaXwgu5PMBnxfvvCNHi6YXUt4AG6VC2uT9nGP6Qg1Evx7pwSQKxUOGQg9B/sJMS7djaLN4HrFloaMar1IinOGmgWixWTlBnYQe2ntqEognrd9mPWFxRWPTOeKpqxH2Vk4uoSq2Z2M+TYvB7Ny5B3NBHpzOZyaHq3G4ZtAcKhDFs2z8Mo6PIcFN07uLOQk9H6vQrAIGIxOVy6sDaYmtGlAKuMz+Q2C6Xt80sL5U/AGhkzxd5NwGZJPq53/lz5UIAyH6dIXh5z+66QvitrdyQtL3Mzvh6R76FwifJbC6CucLv7q0h4enbP1F+Bm5UAV8T/FdtSLfUefwbcW31Fp8U13KN9Sv+LraSEbF46eiWBWUZJSSNI3xytb0hfbSvzLfjql8S8TviC0LFRitEyZ+Lw4R2kXpViuDf2V6TUqmdNUpa29BLy9Ma+eIZ7MaYW6IzP2exP0zEX0mqClffiInttxOPXdMSOPxyvDauVwEalx4K7QClcqnFhw95kVvEdXmGHouVmxXg2HZun3+q5W12LUreBHifXzAVqHiGgGMI13srGLrv7veZh1+fofz67bnd7pkqaT7pCyaQGxSndy7nOPqUGg/6cljvgC3vZVr0pef+ccZ/fRnKn/2pvVf/Fn9lE+Byxe+O11HMN0NDCSb2vipuYCfmJ/yY7MePzJX8kPzO35gNpOuZUWDuoVCIqjiCwar5BjPI7jEQWXe64gtqY5m0s4F99eGEH+vaQ3XuuEDAKWlsIUKVW22uBOmh8otyjZYNIRysPtnsgsOMMGkiuhaPHBtHFo0MWU20FFhRaBWrF1hVMc3mO3M7bYHduRXohHWb/OqtnbbekOi4oa71i+HdaaAd4X9L/6A9Vdemf6DCiRWd6kG9KJ1LJtDofnX95ayJfX1owzeI0Nvk6u6ZZJPt2+otdxL30w/DE09ez+hQTD7hg8H8IyNFu8wzLnDEGf6HQY5/9vDXlIf+rAX1DQpBDfViEndvhSJYPv1BKiiQeUyryO2pDq6v+za5fHqELNlAV7SilwNmVUMiKeTSx7hq0dilYVpfx9J8oiCsB0usqKU2T4103yQChkWB+jtuBpUsR65DtrGIKbiG8iYgBDt7PshMFr7NgdoY9C0SmJ7BGsGK1Y7GFc/rmqP3wZUlm1Y9SqxO2A0kGrf/7AmjjcsX2mXGFu5fP17Uw4b1w9fmU7o+xw6BRDH+i7VZFi0tuht6zkJO07re8sXXj/KgCQekrBh/geU5m7SR3R3y9AvuJKbPX0cx6CzZ58yOI45GLzfKYM9m1VkwATniQPGOQ88sO49RUpaQeZnt2p04q/SSyPFLrfSvQKw+0KOO6tYof2VNk05YsusMiN3Avy1mbrWA+Ne+yGZneIVJnNp3HXa9tCU7qJQrCQeSYCzf4hJgclyXo3WG2CpqmxiwmMMqIWqMZYJlfb5gXZgAjG1sARZTZSBG/1Yvt4jNo7tZQBsY2SlGV94EVL//c1crm/bVsYth/yg/ZrhK7Nw0wKICSpT4y7V79Hyi3PM1rlEz2lOLVrHsbpJmkK97y3rTj6khyejeQ4Z4jPo6GMWhoM4Drr7rq2tNv0jrTdKXwAXT/XdmHDS/VCXzuZ1AI/h2vt+YSfF4oC5uKes+yZ5z3SqrJQCs+pRilbxYCR3fNncijlgowJJCUdsmXTEUu6bw+f4sWY7JqUqIGvdyWqvsmZU2yzyjIHV1yTQPGWQkK6NRSQdSUDjssQrdw6KpCspajBGgSyNjbFENXFkFftaDRw5ERhwQm8TCTJGcmNwx9A+Bjwa3sTGvoBHaUDHsepXguUgpnG84Zu5Xf+su9u2BV2erM1NQ+qmhcKSsH/unFa05jmom6TfaPyit2rf6x16dtP73rLey+tqrJR08a8fZQBtjods4itcva1Bgz5BXVR2QxG87yM05cZeOkTNF4S3xyi4e4EPdruad9lKsTiAi/t/plN1pYjAOLs1oBWd+hClza3LL+VlwEU1uuoyLPoRW45KPWBNENetSrvIqzMdQFW5/HXOL3VgxcxxhkoKdvQglSURaROX7piDdCQB6v6ZJjlmrryX4B38eINrwpaOHHASuCrxQDSVsTFojbZKAI3QBsH7OPXuA5uq3LhcYjk4lAw2xarhhSn9u2Vj0ESiQc8Tee2xJbrseA7a93//DoknK0XrOFY3Sf9zd9GRYu/Qs5ve95ZlLx+/tJGiHNYM20Tgm01/cbf0hTi6m23stbXVyHxB1YAVeHMglJaShV7xoElhWBUvGg1AmSOybhudB6l8xJbfnJ0Dkvd14wLI+94lvMwDrcNkHXBxADWFWCi9OsQutc2248JaunSpUQe74m85+YvOf+kib5TgEZNCZLdcfCxDGo1IOZIAcyZKjEcsYa0sCT6kwVaKr0ygC11wpzsTWWop4aY7juQtWCNVBmZHd/0GwdVdu6DSHpgYG2MNfErCcmC9z/qNkeWWpLz119ZpPNYTkjpoGDctyzKN93wi6odsHM8OAux9Sylax+omaSqSX0bsXt7hOUrfW9ZsRDJOGbPJ5VzNhoHUDFF7ofbGi1/8YiWIKRg7diwb41NnmEJxE3Op9IES3jLp35YLUnhFINF3aQlDj3iSCJzd2lCLQh1Ehc/R2Z+m/tWDYKQjthztoAetW59O+66WvhZx69ff96azyakWItSxo3HLV3DaSW99/n1/Zakf4skBudMwLb6jnOGta36AtRQ+GNiWrJVPMHZhNGRhm6+DLbe4qYkqzuXGhGUiVjVCYJ+w/WA/I4T2/6lG0zaVaowQ86JPIqjrt/myMRohxdZG1q/3Wb8eqWvZYdjgB5hOHHtH9r4li9aiRL4KC9ur8e7JeIfnyL63rKkB2JkJ3URlHLZC9qBU1O5DurvFoLHTx44dS/YX4y261c4wPenS2axU2OaXJwwns8DzvJIsEbGpj7hrsMHVo4w0+BydpaPOAmOP2HLDhrC3iC+Xq2NPcnqBJe9XZpp0CPJXftH5Ly1xiBaA017Bswt2FFk6AqcOvtCGaXKMeOqIBpByJAFmpjnzdJKf8rAHrKx83nFNznWhbcNmM25XdIhCB6P9aoNrvJovZMJLDUzYFmKUhipr7rAdJqwryHUMAI3bmq7smsexcJVDiRDd6KaIvco8IoVQ/u1Xbowbm9bYGImayE1LmQ9sm0IKYaXv/aDRiuOO03rfWjUErFQSNeK4J/ZqvHvS0PeWN4LAoMOHYKp+yVsnXFDVzcqtnIROJ0nEFAvIPGkcJ545O4hLtJ91C+rHa3sFIaE3S6ao9n1ZolCPK9317ipsjs5WXZaOGw/OVdHiIW/hEVsq9OeNr2/YQX5pJg9MtMVdIHk1R4e4G9u4JhAQjhXI4XtExTDN31H2Q/akC9vX0lJ5/0yTxtin4yAH+EroRsmAj7VikpqZiO83kxT8gCPjhqQnLNXY75GZF/fu9cvabA8EHRuLxqatB6oI6lkwOlFVVWw9Fm8sms/aqDbhp8BebxCRRLRhYGMI9StJj4JE35cvj2hON5aQ1umSYs8V7yppO1XvwEXrHYJQmtwTG5JhhThqAXl57SgP48YpOlywEZkPgOAsS93X1lZjtuvvDpXOqF88nSrHvTB79uywtHz25Mnw6gBLl766ORMRpBeyehU2ceqKnKOzVcyiQwsV2OLHfcMRX8ZDtoyg3XLeS5xAMxwba/nM5UMPDV4s9M6/25kNzTZUiZVJ/o4yD9l0Zrn/xjfG9JQTWaKfjkNWnvnMoA4TWEHXTa4qWE/d2QqdVFow0TRxn4W416QjIWU7hdTAQBUt5LxzqRonxoL6nB9019iYmaiuTNfBjmyDHnnWWZXZGjVultpAhxGAChlWbA6m09iOLF8OStkGhowKNI0hWNMg7/mLl+CYwttcAzMB8Pq9Bpfs1lJ2qqbZsWcPwxZEa3osQiOxELGP9RCwq7FSTyAtDRkynGVIiI/FQ28qgJfhshJuOaF1dWP7u3lZw5pF99ixIlXWLxwFtLgmT5ae/jxhmbU3pkSTu0FSAnt2T7rIPwMFvHqKs6K7/t34kuQdSLM5NnvIQ2ClwYENpwL3hSPOe3GEfN7YQhgmRA21YWkuJbiQFYk1MT7FKOS/o8x9pvPKvcq9TKH0/TPx2QKlkKQOXknYHiusdl7MIEszMVuw66RGWzDRwIamSWLgSDcVXKj2Qs6JAaGE2y8HdsUJa7vm8cQAcn4szpFHomK3uHOIUHWoI6h+YjmxZC6/cmMAldWgRX7Qfk0SUeL0r44W2BX43Y/8iL5TdRuH4VqCP02+jNi9/OrjNS46Umyq3tjYksCI2AUsoaVSCfkbdPheGMbxuHEfZrlvmMd9sOOS4Nraai/uhmrr7/3e7n6Sr5ZFE4G9eLHWeSCEXbxoei5vi1649v9ACW8Zk+KBGUkWLbziklKouiFtz549XI7LOPYQTDUFrV8OR6ylWo1ffr/nEe4dZ3DWJKKV1z7/gYuWTArxJeX8u63L4jamn+j6ZRfWFk644flfsmQdF3e3yGcLSMQuK/2ifYLsOAMfdVaMFuQbid13DIamMcTjzLItOKnIO5eqgfLSvFCUpUbQXbsqvt+l8AOCHXl+1DGi2J+qOmuvG76DF4GoMSHJxmBZIErZaG3jRg0mKoGw9y2/hIWwc5iMulM1hOGnLmrCarx78jJi9zKJ3thYM3uG1Qwhu1Z6PajkHhcuZz5QHsv/Bh2+99TSuHHxuOHDmXESu+y/QZDFB/nd9uHqcnf9NGVe+cG+t3RzSZv4THUwfLUsmlDCsLu7W6hHWmh6YNddCTjmA84gXLrU9hBM8e7JNi28+hY2uarOnjJHZg9hMNH5RlvQ+vPMSeaQt3oL/sqGD149HmWT3m4Qf3uI1W95ryYrEYaef3cuwmFyXIrB2zuJcGHR6YXhoDoe/IhfllXyKC3WE1etEpErraVcq3TysHHrIACXXrw4pb+ok+I9RpjZFfdzCInwM3hqbALZunVrAo/etYtPWFeBsyJBQ6iPGoQZPOceo8DajVpiY7QsrI1KJtqBjdTuJlHyZkG1h/t23VcTOxLu3e2g7lSNloBF75XaEm0/ayRmaoCWp9LQvo/19ccSTTZOEnih5atl0dTf308+/iBeuqwoZNMJnjPj4Yn4/P3ZwQ/eVRz5X0yydLbtEZjiePe3Tm6WRHlJq8TxE05S0G7yUwp5WppuT6bMkRmGu5VsQ0ld1xtCebvmeHuKsWuJowQxHoDMe9BFlclJ5Tz5zZpM4tkFS6YcEfTChUHf5tbvEaO3uoti5iDw4HcNp8Jx7IlLl6ZUMhF+s2qbdAiN4NPZ958U7yrsW3xh7BqrbIKmxpCtaFrYg2Wr2xXf72EFNifAB5eiI0fGhBU0Ybi9jwIXh1FReA4YckStU0esLrf7fYhOEEsHVKBUItYmr1pvvbWMn/tb9FIsXWFoQalEBWzR/QdC+bvIZFEN0cvj0ijltg8BKmIPgy3M4dF9fWRHjxu2Uc1wSox3wq+WRZNS0uacMW+mCE/us89vYnMnft67mRrRAx7jSWkK8vCCwcH++yem2X//YOlS2/PwiEmTKL3Ncbc+STOE4oaos+YJ5vfs+TXEGhQ5NDtGSTRZgABRG6u7RuaYBz+hbJb3ruzqHeRjhWgPqfeM9xIk9Kk4/syn0co07nxJOU9+/Byx8p1dMDOPSy/9UqbySTsEi0w6ji0dgSPRS/gYOwQBE89baoeR7ffg69ZnqEZsRod32BTYbh7GbIJv/xLYmsL2y9tRzzqLcdZZ0cIE9t7zQ58cPXIvmDLM3lSPsKrJ3ZAjFiWMq9V1AJVDDUmIFsSJp8zymBES0++746JFi+57X8BOycFru1XvsENLSzhv5cqVjFIe1zGqkSFQwh4ShkeDXELVM5+YdqNh10xUGj4ExgTWdJPIkrZcMt3dbxBkqZ1ZHQw77AANoMbCpNPJ/qKPW3fgTXYlofn9h9peIRZHPNy1rq5uV0rCUsvOL2NzsHtsL4oqhqQNAnntY8j9HnPMMatSyt+gyKGZkujLqAUQqevQv5ju1kaKyXvkI9+amO494710H2lSJlGU3VumcYvyifb0u5//JUvsBAi9NYRTD9+jdtW+fZx20g6HHv3guGER6liDhf7SJyZ8jB29xBZblEk51bFQ+Hd1bSImmEpdS4JJ8L0eVuQhIeC2o57FxFjgxL1nmX4caWTviTByIpGkd0OOWJRG/YulqK1SHDtC9NoJE81TnvKU2ac8xZmev28NPJdk0aKuFquFVhJ6nAjCEPjPFzXhAQ+QjY11a7FmyCbDdQJ6/rhxP/qjPzoOvukQ2Cvb2rBoraD0Q42MHftpyrxy47FkGHpj6dKl/6G2V+CeP+rqgqWzicGDBxN1S/djs3lCbAw8maaKNlq/FCPnQvOqhyhSKlow0eWa6xVMFrULVpaFmenvO4SGCfLar+Z4zK+L9mUTBRnDt7wFo4eum4SXCJwAYU6e9n8IB+TureLEDuLu9W+Vh7rgt+FLVwUaKDRUEj/GjqaaVfacbesn5uTsz2ElCDWlspv6MClCnfTP6HxYu+lInhMtLqqNaouzd69qZRkgOuwKs0iZwBFXOqMNABlzsCTHjae8xe8eFz1lNuQ7y0Mt78KJabqWFrukA+/9oBEGwDxmJXKciW8WuuasKt+VYLhCzZDXjzJkiW9a84Rx/52vP1Y4QSIp9s5OdDr9BkGWGgikRJx6FvBikrHYB1e3R/jIS0sppNJ2THOKB8+mKvC6xPfDvqdtnoDe/GKxZkImeDNFFc34F1r/XJNyGnYSJFlmgGQOA2daN6jCnJxfF+1r1arHRJlDtxu0YO714c/e24hLo5fyiQaYj+2yykE8OstUwvktfcHChep2vyim0HGj1upsAdQmmlXTaW2Sdz0qt4mHGnrOnAo2TAmpCctonUQ92g56pCdjgRNPjLrX9A1XnYLQKwKKuFVrBNnzIxJmnBvHM1ho9pQgVENeriA1NTUtbKFdgh/wgAQkIqDQQJuAYmRWSL2mS2z4EOLdC7UUasYNq8SlIRzdZJNNbBdbTHB7pzqpkI3uT/PKQ22ME/B3W0Ndon+7D9FU2G7sdvQkrxbTCXeQnoKcMhgP/Z+YhnugbglLMT3BCxPeOrmZj+x+0EzrnNxzuc1YxEmOBhVDpvOOrfkBwPogin3u5+IEeGGxtWd2H7MqErQo/jKXbXJK+OiPWFjsuywt9xNTuvHGhiq0NfC4P5gpVciH1kLUfWLCuMITM2xi+lKVJY9wqEeR90vk6+tExIDVn923sqPvvQIor1n5u/6GOXaxfRzee39djzpUY/AwkZO45a2qYsTJbDBMoJx4Iprs/iJUDWNAmcSiI7TJdjbekE79o8KOG0+5yPC6N6nfdN9ZEmeuP5ceUWCUc8427Q9AhTL2NS+o7BAENuE3C11zKDdesgzZrjhIHT58CAEPK0OeQDZsWFh66iYgQ1rC0BpRqEa6u4FRdd2wT0F396gP0VSUbNt1h2HgFRpKvp2Aww3vB34+xL6nSyWrJwDgyid4R1HF1oR7cs7FN8Eoow6C4WXz82UGve4A4MhGCVodXDHwZm8s95PEdh6zKrYVk0XwCi459KGS/sQb//5Nwb9x5YR9+849l0xIVWmM3h13QHnxeeeXLNmlpP2KzCqZR0gP6rgBpYZCf1AyX//WJw35/cKJ8CoLF5IDke7NWNDsKyPYrE30yTfUdf17ZOZFhQnG3r1pM4wDsUu3s7HQkiJ1mSCLjEqgAWmDL7qdOtmebHd9U0DgomgXde9q9bXHlmTHOZPYJloET3ziE1/84hfTIIvwxkuWIRA0L8oRAoLhj6kZwoR9fRz5UKZOXwsF3hQ4szoYuq+nK/cx+grd3d2fpsyzcd3YbmwP1j1qOxZokOyVEikf9yEkJw/HPYSXA75V6Y0p0eTsU2aHdrAv95PdDLGT771IsWtyjH7yMVl+KAzYgpwS4/tGgeuofC5MHvOTxHYui2AviuHf/L3BR3/0v/pz2r/wrVRO98Ib/Uc8e5387U9euDGlc8/dR+TGLBMiTXHVLkLbtgF9CsuOpxBMDqiykErCMeLhG9ci3LEaCv2bHofzdSJiLOGEIUNKGE7StNcJ9E3+sTFYPncOJGHaOAHc3GWZRujSRbS45FgOVWCWwfEjEifbyxygvOcvXhQQheOOs4X2smZ9IusTeeIgLMkQTBIEgVclLpujxgwfXsME/G37WLz1uU16ZWsdCqipE/Fpyjy8lxcTwkaNy0q4ZZwo0SDK+z+/YYn73uLjPtA3IMCWzoa2x/sPsjsAYhJpME18UYU52g6PzCYHIEzCOEATrQdVkNRB7xeyI6uwB3Xeodd1r/i7lR96xb/wrdT555//ildkwA1/8uTJf+yrODznJ2YhKd31jeecc04yu2mOZitWyfGAHHdWDPFqjJ4UQRWrshvEneiM5xgU+ued/yZw/0zeYDGLcn/Bwt4seragNFLaLXBiTIwJxFTy9HJZg57l9YjZViZlIv/qUBRWBYhN5XD8iCPE0QZwfCqd7gOfYixgzCzWGs67jNi9jAHIDuyjW3YQphJ4LvgOgamgkw82eL2PFhKGoQd//f2/93ukiV4uE5S6P8pQZSxTN3ZsGIam9sjeCVvEcQ5b8KjDYcDV3aQ0OaXHilJpd/LlglLJE2IVu4YC+qyU0s2om7AmrMIy2r+/78h11yG1Hg2V+93v10X7WrWKKZn0zeT3K36QzQHktimdf/692F7zt7h4tHsyS0o3pqt+Ip1yTqoKYSRNWLjQccLshRiMEme38j3wZ1FykBw+k6XCkkksHKwAdejChabQkwoh2zJfIQFIjI257DXhu0zn/LNcsc0cy6UCxDI4jgnB7SOM2+kE7aLc1fDaY0uarai3/sdy+Q6SW/LsvWHDQu55+jkffuM1yvgEF5ksambxmvNSaTmMRKnBDc000qNh2fr3WA5q4e4vx4LQlmbsgOs3pXgv/CgHO6Q54Xchga6n98epQgtCkzP3lrE3CnRd11jaLSLdmjkKY8IqEVSBtyFUAaj1aND7WX3n8EBR3xve8cdmfKa7xD/0iQ7vJfee51xfhQn0h+RbXDwaJcgEJhUV+dvffVs/dKghOHAgGjauL8QfMLlEqZrZ4jx0p2TJbfP9LSlqjDj2BZdCESb9GnoaDvMZlFtPJAmKTW3dmuF96/O9LWuBx1t9y6e+EEvHOC67ncHvu3L56b94m0i9jVkTtpC7X4Gx6y20xkcS89YS/GnyZGTyZIEP/+QuX/5Uhaf2IUI8vvAHofwm5f57E7Pu/zRlXnkV6yNkBwFvEGSpafjzb75A+Hlx+P/999/V1sLS8t1PeKNlBhKDg/CcxGYS/TcnBNtC1E02UM7Bo6CD3gRruWlMCUQ9+tjHEu3E1GN/XbFTOZuV7gc80CT3cuktHfZnpOtOKtOhQ9XJAfvBbO06EEmJkqOezcxCmGbGudouTtVHmeY39Zdeapn0SxcnzaPNb7CVJgwslU7Uvaxr43Dw1rM8KgqxHJrkdha/HUNY9CEsHpb+I2/Js/dAHskSzCNZS/AnIYln+UYYtvT1PZUPtwR9XqoEHlHL1gcpEgKKBP7IriRBII73rx39f9ddrTPsJ13zERIGy/fgZwQFrALZCIerhCk46j8Dru+xQVAfG1NR8sImCnKSvlRpZps10GUW1g+N58mPQF4u0K1DjxbeVZ6UqgljIJEY0nH57FjoSddPa+DcfIfyRISnsvymgLWbIOVOrLOcTJpoebRYK3/6L97mZ3yGSX2GxU4CLyrlIpNF2U/8RKLnaU2E+fRvNvQ3DTEikASBTxqEWj23hfmnPKlw9NI8cB1gWWVbgT9JbCaqyVEbzRNWyQ6XhQhpXqzUs7OPNTJr5FriqGY2v1W0wAspfYuLR7vihCcdKrRxCDi5XGiYLBEe15Ni90LwbPLoBysscafD06pleejRsYnF7J/JKQgYjDzM3yT28lSm3xR5HC42cE9NZfNbdXwq+p1HiZRJeFn8WoxViYShiPmmioC7B/Mu0ruTagTJAsyUil09LKWvVcTy3XcXe9yPCBGfkthIiPOGBi+tmbPwdjy4tZ6WRnx5bD7aVqRFqim1DZSiSQze9jz5vWleN5Qr9eD+ZHzw4/Sk68Zk6hz4Qw89FCfAndiufYwd8zmJEwsI3rXnMFpROiWG7ax+TwluZ/WbpfSEx2T/hC4rpfj8r7am+vz8U93VB6ZE+Ka25oEPtXbHESN2ZxkxYn/EpyQ2FcJTc0yau3B2PLg1U1NBSD32WuKoIhu/1748uv332pd3+dS2cNpWe3+jS1hHeJ78yctoBWfUbJit3UNmAEwefXQotIqx+aFE/tgtpApTUQp3vCxYjEN8VMWSIMNAksM0s6uX5ju6efQv+++//wiW/fdn/E1iA01mPXkDlJNTwU+bs1FZUz/WyYmpj8zG7Tm5SenlR6i6rQgzqXPKZOEhmRU9jkQ4hRY+xo75GXGWlC7Q6aLL3gPCtpCau8QyTGYkSGoQ6OKzqjuBeXdu+2sS+p3EhpLqk1Gq2U/HM6MuiJicSDaVk4/d5ZRRmnKjBuWCQzLZtGNKoScnMTV/lCjn3QThFMhYclSa76oXtdNE/kwKm+0l2Gsvn5PYVBJWSwnDMJ4ZdfGRrmR2OoSMXFVjbAGOzi2Fnj9KlPN3IkgbleJ3EpuqoP7l+lIwG/VxLXHUbI8CE62nvk+idFHGiiT43/PK5msuZ5Bs/r/35S1z9aos4M/r+p3jWSxxBz5LaJh78weTbF5lGXw5Imnqy2NFJZuUm5KAkvx0bwA7Z6dEvdZ1Bz4Tf5j7Exb5pFRVJo4/SRgxoH3+LgrdfMXuJA1aeh8F/DElnPGDJP80+enewFUpNvfc6w6sP3oMUNyBA3xqvtdtnc2tzO8beIqU8VUYFxb78kW7UhuWH/zBM9Btn/GDyU/3hiz0U67Lcmg1ds9sfaNI2kOngsUd2JF2+1ZG+katNJkvwqaaW5nfzXgeRaooBYf/fSGaGr9QPvozca4y5A1/N6ieId32GWckP90bsrBPuc6JyT30ugNnk6hdDKQiNOyTWmZmisDH+hFSv9pZxUhfqN/bKhmf0GT+KqEWtw+5eNQ6KMT1BB6Wqkph3YELAO/pp5++EO7fQd2BVZ+KT0i1biM0qv53NAg5I+np3nCi85RjqerzomdmvOMOPNNKIMIumivZ984aU1jNpXZatbdOyTIwX5XQituCV4taZ3sph4yv6q47sBih6g6cZy/nF+IO3JRxbydu+50rqoA8/OGpkO4N3eLFoI75Z3I2MxMg7sBMl35GgTrL9ZsUDeCppgI6N84kPwDQnWsMUgMDcK6/6MJAzB/YsgVORGX+yQ5R5CghpEfhpOnLO7+7H0laXndgesjW6LgDt2WUVVSpLl6suO3qj41nPDzp6R6zcT6o2dnOTwQkKWv0ZOqgZwQYz2x+o0iqa2b4zIRrHupMNTA3ziTvvvg1W3duYkBpaXx8POiWav7Ltt9eQ+r4tI3dYvFVLC4TXHfgpqU66Wwdn2mAJ7P7V0PFu+7ABexnWSj57p7xzIA3ilTcRiC/p1L2HZ2JteoY8z25FVSBvDPJg/BfqauU3e7cVK1Exid6XX35OAUyutke/DxzM1GI+LGLRK0XfAXPN3RoEADpWNx2Qj/o5klR5DLAdQcGxd27MXg48aDqbXm4X9cd2FLvcbakfKZd52yFA03TaHTMOxFllGyBRWqYcI07MC+Ed+rf0VmqEwlL1qMf00Uh80zyZmX7uG6oA1Xdm7Z7nRAP5IbRjGbbJ3z9WqJQQMMFQ4n35ETSsrwNk0YR4lDS6LrHxsE/7u0urJb1CJabt6VHvl13YEO9x+NSnBm6iHEHLumZVcAZ77gDA9/R2UwOSxYbd2B0kwo1mWeSx9A5Nb8RhvEfRpiOOKLn0/QVbNr0AS95Qa4T4o0bvWEks72AfD2KZCiRfvZNOIb9PeoH3TxZEi4X4RpA2lJB3NuLCANv4mqySJJL4bRq5rTTCP+uO7Cy3uMmnarE1cf7cCqLw9Hq4sUdmN8CmqwdJnjGHVhnIDTuwNgFGmFSOvdM8hDpiN8Iw/h4dy6g2c4Yc+SbdpQAsaaue0NbSyRy5b/zjvE9npsY0aCbf68ZIU2GBmmJYh/412UVGUSUFC6Jp+91B64k7u0kwqJFTTJFwYHTlO3GPl53YHW9x931zcWB3NFvsAtewBwTnnfcgbm4Pxfrl0mp7rgDI7Vpu28l5yaIdoP0/EqD1QkwF9AJqPSK5uiVf8MTU03NJisevCcnwgbokqYEYt4VEo5VUHMuna87cC1xby/c/KbzCc5yBwLq6gg/rzuwqt7jKJ3bR30Ge8ejEeMOXAiNOzC5Te1xBzY+YdjjhawJfFHq8NHe5JtJ3htjzQcV6AXNlfuamU2bcPjlYYMbfJB+XswuCEyk4QDCRRVXiSqVD7p58j/h0vq6A9cS9/ZipPv8Av/itt6vO7BFxsycfduEdcajYTZA3IHX81wa9+f64w5sfcKwx4uxTLsyHgUbrHLOJA/DEUBP1yaFGU4vaKwltIubQuIkdAFvnGfuu9AZZVJ4UrqCYyo8HLdBZ4LrDhw77u2cCDVxkosnycBG4239vu7Ainq76wZE0KA7NVf8noxS98bXHdj6hGHOggXLruWpUxlpDbaq3DPJQwgQW+7pVUCrRrXUvSKmb2ANwSackB7J2r4ddPddHAaQ7dP2AU2Bs4U0UCLS/7oDVxH39oRYEzCzs7PrIPmeaZPTTvvd3/3dnz3N/+sOXHL11adTta9ux8y0q207p91zTODoNuXuOhV2xaJP6l2vO7D5CcP8ITDYarUGoTuB5JnkcWaMzB1NJnTBNY97OTbB8tYsfeXFF8cWdD86ao4cYbY9nPPMChSLjJibke3TkQierQinA0a4dL/uwHXEvX1xURf3dlwpjVYnWOh5ybruwLNXk3T6dDuWpl2eQYOO92SqpUufdmi8nIO/PSzlK3rz6w4szLCmLFuAHxRYRKpJmknewFQpmNre0jBo3ncxJxXvBMTOxc6gXg4bchdiSx80wbPNNvxFCk56/3eYEdpww+1Rfin9nqWOZeGp+Ilpw7r/kNK6fyBRU9zbF3Vxb8eVMqDkuKtf+3QXFn+uOzCpYBF34Nmty0QzY2phF7rUdV0hoJJKjHEHjucS2ptfd2B1gS2LadZSSZ5JHmSel2eafGGgh9dnY25Qvx1mNTFumnZNFwx03PnCC6sFx0VS1UuN0xGXC4EP1zbbAJpub5T36enFv9rqFIkLg6cBoskxdIGZ2mxZ+AW33FL4Aa/87/9Z91vy03/6ul+S171OhYeS/X7UEvf2VErOeutyTtU8vHrbM3+yDImIPNeO24rSI2kFs8xupTWvfe7pdDRANqYuNql2eWZSCho0OGrQpbfv+OdV6dW8rRyvbmhvdt2Bi/ebxn68SpgnLFVGFoTWTEORpJnkYV6KKRBanTv6OjCwZSAM/IGBkB/FOrGlB/QUB3u2Wb94D90E4ascR2PC1OjCmgcDTMFzGXnbXCHGem+zzTUnKMOGMdub+CUprTt76Z1SS8MX3M1Fbjp1TAyuCMMH5XLWuZSm8JkUPpI0fUzWneE9675KPmbdF+o1cEwaIu7eGM095a9YZlI1KTp0r9cdmJRoBW9bS/pvf/lkXIRep3x2sGvUoCfWeoqWmz6Fd/u28qVX9S7XHVgL9/EqAXCWw45h3GSJpMwkD/RSTF9YlnMHCTI+XniDCj7Ks/QU9XkJ+BQORlmSc2VKtYCz14W0TaUNz01OyhoDboX1MIlpfsOGnT2OtTnJEqh8sDHy9FnsnZKSsGbr/3K5bNalCGXo9ANAlZYlcSn9uPAcFZ6iahXWXeUj172jXr/uLaW7Ah/39kBgNG+yVSo/See5ttxG4CT33TnG+NS1+b6xUYMupuiXM5ow7sA2uI9XCfCEYb4cdlQTzNVWUmaSK16KyZUeXp+RurA2suy9uNjkmIqHqkHzSoEqNq/eJDQ3lk6cOnfSOOatWCGWObONqtsIIehEPJjWFTtbQZZbs/V/EyLYMWsCRVLEcjlFxTNdhSkjfuVN6aja1+sOzO8ifhv9kt9EuO5I+/c/7Dl1pxR3YA/OnjIEiLs3RkX+rXPznSbxdN1jeX7ZpliPfGTSlnK6cpmOdsirXvt02lW1bPK4A2fSO0HLb0k4xR04r/XGPGHYXQ4bUtCbqk5kAZ9J/pRrgrwUEx5GwFyO3fJWQbB3sxNb+AtemCvcF8VLx13ju7LxlQwyaXrarsaUjl1l2p1vf8MNdNM1tSp5I+XRiqwxBQyVxwlpP24ZkKtfs/V/2ENlRBEXpAjQxSU80ShM5Buwv1iUE0dvcv5cd2B+FvEzQ9fd7GH3da5UxR3YL+7t1bDMKjly1n/r3Hz+sLUo5NoX9f6KVOkwR2z5y0/ES2lcjBo0tIoNHndgFibuwBddlIE8YdgZD4BVmKykRD7TCptJ/n5PuUa1RbeH10Snq7mkfkaXcdugiPZzHMFHn9P27alAr7rvPjwmcPppyZ1eWMf2XQb4/Ko2jYzMzlJLmIbeNMSHkGekN188dVmpeorJz68xBZcYS3APrOZ+/2HakiWwSgC6BM2yITNXd0/AzcTcOaVLEbgynQVL8/++f8SWWzq35ZYym5XIRzjZ8uBNkAlv1x0Y7Of5nlLVnfBhdzVIHCinU/OFvq8j7u2QXAl88XrdgZkLJD/CD5v7HrElV/oGDaFS+qANoLgDs+su2hxxB/6Fv7CIO3A56I54wrAwHxxzW4OvWC2pRus6iWXLYmuRdkWSYotuD0V6dAusOpMipFJMThXlFdtryS30VIt0X07bv8dzE2iNPyLR4mebILwbtfMCIiaRuhWwZtPQEOu/a8LAvRJDgT1hyIOXcKplpnGIh5w7B0Mq2EgpSBVQHRxwOD4r0+XcTtZZbCEs4iVx/h15STtmMc6OIx6vO7DYz6vqLkriIMvGHdgCJO7t1SAo67Zsb7uyh9frDvzFjKTaP/KRJTkLccSWuURkLLm4DpiKN2DuH3fgEGLjEdoFiDvwzEyQuAOnxQzp092xP2F4mbAcGE5LH3ggkBA+I+Yt6nbbFELeosxBzQyBntxCk5sCctjMczFBHTd1b3/BC3NlEt3TpihDGlJ67WqHOrJNQ6tnWaWxsmloBBOzsymbAUMHg7IRhFmeK2DKRZopB8yDGYgo4m0rNpeEK2BRKs2V1DlHkRzT8bqs2epujXd1tTu/3eEstpBYqPOLWHYYAmV1jnC/Xalw3YHV+GgR9Nggl9M21jJUm80B4+26A2eKa1LlH8lBMtcjtiy1TCP3GHZmMUSTyWTiGndgoAQ84w5clGaCxB1YJdYnDC9boIDZiWwPQI8GB6PZiXgvzJpXrx38R+RWplHQHlyPaJ/QMgNr887u5puyrsbHxQQtlYlBtVnxUDo2ajrNhSwyXBmoGH5XSzAHWWJ21klJItda0ioNeTBjFFucIkAFJk8ZnOMiNluC0zvypI0dokoi8M+Eq4eGy7gJ2xJyUF137+l0+hQQPtr3sTitu/x9Eo/XPTZ94ab9sk2xWNosnkdsWSjDyM0710UGtxKPW9yB4eh03OMOPDNTrlGeYbkoo1K+T8+9vpJix13/u5IXbqrAVxheEITXGA4EO/B9VOp4XdcJn19oeLhmaUGLWCk+F6oY4quBAcQUoYdoVVUJTKQJsCUP4+PjvHtvB8ZfSH5cibjHjvsyrH+iQX1Ix9lWpNL32MD87aEhU06VETodrRowshYnkNUUGdEXiAWtqtkyj8RWHX63XFQRk4odtVIDttjxMJI/X+LzpoVW77m2VdPqbo0piJ8vKu0SDg/kYnH+XHdgVd35p9OnPAUBiXu7j0IFs9tpJVSSpjHerztwyek0jYeI4xFbFjoav2j3c9V1VR3BnRg22arjDjwzwx0jXsS4A4vQFYaXhWnnZUIr0Czarzdky0TuA+4bS66eVho/SwVzu/F6zwW14w2oxW5ko8LJYfdt3x6Hl6PsQHHcg5bZnuPFWRO6PWeMjKgMqcYVCi6OJxi3I7FCekLDucMmb9SjcRmhqdWbisYqnw2lpCSfjasMNShnj2M92MA8aBm1884C47eg7xpFFfCsFdE5dC5JGI+VjBuwCScgveo6ufpPKhIr+GqBi7Lum3CMnLqC38aX6w5Mf901qOMOLOMX93ZWEOqCdOVyjE8jWJavbqnMuh2xJdHmo7HepLFDcaKi1rgDp5xZozwTK+7AMgHZlevU1AbD6zEWB1A60Fog6fOD/ePKoOb1OA5wQdto3l0x4eT2QGBgArEzznMqBPdKbIbB222SmTo55eb4WpFaNd6qmgV0U9LyfONNQ0ZnqTnzg9eSBZ97mjmYyWPLJhOFHQuaBHVx0xDZiDbHNQFPq8qPnz2OpUPWS7bqbfKDdEI2xztWQf8ccJoc2aSwadaUb2TElIn5fRLSFXN9OsNBE3Em4GTgM9lcmS1Seu1y/lx34PLvjmM6nT4FBCDw3gD6TWG0fO/b76JS7suDYHNbPsTz8hB43I7YMivPSCvFKnRdxqU0WxZQXMRB/OmRx32eLBLGnHPT7DHizUSJO3AadVqD4fW2JrE4gBKmgt2tTnrlXJ4K5/e+d/P6ZLjfGKRQ2a6YctFqBVqtGCAL0QqDu9hsIm7IcqJSIZu5HGBCfMHsRBraRnRSOIIPkyJLkRt22hLFZlZwTxQ6TT2iYZbXdhdXNnGTCbg9NFTcVj2SbGg10Qi3oSG2CLULM1+jKzDM3PEWj1Jp+bwapbyt5jOhS1Qjo0AwD4DDLj7L+2Zhw2Nl9+asc4bS9EgeY/M+jMJyVSgAhYKvD2LYeUw9ew9uyhw5f647MP27WzHFHVjEScPGvf11rj3hXf46i8l/lnfkgYSsezxonX9hsUL7tA3LEVsWOvImd7IG+Vywdu1yKHVdVxabI+7AMyHjDuw4meBtWL062WAYWG9riwMoLbnFLWIqkPTaKf1FbWiedSbNXhlzq9DbQN5dMbXbwVrRQE1j1JwMGCrajHyBKHTSZJyQKYXx3UvY1EBVIdDeSWmZi5593jz1gIX8PWWy4HBS4NQYdxwfGVq7dihXZBeWPNu0KQmqsyNgRTGCBqxlGJNgkfXdJDViWguzxRjhDyAx95GVeDoqogRmon1kJKuttrMHYlQnKRTq65k49nFMNoLloh0ygvDpugPnvzsdddyB4wTeuwXHvd2TUq34FaaQZDhiy6SeNGxJ3NCL/IHoVDVhIkUtuLMteWhGtYtNnqljVcjnkc+aMKcPboa4Aws86lF1WoNhYj2LAygtuRvKtTx1zYUpLx+ClOIS7CiQeVdM7QXRCNXYAI4/5NaBoHxye4DkQIMeSENSXnFZgowMVJVDTY3wTGitrQrbHaOLDifETRbthvxwNztLYu+svs3rtSNqiq13lABfyQiWsxpiMPNnXTuEyVtQY0N+dXZ1YMTjUhyZv4xA8nmqbUICz1piYpwwLg3cmN1ruVxmd5+lom0uR3XhFae5c9SRXMbeXYh1ORNwjr/gCB+BIjubwy40RQHc+XXdgX/RLzLEHVgjTtqGjXv7J5huX5hJ/Wgut180bQwWgf6ILRU6gr5wUzhXy/2B6ByoJGrQXad+eYjJgQhxB2Y/UTvy2cjGjztwnGU+mnzdgYWK0mC4emtSiwMo3XcJptKIif+bjNI84f7SVSPkuAEysQCrqNXAAOoW1kk+te2SHBOWZVKNZCengIEJktiC31gKMhB8wzrrVhFXXfxPiLht324hs7RjbExihBALQzekQfxeq7IJY+LsSPI+GUZ0hlZzGXLEzstG09kUJ+w9hDwv+lrwYBIeRc8xY/0HrWvh3V2X5QZGWhMoDfR59eo0jaNZZvE0pA5SUoQnMRH7Bu66zeslPLPz2x22hIjz8boDB+HsVg807u1woFsKnwMyg5P1n3lwmpl8z8iDjHJbIg9bR9Sg6YtDSHEL3lWGLTjV2z3uwMnVs0PNH/xnXTjmpg9mnThbQfqGVmLEHXhh2SRed2DXglIiSCg0GAY5h1Fn3Lg64wGUlpyz5FqeumaQZGI2itEMpGKfKnbcALmJ1SC43nHOH9VuVxMDoAO+2OgsMpMmKTTB+ErGM45ObInt+6lqjCI2G8M+SoqLf/9h2lmXh4gxZJYnpmsCjeiMENCTWRS6OJgZixAGm1m4W2d8fDwDsG6RpnZe9siIYUQEB0nU4LQEmlubQNN73AMQo+RshmaFPTpBWHaqUYQVzI5dK/0DBL1vhVFiQDesXqtr0wRwuh5mDwTeqsf/9u37GW0RisAofJpCbLvX9shIzaRUco6T7CoRHyniXA6X89sdwi15JaDi/LvuwEis6i+b2hYt9IHPUZnt5QtfCEZ1xJYhaMy41wX8XCjL2sPmNy02+McdWPpE7VLcgcmaZL5HXOxha4YWIsQdGA+wlsL9nJz0LQyX86A6tjqSC8XbrZ6qdeLbsHp1+gGUgt3Xci1PXZH2O+DsFlekZ5BwglG3mFbwuAEy0QaqBUhrbKyK7WAiD+0gr8BG7DaVAYEtKLRhs90ykciEramV1DhJxfncM56KqTHEWDuMPkzFmXW8yQ++SYtNUeGbsZoVtIlGQ6LUlM481xc7M+9Ms6TGyOxsMKGyHTCDJEA8JhPLdqFxlyC+FEfmGWlLGH0AYrs2bcEgCBuvIQMOiDj2hx1edeRaz8p0qa09lcQ5cN1miXbwdq2q9r0LU3U4z6wAyz1gUjkjiZe9tvdZqQU5tRa6/HBzkDg1rjuwHdfIP2+KoOWLbVN9AlLOUuaQzO77AXihE7N5Z5mn1Xl9vPrVTRN62PC7uBQD/+wbd2Amp0PN2aUX7y54phXkSFZydJb05hHiDrzwmkAkXXdgcYXhhGcvPIrHFR5FX8eNo0SoB1Bacl9miZDPphDL66DGKnrcAFmqQUOjKNEGYry0CUQvNzSbmNgdvokMpoJIvSuMLRE117zdvAXXbwqalgrUXG60pAYff9b27Zs2bfLMLD6cgmDOPOlNQ+a9X8nMO6b+8l55wIlmVUcIRvzK9oBRJsBa52eh717Bz7bAi6AIfzEIwPy3Ay94/7+JZLw2xAxv3qUhLNQx1h90hbCvlW53U1yie8Ta+NoRbabL9u0RZhFj2+BxKJAmiY3WONDHcbC4VovLZQ51m7llKY5T9LrH2hQvEfQmCL2wlckxma0fHPyEnDyYnc1HvFUcseU9Mtig1+UUg1GbYsQdWIAONTNvj/DnKSkO32MmS/y4A2srDDfLcTxpczNXhMstxUuCE8zWpBoe+KG6WuiWLWDsuAEy0ADWqmgTEwM8IdA0jWm2fv36AZT1UZNEeMigE+xBM/Zm8wDRgQm6rvMWLzUW3S/p1EjEvJ40J6RBOHUMYFvFlBZbluCzw3Eu+IhjQ+y9baabzKT0kLdREk1x2hw1E8Ky00ShkL7S9+JdVpsUNV9KIA0NVktIJv6AYG+Rc5SGWOLcWWwhCfLUMWXCLb96gYegthZYa582HCIjZrTPedUugsLZ4QO8q+VnndeorTbdk3g+2/sP05bco6eHQoWSkboOxp5ZorgABHV57rTrrEwX3oidutcduG0Ngff2vXJT60hKj0yUOSjjpEUHPPSI864mR3x5tULRQa/LRIh73fgWd+ASOtTM6wxf6yPkcrmjykwFcQcWCO/X3Ny8/sUCVVi4d8vm5plc023kvsGFyqSSwDjvPlaNVOPaTsFa9LgBUmkaSwUGqyC3TALnWbvQZjFFpUrIgY49xgcAbbvTXn1ENKpbQL2fWDFDwjhZWFpuLh1jEsixo/FYuslG4NlEmKmzw+FN7JGagbN2YeY4hUyLD1GdXS1ix0iScJT7ztddclZRirgWy+1C+qR5NZou0bGltwuEmx8Q6HKLHdngPEkTueXzF3nU1vb0kNsGiUMCsW9+jziJ+NJZtGiIMbuaQcthjSnYl4w1YTAGCEsljTp6PhSAufuGDkpPDz6P1ktoodQXCo2NZ2W61JZKYcpcd2ANSvUobPJX6PbwX6ksUNr0WboeefVTg9P51YoJcN26nOX01VfL93jPPS5BrwsQ97qxL+7AnJenTyQWYCpHJDMzMxM97sAi29+PWH992bvlNWSxYuZ65O7t45Ilreq3ld+JNVbSbD0yYgbSqlCWDbZyHDcA/B5sCG0AjKx/PDYw4JvJ+VmmuPUshdPpiW24HQImmW6AbmReN6qcQq6t1MfrQGigRvWWf5On7pE9fdOsh1k6m2+UWqmR8OeH0wWfzLu+fIshI3GGfNzaiIEpmS6X3rZ2iH3ixTYlsuay/bM+y75FTnSto7NoSO3wZUvU0KUE0tAmhAiJhl2YaoTu+CFalwQsKPjX0lGROvJYLj53sRfMTwJDYmTEbFMbZzzsGyVFr0cXLbKgOdC28CUKTWJKKkq3cERL+JBlLSOURHmqI2tqKvBKwyhKdRiGKXLdgfW5oP6yqfUhBu1/ffpgSY8fP17cCwqjTw0CXpMb/WdoPb11OYtOnYJe5x/3uvEt7sCcCOiU28kWX6scdlEGVo4Iebkw+HfpVS/fJeRCrzswQbq+It9ChfNLe4Wfz1wvoYrEd4v/UdDUqjY39PLC1VcV7Iop/bgB4oSIZ4DpjV0BGTbCVVWe/SxT3GNCXUyxDWshiQ8el88YVYyypcJPDF+0sRlU05acYgaEf5On7qnwsQ1FbAnFsMaWTcpifJ4N5rGdhXmvmjA7nC741GyPeHGx3k4MscF3RGXTkPcQ/HQUC8UaQfCmGt87ttCtZ8wSnV1tDag9KNGK0F5WdMzDJUsEm0g3IUOmRJ6XIL+MjFKJT5S/6jOqtX0A0dUOQu9xD2IUhwDrqctLQD26yLB2LbfpoVCGGsnprqOJlgsz/1QW/KnpX+KtSiTFJUXc252VsW/f8X1ljsyCsyc9NTidbprXHh9B61cUB92jwiXodf7cOwbGHbjsSncTyg7dz3DPIIVd9AQg7sALzajHf5ltvlLodQcOtye9n+xb+qU314bm6cvWzVRSZnv7/wOylotG9fHd0syZW8NYg8ZMvwSjmjZRqLVbVKoA2lg1UAkWCO3tNpcLNuRkSLnUgNzQSRtcMxF9hmty6tw315ZK8D4MP3GBFxUVW3lrlpAUi2hsipiGc4CVfTtlyFQl5VVKvf1ygCbi4t4AWwQL5hqT2dcu23HilERou6QynaHvqR+8n27UfYt41q4PZswyWtcM0u00JT+/xhQkxm3OETQM2GashfHxZXjR8dA9apSkMKrnKia1nmtY1TD+n9aEwRPlGdd6FN4Wnp4mw8wahGuO1NRwjI0oFOoLJMJ1Y6bpZDuzWJLVQwq4VsJQMk4VyU6B6w6sR1C/wiZPDW8Zx/AbZ1wfTxwvc2T21ED0uuCRKOm6bjbZO726QKN+Qa9zjXvdKKKrMe7A9PnE3f9leHsOba84Iui8BVg6TqxfcEIbd2CBQ+Pn/P1e8dzOKwq97sDbs9wPZfsxY14qDqBk9/YPpFmLMFHCFvt4xZDtliCZNqbaC3iqGrArIMf3oQV7BRdzk8e0x3aPQWoiQ/smtjvUiO2ZYBPGJCpc1xhcNAr+aSlmm6NFqARIbp6dg7Ln8s5Flq4um7bExBMeN+vtn8Xfu06E2cW1pb58k/GMAm9x2+Wk+LxzqbJ9+ya24RJTOpw9L6sQvF8+TpsdpiN0J/3GZ3w/HhapEgiYYvFJ0lpbt+EpNl/yhCVLdh7ZNEu36E35+I8vuZGHFtuFCySfVCTWc2Uzo0fI0BCHvjUfwzZh2jJE/HrPxv8gsN0YViB4tQJk0qRJEki3wW43nI008JoeudFapATTnfTrDqyGV3RSxr3dh5OwP7GF2eMUoLNAiNNbc98dRFdoNy2SRu9xDHqdc9zrvOM+OQbEHZi5Kr//bmDcgWcS9O/Ezh534IXxoO7Cw695WN9/RaHXHTixT9f2ihD3m9kMB1Aye/u3lEnW3NxMtn61JuvHppd7JdCRjfRgolXBhiO5lcZC3a5dpg3XJibEVDD3n/zlM6gDfoKl0ADJjHqb2pRTaCDg4yu03XVea6vSskiYpi5RyLNX1w5gmeleHJUxFFe3wsWzR2A5KWfnhXyamYw4kIA9Ygs3m5tO16rzFrH3fnyIimSQORVYeVL2G8NjHuLaCgF1xFQNwnP3ICBQtXxlPzV4qDDLNjzKMbavwyAW6USTyDGIrLse3Qe4XnesKHR1dfEi6SIBRLp94w6sQxP3dt/CJjf99/ZPgW8Zn3TSc3M6vu94kUOz4Cw4vY/039NdHsHodJrL065Iutwv6HXOca/zj/vkuBV3YMadl4EmpN7b8qYdzOW+evChma87sIAhsv1NdYGXzc3N5MPdvf0nQEV2Tuj6OP36IrEHxoWkbpGrBMR27XKaVtgTMJj2LT2iRVX6MzEhp6LV/j/6V5IZT8w+gQe8Fkhqiwne52rVMQvksPblVDQb8tgqFaXR7Qrer4j84NkWePFSAmlYOO3Vqxkh+DEuHuKqMUSx77yS6fZu92LHtYufDrPC2XxuVnhN63p0E5kyJ8D4gqokeNPQXXa6jBEZ7rKjRZYl0keLU5xV1Nlqp62WxBSgXRJws7B75s+X8M2XrZZhHrIq42bh98zv4cejxJRk883Y0QaLoF1CUOfNE4Fz3IFVyHFv95dNrQ8nBZ4b51xjfqlY+Zbz/Z5q/KZ6fN8ReNyB1QoSTdDrPGDiXueEFPfJZpJuHVA1YdyB6ctE6OIuKm44hpfd+8GTrGQNFBoq8qfjIKALsWag7a5pP+xb3C2R7dXN1qJ6G+3j6vpu2UrQNNu3t6PtqryUNbO4lkCoCbSFHLk/aAKbo7KEPVRKkrK2WWCiAnG7T0lxC8jjzZe7eGk1u/ODSwmkwQhZGF8p9q3rJPGjqQ/GTCLwnvfldkKbo040w7JrFwvApqdljaXrBs85ZZx3rVQ4ziBL0RWJwJo4XwCqAuyhlf2iteKuu+S6Ywz0kTECFmdbQzgfKBRswfetuQ51JFGZR7sE7Iz4xx24gsg/O02DaG1T+whEsZNwrCEbQOsPnMT9VnGk1QS9zgE+7nVguhx1UUXcJxuJho478Ft+AXHr63GLOzBe9ljtusc+xqifbLdP437Yzt7+E6ASuxJRE3u/W8R5xHfLVoLa2Jhvpq3ogGelqd4k5rchPTEh9XDiwOAObaNSZr3XdX3uTFAv4W+xY8xUOcpYQixxVaWleMwjpb6jlN2GkO22u5RAGlcQyaMaQ+CB082E7sUZEil0IGYS6XYD2z/LeOoonWh2iDGXDCABO0zYKl1YOpeSOq/tQIItMx3xFReeHIjnOMsR8oY4eyc7OB7NQ3ho2LRrx5BATdhnQrN1sdPxFpuePx9oUlcrNFDZhDu4nZYQh44E/OMOHD3yz26EqWV4zxjSfI6eZCiXH47go42kUWT0kfig11Fx4BAT97p7sXTdJM8mxH0yS9d1Fbv4ZPPoiDsw2Q7sLW0Sn7gDw/T6E1fhdRf1Melz98L9sNne/pNMqzK/n5pW8PARoQQJ710viO8eO6mqinYg6Z1/nJdQfQy0197CNjKJOQceaFKhyLE98z3OMR/8rlABtYkB3ga1zQIDSrP0lBOzoOWsUjhVVMfRuFlmJ/jVXuDOoEPoN11wquvJnCBaf9aQph5euSlcY4i3A4OMWoCULh8v62pn6F2MLiuqDjSdBA9u6sMUAUsdjNACWLpaiTBTAargtVHlnWI/hMuwHkzHm3VOHN1nxRC5pl8HcehIxD/uwPEj/+x1G3zP2CRLdZGTsAe0/o88Ao47sAoad2DUJCIcF91yi8PkH2RzQJEOHfq99uWwLZ4CTnj/jZky7pOFTKotmI7jYx1QNWXcgTVfEj5xB3aOQ8+/eu6PMehjHrOX2A+b7O0/zeRGa2Na8eW+m1ACmXMPPDCk7KzzVgsnke089NCpsMmQOnDN0oLH3Oc+CMyAntgSJXZ7YNTQ/YFWTLNRfBmKShN2LxEsRcyhslP40KeqypPy2e4IM98ikrnttrspR62oLsfLutgNfl1HLqaibPuSTPZ+PC+5k+rYaWCPIfIutD/nuesoI5aQDwyvdCVTJCoUV04O2XJ0FJSBhpZSwgz3UHTHAul6rfEU2iUxm3gNjivqTkHbGEPUk32uaNmZB1tHzOxGshuGf6F15akkn7zgg4PDwt0/mPGHEnjcgRVA4w78JwKTVDiS4PnLXLZJ/KDpH1K65BI0SW68MSvPjST8k1WXKpm9irgDF3H39ok78EKShQemt9BFi3AS3i6p5ZLYCyzH3v5leg0J1axcmKsE9ebNQQ9k1hrDOeBGtTWm6tH7RDEPsf0t0b+BAz0518roKHsNqkoTbvwm5u1wibuo5Igpie2WCJWedbvtPmaeN83FVWJe7HODX5jolMVOhituf3zpLHXFBccDpOl3O9rQNRDPaRn5MLq4KwsUzsVM/tu55K7yCfbgsw+qXbq9ga74rbler2qagdmqrSWNcom26kB1n9dM1p4eXKsRW75HUdyBY7g+iSWYPW65ZDehYxD78gJERXEH7rouicA6wC0/9r9DAo47MOUSmroO7GfPOecckhfQ0MeS+NdVWaqgoOkqqwMvWnHcgW3a/S5zuKiCCH9t9/afZLYR+TIvzFWCzUHOJYkDYzpOavPYPVr71OeeC4lXcDHhsX0gppSczSjO609WmlBSxhwdT1Gaw1Oaqm4WPet2oclv8/eFTfDirnesKBkswd0uS4anJIRerE3AW8/9Ba/IaIYwfuIMDV46N3BT54WxFWeSvSwVhNqt6/Chh7MVHLeF6/XgvmmOY5bRfblE9ekKmOtRx7c035laXP3CvDvHHbi5GCQMbi3VR2IRGLYm/OMODNXJLUSYyWkXIP8y9O/QcQcm12TSPU3AUsYdmKZyCqG6koawr6jIfRKUirgD8x8VZey4A3uO2esO7MBavBRJUeNW6CTMCUWe+9zn2u7RncBL80LzuM2QONDKmDfdbOJ26RLHFc69D4o0sU1y3JG/BKUJISUF7kbXMSEnpcjYcNbonnB3LOKPNOHqhb2OIv6McG/WdsmipiJkSl723Qu8xFE++OgUdseXUondbmkvBhGHmERgXFx2aSbDwXFbul5/BZZbKMxpc9EdMsXCoRgSpTRSFlYVXXfgM28yGOUkmFJm5iecCdmIuVriDtwR0lD3/8KRYi+a6HBBJ8xRj/1zT0FKmb/oPtw7wa4zPqqKO3DdeoAcvZb0vkfjqeTXy5zVsnaR4w7sOmYKPanUwDrKuBfkMkkDs65JNXO1uZZMpQTipTY6zmoQP3hv3qwHzhp9BQmcC8KcVfubqCzhptTpZsu43F+Tk1xow3ZfUavN3jJhrjFMPMqB22kku12mAC5ZlQteKpRyGZ1h4RVOW3qrk1Be63oCXnKfOtoQgvNu8XGc82u4Zokixh20hKuFq8UisU52lXTdgQNUbjL3TesVfOMOPOmXIkjcgUG87W1vWz9vSRF2YCBvSckv7sAp6KIntelJT6qwpD2aD3pubcRkhp3WcjDXWTnyOJ+4A0srIB+6kMLbpKU7VNr3hG6BMbpGx1qUpOUqwdatoEb04F2WpaTU281c4GvGkPs9j5on/DeN0fkEHcfJbaXZ5izlNrqr+fOJwOi3vQlXB1kE1+XQqeCNPmhTroqKHjqimjT/QM9hPieofaqTRhsU/9riyxD/RUR8lqebPaXfer2DNaMZLRaxsCq67sDxzEU9+2LfuAN/SVCeI7XEHZiLeSyFRj4Wye+1L+++RZGwHHrSk7pOouu6Km+vOyAt7mjyYgmvYtyBGVoBZdVVa5WPqHKT/YeiLcRCG7edsqHp1/1ZOG2r/bB1PFu2EmwFOS5mqGIvQ5nmsuLliSfyZplfsjThpVKKsH3GCmlXmeEO5U2qWFQMW1VmpwQ/Hcl3Me4KIZl6nGemtVZESGUnpbi+z2kJTyK7rTlYTy6cxWPN6VFfuDuWKw+m9Q7BY2GQGFNWRV13YM5NzjyznOY3aW7ukTyucQf2iLmoEHZg+hsQFXCzT9UJPu6TgrZ1pV2J7O9b899xYXCOtCzMCykpfLe8i63PQ8Qd2EhUOLxaKLR3iFkmL99lf7apyM6qvudga5CEjOOOi1eBLv1ShZJuTbMCZ5exhJCqZU9HR2eIeLMLMk7zm9xVEAiCO0mxj2ueRFro9D1KGHdIdpun8luZMLai+Jw1IZZZzfDkwtNeQnWy2OXCY8JzFKuKuu7AeNAcJkrfZNK05CtHeDu+uJ64xxL+bfCr95WpABjvOk3hU5s57pPW20YU4pnFuAMLywWsK1d/AccdWFn5Qw+NFvtb+HUHtvLlGRNecpACbcQlyyWQNK4pV7u5+ESM4XrKn2ii73Zny0mO23a+PDFwZ5fkAZHd655S6B4wyJKe7tBesryEZB99TH/mUYsq7LoDw6QyyJlnGnMXzo4vriruwNnTS6DjTfipYmrwwBPy91dF8ok7sLhWOcDyx8KFUOjirzuw0XL6mJQcbE2Wkkmy1z3pfRM3fuf4fb+ZS/Z57na+KVnOq4dYEaVO9tEtbbEDrXjP58rVJVMgF1XqdQf+ki95sW0qlC/pCXHaL0ZlTc1DAu7tWbj9dse4T45e5EFqeD0TYYxOvu7A+TWfl8nLQXoqU2IuXWG9rr0M5/d7sQRJdV49we0CZlrnGkCFJ3qA473yjlar3usO/CUocN2B45lRa+CBGXWLO7Afbdu2Y1fcgaNoT7nuwH5YiuUgqVmvs8G2HnnPT9i6p54Quop0u5DY2UOibPERO6PYfP51B26FmMe6F1q/tKEXd2CbmotKIDXrBRK5xxKgnIXHO+vk9IwC9YRI3KMK2XNHIDKHt5//uO7AVeNcaH882En+tmNpkbU7gnBDxKFcj+SUy6kBJV9k5H/bNCSX+8qJbL299NegS12/LH9t/HI5Gjgd0LOnMDoin6Mf9H5MLebRgaJjkOhs+KSDqt/f8v+G86uSMYqkhJa1XAz53+pcd2CniYc/ahX90tsMaRSlpFvmv6WKsCz+xQe9L6F18gyZqEvyoUysQ1YSmw8ooojSU0qkf6NIO4ltLgsIS5fOn+dE2Ww5myuXqWTtnLO+HmTwW2VTwBq51Mt8pUK85a8BeR7OWP7Zu8UfgzCLi2Fga0A6OhtzIl4/p+G3c0FKzHFxMVVd9jzfeSkIqfJp2XWDl5ZJTcbEiV+vdbpJkBpIKoH5KEycuE7WYmy2ITk1A+GZLW8USbBsp0/cgee/U1HEVua/fyRR7jVXbLssJiuKOOA0RKwpaBQTQ3O5Mq6D2CwhoMwJ4xWRgalIms5Bsp6XJL0AWbqBmdZfs62NZrrq20AiaRNq2fWCTS9LTWZsqKkBmtB1rpBPuc5G40S1e2btG0XilKuBtCygnNEZ9+uaQOD3LXm+O1Uhfy5dKdRrGyu2XRSBRnKQiLiUM5oCLcerGDlaAqSmJVQBxZUUIJdL0cjoivvzkrjUEjQgZlrinfJXCx2388QTIb8iIsCXjVf3Z8lnRz+SGFNOATjt/ZJgHSvmU64jmRiVe+h1B87mkKlEWNWuOzB1y1534PnsNsDKeoj12pHTDBVHwpoBJTUFyVf4GTAF718W9YI4fQpSNRDDe50bmGJuTOo2QpITkfANTuhUhNHuToQp+ml/aeLCJKAkjyFDyv0yJ8E6XoWoe5jVpHnRPnEHLmBXbRcc5p3QimJQqPlwIz9aESFvy5WIvwG7MJA8FnZzZVaRMpdSc5DXvCqLvrxMmsVvpm6VjiIOtNEyjVWLpu4+bSms+/Oid62eY/EhH3zwwW9DPch+rYWWfMeEWvC0EMOFjEVLC0xGyoB19y78t3RAGw1c1daf0LaJZKsDWPxVfV1hYlu5v58yQVlZVQjW4erFqKRhWZb2EykU1TXuwKxRTB7ztesOzN0yA2A+2yL0tuxwI65sjiKJUIcWRUKJbEriGJE5fFZWIAzTlc/naSGJpRRhEb1clahzTux4noqR3rRNsO7Aiz0PurW19YV5dv9yueVeeEFkIHN4YTlSL4C0YN2BP1UxGm0FHJmg/zoxD725a553yVyF5GSa1FfEugKnOOzsL8NjzstAMXHOdpFZJ3HeH4ZgLgvtNXued8DCaDfr2OOMbVNJYulh89GmutJsVn6hSFb+Cfad6nEV5adAfXlKoVzvm6xa+Z7NQ/27yLzYL0yOwL/VMy4G3j5dVcTw5wC3rFvtda5Lkq87MPvRfumlv/71r1QSi79TApHZgMJ7G47OTqSTYCG9MEnxNziZiukn78BJJjoBzkshmV2GzAtf1qsIOyZdCrCFor37DpjXn/dcTQ+b+4yTzG8Uid5SmFs8ozNaUHq+pfPTBkPgQVbsRoUP8nkDeUVzObGh17nUQzawkvuecfYBaRX1AUyCoyJYVFWCOiKPcdjDPeecVacocqXHuVS47qIFAFgFgD7nnMXuWv3KK+q6xxqt7u2FiRPbJk5k2FB9DmgtAUwoA1kpJLXLkHmllKf47xq8aRqD7aN6qqLlFljPpcSIO/BhKFdcEe47YO2MzqJPv71LyvZ8S+ebTW7KRVdTFk9Et0MR/PuB8qO83ChsaA3sUmwSpySAAIPqdsbhukdeYnoa7CGWJa0SyAsrl2lhwk7lapFcLnax1DmSAhTaE0L5GWec4TspzBvKNJ1Oa4ADzSgFpD6zFxkkWKgICwO3XYZMig/NLn0D5xfnOEA0YtyBCxilY9BR4g5s9Fx7RmeKW+fG25LxXFOopUvnhw2rkSsQSEWnKy/BjatgqGk67OTsenHLNlCpCPLKF/2ZYky5XCWoQ9+ORrFyWVNnqneQi9xV4QQ0XsQBVJ8BY1DF6IHaLkMUH5ddewBZaeb2ZL7iAAHixR2Y/3Qbft5zy1XAFccdeD73p2quVKlLFk2OcMKKo5KuE6bsluXSY5koO5bhspHLqKI+E0NtFzGuLHBVBdLE37USzYnt7rClgnd6y5Vhh/MkX/fYnCZX1B3Yp7p7103Qj8Lz3iEsCL0wSfnL/95F4pMPeR8C9hJW4HSTYDaS3WXIPE9/VIHNMfxoaNY3c1XlwhYcLO7AHD27BVbVcQeen1Wn1WYbL3mgUuqFyy8Hgr4XcOmyVIQxzjnxsGJcQko7rV5YaYmijK/KtVZB473asogT6z55XPHROkahaJJpIRUyKol7u9zeTFIQGt7+52JbbdXXNwCoeY5d/Q6D5H0IQpTWCwWYCcpAaZch8s+A48Hd2RcYJpNJoPMOmF0+qDvuwPOzqvhS1YlCHXIveh9Qei6Yc1JdEKSNooms63/NfVlLn82q1wcHtCoAn9eLBnGoTcDXHesdAGz/HfXCHvBJve7AuUKKugOHtu7tYpTblXFvR7IDiqL9YXhhksL6kS1tPDIAiL/wC3e4VO8JT8iFYT+aJuFAaZchs66LDPGeTHVNIHrb+w54fhbt8ilAIpTtuMoOzzJZgOJ4XZA+sKnkxWIQtfS4dMTTHCxGbAhdZXy/XE5YPit3O88jaMpPCexwnqrXHTj8hfcmMX72jnt7m6ZhWCgAe2211RW+OGfuD3g8A7TP67f4BVo3uDBJYdhCNfFtvjNPssmQUMcu0s1GC5bsYb3zdQeer0WW83huEqG4t7NUU31z2iwTyLcpDfgQArmfmrJvsmgIXWX8WOREPIKF6SryC85K+SHBffRc5LgDh9KFKLd7x729X/jsEJ9SAPrmzv34axKHeeUrW1rM3Wqr1QEnMwV4jpL8/mQwr7HJEOXRA3VN8Wyqww67AhabvuknXdHrXXfg+WHUmHYYBaNWlArnSBFZ3ZzaC0T0PqJt/lYeqktAQ2n/gxUDVYZKy8Nir+SByBmkt4waXerGfCOXlNIh1HVvX8xu3jvu7fQcVfBBX7HPO4d9UVu7uXP7AJ6LKv1JwdlkyLzFctVVRQ2aHiZ/IRaF6w58aDjJ4CsO60WvO/B8K4ppLlQpy4F7z+flJBVJuQwtfuG4SM6l8pAyUy7L3b9F7lHyLJGcoUQOZKoSxZUerPZX9hBQmn5jbT/vcJ5Upo+dpZCKaNe9fboJd+O9rgpAOflk2AmbrNj3mZfr+MBXtrToK7JCUpWEB/3JoeSbDJmXSHVdlA/EH1QqP4P3xKwlJ9cd+ImHHdabXnfg3hrt35A7U6VxQIRhEVYqdOUsy7v5PLqailGhW4pcSkacuAB0WPo37/2dd3LaKA+idv6RK8upqpQfDFHnwOTFJgClixal2y2He6hfGgVj1L0dyl6KcBsoDP/6s38i80jIkL65ax6D7nVykCSOo5sM6ftTZS8y1Afiv8s8QfUhvGuNNW8rrwJ60+sOXOgZvlQ9xYKwAFBZaxgapmbfElU0zUWR0ouzbHaUB8Df5klEAGsJqRdxTitJy1B+MTyoiJBb34LgLKqUadXt7rrgQpdaFhFYGwiDQerePrVLgaW//6LdBiCv3anR2KiZL1DQ1lfsEworD3+JC9uLpJEUMuRv7DhhkyE/9rdKe/v0HPKUJOkD8Y8dNejJbMEumroDhk/B376tvOqqq17/Vnn0qtcduNjIW/sUU8Xqbhrl3VWrAuhoS3hR7cD/kfiSz0dC4PgQ2lF/UyviRE12WQTQmimft6Girapkc7CmIk7Rw1UhQ6D3M7HqE6lb3aVKlMi7LvW6Ro2WRbXu7VYSbl50udX4rYCPAQwb1tiI6wCwEZptui98xzUpDFA53Y0ggfDg/sa8TYa8+hvf+Wf/7A2OfGLv3r4Yw/s3ixw16DzUPYF+Dv8m0l96VS933YHf9mFF///8oLx/09W/5kF9/+vfKg/y8SoVEsrqBmavRFNcVaPqhVjuykqUeVm1CfPqzlb8BWqcRZ9XqVTaddKVQ3FSTCL2P1P6/pCmzyiKlB3WXBURw6qHXlHzT6DKje4mclb1/ci4A88//mKmpFVKddepO3BgdW+fese93U4/y0cBtjr5eoBhw07e6ultLH++z+xOd+rvV0PPD9s4iRcmKf39lFxIduMwktfuNmgUWWr0r+MRLmUZC3DKKaf8uev1+uRkq3DbVZvc6HEHXrdp09UBvOtTi4piVV8orAXTJIU6AQUrQ6+XqBhoOzsrg8E35/PaIfddqiwCxZdDjDOkPtSiUaSb2FaOW6ozP1oTNC3UdzvHcTgp4Lm+3xZ34EUX/iDNU3hIKZwPrDtwMJz90QXR4+7diDJsGNHY+KkxMp8Z3aAfHDjaN/5ZBfEn6GuE5Pb3r/jUGJmtTh4G6xAkWzU2+sZxDv/sn0V+7G+VTrnVrW61t5wXl1ERd+DDgq47LHyOlZkRNqqq2N+hTWC0USZUp2qAmlU10uasPg0HY3k3hUq7TjRlUiY2qV725PwbLJeDqXqrBHVKC7Qo6uU98LL5PJIXCx2WO1ZHaGte/qI5j/Y0AP/Lzh8N86zfDigUyD7on/Pe/2qF1QH/cxDjb6ic/helw9drndoMoecgAQR7UT13YYO/oXL6EfL0zLBGMetkhGF+9x/c87zjjtu7t9vd28cyafq4A5udAzdJ3IFf/1Z5rFu3LgyIL1iVtVI4rfo93swM5BRfWGi87cQruw1qXmgZHKpQrVvJvNLzh7CyuEzN0tumzhKIRLFTVr8DSs6Vbj+UWFnOLRJdYGR8nNylPYp6lS/5vLbVXRmfFRX+/tT3a0NvtkTfmaOOWjh8gqZEQrjuwMVAAv+s1JI6zvvyRiF7vMuFSn1thQKfAACbwIcA6OuErrfaGoWKaZNAyMFUsJ8EmHoZktOXMpnULu5xB/6Cw8qY2rnTO+7A5HgqU9oZI+7AMB7yxFWoBYcsmNcN4/JmhOsa4Cq80fXh5FhsxiucqXr2HQ5Fdbxa0qT2poa6CHCRxVP0IcraR9YwFBIgyPSBi0Sb7kh5gFsf8hqRcl6aECnnAF+Nkq6BSGEG67v2PhBi7ty5feIIxPzYLzAQTZYo+ShJYiIISe2delnC9oCBgYEHBCnga9fQwGfe1WTSALjGHZjR7vSNO/DOrGSNMiOKxQhhS1qTsUhs/0z+mlNEC0hhvG/ICeyU6iZomsvN7OpyHoumNj4ui+8py3omdWjC3worpwaVyGlPwV2KjSZmYTrnO/l0KKhmehx2KJ3l1lwG1eal1PmXxWKPGFrcYMhBvVEfcYv8Mw777fv63o+PYOljm/vu317V19kJKkOfHqJ1dvZRyjknIL6amd8diSljQaaiPOABcx+vfnWFGqcwO+tbZ7+4A0eFI/BwjTtwhlmjvLMQZjFCpXyanu1fSdhw1xMlQP7ay/EWEnLKOuD4YcDx0uHDdPpSul1RjUATxPaipi4tFfe01FwD8OIkYqVFUVmLai1tdIVEsM/VLMKej12IFojkU5QVD/NBl5TFINY7ZAzCCMi6jG4V6O5MVvzLnj9NtQ4Qw6UtFnqv/xQ1KCO/8NK+jwP56b5vBwwjueFiEJaYd0LV8OdhW18n2k5zWcV6RJ+fT4c3m6OQFPZvClodmMqcbGAmk2AnDrDvy0NUHndg4uuf/NyCgHEHzr2W0QI2KQvhSoc1SwG5sEQmxFhhzJM8fQmo82+wpA40qWgKsSCQQ3C4cuod0ulKlwPuNkWInCHvWQfkhbdXLIpgoajzkWP53LOqAvLlslKlb9ruUJEbHnIY06xMg4CqNrX7ZG5xb0fH3RsAWEcf+OydSPv76QsZ4M9DhqRvp50aGznsGMbCBXm/sKm9NrV3IAqmoLcHAPkAoDMjUSKfU53OzjoVtDum7nwndDXHHXjnTm6N8s6doeIOnAFAaYlPpCJhCwvoRO82ygwctHkhZtMKqgu1fA+xD1VeqH5UB+zKKYJD7aEqAnWwOdXb9rKnThlUhVImZVcx9dTzYLWE0fIPiN3EMvmwCgRQsM5Cjx6uYqj1r4gXXYuJBsq+I87FzwajCeLe3kgGIT4hEoxVc1WEErzy0NfR4StiB4+jGT/ZwSb35e5L7jyACUZGnbYNG/mc8oMBcj9xgGOkXTBWMSCeTi55hK8eYlWX0bOE8VigB153YGBJdZ2Izi3GkAWXlAgw/Cw81WvJqtpHRdf3rwbxjEpFqvSqeAhf7HcaNZJ+VxR7FW8rT8390giqrns4h1vF5Wn5aMd8kK2jcKCa/XKmP/c7uZxhtFL3gXUdaHl4DSANplUe0LMvBap+IinBxOu8a48W93YZQpn5wcjjSNv5Kh2dAD5DCRr9iQ3wJZqWWQZEUrC4dQDmdw+8BWDKcHBOkjZp5HPWAaUm9LDYklCIctWuuuMOzBwj3mGH9bjrDoxUpVvTeLtibay5EKaU1zRDbup7v22RhCnoq5QroKsA4opWsEwrGr9iRCn3QhrynDJxZhjS3ZbLUQog4hWhDrMmagUUk/UEuGFc5F3LfpnIZnbEj0EW1GFFeF6v9M9juVwfALGynyhDC/zQc7e95z/sFKT0nvco4w6sxSfu7W2wuLeHfQDZTm1t3/n2ETzhPZ/RfTjtc7aWOzr6KOk7zYVt1zIIQ1/qu5ukiLn3ot0Z+neEZXNOpjG4NwaeZy5u2gdl23q8SEPwgmZU2yzyjIHV1yQ4H148V1kRd+DDDuuB1x3Ygr1kdnfCDBoB6+GUNA49s2Rm6TC9uT9sSztNqFOVOVQMHtfhzr6okSj39cpKcrmPkRP+Vuwo7f9Fzb/IglMMvmmk9XwNux3DEnJaTPaSWc66DD4+D1UPYmjAlR/g6pV93uB1z4qzDFEXOBbUIbpXmx62e8mzHlq2yFOe9Sx13EUDBd67DRb39j6gA6jHJ3Jy1nYUCUp3fVvbTjv1IX2h11izjJYAgCUea8efdudb3Tl2cYRh8+YCqgEin1PNfWvPXNx1wMXE7MQ76bWZnF+cqawqu4tNl7gDp2BHDwRS57q86VUB4g58WOp1BzZhVKuzs96Ng9INqZW2AbxxrpevSCXPwkK4u/zPPgu6eTLsTfJWHtfB7lORMtDxNXQ9iy2EUlPGQm+v9MtaLFtONpVIy3+kZUvQS5cxcs4cEeFSfh7aRTm59gFDFMvoVPKy8iMIgCyWwyWw1lPGnqaN1Q7+YZCkUJy0xca9HZFv1ddXKBQ4RIIb3WdM2Pp8tQA+sx7oYDwq2ELh7UL48HaAyBGR4sw/8jmVvLyS6ZMqdIwa9K4DIcIWfMDzvANWZjWr9x2wMLS986obvOMOHAqRet8B21T/TZxcoN9PYrkpNcPhJbYS64AVPulHx8lig+/zrYqSdyHYs8Bu/gf/ht/9DqSqq4itmmLmionmrkIicroA+Nd8pP8WhDJt4HW8RwCivJZ5CWsEGZ1DUNad3iqqLFWIsgQyN3LFRzFugQyrVIMHU0S2DYc9vVxgiGS9gYs7sCtOkX/e5K1tbTv19fUZDEDLWEtBsdDXh6B29PU9wdMgOLrQf0JIOjTDEYaYKuKqiwaIfE5dSXS6zlGDjmB+lPMOGBakxuCu3XfAtEJMda664QGHuAO7JN53wChVpBCCcnqaNc0k5dvqk3LtdK4q/PYzogYoCNsuzjjLzX/zQJf3cfFuNH3zVMS5XGhjhTcnDx9JR0rX1xdRHKxaxHYqZ1/qPQKfV026PZFRV4coGS1jv1QuUDSrroJQ2jO2iWXv4jiG+g9sAdVLDK5T2hzLRa5GeHmriRF3YBVWxYmzEiBtkvcVDeec84wJS8ZaQFVcmWj7uu/ykHqzeT49LLHZZZddhixyZwPk5r3qotMC18jn+NPUUYNuY513wNGLq9fx8+/29Kqd5QG57yzq8oBH3IE9TbzuwO4K8LnWu0TMJvvcw0t0ijkpgO8GRHyqMajR1wGBJrJ5GET89Ubv3x2mb54ebLX2TFplKxGJqmS+wq8MvQNUwA1BinqNlJOPslnVAFS0Q2GfDLKOOcX2PlE51ytVGVeuAqAfACSOlRUt9+/7RzB1dU5UOET0I2F87XF5X6rTOHGPxXF2awIX93YoW8kQCJYbCAqF2Yi2MsHqyWb8ZEgyAhLv7ZRTONBaUVddNEDkcxp1grvFIc874CVLlli7+NiLJZjD99hJuSF43IEt2EpWz2sRPAsi+XvwU/DGu+iCVg32kgm6q7TfzJebJmNoUSw395IH4R40IOIGM3QNexs70BGX1QfCDUtv601e5l51hLiWweMh55gavcGPXFTYEZXoNSyKKhkaWfXv0OLY0esP/HsBvUgV3WFGsJe1WefrwqZY8dOpzFb19fVbQfjh7xxC/M68InDiC5GEqeasXSCQupVGaAkZC78M+ymROwM2dXDuqy7KfXGOfM74d94BT05Cnn7fAe+UD8j9yFWx4w5sEKsqOpu4CegL8mykVFrrNIFZqoFsb21ShM10gkIW4mgkVNKpyL4tFR9aJlVLfHSBm5EYyoECi1Jf5IyTuFgviGKzZjdlCqIq14mr6pQHUTmqZHho0UtEvYPC67JmTi5w3rk81l/7KDIQOO7AbWsIvDfySjfl/au3qmfAinP7DKaat5KbSqxPFOfWq2sTfVPD0Mqot5DxZZAlqk8d+U7kzoi13FddlMc38jlj4HkHXMZFuxLOv3tnKSU7dyrWKDfGL2fbWugkXJ7Rq4aLvO7AsmPUllYgjjfC3es2oSaLGlS9ZcZRr0cl9ROzQ5FWUXwte13nDCVpblgkC3zndrIQugDrTh9sHBklmYqTpl5IGxeBRkBHB5lQYZF+uAmnN5XO0A9xJ/gKm/KlDMd4cMGWWw7uoNc/3+FyOWUv6ziOTf2HG4gRd2AlVvX6PptaFJqDJiv29T0cOPE1CQ5Y5gpCQZFUW53o65ga2trXgUQ0csQ6IRl1agbcOXCrgLH8V110eguHa+RzfOM+OQ6cd8DKNiol7UvHTpRWBq4nMOL4NRmrdHwCKsMv0iVl4fDy+LXRwrCANdeWYJ4XdAMT2W0K9yGVvAqszRhd0CrIdq0EUSCt4pSpDb4m4mZFZbEhmTi3k8XQBZib1AEFQRwcxxqKt3WehY+sqy4A4c2wHvh1WTMawnGxaGThMzJ1d+2cHBJlamQFSKyq2J4/e8st+VJDd0yZ4sBgO4OusL3aSv8SXzXlknqIjxZV6oGO4jjskwliKtDR11ck5UAjtKMAAAg5iJoBUR7wgHcA3HkzrO5UxFUXnd5yizOX0OQd98lx4bwDLkvt+3eteUPChaZx8qJDLV53YGp21OOXZZV8AHAx53UH1qLXcoqL2y2cqLzlk00PL/HX8h3+IOKi12MXPRYUir/Brx0U589MDvLnx/r7vcqCOeKk6UTQ1gZL11vSG+CKLvC6QOyJxcQWzXU8iWEMqb4AdPL8BoBSl43sb9O4r7FD91fO2FQg4vQFLNdh4n8voJfTO/6HxMF4DYwVt6+LvcP01/5dJkLGHbhtdepR2OSiiG7rI099ap2d8JMJ4svEGKQDqFcZACC1CmmHkZwxSLBzzz0Xcwu66qJ+CJHPGSVxn2ys8w64eJ4w2c0WLZOr4nFiXXWVeN2BOfGgdh7xiHcNp+KK35NR6pzXHdiSpHWmrDq63Vx72FNvyUZeQo2LEjzZBIFCNcbbmoNuuCbeAKvrWS960mrVQ/nGRngC9p1U4GPgAoOy54U+NsCMils9/ZSRKyCqHu8ETfVsFlqO5M7eFougkpmBugdLKAnHHw/QTwAUxuF1jlWl+LuMuMcd2IKkwII+7u1O9AlO/N0/fwmrmbW5+VOEGGB9TSVF06C1124nHY42Y7/jHe++984hhem56aqLtn/RfVhb+5434b9nIp+zhi6p4j45Tp13wOQl/lniX40V/7oDC0xuikxecUXO+w4YB19ylSXYF1Jmc2ZqLEGreD+osX/NlUj9u0VdJJIoFEmrcIhicKmmPkCOJ5oEvCOwSqxRqSSVmFBMFybPPpxy3RGblcdmrbWSualUnJG83A/s+NPpRwCu57PjDQ1G5SpzM75xBzYgq1dhE14Fqs1mTrRkrz1lqqDPhtBkAuRE1AyjO54bMLkHz1VXXXTt0KFD/32RvuVVSHVAiy7uk41xLD2NGnfg4qAB8MJ7M8cvDUc3fZirh8GC31evO6xn3HfA8jZXjOONI61NxV1KG3RlJZhwapnK3shp5XskbpqElYkjQUgvrjgbqHl2ZdjlyMUWQdJxlbwFf7Ys058v8XGViqAQx0YF40dabhUHmFGABqXBOaj7N5RIYV3ARqNyGVHVB7zjDqy/ZioovKCJezsUJWT7dgBiNnmZv3LKvaZCujUVUGDgQcrxO2nesb0dROcGQspYkVdd1EFZ/vtDeFHGfbKBPpSdBow78E6S1sEUNf0iGFwa4DtiwrxNV1999bqecd8BS/fBaQhhk22aWYGrv03M6DCotWS7cknaAQhKv3pipu/h4S2RRQtWUolNyGMrxbH48qaFVgoO+/hQUmriXV7EAhsbVRDNkR29+UUsVHQ4UnaBhSbD/kO57dE9O9qjZoXdAJzBH8oN8rGieEVGRfW+6+hQ1Y5v3IENCOovm1o0mg0AACcWxmELTkEKpEpgC+E4kg6icze7bRR31UXhKgGWHHZgVdwnv8XFo+7/ifvOrb804Sc0YtyBCUuWGGA+uLnvjw9zMic3XR3oKfcdMO+pGQ3hdgW3p3O7hMNpmgLNyt4Ios8Nih+AD08tij7W5Ghk14sAXsT81d0aUxDR4MYqqPiBakWBQL9HZq1RZIvfQx79LtWq66izHv38ZkPg+5MjeaW/CtbDAqNiVbim8GMgaWzs6FA0V9qGY9yBjfDqUxDi3u4DGBCsOCgAioqqGLQJ+js46tRJAn61ebOQU9hVF/VQL1LcY8+9/+/fFNwoxX3y3HPX1+X+c9P0rgl00rxxB/aJD1Ez3nfAmmEBinkmnYLvDCCaVdFLEPXs/Le8KHIPtTaBhiWUpsuFOFBi5Fv9yFTQq4hNmjrkYxweX7gkRVmFICpE5wuvghhBrTh7uPLXSp3z1y65ZE7q3oGf3afeW90LVm9vm1VoMLM653QtaFohMOLTK+wdd2AtMT7hJC7u7UCmImx9bAzFJ6IVAR/84ZSpUwFQIyZ98EHpOBJ6ED8GVoQIV10UKV1XIl3sOliDT87Ja5uldP96cjqn6you6aQp4w4sPETvDst63wHz7KRPZjZhcrzudzaZqJVC8sOGXW3IbeCbyWLIqbFiCfZ9NVd7Ywwb1NpF6q2tLVmJrGmOJaPA0cC7KMbh1mWYH6JpBei6rvMhsKkCEBmu2KwR6L1SYQ1BkDS5JMrzXsbJzAH1qzxFfX/Qq7oOV1gsVFJiOf740+H1ELtZT2lkKcBPgA+4xx24SSL/HA4AMgL2kS4WwQCwgoCAlAHtY0Wm3isMjKqQeqQQlKsuiqPrJlomXYfi5DnnnPv3bwqKuW4k93L/+vzcc7NOukqlDHcXU2jyuANfCtf9OdTnve+AeS04oWQyEbcWBmxrtYKdZJWWYlX2bmJNsuYao/32gY26LBIDRF27CJey1/A2e6rVMfc9cfyoXC4BtXc9t5OlGTq32tpTNXHCfApxHCCxjizwOw8q2jvzMvK7IvrRQeo6thtlDg98dNGI19mDC2y4isAKEdPyVapHMDJKaIWZwhF6a+qEvrzmznEHBuBfaKEcBigGsNlqIRVQAhXXKYDDwsCkUsWMFFJo/6qLLk5v6TrkKRf7LW/BX/kAnsuTq0HOvVgQJOSiSe6/8X6azj33HJKIdtVq14XG+SjsyHFnkRB/mPWrR1x34PgG87rDDst63wHz7GQ48RbVA5RZYr6hrPL3cMqMKe9u0oJQIvf0MCBcv+KaoeCcvcPIuzOMbEcxfIAbUB3kNWGutREEXHiJRbz/rXK5cztZ3OdTI/lZNq1caYY6MZfZBUGgcvrx+O7ZYLUO5O5mVn4n9CQY5SFHUN8piHkt0XouMb77v7C4rVktCekoSb1Uf87jqeniDoxmahF7yZJWlFYQMIg1gVQTxgE6qlQC9HDNRVetcpntOugpFyt+STWBNT8J+WSaK6d8V2QKH7i9Gkuz7HFskUocOBCvRCK7ct2BHb/mgusOvC4uARZMu++AmX15odC8wp9y6yt4ZkXOV1Y0dnOlnMwTgLQEoPploMscdV0zM5gGyqXOZ6m1EgdioEA9HrMQzp1qLY6QupEOsGdS6ciJdxaFV7iOwKBe97sKU9sxyk89+tHPc9TQdW4lh4B66x47Z7kxQhkiJJejSM4xtD2CRbw5OaxXjZK4A4fhKahKfKrBCtUiq7ZOQY9TfYnDVY/1Hm655W1vQ1IEPZaBhD72Lbj2J3QdPfueUzrnnJNdzdopE3lxxFDQsBrMrR5mtmIJHvT06w4c15LC6XJT6COqC2TR4AGt6VKucXPuI79u2O5rva6sRLiozi1GC6YbMl9KMfFBQDBV7FATkgPgPf5E6fFwjdUFvPsBI+t8lerdjo7jlTe+F5u1VspIycvuzgajU9lS5a3o9lJYuOiQBNFeb9vn6hHH1tTEPxBT6sW7g8S24BUg7sDNwmGn8CAWNWatUL3X1KlKFC2bBsQrLsqZTIBDzhk57sDo0McmLRId7K6/pD6avPRY+M/K7yDLRnf/ugMTt6ImQKoWIO7Ahx1mHAvLh1lkG8mSwQ1qbflvUWAorZCEcLtLPDphX+13ycSK2vOmiW4XtdiWPJSNvLISnEXwrZhIAN4KIoyFeEEE4IHtKnYVvZRzY+BfHMomV1W5u68O9Y3fZk2lQmAlgYd9nk1xEuXvrVawLVYYKV3nOqHWF+lByeVIXaHA2PxMqH5xj5i4A4eHTSclMQw1VqTCQI4o6xT3yh4WBqnP7OyfAZcf+9jHklv+eIL90SeoIh+LPO+ACXSGkxXPWx5I3i5L+GOjQSMvEpvz0YI06C4+NAcEPelVk62cXGLWPw7bq/7SJ4LbEuWwgJaJwPUC/FbHpASCCJLDSwZWKCoz6SS1+SEQkyq7HgjmGp59+6aDcGyL7pdBpEfBpgwOZkJ9D1x5KWFSchc9xLTLk+b8gI6mAgtvgi3Zir6N3NbbzzfIJZc8j6hagf7mU5Zcb+rbECXiYA+wfD6v/0yoxz5ixB24YbKPvyYxVYgYqliBCkcgztJAdY3ilK9saZH6yzvi3XXAaM/7qYQIkY/laWu8/WxK5gO6C3OBRl523YEZ3C85du+kdb4BHndgcQPUV6+zmEPMkmDUdsulJY3b41ScBEcpmlmu13xRp3IYALX3S+0VVvhWVmaBv3Q6Lo+SuaZfBxbxNscxC9Njp0BtrQcn54SO5CzkV4heUOZKc1gICuKtfTWJKZW8qFxL8bzLMyzUS17QpLrkeSRLrayVBVBp4jpF1TB+TatNQBHtDYp1LT+KPuFbbwTFHZg4xSpWFz/bdQFGpNxrgW9h8N9f/6oDI63VxR34Uz/Vc9y5qY5LK+iMwnUHdi+Vig3l6rjDVd5xB4ZirVu3DuduF3LdgfO9qgBesaLw0IUVuBkXFmSuZ7F0e2PD27SyoqUwHDMj7sv/TMHgEUK6QDQf/E52mNyLHhSwtO5DVS5GTJXUxmUgyOtY+kN4v/XZYLOjm8BWxMY/4+f8YIX73soNG2M0TMm4KqK2x15ARaQw6blJFtcUE9qRFHfgkBVFxlJg0YRKJPtlYsy9UE5ZkB6L2wPefrq4A4+O2BOyR6UVUbTrDsz9kkO3eLTR3ubbMhR03YEXFmDoq6NmyQVgF1d/wxUsrStp0+9AdCIY0UWmHAHrYrPTHo94jKgm6ksmx9nTYzaNWg+i+HsTdl5VIldO/Z8qKjzg0T/jx0gJPujn/FbaoreKLlPdbGwpjNqSV4Ufi0I9kibIMpriDkwIMcV6SkLIKQsOS5vFzWlb77gDj4rYT47CuAOzCfz06w6MQe14af/TRLldGE+ZzDdL4sCKYTRaZikAutJKuiYMXcfCiMqUK2xdXf75Fu1NhqRpj48KKdnkVYRY1+6Tqvs+e0OpnHpqyPmn//SfPvqDEt/c6IO3SsPGCK0Ky6mEFupVFQth4g7cOJkQPdZzEoqEYVpedWD3uAP7MbbFHdi/UNx1B55wa4gjsKLEfrSTC9IXpJNnXLMJ+Sho7RjNzc94zl9X8jRlDVdWltDkLZRVTDGmXCwm7bFWy0DBvwgj9nW2tlmlKdWs+qCaD/bMM3hPoN0oGzd+F0vKo38ApfX//ziuVmJxUei0euqdUnLQ+T6uluVyOXqLBiPKiXXEHbjyZ8mkcIbS8KrHplqfSRJ34MmEf50CPddbuP764Jg3vUKwdNgJw/rulWKvI1isqmXKAk4kMd0/lG2b+FCNJE1Ne0z5V9T3pKL06y/fvV0Bs7mh3SgcqeCkd+oSGOuSuKcXqZ6XRYFRFXdg4ZpTPEfpyYZ63IF7MNevmMekCbjJLH6yomFF9QWBv+UrjtRg54t0dTGquyGSa9NHUZKlBrdpllQj4jGn7k/JWf6OWdKcYaXC9m5HYDU3iRWLi6z4qCwZoQPhDuMiCbWcBZ0mE8zF66lANgYLCmAzcIkF6YIwORac5QJanVH3C4ItkukafqjB2SDGGWZ1usJXLTHquCc2Ne3WkhFY0twIBC8lATdvxXWLCkFq/CYcQkrXnmGdTkplBMufaEyGkoo5ueMorMCHnnV7Zl6QLyR7w2F7DrSGw+BZFrzVwoy243f+okXTPv74GnbXHy6ZhRv2K9C5TQx444JY4L+KA5rDbl7nnJYOgmcRNAJU+I59TaVJHuzbgQluHcVBSM+eQnREPqMf9D6mFnN0oGgMEp2FT7rgvNePWt9sft6tE6E8PxVzMjDDdwbs8Lzo83n5RBtBPC/mnlrBU/mpnEPBm604LgEbS4eXhC8xkF8TUbqlHqV+XJzzG/T/4b3y1dXAN+61FPzWErgK6lODqSlHbejvv0+/wlvJBfkGKMKX/Oo6Id54UZpki4vaRpYqIoujjz+ekYxFuOlUM8jRwA07jGjcnC/dPEK123WIfsydLLiMPAsqsrQ0wQLs8JpU5DBgsovpbKPjUCp8/dlipSjuBhMEoOkmTeowarLoRP7TmjDRpivrGU1AElXc2piZ/vuQ9P/DI44AvobZT/8x5za5Jw7BFL/8jalMZTAR3bC4ojCWRADIHb3q67t/+/8e0v6zZ+HK7ptke5DobCk033lpEVLlc3H16t9+/Q5z+bnZVCwi8vyUshNFjgZm2EEkgVGq3Z8ZpjgHdecalfEosUepweQlS/rdfmC+wBcCVoprxAtLcHD9fq1amNHpvn3TPl1mOUsjR0rym7nG/exhQ/8pRZlPKf3sAUblBE1kSUZa1k1hm21+E+xm8t3+H9J7vVSiE4hObbJfxc1kzYTcnjpxalEh3HHHgLJeDauq1RjqYlUvHrl0ZT/9NM101bcLieRpoYur735i4zvuMBdCIQEpgszHwA5Bfi7AyI4dOqNTo6wRHOm9KsTxaVTIGazZgiQOKnljpS4Yj3xa8ZZVoLubXhF0RXvrEqV2IETOUUTJOUdCzEknXZfinOt1FsogSoOplwmn3Ts1YUm40d9AizE3R2WUNCK5KsRcTqHKEUf0XyE035H9NNxvJBsf32S+ypxFs6hlUdfGAraLwr9723MxtSRoQMy00G1zLzPb4NduaoJsSUSAreF1b9tYnKjKH3dILFqUdCjlekYGYgD7DQCQm9/8hQgQoJ3yBuZPiS1Tpsz2ga8JleU5dE0ODspdWUB5WpXq+p3G494J8MQjWTWXE22LBzf2oFE8nU6HIqUG3VTOGTPmbR/pgUIpoAH+oXl1FIAzIU0G8jRASlEaBAULOp2iURa5xr1e+lIawqaQXbNGEDoevwWzPYBFBTCJaDIDgxKsnqbV4Ej4Bie0j+E48dpZdwj5bzgrkv/A5ML6xqCg+ItMK9sLOAMyMycOxBBi/W8AWNnhQeYnHfLm1W9Q0K5Is7OZbTmwhjUBy6Fr1hyUwdKXIFtSCNzzKZWfE5stgOewa7qlAwvgEgdREzo16wzNUaj1DWJjvlkS1wl0do6BCKfGklph6jeliDhNprlNl2sZBRTTQsmuYrylKAm6eVZMjQIvOKYC5KusOlQkixYWdW1MuXckPU6CZcoL4PQ3TN22WeNlz+/OnTufBtV5sadeCS1yU99QC54W1nAhY2uttWAyUui6822uuk9+Uvp9q5hV066YUucFi17wAtYXwp+8zmd9oUgr2wso/WOmYWbiIBiIIUR7krr7DimdxsMbWF1kTTDgIBaru6jJrOkGzWDJ3k/cZGVFrUtLkjpnaCd8eEFxr3baBYd5VsoNzjAKoDM9jhUWUQxG/EVV1D77/HKnhTI+VrHzDwysaRXfVYktvSm4j6cHndzocVYpZlMCtORk3lp4ZzBThCEL3nkzBbLINKZWfMyIUvpyp116sVTAugPPOHlVra2tT07esr2PPvrJJ0UGMocnjyYFknkS1h34QwHUnZCJ+1V8pk2jR9OIMYsueTYFyzsAXsjS5TMirZDuRWOIaZCbgRz+BgB90mlc5VNeW66xPF2Dd1FTDZxLmfSlmee2x3wZTOuf6cqHxWllDphZWmHuYjlRWz6jUTq991eNdZicpZFzrtdZr/2q053uxOXtQfsMGjRon07xbd73I3mkQWdagU4npbGnSUCRq2W0xDQwc62+2DliWU7XilEp1sxXWTc3i0Y6WmUcJC4ZH1u0oYs78MLPvfrd7/76179SScx/19xAZDag7pNm4z0SFIDLJz322dGPJHj1fcMcffRRRwFvKoCvAaUSOArSvah/d+AAIoldhvSRgO4wSIl2FLIGIrxSY9xZk+gxarJF70XzEcbbyzOr3/x3FbLC6JJUhn0elfxm4oVEUhBTU38VrCMYy2/tQ+XtfX5ZyPu+70eyqklTU1OJG5+WwO/Aklw6KkpKRnmbpJOQ6GQVYH7qQNWY+d4H9zQ6PmRtanjQsciBiTtwAaD222/61q26/37/+x63bqYh78eIHU1zYs8tAv9DikHKjwRgYDK7DOkLIWLwM5qb+MFtvW81c+d8RkL8QYyDzMhA1CSPraaZ8T6NBXzRsMI3WwCkZZALLiWih8V7TLQw5GZzUXNugYQSn1/2hlK1+6LuiDqJ1P8RADo65mbHxlz2AHxpJoWFJsAF8q1kHSoek0BpjUF2yaISZNxjQ4Nz3CdhvHVUo9mzmSPJawtNAmgy4UcSkJs4uV2G9IH8G9dn+4jIR3yETNvUwAcH8bkFWHeNrQQHulQTjGmSpaj4kad4zpWnMkjT4suKQZeIYmiFVi8r4VBS5mDUKs2bBnd2KvqOjyzRqg8PNbe5TcE+auk8TajGMPRzPd9Sewr+Bqa5lV1qwFeJU6WTwuIiUuzGTFiVdRaKyNZ9cjrdtAmZHUl2NCaB1E9CkiuA6ELDsjalf8yRGCa7y5D5LgrNjVGM3yRegxl045poOVZiXnAqFFfws4mKl8NlvX1KimmHC8XPg94JJ0SVl106QpW1EwSf6geMDxECqZrFv4WSnmorJ4gGfbHCag2hZ6sTunrZ7/qgGRWNRSVaGVcwNbQdVLjGHTiCdZ+cpgSSI0F4nkfFsVBij7MnrUbiQ+ytHdOR/I8idCkWx5R6ioIkvcuQvrOmz4Dqna56e1PIVf8BIJBP2SJeDFwYLNU8lS2rLmicF+ZFFxT3KTCDEr7bfthl/yPZzWvX+8KEn4szAFXKUxC5Di4anZ06nZ2S8hqlesRJvaRKR0eHnmyrgqsEN2d2rLW3YROREaMgfkrP0CaxbYwTpqDe4U4tnnEHDq/rFAfpKZkC5eijj4aYru8A6NrjyyOnqq5ubw+9XvfYe9/7b/gPt/HGe3R16cYRlsB/DF2GzIdRltvvW81clR1YwppTriH1svmaaKk9Y4eeHWawffhnFECBhXyE0FabdQdeSz7vM1dt6f0vaWZAsKBKS1LuBn8Lzd3LNLwvi6gqlFCDgdApeYqmEh0XbbCHdYTeBbjbcoZWm6+MvTCn+4gUYXQWQSJyThZc4w4c+rpPypru8zmAcsmzKUBUPfIPnh5p2lEv3AP0/YLG8xiuYcpwb0rbHnu88Khp045EUyUJ9gIWssmQPo+bU+kjWimvndN2JJ8SK1l2CZrTSkEPCs4Lmrj5DZ8JC3ZNQApCxppsp5xDMVuqfqHAjBOpDkbD9Z9AqUbxYKNjG8bs2sQBVOoo7I7FdwUBH3+pQDR2pA6djvrgUXPR7RaG7DdN2E1emruZYoQ7dUSypLAIwhqZT3GnmqY774CNn3vbQLlJkNpHJigp/JkXemmLY4b1HQDV1X+q+T1u99Aja4ZP4aqru8gItrZHKDyrzX9bVKV2GbLDE5G2cfldY8v8nyeK9Lm5MVvYsvCNYWayMqqwta1sWng+W1LPC1JMQVz1y3aiAf3+Jd0nNXvYdrwdSn+8wE8Uu+H4hR6VasmgwjTVev64O4tQ0lyv7M8+am7evBV0xyvszG4mD6qgpM8HFtWskDmy6nbKV9Ey650+dCzXCfEMCfY273eEIiSEkRZ7d5xhuiZP0516XOMOHMnr3jYS1EegxJJ2597budAAIHrksI8OHs+5dkks0o2WBMiq0i5DdrwjMcFFF9F8iZsbmfy5MV155ZVzuLLMrGtsf1lv12Q1Xw9ivmfswPGTDtWuclUCMrsI5QZkQvnpkKo/AFqzqoUt8KMAqoUeUFmfZ2LMGANjxljDOAmLA8XbsGxT2Gk+xKaTNpFM0ZB2X6rgDTeEg4dwjmiA4mgWXjgHulql504UijE85c08oYqouojgNrlwjTtwRK9720QwPOsRJAb+4OnlElZs94PxlLquVwo0eVZSWLRI7TKkT3ywqA94Jf+OiddPkV+ZG9vfg7AJdShLN2VpVdnWdK5O0lx+hSWzQkXTeeauUs5LTKZTFCuuEblGFpbkCeVNwQ/EEq9++fweoWMkY8YIEzbdFUesDRpS9laYmLdC3O5ApPwrd0qVdiXtdl4Ixkz5K9TX4whxN07AAGXAZHl4G8UzVqtWLHoLoQzNwlfwXoE0U4WS/xBpHY46595ktWOJNQ6vuItG+rq3jcqIZ73wHQCSaUcC7cVi+wcyK3gmZIrtQEIlXS98FhEkg6MPMJsM6YORqnAtUuX80RbHnP++1UyUKwM5lYVuI9ShHH0uS6qv9OHbgji7eliTyfRi9nlLSxadTGYyjgUa2hytuXSRgF/brNpwu20xkuzWFhSzYrWV1ANyCqQQUdobQ0zpd1p0lCqcXHpra9SQgxPU17MiPdL7MX4PCpvzLjlilNaOh1S9Gxjil7tfCfAqwYufW4Qg3d9Hwv07mtyAPsimQH7nnXf6MD29yd5kBfb5sbCcdM1PhwB7qbISliCc7vwjQtwnAfMCfOAGDI9kXkm0v/X6b5B5hIIntxOvZI7EgDOg5MZ3NXQZ0ve1Qgit9ASrXv6Ug3AvTbN8s8t5aMrNmmsAPYSfmfD7r1PUG6VdusGPxvpRpiv3bM2NbvRWe255jznHfNCWK7o3utEa1cUcs4B1LOmnmEqZdcBtVk9ZIkn5dCZugUBBzssSRlR2K3ra8Kka9aCnB5QHyu4/6BvAgQ9VflKLlxtDuZncZl3RumKFAFQklLp6ZE+njQsh+DbVpcDH/UerV0zeqTlEWXxTR2NCzgvnoPtnAX+UgPt/oLpAtB8vslxFgJ131lsPqy4r2ecxFPpubXw8ottbvNlZFCGxdGkBxwjPNq8yTfv6pMbg7I+mRI874Sel3xfHz2L5c+ZhUGKSI2XoF18YOQsGqCQiB5AbSkYS9LFO9ev6l/rgPm2701b+hsDNDtOqlz/9Vrnrr0/8IaerpRTIutuHkp7vdLQn/5asUzfQpM8sF2N5tNv8ke8+072R6mKm92A1joy/3ZIi+jnWV/pzlWKdMpmVdfQwl9y6JeEWfiouWnjQwyIG/tadpPwWDC0BqMP4uJ3sBWpqVgCgasU1cR971sVcWLBmZjzCFSnkdEx3g90IwgMcGYNgRHuNAoQp6/uHB10IFltDYIs8NLR2LTEB1oyKw9LXP/+O//X3V+VX5oOBNNEpBR934GDrPlkHf848DLnYGSBrA+hvjsSpmDbjz1mG+4OnR5rGsN0b8PyQgiIzbdoMTDj/+ZIgM5ArP3kEC99kyNcYd9LZZ3+jGZf0Wbrj7jf/G0T8h5t9tG0fcnhGkRy5gyZPvvVBM5ICn5kzFdXy/lyDIMvXNPl0TekS/f6T1/9yI1Ik18XEhP4u1CyYSy7oljsO59JhejvydQGrsJur7HaZUNRTNtRAqsmBJ/2WFNN5dyjX0lp03FjckrI8tpBwbLj7mBG6x+ULDYwarDnhVlIoFBDKZqvBxmdHEK5kAp5YSI3cLgVewAyKF1MxKmCHOLkVgShOG1qGoUihW/1g5lblIeMObI37ZIy4ExohF3sjAEn1C8lXv7D6SEjGI9gANO8Bw/qIzTfnhIs8bL45JGOGr4Ya5f/CnCDv1DpWX6Vw1DvWbr5DWA3KBf/ir1Seik0+JC35zM/MZ0Yt3W4km64pBbpdCyvPGrQMav5mwhpYkPqInUBT9S3k+nn3i7cys083kyjnnWW5hXnRgPO93TdVvBEXxN2eI7VL3Xm7RoM9HzSy6l/3QaOLQSuAEMaboRCZcuALscHQCwQDbqc/QfP/frFYXw+qTWTqt5oGAv79QrGa46SUjKVLDUuDeO6rxGNRh3fcgQ1V90lRTd3OYBIewYCtkb4R4jnYjwPgEZjwF2qBv3Fd4gz0H7zkHg+Z0+4c+7AP67sqRuNmPwTzoA3AHb9BV4l/nMH4TUYqHL3jDnJPPpT6qZ8WnMiVIrgPGRJNs6a7pilTHpqGKliuBOAZUDFLQMcLms2b1ingKvJ9+mKWi89meNeJvhYsqLes4zZU2XHETkyTe4NA3tN8QJfC9OnTCSbnhMuVCNY1XQGFy/lmRsKP9Zhiq3BNI8a6r3cHDkp5eqYXWevrLdAet5VWOx1x7gDh2dUOxESN7QaOPTnmX/pkP6KIex1mr3GIO7BJ+g7YPOshhxxCdqFd73nN+ifRPlvXiXmIBEHzIUA4uZRqqThtsuzss+P88zmpbveDkb4qeXeUmIrJQsvwEEhe8IJ0tbek+/tNRipQ5rz4GJ5MKaosm9Ck+gyzx6VswCtRsCzqX2glrbXQhkiupQhfejzhfcdehSIxmvO7KAVvmSsC3I2iDGmZF4LCV4FmNTUGC4UfXzviAV54gB0kmCHPf5+ie+zBA0zf0ANo0T49pF95OTn/g71HodhQJ+Sq6a7Bxx04JH0HXAcgxJ+u2OHsSau1vwOAirzTOjvJfAOCzs5plN6u9vb2GSj+o8ce8pDHBukG+1GAT3uhAvRdD0zw6Cvneu7Itz16lN5TjTTQr6sDa9YQzeMxtdBZIPa4UVzLneE5R6nOhQpL4lOg4Ft7abd3s/FxcwfTFrNKDzXcDLyzBaykBIA3mEojPwXBdY3xcWvja8etdihOzQvn4KAonV8QDEkY0LywIG0cmT9fMzujHKZ8gDM1Jgu0G68uwdJjYwo6F6yNLWzn+to7F9XN1qHjDmyOvgMG0A5C/Knm9zjX3k7dfhx5pPrYr4eU1mlxezulnMCM+Az22HX0T6uvF1OxPzE1x64JYt3NbnazdUH6oGbOhqexgwLI/0w/KhFqBr6HgwcP3nHHV5f77o4AZK8H5qTXBFneJWQaYWgIc9I3CnKH7o0awbUen6HZmUadhdZTsd+u7GaXq+A1T3VCzNjD6UisdpCRnS0Q63jxdgjTEnjalRybIuEZq0bW7bUphRfOQRyI502nIgckdA88WqCU1hQkVYY4VHX7ab+28cU+T841wAm/8eqoGpoNHXdgc/QdMOD27e3XkAuxtLO5P1TzOoqTaaE/D1EpemfHKvLR7uvT45iOGTGbhpiUsSCfFqWP0R3I3+ASKoWwDowv4L36j0OqIkk1s3MGIaNnENL6Q52/yalQkk7eQapyBiHjZxDSRPJPiX/0A+z2mefYsOFz87fdNJC3PMippxrNlQoOsrw7BPkj333mUxVt8gZBJqGn8KUqC62zqgoIFBbPYNk31+AENHFTt4n9wJAuE9tVqmIffftbUAFYTw0q7tJszEF6xxiGXpiSjjnTDncA7LOPlgjBgTSKBs5nkVGMG0tIOjTFVScI6LGGpeuvQN7AvfHqVPjL2LgDm6TvgK2wm+Zv0X5LSgRrrBNMSwL7CabFd4a0t4/5IgALr0j4xzSS2f/UEMP+fRq0erNPW9fHUJYeWPnp5a/yBKBnYLV1YCS3rkHQL3iiUYiD//4mn6SUX3OD/NENHUx/dEN3nEGIjRvPIOSLVOkMQkbC4iwbbdn45CgbNyYhhfOYQOZolHY7NnYpLhTaX+KhVZZqnOBmsL3Z9Lsb0y9ugNnXU2F+KKxlkaXgFdbwKuQso1lQ1jwEouWVrRJNPKiN6YhjUmWSkfnz30kAwJgrcJJ8qA+55f+wDxObffEXL136xZRjn4u7wfQ0ufHqXBYNl6FxBzZJ3wFDABvDddZOgMb4F0g48e1jxvgP17XDEJv64JtFwRT0dvPB+QgS9/bgiiseC3pt9QxEfqBsr5TIVVgegjOKJGOccgYh/9/f5BOa7rj1YOJg/qNXOnjtHbQuG88g5DfX7AxCWiD+V57P/dwCNvoRMXLqmjJXlXsTMTLnQXCxZ8ZfwXEGK7EmoG5PDQ5aaFsD6uq3mCuo4G/myXb2tAQmQrYEo1eQV2S6UyPbqbJostJO2XU/4QmkDQUpT6WnfBt2316yCpx33nmUb/QTXv7yl4pVu/P1tLZYyK63xI3ItnNJ0QCPVU5tgH29GiZxjIUMVrpbceLVKVUAGXfgRjnvgO1CBiE8gb5cnnkbk+MyHjxt2p3xGUrgl4UAb/t9M0qkXQz9Q+Zhau6GEcHVAL+40Ubpdd29q2C4LX9C/pBVtk/YKC9zciVSUr+8f/43hvcoT3rSsx6HX7ohQArM9rG+BXyOk5Jzamjl1G6gzNS2482NPid0G1q5KkdUKpSHWIyn9J5D3XtFXFVY3Kh/NRwdm61Fgu0F6zNm38/3lScqzoXMa0JceKdi9et26nksrLEsKl333aXIK3UvvI++vwUAmOM/KJYN7Eoxf9o6cgPISSfY1oljbtIk/+zuuwuuvJLTZLZ5sQUYd+CmPe+AZQh11usnX06Fmxs0MxvjoO5cBmHoV+y15C6TN7sZpKLA7tYE1Hff7RMAqO8Jyg0BG6UbwdUeqatsp5jRI/nl/fOLQji/Aeb8oJ4Sm420MZgWHHDFAvYnpcAvqBLAiWWfGmR5pEzqKwnmPjF1VcNUBJVKeJ1xjzH9pNr7Wp/kHKVQx1UFBjGw6MDiotTtJVo+BYpR9mWGOBe9nVcVk6LZ7pb8pr4NZcgzjC6+WCOdRAmb93j5yxUvwfR6PfKHl6PJTIXtqqYU6CHBmm4eOgnmr0X/s3Afdz1ksQUXd+CGPe+Aw7MnrQaQ3TlR1P6wgiclJiylzGEXpTm3y5OffOc7tyPtPgCLek1GIf0ehFYD8/sEAPCKV7yCr71oOl339iqw0V9JPLSTmFC50xdHFbKpJUBTHp2diBpZ94oF7I+E+vPwm13OQ1O67Ed4ALLMLy9LifAA0EgxxHvmoC6yoDBLT1APHePPOAh3UT9BBVEQCivkcWf2lHhilN8GizkbnfhcQVcC+LQ4dFKcUFAqklMqi3YVAcn2K7cvKhtDQAtUUwqRJ4PZTn8KAHQEWNyBm/a8A25vbxfhncmYPISNZz9Ia/udHSswhiH1HHtITP1JgJXQbDZ9N+ZLomeo+Qf/gAx4xaeD+EV/reni3o629952wcG60Dehdb1tMrmMdHaOrSqc9KV2N5m83/XIOmD+n57T9weeasTzc37+J/p/yeF32kPoFb9vKvTqZX8c3DVbjIx40TBR5m6Y0l6wzg7VuWC2fXtxUjkVaD0Pn4tQwRY4Zc4vN3DJsAhjTZu3nW3JhdMruVZRN6gRkEUI4lZmsBwWd+CmPe+Aw/bq9vZDDjlECS9Nyl4GXkRFUMe0t2/sdRC04djZJPjlBgDmEwAMWFVy3dt/hQKyg6HjSyN7H+wJ1VReGG+KErjGr3DfADiRRm3samP4bR/6ZqfXe9azzjEeQAKMeltJvNvLkE9M+q0PmvG8NMknfqLTl3ykPkTE2rYS+7Qa33KFfSFBzWWfDbaVr5yydTxa3yPk0kUGzFWCMOc1lKDW8QS0n1e0TF7+8n/zJ2MCKzG5jJApUsH2i7czmBoE58NTCINLAWTUfjSdd8BhOznp9vZ2Cyty5EWjYmaefB33U7wp5v4BkiASDVXwCQAgYX5f9+cmjHs7RQ62RJ2xoHWanhDFAk5kMgQmtyNW9oXZmnVtSbzHclxO64CDpIn5QhNJXkmqhHPb9KG7vAga+pB3XqESP1JfVw8xLwKFaMRUwuzo8kJ9XqLI/Aq5JN0eUumYE+3lkwmopPr4JrWiTnnRiLloE138exFE2W4cNShotvMO2FMJkCfr3IiHgidraJlh9WrvK3exElqbmZkRytQgVwOIoVXJdW8P996be96yU11O97UHAfbO9TkRNBQOqgD0igVseckcm1uYI2OWsVem9O9fVEj60nTFb6jE+O35Nb65qMpHrHxBuualRFJKBZzCQzdIYE0hBg/Rb0HcWVtjCpyZnCc/JTDMOVumYq28jZZiklf336GBYs5Lplr8vZiegOZV5TzIsQPAUokyJAkveiHbt2NGDbrGPe+A0VRL+5/+TRojDYInpQAvctPjQw45uV1qtUbozX4XTRmJKRD6bsuWaXwRYC0AmE83HXCwuLcHB/y57PlSZfLkHV4G1bTK22AW4IfqX/EzcEtsvvVvAocnVoPdHTSaCfYBMwIg1gDaCoisIg8D68iPnTf0zw/8lre3TnzER/zJsnIfkXhV4h3ztIRTYPny5cCpawow4A536AxoGLIiJLGl2MI+zUkLp2qppX1i6rUfQJBCoWe7FZPrpPqHXb0MpGu2kXTeAYfNTPUuu+xSDeH5Nn6L+Gc5+hIf+wf+gyLHZns0E68kDnS7qLlpbw5DW2g62Iy1ZUyNQFx+Qv9uOuBQcW8PnoM3x4M+GE4/Goi+xbZg6pxoYuU/x36GKIa/olMfAOzAqtFojwvyzU6vF8QYCadEqGyBfMUC9t8lc2xeHloPmn/HO9Y/3SkxP/8ny8q9dH4+8aqk83kaUu0Dcuqa/GYfIMJiTWOPROkJrxW5CtlrrlVQmv57P69ogVRnMiEnm5eTGqVBkrrZulF03gGHzbekRIjqXRiwA117QZFjM4SCA0m17LSPabbkbNZFTM8gr91vgz9kHmYQU4NIS9Jl93Y/8yYDxz02fDkZgE9ShcF/lM985gHAnUEg+Ej0mXUPgih8yZZCdP9mp9cDAQOhpHT288h1lR5ArGkT83+Zyzbv+GaX8/zBbryZlH6U5h+H8u1e9ap3zGSgt7jaewiau4vP8R5sxzpJGsr1yKr1mlyrhSfkhg+J6ZW4CvvWPFSJrukaYYqt2Zr1vAMGohWQyV8f2N6+i/Cx3+E/EMVmnyVCMzCmvf1AUg40QmsbBwmpF1jyoCAxdcZDgBriHgROtpGvNx1wpLi3e8c91gzGDvqVgw7+FSEK6FzU0FxAVuSEv4mGJFiA6USoxrnbz7d/KVdOosT1k64rWZew1HRxJqVP+90MWSn9ybJyhw69NH8DsgyQLiN1Y1D7sCby5DWZrR3UPqwg2XcFq4GVhpmwRpKk1m7rpI6G+xntEYsueYm04afkbIsW7SuACa96mTTIA7+mUp7GO++AHbSosgswxo/ws0S4CUlBxgC7qBRJLemCGIPUQwCWPffcvOYXYf5JuOmAQ8S9PULcY01KHMzQcOxcC2q4YZ4KJXYZK6xBiLupnBA5IZ0DgDuxSyOQF724gSInwSAtPKn65aHt4OlfmKTn03JaXv5Rmn+ktFxUYkomA9m4MTQ8NTzEPhVCux0afmp4kDNBbMkaY8KaKs2qte3YfmvwljNFueQSuBm796WidJsMCtEvvFT8uCO08c47YLwiur2Ssm1bByYg7v/5Uj7glZpKSC1DbpiKfSQh23zzmwGSdNm9k0SJe3uYuMfq/C4OhgGIONCDKITT9Y7j2AHLHkypGE4gdoJpW8ZqzLsaJsKtnATDMVU8SIYCnSRIKijSFK6YiCmwJz95TW7DhIyA72s31jGiKqzV6W20CvSaQRvPL0vuh8lEUkXTWduuuhJMG/K8A/ajXfCx39suH83hF/dsFrQbsQgOPvhsapj7EGvt7QcMqrkZYF9x5YGTctMBR4l7e4C4xxo5WHCQ2tU0CtG/67j2sGS+OwDlTncyDqTxx6XW26g3SOMkI+uy3Y6MbzJKmTLKyhR3+dWBZIH9Hp6KFqmz+W2B/R5eBV2S2o3xE6ucsAZIs6x2CK8Zbla1HK/EVcimDueO2UTdeFUvfE102jbeeQcMVoFq7Lcf/NgSeLbn6GZIt6YCDkz23zPD/PKhuwSMkdRDMNW++QFvHjnLXzYM8Y0AcfVFk3XZvYPEvT1A3GMNkCrdWmoRcbQH1OAB52FgMe7q6oObvFTnu/9ZAveBGxAEMbPuuhhaP5HNhQzFEsDTJyN1Jr8BT/eF2JKRQlVOZw2SZoVSZ/aavARow30FC3fetkmqFd2E6u4OPmjQhOcdMBolZDsEueqLGAXf8Z7IIaRKYMvmZ7yV1Mka/pDAh519dkzRvB97Pb808soDJ+uye9cY93Zo3GPDl0OgqMXs7MpOlIchz+wh1M8c/HME7kWNGcANrr5BGuuuK6z65dY/jXpaDEuWjHKYbFwzWteZ/OZQuneFC23JulJie521MsFKCLdp9pk+Tens6/nbKhQgkDORsKYlMNOgQQOed8AOaFYEPtYRCoCioh74La3jnWbNptDOJFGuPLD/l9271ri3d113vyXusUq/C6oMOJi+6hL4u5TgIanKsMZbzRJgdo9LYiU2NokIToPzupNOwhQwIibC1Gcjs4JoUw6xJtNMCOJ+1oqEL8HcpueEAJ1ro6/XNJuloLkK04KpvSYmN2TL03TnHbAjYEBSJ/jgD3s2NwOgRoz6OykC7YNt6owzzj776PeROZ3pXXng5Nx0wPXFvT0F22x9F9sQ99j7O3UmIhSDAfqjHTusK9EHk7JVsSJAmssVos8KGiHNYBUAUiBShYZhalIvGR39mQm/oF4iOjAayOX351C9F0ZCF0psx6S7aYI0SxLQbeq6rZXM20ET4tHXzerVhn6uitlKtnZrrvMO2IVmhK2dDfjYj70xqwcQkDKg7axI8+gwsLnwsX+AIo4++uhf55jhGUHevaGfZ/79IN71F02vy+7ddZ0q7u1d16HqnKIee6467rH3T7pOl0mVT9fsYQ/Dh4fZJbH/RpTTU6plbSoGXq1LtRLVJCZiaNcEDMKTwCBMTep69IMKpIrqy73iv/9cfv+eWLGK6svXYd52Fcw2wLx4t6n1mNHndZgCKRhvWlNCrDIfIecdcDgAyIADWcAAMIpLBkqgYp6Awygbvl554JS57N6OgQc+hIw7cBFtwvvvl+Ieu342kshPsdLv7g0RS+E9JRugToi79Wj3TrcVAOuOqp6ioqRz0kmapS71vSS9173qfNS/J1asJP3611OJ/VjtE2bZ5OY3Df4y4jh3XVAz2AT7TSeVTAG03Qg574DDwwDFALarnDQIYRDrIUWpBlL6ygPrTjrgW7oO2GBF3IE5kHEH7sq4A6939mXKJeZ06dQhFAbYouiOGHdV65oKQqvdNDWJZ8XNbqlAojAmLDUpA++Q59O9IHE1T93rHjknG/6nO+H0e2LFChKfw1Nf3wO6bQXdbJGqcfYhHKfeXUbxlz20W98zWTOtqhRGXtyB6SH2UimtqFnXugpkQs1T82jORypfeWDdSQdMwg4Mwhp3YJicnEzOOWcySUPged+X9wtxB9b7Xe0EZ22x+34IdYOBWq8a7VJBA3R95mDMyCLVHPNm7Q+QDzctlZfpi4E/Nve4R0iw1u8VU/cI5PP78MNj4n9NyHdt4usy2mMP6fZkursL7Oxr67ZyKXhnO9TPAKoZU782PzfOiIs78J6oSrzZYJ4yurlZiaLtl+JLnPybxyyH3fttb8NhjTswTjqazjmHDHfzavO7e9vJjh2eG4ODO565YwcMg6RK9wDgLpMDgOmuraYMq2eaog8mNoMhEAuD1KWMxAwi6EfG12okZhCBeQC3vYHZ2UDuHt51jesyEX4z29LUXeyfglALAG7NWzbLaIs78J48iEWNleooMJAjSp5G73eYfxl5szeWK/SyA1/EkmMvChy4ChB34K6zRB4Y4XctwGW9ABN3gbJMUFGipb5GngllTxRImvhJ9KYCpQLTT4t7eu4hyWxOv1/pw7d7DpfkoYpNqdOnWTYF6mPHdahg6yaGlHkaO+5NXRsQ9oQtWMOOtLgD35uUxDCUqOcPCxyBeD8aqOZozzXDpwjDdLjkk2/jww78tvvuI1QTd+C2O9kVqQx9LLXaye/uMMLiLuYmaMIvkCz/sp+ZLPIfmlRnVkjMzuZlUkg89FCypBkczSwydX6pIn9ZScvU2ooTW3Jq2hEWd+DlzULEUGHuPyeDMCJl9KDDUn5x05CLqsIOXF/cgeX/QL38LlnUK1/cLfB3RM5fNT4oT6lQicJzwLJqFJ6D3LoGak2N2YB95QtC2QajK+7Ay/c0x5K/bEIlst/00Sh7DkqDxa086YC7tgHjDhxaSiDkxx+QtRRF/pbI8LvGH7IcYlLWF7dg4WIss3JReMliuoZtwb7yBWEzfkTFHZgVRcbEoglSELInhWnxicfcdSJtc8Yd2C5S10g594uvOuWYUnUtlAWIlCpBDDRxQ/aZLwuE0aMq7sDLhZhiUQqKpM3i5mmbPu7AO7BuR1n2ppoKTHoxVb8JxZXdzykdbNrILdpnvjSg1o7IuAOn5s9Del524OaPOzChd02wqT3TKbn0WDdkfj7czBuBcQdO1Uyl002PuyEQd+BiyvtUSaMu7sApLJmTtuVLP17kEwb4zO0p72PqhAE+M5Jf3b7TzMx1/aL6mW0nDPCZkPq91i123WNKJg0DfOajXjeZkknDAJ/5qNdFpnTSMMCjcU3AOiY2nrmcl04aBngEeXk9FfgOqc+uQxownMlMKaVhgEfJFHmfbmAy4D2ErazuOLdOKDxzmVJKwwCPkMEHXKT43sN2FVLlPv0islm3zoc/NjbQWT/8Y5Dkt24RbBjgkSGw0KE6n9TxOPEFS+PldTw6DNOzfPjH9L8vDfFfBs5nk9+6RbBhgEdHEYbC7uRszmlGX8rZyK3TeUy+XG/HQIQlv3WLYMMAj5KJUJMAj2A6HC8sitw6HMjk6+3Y16tdfhJJfusWtYYBHi2CVf3OOVRFcvJd+rwBxMz1gBCW/NYt/A0DPMo2glO8PU6I+8ThLZoSDfzoNxB/o0gV8zViKq3m4vV86iXJb91C3zDAI3C32yIqV4ngHq7D5tmXjjVT/jVEKVKaUCmrNM3MXK+GseC2AMlv3cLeMMCja4poyYUPxRMhIbA/Ouz+NvBCmsKm6fTUqUphCter0bEiTH7rFvaGAR5VJdjorjW2xmXO7Y7BsjnUgRZLJYlUqBIuXa9GRTz5rVskGgZ49Gguxzudg0hELT/sfa7cIDIDOTYt0gNTIjWy4SDDsMHGT8LUyW/dItMwwCNFaWHnjYEyNYdRBGtEbqDFiinfg0wo0nRapwyCfM3Vx83M0x97wYYfeZ4nv3WLSMMAjw7le4SDAqFyEmHiLonB+2Jx4MXKKfyEByoUVvtsTS63GV59Y0OPHihqJACTAhBB8lu3KDQM8MgoOOxvDNV8d+BirCybY7uxRY8rUqJmObPv1mHjMNSvNTMMw9iIk0HyW7eINAzwKFC4A69glQdM1jQ4ufN5rqwYJWwM0eOc/gWcETQV8kCVMvT5So58oHYl1Nvo4yRg15X81i0iDQPc/CiHc5Q1DNjAS4nktFs0pzwQwqns4ekUPlUr7WAkZvTVZKlbKbUOuI+POKw8T37rFo2GAW5+jSKlYTHXM2hTy4Zhud5ejJUpGEOYMqV/XqAZTaRApcqnH78fTQWZmcHaeW+tWzduHCehlCe/dYtGwwA3fw7qMBFg/75/BN8gXsoW96xzym1ZNn/pGKMv4xIrNQJ6Wd9dS7xfzUZv2ZKpeK/jYyNZ4iOjiEjDADc8UKWPls3mIQlE3fntDrIWnFcJOEKvCZxo1/gB0b+FN0zWH+MyiaZUg4NJqmXmjbVd3Pr4W98adG5lpG93tXELpeYO/9hIlhGW/NYtIg0D3PQ5eHNBNisJBzvHMblOMHBy6KVTrL6BS4zg+d1osLyc+H3psH/ZVyLQcKZvrtTsAAfClkSNOnYihUh+6xaVhgFucCoRmNwFGyvA+T4NCrU7tE6sFEQRMLZo+t8uIidHDyY57iDL6bZFwn/mdvwkbNh311Z8/ANJNxQ5EZBBkt+6RaRhgBudinY0JRdFsGGZld6SM1Ijp28kGEs4mMj/j2IsC+n/GIFHvVj+EwDL+78DICUoxad2x/KnROL447dti9pXs6VmplNKzePtY+MdAbJMkvzWLTINA9zkVCoK4qiOGDQ2dogXR9PKu0Ds2dNnwuS3rocWcolQiMPFbSl9B4CD8nz73scE7ht70Fcznda77rdiSH9/HOM1E8xYbNvNZlgJCPvj1h6ZhgFudHFqIZwSIYLV3RqayvUC550fAUDZ02fqqTIv9NanPe03tdB3qzPflEGlKx+COev5b4DSa77cOnDrueaBPMu5oRgqvUwZKuzvj2WcPdTllEuclGN5PcZlrG2/FfNSWB83sbBRaBjgsBSL6YLiBL0LguRN0uciNWHOeZy2iLLnOzFp2cj4x7F6xlMt1pIUWgj+homcPeS/ZBmISbhN6iG52Ka5aqBjwBurZmO9jF+lt9hd5z22PfagB3HEst+oeT4cAixsJBoGOKZe7E5vxfQITqZhnVy8gN8xYEL9qeuGcdKy4Zys7KABtisEGZGrCds+ZiKR00E8p0UBtpEqbENmJGGbHE3XHK0IkrakQqNAs2rnrI8hXx6/roAYCwwYa9lv4zwfDgIXNgoNAxw0v5LXNfXpwMkncycMTCpgYdsPMOYpTHni83nR7ZeefXkO2JlsQBPEJwb7nA7CwYW9oH9p8q9Lg9e8Jt8pVHij4ZId6Zod1bElFxqGjXUzhPHo+P7+uKWKfkjhXWONGJmXwvK4oYUNf8MANzXKsxEI+D0zo6n3oSZrZcLBepToQaVXvwlTeYtEVrlty53LUDHG1RMf8xCw22+bIKn48gCOxz/+vwIQSTN+wzBIgO/IkWFHYkdFrKaUhRYahqFCuoaNQRhWgTD2jlWqAH7JkpXzfDgIsGAbBnjOnNDzDQMckdVFiKLPkMLEYpB+qqAG3mNkSSKPZ3FdlvcHp94VKQZl6AXcZSQzaviYhwC3h27zNyg5hSmVczjkkEOQbfvTnZBpXoUh39vRHRVNZqQ5CgPjfJueYVgFMh1fWbmy2zefHYtLW+sfN4JAGwaY8X7DAIekOHHixChIQ1Ef1hcKfijHkoLD7f5ZPKSisu3ewU8CHucqx8OJsnMZyNRKTJDbZX0AlMcQ//iQOoQI+XZ+UsxZD+1QFraUhREOjP4UO+AYYqxQgDFH7F2lMo5dtmFlGv/dSDw2aZe2NjxueGEDaxhgYeFgH24Y4IB5kSSNdZS4DyZ8gGI2tDW0JbvAr4PB77ukbo0QfZtlpp5FG4pXAYHTNI9//GmwtFdolm+3v/dsi2LuoxwVTWSe9NMMO96iTrA+mPgzbISyupoPeaiQcQltSjuOofTNZ8fi0taGx+1QRIANAzxnypQwHOzphgEeWVCQRPZkAp6Xw0NcZfOwiUH8DFR0Ivgd2zKLCRqXt46a395w+09+4jtVogROe3zAtLj/VXeVCd8aM8X1zIVahDqdaZQNnoN4zDoJGh6DZMNGLEnmVsvCMD5x3vpOFyhtNnny6xa1GWTLMYy++exYQG1Nd3igJdMhoIYBhpsUdMqUxnCwHzcMcDQVRGlOky8UDbwb4FnPwuxcou1lx0dcBPIATlLOQbEcXluXsWC6zejRo08jmrHr64fgjz2Eqz7u4z4upB5vJVfhRJHABezmkgy55TA3+DIMA7pIaQAZci80BB4j+OagR0Jkw0YwOY1Zcsp1KU4i1oFA5PG3JuC6FMd83KB0RpxY2toQsBLD4wb9e40BNAwwG4m4XXC93zDAEZkIBOlPwd+wP18rxkZOsoWZgz0BMBSnVqBUi7sMgqpmleNUetrBBzB6ANBT7/64PzH0YUHeYPcHPvIjHx/kI1GW8wzLuT7/TsE7P+0/3JRJha6DgdW9mb30lt66OsCvZNe6Vk4QDzgMGx0wGqDth40MTjJ6CzOOgBhEJngLJ+Pxj3+GDcdY+uazY9G2tZpeSUZRAwsbSMMA413q29EBN0yq1xsGOCYwZTojn+znHPr7k4DaobXyqUjB3ymK9NPQ45c2o6BpTBh54AGYju6+6h5Woa2PvMfHkCow8tNOJDocX7nbfqEv5YXBEebQeQa8s2XWujYAvtlAk0utZy7jZXZVDqzMjeq7iK8R+o5/KmC4sjTuUY9iNthggw8j48Y9w45jDH3z2bFA2roXxfC41Wpz4ZLff08QQMMAoym3C673GwZ4NHOXoslErx/t3DiVvKs4SEekHV3SYQddFZc5ENWR4/RaDCYBXZGp8Awt3DWBEdPH8754XR4Grtfn4vLKrDFw9SJusL1fR+XALqoIcwXrzcI7vlVuZ3ADL4FiHIo9x2ArffPZsVjaGkoG+f3vIQE0DLC4Z4+miNsF1/MNAxyRN1ze6dE0UWbjLpb2rMxV52BifoI4xz6n7AdfVs6tD1tJuSCz6VNpDkgRXVgwUtevDiTHCF3n9FuUw1Hqhr/o3O4eSJVaLE8/cqlgEe/ln2GAd3yr4qt2P+AGN8ivcUzcVM7xCAtc3b757FgwbY0gUxBAwwDLT2VtgfcbBjgeARFkOMzW36+wJ18ql5OnVCt6OMP+vfMwUwH2iemM2P0cpQ+CcmHUmfICiNpY6HeeXmiic+3ErA6ug75D3cOgLN7t7p6FACp70YJ25fCOb0V85R4HhN1Mc1Y3rpoNj2NkjELnGgScfPJflXHi2IZjVPb9rNEHqK05zfekfNxofG4YYDDxPkjtiAFvNwxwSILg0WleshxV8Dyru9ylaAQiz3rWjfJV4AiS0O6YQkne4RD8UHYpwwyFel2BwF6qqxXNMHx4spy4C0Nd14MhTZnLbE24uj0HJHF3O57s5cW13X2YGWSpZ8ljGEKJUKJNiO/4Bht4N7/iMsmBR+s7j4wVxnRKRWL1vDFY4Or2zWfHAmvrnk3ax43E94YB1j4UvQV+3DDAwVJ6gQOSe6Hjoa9LCygxsb09GbLV37VNHNwhm1d6+BZPjGBwlMvhSK95+PKBLEoX1dWKmzh1qgex+y8lyl1JYbwXHZw+njBQ/dkODBslv+fg9KJs9pQ7fb7s9WPY6M/xqqKr6UOLFv4GQyTNVjh0fCsZeJ/pdgmm3dVVm8Q6nTacRY4bw+53uG8+OxZcW7PoHzcCvxsGuKBYQYTebxjgcMyY8egZM0QSQNLChaEbOgUW3+wu0lp5cOIM+nL4h6zNciCJaLScJIr8OLlcV6mtzZXLRKpp0q4XGyXxDJKTSj2I0d1pQkqTDsRPM06tHvBnCEzTLjJJ4QwbJaczeHg9vtPp2NNS+Q18/5PBu939JQDoFidZafXgqxo8Or5VDLzPfAjhMle8WZmJPaOrYG9rAM4HzCcMsPKm9VbwfMMAR+MKKXJt6vt04WPTJEa2YTrSoAQZ3NAYVWgqULX/9SolJtkru3ndgrvQBGWZKxtaNjn27GVtUASt0JRYuax/Ogl4sht35OjpoWjqTXMylFsvSqNkGCl+LDGSQboOdc3Pb5546g9K+FN/huC+fPZn09Q/y2/6euk/yzZ59VCR1gHnbOA2efbOhYuVtHvT0In+emnFSUMI5fYkNnh0fGsYeDd7XI6pM/ERkBnoRLOAHnZH33x2LMi2NuAUrkVPSyoqFTJEt9hFWTAd7wpFG3/eUs8cORI+B5NPULQNPpaL40usagHfB6oeBgVQ0pbzuEsQczqCtfJU4TBX2SyMxifKc+uDFS8woJyL4CywPdFDCe2pdS5IMU7GP8ojKaoLjB51CSPm2GW3uMUtPjvKP8tv+lqk1VW8xkDKPMwOgtfFwZGmYUgyDA7qC5VVbxkGthfNiUvHN9jAu5EzjXhqZ4w3Vhr65rNjAbW1GadG74O2Gic3utarZnHDAPNOLBCvE2f2Uz9FQ8jFzxwJkRkn8CIaOeMEEvjcJggvlggfZj3bfjT89w+quVAGiRJzXjvPTaXTae0zYYWxrToRTc96HCQlkj79naKnnX5UZENCYVItjrSQ9Mvrx5R/mHKURv5yy/CkTI/yUEdCdDqHwdHnWqmg3c1RB6kVF9hRZAh9L4458JMCqDCMgu/4VjHwPoOFPhPeLzGbH0NMKpUUOhVKJSMrkb757FigbW3BKUlTPz5ilzvB5FsGSAyTN6eksPIEpXv/92d/M18aQ39RoNqHT0xMfPJP8ZC2thNIZ84EnTEjFsKjYkqZgdhDjPf2YiFTNAsuihhxirnOKb1uyc5Is4bPhJWIj7nhLNork3z5QJY1W//nnNhZnkMYGUZ/44tLbnjD02GUZENKSVKoLQA9X0k40Hw/mjaNcTjcu4Kq1roOg2uftw/CRieaRqHMnNjCMmAa3ZbFUGYnZA4d3xoG3mc+pBv4CluPwRLaVu1ZyZqSkZXpPGck8xwkTk1Kfbg24DAUtwsum7w3JaOIbU2VKF0XojQws62tjQ1K2UJhtifIy8gcU5IplUq2/kh57pmA4yB+Bg4sEh2cMfmKzbn1iRicW1+vjnMOCuaf1vOzxYsnRBEAaY1kCkJww6qqbnh6hpnputWWvpJwoPv9aNod5Y9IHGOv1zl8jMjnf75Lhy/CZseCDFj1s1l8mAeOOYJru0NVmfSdEy5ird+yBUXf69ibYDJnl1tOKVxq69LxDT/wPjPj7GlzZua9FW5rh0Fpt/gvTr1Gp2S5Djvqjr757FjAbW3CSSe4kLLeAE0FeMsgm+6XRT9uGGDf+A19+MQnm/7g/0QKdkfHybNUhUe9pIoi3CGqKjZ3pKi2AoDTWoCSgnKifVmsuIajLYlOP3iFAMrV6sn1GX7nYYqBYcxViIaGCIW8feJ3AcVrZXp1wzwF6BUM+ctfc/XxbiKf79Phc8ylta7unV7ibVq4qN72WuF4Pdvdix1C1xfPFgGYqpY6iNnD0DqOu4td14xDxzf+wDt6+JkzJePKZHcgVkq8ezS/OxaxrXE4XXoz+j2qWaveS6I2b0AsHt4lumhZ2tRgKlyHLFTYRj1BG1DBFOX2FDVjK+F1gQtCFG0Mw8PD7T3tBBzCZVogiiLlOXk8kWsnj7QB50GiohpMW4lcA38Xx/auJ/ve6OQNR1VHwSDYAJptZrqfqo6vJBwo3o+mBcjXXH28YPL01qfD5/esH/2oL9TdCerzn40EyXJxiN3ujcjegjkXptMESFmkpQ7XbGAWf3R+26XjG2jg3QIMHb/cc7Td9NFAvow+nI/W7qsB4C2cjKIlK332vvu8UfzuWN79bltb23AEtWlk+PefAolvNwhhEoLvhLI1MWFT7HchGYq2CUnFiNCsVoi4C4BsOUHINZKaSMFJYeu4IQyiNCKIgjsV59RH51gwx2Ej7ixFHEdgiPxMHNFgmTBh8WJcc5CHr4Q489H4uCks532yNzO9qk7PPDO9mSHPHxXUCSab4zKQ97AqxgPKzBEZYrd7Q9Sl2AhqLnV9/VhFol3qIPgt/um6zS4d31AD72ocf2K57csdIWmC0aNV3sLJ2OC89Z2K+uCVOnuDvyP43bG8W9fWRpyaWu2Am1OB8gerps+ZwTuUz+aGLZuvifqEAXYtfDjarw/8h+ZTSzID1wFOUFT5GJWPJm4Ov0thRxVGiTPPKsw3LvSeE7AddFsb6DkD3EjEnErbly1rmQdAbehk72YBAh9NVAng/L5cWZ7yHamIinP7Mk9M4QfdOiuCaTE2YQJNwYiXHvWE0zf4M9Or0+P2R57em+lXEg4seT+aLonyNVcfX0JlS+vT4WPV+0m/c9hsYPu8Fm/BjKxaer/ihbmUgEynPKnd/djLbHs1R5Y78EtfJXblxbDU0Tot/qnVp+MbfOB9Bl4gLty4/5ye8DL6cM46ekwnSCJ2gdJmHUUTx6TYndp3xzLi9DxjW6vIFF6rvXrAzRqoRnyVWAw0njDAboUPx9SKPeBzZ8yQsbY21BNAaABxuIECFZeQ08MqH0wqzDfaDMnWW39KoFhPzztFtrvrXc9q8tm6dmuY07Jln/RiNiYOptDuRKu9R1YoKmvw4azKHM6ZQzeGPTY4jrCrLaec2VfZ5sj/xr9RS0TG1ser/IQnxJQ3M/10nJle9oEwCury6djBXCROD9rnxeTD3FwSiw9Myn9xgFU4DSV3fUu7HVnFolzq8GBgml/ps306vu4D74BazpQ+V3LtbpBPTLfFPTEyuouEY8VLBfvmTRyjsTc6KrBnT8mIU7GtIWQI8OK+ZHRzI3GfL8mOj6pGku6MGI+Cyd2zZ1GPKdbGqgyCUQcPXnPFFVGiGSnl9JAovH2ThsRsJ+BC2ZqlZ+tnPOMZu2y9yy40Jx6+7JPMO+WgrdYejbzhVINgv2pXVzdlCnwwoBi62sLVAI5HRsSO1hWMM18+kKWB3LOrOBHf8HRnZvrpp8ecPk6Kt25gVWYf/Pw6dgVUin6fy2Dv0FrJhhm8L0v5BdvuaJ2J4j0BM6nld2RIv98D3bBLHNqlDo/V3gVal+3T8Y0+8C7wqyq7uXJHseAxt2pj0CByRaNR9qTYTDPHYDUDe0Yj5rbWkQEHCwuiRgpWWcdXOD1nvl8lkxThBKvfiUmTUiKA1IgBZAbrv34BKJVSjmn0GG3kSC5TU0mb5veMrYVu/Yy7bg180ucgsXai1UrAKcVdOMmg12XNpgCosLUZfbgYaK54Vho5ya4yKxMSWvv+l3ITHXTChL2fsGGDUTY6AVPzfSVGl0O8qabQ9zzcqLMbrY3kSpLIdVNBRn7dWIVpfB4YDbAjwX+ZcwGirfZx1yx1eFwmAJueWMZf2CH1e6MPvM/MCPwfGeZBVwrDESmXCvbNzwRiA8dkY89IZg+ETHKzEIgAOE+qmhJJJtSbis/nCPcHv4hUKDmmQcQwDVqgTXDFFba/4BjUVUrKMxV1QfdASAuCPL0yv0tEaIg5CUKSMKHBRVoV8bkE0tGhfCq98BluKr9NqnO4k5gx0H4zVeXcCybQ8R+4LrILizfwD16LWF+IoHqoaAvqra4cBnvNWLMhsWOHzxcpxyk88NnujLzy14VpAaC6vdDrL5tCXurwAzfwn7D2e8MPvJelUnMlot3DQQZhU/1W0+1C4OpqR0urYM+eEch55rbO6B63RlLq/aBijat0gqZqWA8IJLUxKItZ3kuJjSRpw9EjOQ0EuYrIovEq+6xuanp6Oo0efQ5tYqfqE2Y84xkziVcgryBarWWf80mf1G4zJtQmruICI/nGDpkS8YFAItcMwL2XTTjq6ZLTq3b4ES3m4x96EkVOmZl+wzgzva/F4HaFJ5T2mgmDOOrsQtvaM42weYb/MufBKlKPn/HPOaaAlDxZBTAMQ7EMJvb6uRm9oHbj6jtoLov93gAD77DxB6/c9na/xEl5ZuRs6bYY6zRNN0opoMbAPSOZPSKqx03hhyl/yVVT4k4XXCNJmeCGlBjBaQeNn3WCEjuBZzJTmZgHFIL5wwayTXDnOCSwMaKEM4A2Rsxp61fQbE/ooWVxAs6jTYhDsBapONNu2I7y2BEEmpp2tIb2UBVnONrDhAlyZENFMMH3xf+dczaV6UFveMOTT+4DmXJdXxvMlbrCMPBeF4pwGZLttaDwfNB2L3OcxvI7hrPdi5FnH0gw+TBwi2DaXv/qXADQfre8zH4hWeyBd2/EM3O5L7iAm3DBBR/S85jFGqWjpZVxLtbYBGlrkZw+5EP4B1ZWkrqc3Arzan0RummTucdjNmXR4BVaJ6baaFgzDClLVJuB2ul0is1ggz0MvyxMW7DUAOlTiPCEdmyNsWeirnXEf185V0H0pD0Bd/LMfXVw3Oc0CPjo6146aMJiSsLnDX5FO0cAX0d5rkynSXLOVZVQn2OH6/fK3U5x1HkOzwBCIZzf5T2fG0ANw19c6qzIh1XUPjdpiVo+yGZ7f+mSJsXE3U0lnN2RB94VO7tD230Bl9oexgfzGhebbGLZA4Im9oFVDPp6qaxk0E327h1YOztiSN31rGQxtEIzD54IfSp6+W+Smu4wOvg15E9mzx6M9C3s08SeFtLSqYXgymg9XEO3025SwZA2s6Q1Va/KjaPw/xdqWzqKNuQmLAYrZ51LpkV7q5XpWqvjXNVH7vCVPsfubwZWRPhRZyDCMoed1TTJwF6V54O2ewFIsSpM9YcBDwQtBrqP5TBoc9hAVwAYev2O3CAPy5SdzvWMb2rxxW9OlHrbzTolHHfo3Jk8OpbYxNzWlsetLGHVcDskWTUj/2VbMU2zffus7aE2YQ1LCw1COYkOD6AW+e63ajjKMqIxzQiPwwpBh9tU0J0JqdjGMy4YVXCVioY5ygLhYK5PdpzI4mEhYKesLUkaKJLLiQNJJDO+94TIVJk+YcKdAFfVsbqRfKW+F5Cxflf4tSus9wzKQNghIqiP3x1yo5fXwJQMfTrc4dCDkOwPpN+6SuSyQA7bm0tDz+e81U5w+15JzlFWPUxuFyn6/ZUQwm41TvFUstiCNryW5+CwGZZg0+x2wc3DdIJ5yTTb14FUK67SZG142OZwmO4B7eTVBKOw70C0MZE9JtLH6WxgGiten1otxBQ7Cf5sqHAuj561IXIyoL984LhLbPi5vkKfqEGORf7ZQJJnub1B73QnmM0V/r5o72gCjYfK9KqP1dViAhy+26fq9+FWtuJ8rpZympvfLTyu0O4ox+uNdhQDU3NWArlMetx36PCQyyJZ3vSG9Oludy2aJkTo9/sNvMP6/XHsVkNnqjeNQhY7yG1NGxvT1hqcdJreLriquZpSHafkMOy/Y7y8Bpo5QNR+O4Hzas2tE9qFO0wTwJs+JW512nLONAVaNDHd9MmFTYZPRDQ1hKfDZ+CIA2LKhg1PCDQJZMHEX4nnIlk2Zwv1+yf0q0GJyIdd2yN5cLX53nvvTVZXB5Xpd6KhsjK9imNYXS0mGBkKBJF6vQ5fSH/XgUHDXiXwdgfZrjFzfJH0LNHOnJnJYWXdmF5/EDLsMkmNdS9TkW5X/OI38A7q99vsdqf0uAaQLhLJYo6beh3PsQPIE8y5XTQLYdOQB9HMxlO4Bm870pr2EkGtMZ2ayqN1bQZ7xwD9tl/E9tnVkdvcJnAObHjaDGKiLZH/tCZMxapHrAIHmWTi2IT5c1Chk5UtguFj1acuAegH/fGt3t5ef520sTKdtQF+3cY5c5xemZ7JYN7wgHMGEguDdq0rbsgdzV4Rm9/Ft/vq3IDBKXwc7kXS9wKXAZkKLSx2xIBx6AkFt47FywDKN2Fu1bPfj1jwGPgda4axm0V6SVwURCSLNVJbE/RtbXvcwEpjune74OZgWjZ7ixGMIHmM55IctulLXNc4qmGPhPRjJOq6xsFugH5b1gJ27Wtbz3oKT5SJ9DIThlagI6puHR0FcX61Fich9ISTmwRt0IrCowoH5ae8dVqHjgD1cl//qbf3+zzjvTJ9S/o/Ug//squxoTI9c8XYVytw/C99EMTOIODtdwYqBQOMvTKDH6XbWC1Tqivoem/YzxxPJDt9zwphJplhkJpdj5fMhK1nZTLl546bHAl8lzsgCx6s6aRyWruDcVEKWYxxk4HneIPGYHcru3K74Cabc8unbBqKwC1FMI6sXm1VN0CzqSnMGYiCTExAhv0ZAlNZGYWqN7ee/kdwMjQygtkUuulLYU73RMT0yaPN1CMIJKQkMZmFntwkaIOMx9hB9tsnt+sIpH5fMsmynX76QfD/6zb8H2ZcAJGoIVMxlPMOXgWm38QfshvsCsioL3SdN7kpkkGRu1zg+40sAzovfcs83sHTzhiOn5lJpmXh7XaHahbTfu5aNSLZbbW8rFkUu9/4xhL+GzIHWQxtIqNva8vjBssXoTn4t0uqjHFJA5rSexcoiY7BNUxhs9hTfNgzMGAyjA7v6XgVU6OrU2boht2YQfT/LJPVkdBz1iaMa3RyAj91PDrQDpq2ARRBvqmpYHkY6KbJsRABU1//EXVSkwpqy+Gk0YCV6ZQRpkPJM2+CzlSUU6dbBvWzZpF+j+/0wBn2evZ6ByrkUsowkMzg94CIm+1y7B0wuWO3NoPdL3Y6vQYYtEGzMrAMPA6LfwQt8NKRIzDtZW9NOeYwCx5tKLs7FlGbi76WQfajpZb//74X09D/7nBMWX9Tbmx9W5seN6dcwL+5+TpuCtSB1bLbLGckklbttKOxnxaLElKmGdn1kt3xYdzih9GO07Jz1+5TFdmHTKONEx0asgTDNjsgLhN0FreN9LAYttXQ7gRWEvX4Dg/wX4mJVmiC5ROjJhVRmQ4F+UYmkFl2GQ7bIcMi/R7PYLwgM3jBW0yUFDGzSBTdfrzn63uFsF7XnDvMeOSu6jIsug6plaTGpQ6I7Ro0JaNGaFq+Jdc3Jv985jOv/Ccowz8sBsvIgodZA9gtrQoscecR2gpysf7RscRNwDe2vq1tj5sJvZpyu+CCW7iKEDOP8XH8DwPIuceQuIpVKxMDvrHNXzIm9mAGxt6WtuYxbvELFsPOwzQYzCdwGAJulw7+ADaL2/SJMZGBIMcGJ5ibJI0hlCgaBP6r4t15RYKZNKkjNqwTZCpIkgSu/CR2f052AvR6BY9bFszzDFoGn35v36tljoqVWzscn0Cd/tzrs1j0jFiXOrCmm3KfiapW4eWM40BjLZouQcR+zzH6/YXdtn5/q7c7CIK+IHBmH6J9dCzxY2xjq9vajUZm2uN2x8p7/TfmgLesCMJSTOu61g3nVu/ZQ2wqmslxmTDb2zIqGZR67ciIWnGm+feFIUjSjoLNjtwuBbfWZ4I/0BEPzeBlTibopbF6Pk6FH3aHvEWtHux6QKGa6cw2K6kw4FQvxO9phx0L5VEoiL7vXWRYVV3oTX4Xqn32a7zXtTBDCae8uCSNOhX9Fyy6XGy52X3R/vAFIPAmmGG1Yy2a/seiNDtyQLXcUS54WPr9FrvdmPw9DOmB8mUiLwickXDxx5qGPRy2xw1+eWoqz+2CSxc8ZhCzSlJeRc0jbxc7RnKGUfieD1m0b4kWC712JB+wqDipzJJbJGg2YpsoFRbph02kd/o0gbQsVpXXli+UpYRMUzwKzxEMzo46JX7WHfBAmyWRARsO40Xl9hjRe52hZAe70tXY64WOObNdqsGQF0oNB/ldYLvndjV7XVI1Uj9DTjn1eIeZGW51ndO4L3bhtgzQd7yqx2Xpzw56RT3T870WTf+6vjH5VxC0tgabbmou9g6dV79/dc6+4IGzG0n3JV+S+bIvE14rge1zeEngrk/MveyOnmtsdVtbHjcHQpQUcZVEvXGHcQflf93BWZWOBX/A8PCwNaeZbWXY7nSJ7O0pwaKmwqrOW+UjIyPQYVxji9ARGeZT2tJ+ILCV4eEE4lhl0iSP03soaYKxwklPKiTfPet5sVoTyTiXPlbpEKCiG9dgMr3XGVa1K131fsekCmHZmwq2fAdHR/2uR79XO7IzSO1u7Plbq8NYQsJ8/8EiOBMmO+HZVIo+rJawbzhZXOrA5/qLGHgpjqn5Xoumv+L+VptagHnny+rlDka0CrQbKt+Hpau+hKRlcQIlGy4eUbe18XEDE0JvXjrj446OJyrcXzkBpRtTwxeeJkba3ROwrcQEMjzcUtNrcZJ/KLRF1cDqOUOz1Mjy4oSOykRL6O+47VPLMNwabjsoBtR7p6TEVmb4/aBSoLuZuPCXqozw5043v2LdnEjoY2uV8qoBj7zVTTGCDaB7nNXrgjv9hlFnZlCYWF3Aqbnfi8rZljV4XdZ0xh+Q0Nczx7tQywu3XBEVCyfO+R2EZjctdXh4XTvigZVbO4F3RpgtEgKtrd7onJY7CKKwirUbSZEUXwPb5/BSKuPjdx0X4RF3L7ujZxpb3db6x81KozAFqLcLbuFAQFXpyBKNN4sFHsYdL2ECLK4AJWzzaxaDtl1wK0oG2A2xEt3EjswdqdKB/xKBVLwpbX/7HzHeh+72wO4fNOJYhjl4mT2PKctU29jgpLXv5/zF8CU5qxIxVcoDNcsqEbjKCMKuFJVWuiq8rsbx4Dr9EOnLy9Q89h2Pm/q9MCTfpvG6TL0k/hTBvcYBfutb+6Mdf1BOX99vsE5Fv+ARK7boypwHnq2KpQ7J64ERFjzMqrwunB6d6mXe2OoBXe7gFzwU/X643SjhkYJViIEPePjDH66BizG4xta2te1xgzI9NSU+GNWYcpGU38GZiP8jdKMpKDDQipjNfURgxriL+78vj/kvF9CplRkaGgHBoTQ05NyKKWkPpk9mLjhROOZ3hqL65yIWmJ/Y2Xhjup3jE5jlW4HCz6fGKqYvfl564C6XU6cao+jh9kqvI0pf5gRu0Nej16vs8vKbPWtlWOUY2pLLs8UO/V7VD7Yw7KwWND7f/bX1Q8Ye+KcI7vX0tIPJ+Tt/534PTI+8qkUvts9IHJ7JXH65vNSh8Xp+Cx7ITCLTprWaEAzPgPv9zHIHu+Ch6PfD7calH8WkCeVD5Jm12x/wgIcH0T06lniyorHVbW173ACXKZ0OmE5Hw9EpUYfY1i/Npj9cEoylfKanjQ0Lau8cvtWAsUTMEB0ySlsbGvJIaYVueTpG+unYv0i73Wbs2eMTGyj4QaMirH5js0V0/jvi/Dk4Af5EzL9xk4K/F18U+JcZbWiaTusUZuIcI2C3R4ddFV5HBdPtM/d6IQsdil5/IQrKEQGeQ5c/lMbUPv1e9Y+13O4iveV4wltX9Y4/TpJ4f7k7bvmnCe7ZSX8OeHaHO1D+qNT5LMqvMveLx11RZ0VwrlhBZpxyl8tFQ0+bPS11CLBe7/ICpwUPO+OZ6owxA3Me+9hWgwxz/LADGq7hhQUPcbkDazeWb0Npu0e+DaUtU5qc1GPgD2ZKN16pXH/ygAdo4eILprGVbW153HCwUJ5GR2PKw1UTee0aUAZuiG3sGEkJ2KJPC4uAsdu2zOZFwTuXUKYjgFPtuTAKh2AJtNttv08TExPmR7nEJpp8Rk35KDKYiwnX0BCxt+d4xKcy++UDWbjTaP+/qBP6fOmBP51LRNzinuMMcc9YxJrzXoeXgRmVZljvdC0MW/EIvX5JSkrleOx+n34vpt0VGW+6ceiKQJDP+7w7/GmCexblDnf4oyT/7CNjsyCGMi98t5MNYlZuTk97/f8oZRzffffdKl4H83rqBQ/Eqg+mEvL9XVLexeMfa/K87MPeoa8RljuEBQ8VSLuRkKTGLaDdDkcorXl0LHF1UzS2tq31jxuWDjf3dsFNouMhKaw+ZNY/luG7LPSNlBJotYZbINYXdgRarg1Zk+HFJqr933MFJFdg3jYuW91SgbWnA3scYp/RYy+i7KKnpI1D58TQBpoUoIF+f6nXR/hp/7eUTiX1inuOu8zlDioYYdhV5XUUlN0e+1pX8EIH3+vNokDuD3fJ777Jqd8LbHcZO1DMKcd8nuHzbok/4IrHPe5xjuVWfNvVYIvuQS/03FJHbvV9GfKwF81emO2DHfJEcZ6Dg3zZbyWhhpR8i2pnzbCDz8CDbsHDwe5YNIEoFI7C9KdEWN9qPdPY3DuCCUbHwb9dcBXtUFE2/DFuw6/zBnQqU1OogpExAeh+uEUEJ3pNApn2cf7P8hqRIaoRLREb22EWtw94AylcgbqVwCiFksZ2JroqX5qamtSpZZKcFHiYI/3wa4f4Mwv1Ny42qd9G405Y4hT3HEeG0neuwi/yvS7R6yjYsYPjsfa1rlhsvV4t7Tvf5NbvRbY7Z7qKryQcWPx+NF38uD9FkkGUPyjhB6Pc63eq2g7+o99V3X7QSu6w2/eKL7boDnMFdKnjneVSR9nqhc/jvJ7vgod5P3dmhoxzSOTLDozYYostMN8i4/RRJwsefssdmgWPXgBotzNOEPRjYKbhhj4hlZZWI05A39YR2Ofh3C64GsK8X7M5aurc+LijGZmiFgrIUojpFHuHRcSEnXvtlNTcuqLJeDpiFO6I0ehHJ5U9HqBhaGCfJmgz7E6lVMIx8vcrt/gNXGirWg2OAUSKxWcRWSS/8PMAf7qNVtY6RIb4aFD+0rUpQfzinuMoxS9OeCb0unRep2COpe3eaVzrCsPY67Xg3u8FtrvImT5R7mWE290L2OYUAaKeqZjl6ci8D8regb7htzflxLT6O7lWJ51OuOGc33W4daDhKIketxZNN0tGiG/ADjv4LnfICx7ycgfQbijfhtJGlOckDJ+PcskQpj8lwpZW60lja9va9LjB2OdjbxfcbAjufJe0Uxd+mK9DQ/tS4IJ963ipGDotUScmaCIW34NbIvvo/U7HFG5EyZGhoaFks/2zvYO1sswcATw0WuxPC45h3kEvXddqgJeXQ/a5f0m5hAf92R/cJMMoKSYR/zupdfwo4gfOHeMLpRJmXPmVE5uU3kRiH+1v4Q1DQ87A4hb3HEeysyQCz9hel+x1lKB6vaC13qheL3G6LP79XmS7G4nKGmGpv+bq44uD3N2QO/LNnBnN5dYCewueR5Y5dEsdfy+v9RrxenD63o54ZGPyWjTd9DvXNyY30au9NkH658wJAvgGt93GGJ4s91rw0RnuZzeY/4+4reeUKfpRWyrIlH7mmU2MrdX6orE1bW163CCYCOHGcP92wT3nnDQ6LlMhZm6amvITQ0PSVicJjkHVSe2ZmACwFajwvQ930ljN2CdC1+KyXtt70C3dpuObygD2ya4FDc9CwJpVAemmRS/fhg8GIVQ34T2Y54rpVvjygSwTwKKIIKvNev9WXFpXi/uiQr1pEq5QEH4ajb8oEYpb3HMcZW8pCbvoNztSeh0G2htF9XpB2Hq9CpjqIPq9YdpdgVPyryQcWPh+NF1IZd++r7n6+EIr+8qyCO1xzoPAjI7U7KzeRsz2EBzx8JlJgkRDGnbwXO4QcbMbTpHSho9yH5jpkaTJ0X24o6q2tjxuMCD2KZBzDsbpLscSmYKYibdRG0909uXjlbs3CNWpKZqKO/vnRAfs+Qd7pafltNWsECFHzTWSATtB3WrZfVRQr6zZGQc+StW2/EIBJUz/DSBwiPJEMupPgcuVJ0wQk+dyZFkfhhh27+vhHMnRWB3gUZ9BjZTe8LKXOcHHPccx48RMq9m0rux1YbD3elO3BzjqDur1tiKIfq9ju2P5SsKB+e9H0/lU/sbXXH18vpW/UdQm3/AhjaI+TMY1O/Oo51bHmq1f8JhhCzOzMpMvbl2mIeVAQH3ZnZc7NAseHnY7kjR8tLNjMf0pEda1GqSt/dmXiJFjj02jQ5mOuz2EiOkfg10Kgr66I2Z4ygDxEqeyac3EBKNFEu46z8QKYJzeg245HtxJaxcwpvssYOpJB0kMrzBTlnH5dhpFcJu1BqoiLso55ybwacG72toIjuUfWk8rhhiBLdqIWO0IfTQSeMKXHUSyLFDGPaf1u5oc/DORASSaYVe11+keV0JXMHeda6+39+j1do/jLwwtpN8bp921Q+898lCf8lZzl53JON577x/gH3mp1YVOP1QMX4iGioGTonDqWjS91yRaxhfXvJc75AUPD7tjop0di+lPibCy1RBt7UkZease/9tXBJ0kpqdhr8Ps/kH1TURpjPxIu6jVMhu/TCEK7vHYZcgYZZ/IPo/xccJslq7tpDVRhz17gjHdR9FsvgQcrIXzZV64KtMOBzy0pMH1bInfyPE34HPWoUzbjZPbPsxfGFSR7VIYeoVbCvskA1z2F3HPab3ZSwXj+FS9LqXX6QhzPJ1rr7fH93q7xFyGMxvQ7w3U7txOts/smbQMYAm6ZIlIx7f6gQNMox9o0SIveChxNwxzhnzRf3otmt5tEHrVncYdFF+C2O0nKYNHOzp4058SYWWrAdra7XHjHO9oDjAacdMVHbDv+o6kVb24KyagavZ6qCHrkKPUhuyoB0cpeFxri9wZmxlQJq0pnemJ1gSnxQuOJjZQ9/DtRq/cbOXGRt6+mqdOJp0pgHMWqErQiUjz+9hgy54e/rbu1FNNEbXvM0fCXPyvMiSwPASYJ5lvTrfnMHbxBh8YKZ52vI1Mc72ieP7vAPJ8ll4XhdvHloLOtdfbQ3v9hd0yXYQOL6zdS9MLjIaS9zQdEmemgOXmxv67QIbzXHamSI1gX1iQZa9+13W5I4rdblLmxvSnRFjZao60VCFiKwTlrAsBZgkYD+gdE9rpZENIMJ/NAdBS9kw4pKj3H8ElL7o/1N1BmH4f8HWSJq0nPLdwHWk76HnB+YSndQoKlkoTGHhF0pEmcaPSG+nh/20Qkh5zjDsd1wNExq1iXXBWd6RT/mpnrSCYMgV/jKDvF0Dkvbb2VHt9xlNj1TcGnOwniYT+ymWKLuyx6Qts0BEz7Np13dYkbHXIXi1de709rNfL8Xfw2+Gt7iBeL1C7lwM1W2f8ovc05hLAgv8+4DXP3mFrJBEWPIT3fW8dOIchHe9/kpG9dS2a3qrLhmc+8M5WTR4dbrkjrN3o1knmHZlSk1O2mhShDSW2BGafNwebcLvboZ7TMZaEp52OZCk4rXI3HPYIDBNYI6sWGAqJcHXvQbd09Sat1bNATAN3+IZXuQDT8VqPmegLwQZeec7U0D0HfrFhVEfHH3Z4DWZkFlAtYl0uysKlhnB/tbMWIzNbeKCCWBangtpeekKsfozNc6BdzpHP2Vik/ct4h9Uqwx47B6IVWZ0z0G29fI6F7NY4dK9XQXf563JjQJ2eU7sbuR/35349SgUVWry1nfVxOVOdNP2hNKa+POKCRwqD95uhVHv2u37LHUC7mwLFKdkh9pzT6bTJP1yd86bTqfUdrUSAqUMnEh1hGFNV8CnXQU9azSHqw3B8U3rCpHgj4c5iJIyKaIqWQ714n49QNYHYxt9lDshd9B3Vh19wUT2yMSA3wEsKHfnBzrlR8KOhoNh8YdOnYyeZpPzAcRfVxAMFYmXEM0+FKtpvaqHvaI66KJj8n9JyGXazbdsK4OttPcMey7q9Qe91GMf7urI6/wGNqe9+KI2p8361Wm8x9noVcijtzWsonN7dGKcXp90pqpafy1DK/dhD0RjmUoiB9+/YZcEeq6xypFzFfyS7Y4qC/ulRad7Cuw2tpiKCiHTgdsG1YujEyF4g+wheqTNqh8zlBmvZB2WRsYSTXyFFV8Z6hMGY/6YkzGr56HScQ7q2mQiGbZlyHbX37/lAIU9aYDD7gBJXrQEOkBi5hje4J/f/vl/3AVAEjzjCKxXai0mJt9ZnBLPVh8BFVymCHnv806H0y0zUzfIN0gD4fodR456/huIw6Gjm0HczDIjz/izT6yzcvf/uf5Qyjh8bwuvIrM4ZefBBxuy7MWaHandby/eQ0qM4dIixe/9jUzoUzW4TMN4FhWY5/vg5KcmAtbsZSPl4GGRg2pOrI7dayhmt9LAKi5wIxi2g/AEWDh5kKYfKVVoe+6z5iVelVHJWW3GGi9z5KfmO2B6umkUi1O+SVitfsuNOFk6mOsC9P/ETzzn22DgiR9VgJHDNdfAIxQ0N/UBcXVl7OgFNzvCyo0dp5J+fhs7btk2kOUr2b1tOE3xm9wp7LOv27P3OvFsPsqvjN5H0zrb1F1Svl9r9TtnscCtd56y0ncr0Ng4wtX+vPJPe+fSqgE5doKfnLeiReNXTO98VCiXLR9KR52Y/uRzdrjqsewYdx5pxANubNXqNgkhuV6fkCCpRrFWkJR1hkUdzdB92mFYnN6OahcMuvhfUwTTMOXD0GG1A2QCSi77nL5eRf05xF4XTJrioXy1v2+/Yd3UKe2zp9sx+T+N1Qjgd/rKV1sPphWp3fcs/PZbb8++Vp7sbzfN9f0mnKJDhgt1W7X4t2GJcWqG0u3nQPh5gg6JsNZEeV1lzZdGqXC4ZHVaKoev76NFzmJ74XFXGKA/TZE/QjtZzmbTil1li49q8hJU4n/o29nOTdzGFOLcGBccSHcj00PcsT6MczHoeiF6AJtJ1phegBUPYY+P5PcnrzM/PGyVSr79MktObD+T0IBha/umx3K6Xp4Whlu+3s3bf9PSnB7LbRhhSno9T2GKLtWi6efnycanGgLe7Ekk5u5MsOJebE22rKcP6+/lzFr80L6gWB8mF6GdHhS0kDd/lFIT3u2Em8GeyaPHeVRQj77qsLhVZVK8s1z7ZTItm27fxKfDcrr3W6SQwHX55Q+HulaMVSzeSfUekJ3CXy8g/Hz0vYcilijMXaLTNivsn3wa86tQ97LGy29Pv+KJ93nvzHi3zXi5f/09zDabf/vrXv/7tz6uk18uZ/d7C7LYw22p3qHZXtXwY05UWxZ4JMd/PE+1+eyC7bWC+Ic9rE6Sf5HdAxKueMvkeqrIb6r4ynd3J3tt7kTMzMecpW00Y1otf0Vvr2dWzo2R7xpifQpYgIacwuYbJWjzPy8OetO3soododx0TuKYXWJMXWRSCYtG4xRtaCvOdMk4ZheqPlYj0AgdLjiYFXu6ZtG3bcp4hQu91L5kFD6LXV/C8vE+t7HAYr1MLBrPr6fUGNz0MQ0u3q1KtKNmrGWt3WvKIa7cG5BvzjMdagOmkZuJ8I91X2tkluB/JTi9+SuDvtrSaN6yD/Tyhynj17PEguZ4x7mdSZc3Jn1lVyBULHTXIdn7knUchkVXIGURLQawxIJsqdbyhR41FzsnPK8GTdb89eplbaeS9zzuP8MADsHspNJOnO3pPZdhjg/X69F6nll6vk9mx2j206dyhiG3GLSELHnx6Xly7WzeV2301XqUioxk437z7CsIHC2SZUdmkaTWRxc8OhPx8z5j1M4euIfvTQnW1VRO0JH7HV7MHEn7Rw9jo0JZ21JIvwlRex4QycWIfQQQ9jowyB3/aMzCPTcz35aJQJC1h/zJR16cVFGUm7LFDJmKvj+zZUtjZ5Scb9rAfrdfvY3awdo9suujSxG5KWfcwzfjKi/sbDWG3lWkAdGxKB1u4vjF577bbiulORTJuvrHuK+3sTtyPZEf9SITNeXJ1tK3mDOvAeGA8I66fxav2bGMT66VVq81r4YedJXSGr61BW3rNTeldYWquznOjOWEHgEw3AyZOUUtZ10jzm9IbASlvwnK+Kqtc8Ax77FwC2euzeh0OsmvLA9LeLmvp9RrMNtkdrt3jtjw2Z/bG2gR5NS3UXnliuGD5gRh2W9Dy/dOQ5bVoevf1jcm7jzmmFqerxZc94+Yb6r5ynd0JnpKw8pEImxR9q3nDGhjPzriGh7j9r16RoJfgs1pG3vWGg1sattWb0PSM30ZcqVGC9aLQLGnjDadyJTc8HX6lfv+K7aUJEvl2RsG0+VuSmTwhORP22IEQqddn9DqV9Hp9nF60dhdND8Uc6NHEnPllEurlY45x0Z8rEdVuici3stJjONgCkHHzDXVfiWd3oqE+JDRjom81b1gvfjVfCKM/C56fOWKfqeSrMpWItOGZ3nCT8WtrfqJo+a5lKcSl1yzUGz8gMmppYbDxcw/hzKb7ncobCLwCofMtBxg9ZsMeS3SI1uvTpnp6vT6p8dpdbc/FwqfrZap5YOhkgn5yxIjjKONpmO/WVnO+N4Q+nQ3dPW+4YSbON9R95Tm7k6ZRcM6g9L2ClSs9jCz2yPCMuX5Kihv+jaBqm51nRW54pjfcPSHVVaTW6zp8c1nHHb/hxIcY0/UM0IYs9TuJQtB6V06vItOVCbzpsCLuotF6fWqq6PX6Ea3dIzNuXKeQkar8wA+QxyOhNsZAWuYbZAsWzrfk2RsaPO+GGTjfWPeV4+xOmkbFmZK+J5hajbD4LMoremv1Lz4r+RlL9bMzOT/hOr8poiptnqwFvUqx5ttguLtYTVZpK/T4XZ68jW8u7rjgt+H8O72n24GV6acX8oa82+msKLrurrtOFOl7v4YTupQKXde5KHVcwXp9I77XG54zH3inudJpI8f9hirHpWW+t0ARBBrPNpF58411XznO7qRJwJmRvsDYah/CmLBMvHbwHxlI9rMrnV/U82iP+QygtYLyvAFKrCobPcIETEkhpgUH7SIUV3/9w2U89czAccdvib+rDRQ5K//iVrDaWeIeW8a9HSZdV773XnItpetC9HoKr9M1dK+3Eds9CKA1D3VogqKeuZ1+QpVBWuZ7bYL0a1LF5BvrvjKc3UmThHMGpC/Rtxof1oFX9NaaiE9Zf3//wMBEBhQ/E2Jf0Otof0EvgtWRZtWNvHd+hgNPbjplqbRZJxNls4JWHzCtNZHahmlJd2CBU9RxH5a27LezxQ5FRg94Npdg01BxB8ZA33svQ6FD13WBen1jQK83OEIMqEbdm6Rlvuco/M7vVDH5hrqvhKNbz4YzPCsJIBHz/5zns8MT9+wM5PCT8xRhz4JU229rYUIMUbRIqT6G00YUPCn4sTC1fDHk7rj6QPTvgDPAzR8A9gtTSajqtwMrlAdI+nRWK4m7N/P2y1jmCP8KUCfC9PrG215vMPlVqmiGp7LJQzqJdMw3nkqs6GKyism3xn057C2Tnl1CIiacyMjKlTIVbLLs2jpNMqqfhhn8fL3rScQW6ebK/qrdftlJquaVq+ZcgvV8deYHOBGj5Cfch58gNgSTVHq3Saf6cEDCDszdAx924DC9vvG11ys68jCK7Njj+sbkvSSib5O0zDd0rLEtns9kVZNvjfvy2FtmKs7wrMxFleEhk59Q16vyELDrcJ7XZ0sru/MFGt5pWlV5lUPJY2lLNN/YXpra5XkdJP8+yuoNcqp45nCouLc7hh04TK9vrO31Bj+9mUHUVsXHkIiGzWmYb27by/nGpr1VTb417stlb5ns+OaaZvv23vgjEZabzdhqz7G8kMJU2Wcsz0M+P0XHZxnUDnrOezn0bNFdX4ThgEbUDSfrh6nZEshYec02duUBbtV+AcNb8ztRT03ZqZRYcW/3CztwmF7fGNDrDY6tCdDSMd+1Ohk433h3tBuUnK1loq/xd0yzXSIzIMU+/spm07caP6OVCH3GfpLGsHHxd+13R5o8H6dS/MwTAVxcfYCNT6NdNRFLfhO4qqlntfWV4bYaHug2ekpmHpUxfz7V9wWVxb1dE3bg3Ixxen2jvtd74EBsNny2LrJZ7ddQoq0s1zcmbyWBBGyYhvl+BgvnG1o2VTn51rgj8m/igSZdy1OHSnDD2Vom+AoaD2S9F/5IhHsmdbTZxFZzAYkcwjjkkLMW73zl/mVedhDD5aX6iqIQL17OHiP4mTSdXv+J3aZ0gu7zd104D6jcsIr32HCDm/7ceTO8SWJUoyPj3u4WduBG7PUdaMheb21QTBG0dKLYrZVJqp58a9wRde3aeY0vlnED+NoPvCBwRiQzJm9UcozKa+lUh9z3vvc95JCQH2TjWYuH3WZD3Itvz+UofuaIQlW7ohjnNuqELwVtnHCPjnHexhMjkeLe7hZ24DCp/nWujdDr3eBMGne0VZvckQBna13oKzzMUXMhKd39HhqU3GyKVhMxshHkrLMWDw05sBEAQPGzmDjUBkgB3CBkVk3nt7bW8bdXcdsmLwRbhOo6p7ADt3HSONDr3QBF4440w9zSFLi7tUxw1tTAhaRUPhJhY9KRZjO2muHIsxw5cvHhLNYrHX1nR5biZ+mWqrwK2QvXra+ttXnaUZyUGqmAqr8i7MCRGAt6vRueKNwRwTQZ8pStZTLMhaTsXT8SYZ7UbIZW42e0svhIVxbbqeyIMwIAKH6WjZqQZxZso/jfcaDQFGGPjUMD9HrPjELlvvL1+pJt7m4tk9Fsr/HTyeGY8N8dZmckzYZotcAvKWsR6AaMA4vdZb2GhhwUP8tmThtCZ/wkP6UxOEsjKdyRPIuYrWwt02Szj2Sn1/1IhNMVXLNhWm3xIWcdcmTMP9I4EHA683rzKYqfZYOnDYH762Uve+xZG2jckXC9m7JN3K1lMthHsiN/JMJGM77ZlK3mPtz3yCMh3ziweIh15vY2ovhZjoJkmfd9TqJwR/Isfm+gRtlaZqvVjzSNEDmdCvO9AazVFrvvF+xM6SzWHOX7WV4fvxjd127tbj9aTraytUzY7oeRj/JQvOwOI9qHoFrt2/vyFo9RWTy207TpNzMy4vt5ffxY3dfulJLQfxtaDOgGdUXcWuZ3YtJY5Pyoj/JwZoRvNkyrfX1W8a0as6jsKncePjw8NIT5keEgQ8NERkZcP6+PX4zuq99tTzHC+1vLBBondPbGH4kw+3wRudV02lUe2QlS/nkN3I5OI8rWMkM1QMXFGRCHVhvb0yZvEiS8WQ8b5EbG9kSpqj3x8c8PqK+M7Nm5czjMq1VkiL6TymR4+Chla5nXpGmC62zgj0QY0WoK/coy6cq79f2VLP/bf9h04XBKM+5L0kaU+97OnoZnpYi7gpgwAoAeVPKydCpdQh7/+Dtu4fZ3138WFoMg/dVOOcD7k+AEYWuZBa2NPU2HvdU0lP5qYwJVP58kZ/4ZYncMizh+7sG+H/xoeYNBIxVZZSe5WcJGlG3saXhWZkDI5itpI61BUTR7/ONffbuDEIrc8Upjfe7BuL+EhTKH2QhV7fSnrNVJ8JSNKDO0Kp7TlApoNQlvr1RKtkGbJA81ilHsTXbZCbn//e+YpTV+7sGy/KJljWGCtL1Gd9MVHsLWMo08p+E5RqY2DPrNhLnggJSt2VJV1nFoVfUh1Pe5B6Pqi5ZHUEXJSdiIMvM6Lzqe04iKb7U6Ih2VyOCg0kqcHk+CzKAZizUBL6uSaVetPqSd+j734LqoIXt5w1oke0jpTO2L4VMW+02sPKfhOUaiBvqF2d22d7TV/oibAdmSpUbJWJwf8JcA6/hw/NyDPcnLGw8OGhI6S1gL6ih/a5l931s/HuDmU3yr1fUobPdDaMV3Iq5XpiyP3QO5fsYhL3vZO0i7saS0JbAP5JFuqyarvh0gSt8M93fX73kBfA0zWDH/LCCl8W2W/tiZIGxqW2rZ34hy3yI+HuBGA9JqMlV/f8usVNzfYlvmNr7E7Xeb7Xi7GVDjN992em9BUlJfo/vM074TQHJLwAj7yJ9/wk1IcrEOYpZ31VQRkt58DeufwAmXn2+l77V0L8XnHuw6GW5jwbvxY+OZmA0zVoHhww+PuykYsvsqMLsuAIkMe7JzZ9JGlCUasUvm02q1PeuXKo8Iu7Iqgu9g2eQ7m/4TZIVsTwMTEcshF3jJSUgyB0RBYAnGPtj3iBv5fAElrSMf+3Bw+lgU5zPpc638u+v3vBk2S+PYWIyZLtyZV7SNKI8+0s76pcqQMJl0uhycMIw26/0fP9oOaE81iEn9HESYNeHsPznVZvToEderCgIZMXp07YgRyeHcR4motbWm1dY4htzEZ7fg0SvS2QJKu2K8MGznn9/XWr7n5WXfyls1NP1Ns14eMYbtd1qgyi8Pyi9i0PC0CF6kLWHVKn7WL6syirvdaczk6C8m4rq6uvTY42dbsQLRVJnsbZhsKH952Uv+L5PV1tbezBEx+t1PeAkZ/SxKhpX+A0eUVOuagOhlL6t5WWurpSmxr9XcR7LC8sOYzEgvzid+YtC+Nr28nO5tf2KD++IjHvEIvJRaVHlcIudMWuUgPOzEI4y2sRHtl7fV2+2e9YuVH9ARlyBVtTvIKpcYbPZsU7+X3wmYbaErVpx++rdn+gty+ukrVkjGMTYrjf/8E261xM/8TGJ+IDv+zM9wOsxTfZuBxMoXPX6XI/9AsL8NWBMAMrK11auBWn4QwNk/h1k9HOD1OM6nvAmgL9X93wFAWE7TN+73BVZe1LLw8d6sjlO0pL30BZOO+y7lWCw3q2gbnhbBD+iI88765QfzUSjPtXIaFd7q7lXeOFUsGfGdAC1WLBZPM7PidCq+PuQzmFj5syNGjDCh2s+AfUQK8as45a/+KujPmDSmfubmIiq+to4eORK0WCyObrWw9TQrFkHNRv8WSLVvlHWs1IPdu39L+d9SAtyOkKXeY3UvATjoz666bf/+VF72vbL+JpBtwTlwF46NVWj7IugXN5Lsde44AaJteEqXH8xHIeMW1r8EQb9W9Ttb5FIpKmLFiod+i/G9MA5+6AohZgtsNKb9vaiw/au/+qutQigJVAQfMULXf7v7ZpBy1bHRrCNHFovFS+9hjNZVGAIGGqywNPO3aC+XVgNBdntAqgq4HRBmUOlFjYl4rBdU9y+TyyGo2xY0QWFUA0olwUzkbiWq0ie35ZEBHS1L24TJ3moCp3lnHWFTGWQVffJSMdlDH3rwwSZ18EMfyjWOJadZBTExmoWfu5yklQQSotE0T/uGS49I0DiO0TCSiI0axWofwhfAg2XTKhjo7to536U3NUacKDSfhDn7Q2BXN9NjjECZkmQgTyYI+yKwOymQs939G1C6UYt/1i/+RDYVD2+LXDqjhVjymq3rHBISQWLKIRaIuWtoIRr+Rgw4ABDaBHupvvMFfLFwwlpHS7n0HobAGCoICYJgheGTEI1ZtwuaIzWIbE2FJuEnELZeFRpwYH/y5Qi8aVlMjzEF7Bci4xbuPO0WoLzFLGZ7dK3pD0+lCRO41VYJZ/1CGqcKoGaPVsRI06x4aCAkUByNBcq3ECaISxiOIAtRSqQjMFBMI0yI24K1jhxp0pEjWxXqdAJhTIigIWCgt7lRehsEMkNY8tb3unDhjvVif4F7qgvBu7ZlZQE9Xs7QqkhEw4i2F3vxp2B2QWf6w1NpRLCttko565cMrZhsbzeJBoogZppAtJiQebVTUaqeBiYpLWfe/YQXQSYXKbMj0xKUm58eZP/TUwiQkTrFokYdYNIAwIw2S5bwKjwAdZ3WHwdSgPI1Vb5ICXA7HK2ypNXPO/97qmV9JWR3H8vLITj22Lp93W25/vMxH2lVmlTwN5Zss+W2U1qZdJ3hD0+lIQXbaquEs37J1vi5q5xnjQLu/rXIsJ8HJVMIfv0SoAoID38I2GcpLX/Iox5FaIK0hAJqcFxbO2KEsvBKI0bU1u64IxOWm5/WPC1I4sMWhBahGCPyXVfXoqPJo1fgTyL+HWIjGLnNbaImvN+MjIGkuysKeH535a9e8IIolJw5ur4vZJk84Xh5fyKAHIusXrEtm5KBbDyqquY59AQz7LeCa+ZobWtLhG0exXyrxiz3rF+y4o0+BczypTYsbZG8PJDONzzU4w8BPQ/Eiz4GPErntJ9DQvmFGjpxRPbBBc2gRgPN5qc9PYGVptyELmwjW0W+Q8RCHy2ol/w2oNL/Ds+N1rWYInEe4WsCg6yMIaNH9HakJrkOqT5lrV5AyGKwbbTvqZaR+vOjru/joN3tPNv+/ZF4s16xrImnNB3zWF6YKgCeWODdDg5iHO9XWtGOL8NYif4PT6Up0beaiHLWL35KbXP3qn7nWQtIVwOCLXOQB6YQPQsBFrXfyxGCkFi+Y2vCy6OCCPuZ2tYdW5hXHV1p8/anXS4zasrdOnqkUUYzc8RfS2E9UlOEE9CC1L8NqEbVv8Nzo4HUFHogFSAwt2Vuyt7OB1BT7Z22QK2Pf13BA153lfc2vW1bDKQBbEsAxY2K5zn0xLKJE9npboLIBpL9DSbDD7A7Pdi8m8Hwh6fSkBhaLQcVayXhh5kuV5FxKkOwGhAUWFTm+AgozQpjLJKQgp/51Z8heRY9F3e3HvEsSgclhkJk++W/o4wb11i5crSWjDaaBuk3SAKJ1Sx78PqS+BxE0/4Oz8HfQbS0FMkWCwDUO6kRV+bQC7nqY5bHJ4ZEL3rvtZ/y1Tg88Gbdvszuro/BJMl4S6L5quzCdnpQ1qTrjH94Kg0o2FZbpJz1y24U0y7xAv3YbSVueJrvJhEc+/LlNl9aFB54/v/5s6T+J7Gzhzq8M912nMTd0vL3kyXloCOECG5K9b8HfpWD1l9lffcTXjv+jJAdd2T7Vd4TO4gE/y688GkrFbtwtMZ8v4c3l48erUc4FV/qH72nEe5hpXvsEUrqz/5s5e/wHP4dREtpw2lFLJjRDhXJWzHCaFmgQgw2Qd1HUR68Yb6f/cttDJA9UK/Yl/2zAM9XWhq39ju9aneQKtSJokxF8p0e7C72qNyp//BUGhNsqy2SzvqlIGHHjmp42mlkCg88//5BXdvwQBJ3S897ng3z5wu/K/QCLzntqMoIYWFweWC0rv8bI1deeOFKQS68sK4x31uAjhYxsLki3wHxRXJD2AMi6+mxPY4Iw1D5HETzE+bvIFpCf9zOFAUMwnaLmqUAeiG9nhH1/PMtuAnqPom+TMvp7pbbSDzgV90n2w2vjbPHw+N+R8SFlp4rbsHC2+kB7VheZPjDU2lIBbdao5z1i7JjYSH+aPsdVtTQ7hgNQRWMEX6YYXx83vOeZ2L+/Pl7QblW0dYLvOQ0QomNaJUW1PAxNUSVpAaESpEmCYgjKKJNvgfHjiD0z0E0zPD+DqLpqcEBF1UBcKHYnMLw7pltHGIEIepuAWR1bwo4lfRRoL76Ua2U6XQ8PO6d/v5ViZusOM0Xb6cHxTNqLX94Ks2YwK3WKGf9Qg/sXZrw08cIAkW/E3CahWn6n1cMKe/PExs2bLghhl2rHDHFhEllkZNwIoQF5iy9gypiHOccXoftilvokblz5z5ljrZkGB4AIoYw3j8H0RLaGHR7pP120Mm0IrrJardnGYkcUlJdHwUycCZ4r5ld4cfmwFa5jhHflDNed1YgJPR2Vca9nQ5dZPhIhLmTSrXh4JoH8Gez0kifVc9gnk+LyV93THHty5cvLwppEWbQG26gckNjVPear8peaErCllPEIC3KTs927rR8+vyKPmWuKk9BU+QIKwlUOVySpP4Muj3Sfzs1m0Hp91F9TwPptosC1bMOsQm+qFffRh8AWmv5tMctT9Aysuq0PEKaOBtdLjF8JML8SaXaaPDNY/+zJ0n4rHrkaW19jEB17S2KoFM1KhVrViGiiYiFhlbU6oAW819PTteypGoQ85J5V01VzUyr508itkm6dyVhTadBoUfKb6fH8N5ThfRr6SgpOIR0y+vRC6GI8Uf1VfRx6PvmOe1xN5QPPq+hSdxln9+2u9ODdNEId1KpNlxBah4rylm/tHSR915lshXfahDOpzmipPSE7R9p0t8/npxWbpuYIaIOaDXGyrIsvb+DaGVJcVMDA4NSj6RvZ+QKbbpdOrTu30qPIHhm+8fbPOSQbvessxTtXYlR9qq7qu1xS2E772NZGpuMrQg7PSBXWxBPKtXmUrF5jIifVU96jtiKVcTe86Z55sPfXcXXP8tKtnJbDBDi++dAWEVSqT1KSIXd6DuSjqx7+2+mI9JgwzsxJCRi64L2XZ1xhRCC6oVTguGYK408OXMr0k4PRJ6D/C6KMvJJpdqU577q76cnY/qzWWmUs37x99GsZ/utvJjckiSU768wOZK6MGSCT98pGRBEOZjZnLSVqSRVJpWlR16iyt2jnc6HASIBesghXl+ZFdKp0Ihkb+1NIBEiX3fmDgUdfF4f1kqod3d6EAk9kngO2B+a9ozipBZtKhWb56+wvY3Ic1TEz6ontRu1lXU/Xlvw7NesF8ny7Gevo6m3bmCopCW63zkXkKBPf+WE1xu84t3//n5i/uTfDEhpXkyPz6kWMfO4eS8z9GgQvMjdo53OMXWTGiFBMnhfWzKDQCMp46+DXOhjNEFx2uOeqYLmwLX6tIPPa5kNWWZuxd3pQWTVqlUSIE1O8XdLkafB4n7/wN71cyH1Wgm8DFP0qxuSZDmWgKnX+tdgBBMyv4l7yeO6v7HAWSHyjVM+L5EJOCVKSLg8/vG7VKkmYB43TwnQBJ0XnoyQ7ZzJjcoh2APTtkeWpkPoMZ86frw87erqRDrtcTcsSfmTmFL57D7t4PPQqmpVkN2nsa01Qne7rdh2jRvKTg92Z+OZTckzESifVU9/WiviMRQAx/6C2qQEOXadtZiiAqqm/rtxO9xAtvIlMgEBaOTp/MmTJ7V6MhQHALopDESclLTesb8Mds/J9t9oZj0+hAvRnyXgoSn/MQ1iOPfbvG7Weosu7sAbiH48Zk23U87ryw4+z1iVeZvTyk4PVgUWJcCdVKoNB9c8CMrGO+uIqjLKD+td+rSYWvSg3w1Jss4YpN72ts4IJFKSK2SeHlo7JTY65ack23D1WwBOpgkKPanRN5RJbnGL68jStmwRiBTx2ENPKmyLW9J+D90EUnS2DCQOOctKl0vk+4D9u827+DpXlh+fBhkLen/MlBDs3bvBMwtqiOVfz36GFLVXGG/JS41TznMx6JyedfB5drtjtHtlpMmLsNMDoClVzXOedx5xpw2Honko+T4rpqK2O52nFbBJKqgpqAYa7VBBtz9eTLL+dEnBk550iyiQcBtFXwkAuRhg4jvyYK/x/wOGdOwWt/T9Hnr9RIo+7mid/v7+Q2IjRbZtQ03BW1S01zTKic9oLryhzVwm+9JGoeVPe9yxglr8jsNTxO3WXPSpZQ49556FWDgJxj/srSF5kLhDD+UBKXDKeXq70wZPzzr4PJjdzu1euVLYR461KsS+plT13ZsYynMetZlQNY/tz2bFnvXLzswifu46T/5+cotfLusNY9KTQoh2KIii8/PbxTQ/P68pPQnENCJOXx6AMnHNJXjkIydaGvv/gAFJ6tFghv0eDqb2KK+k8CaBf5k3oXm720DKl8q7DHdorKmEzSsD8pb5ogSQZjjaEPBxBx4raBq/0/YIodwc+u8deN2iWYtIIOv/YuwSJikoMmsWJw6SeCgtoRQ45Ty13a445e5hB5+Hstu53dX9sqauLftiLKPs9GCR8srxrkEwcw+f8RmfVT1hmmfMmPdpMbFTVFRkeDioe0kfMvE7tKLjJyd9Pf54ma5eE+RQWdtWvlnb8mq6fVITxDQKCYnLvcUb9/Tf80iU5B4NJq137K8F1SOxZn2g2bs3Q9Q5uEFFy4hawnbwVh4pc7SXY+VMSOuPHHfgsYGm8TttD5BC4d+qe8rCRVJmsfz7pQv9y+mLHH30v9q0kSb/ztl3rFy5cOHCWZDrf61yNZRFixYuTLIey+jt/ppL1wvFvIoJLTdIDzr4PA+7ywRs96z9Iy6+kDVB2elBkwSNQUPmM8g5j1o/sOZBMceSPhwmJbGz3zyxjAcnSSF0u9hAbfQSmQCNvu/FUvoilhomplWbiFYDoAA32psw3tJiu2MJoCacLW4lrnfsrgXV40EnHl9WaPPjBTWcvjkcZnM5AG9AP0BqmZQeZixodDdedZc+YWHjDjxeUJHfiSIFPduHH374okXE059O+m9uexYLgrmeRQl7+tMBkfFC0k85T2136FMY8F/hxFVR4mAn5QbHmIZyF37weW5233orsN1Twn3KYd8t83d6kIe309QIYJoHiF2ZVeiUJbgrO/0xrDL2Sl3tmPRr809iJIoGkwFdkVH7PuufC1hRXOz7Qrdsia7R5tERaN3jo67Dgx888SUveYmFNgD7/4BB6RF9Vzl5v4fOWlASwyAI8YA6M+yKTDQFiIrPQRIEb9MJVnnvqMLI3l4unqch6LiLnjDFXRSGJu7AYwKV+Z0AcK4Tpf5i8dDioYdSfiFf/LxZ/0rZCjQBsnDhwn9798sOP5yzffjhxNP/m7LxzrFhsvLHATils3ig9yHnmew+MRQX4eUGl7ZdAJ675Z5OPdTN7qNTYLvL09mDKRJqhI8cK4m+b0j63ocqfFwQSn/ERujCTv+JTV7v2BD0eCcVTKRpIt1ukp5iofYtAH8zYBeRlZzIRtgnsxC2wA940i0a0vItDA1UoosDUCZe9SIcdRTzkhYhxn9WzP8HDBID/ja3LEa8/jMnJarskgIxDojm8+L2jAXNRnmNiow6mjZVv4ONWHEXRcEGPnasyKvzO+ii2myGBXOGzJp6NMhCyDaB6Xn6/mTlMqcU1fmQ84x2XwTCyw1enbEt+tkVBvx06qF+dh/l2t1xcsphvy/wP3KsFJq+Iel7N4SPy8Xt3J0mN9BsqMpCeE1TI9DjSQrspbUaiQYBTeAUhXSzBJ1C9PGJ0t//nC/966DzpnwSCPYnNtzSmMo+EycyE4+ayEQoagEcYf8fMKjw3js26P64VPCkz/J0B6j1AhjFO8Stgor121l+LD4jHEREebtApxvB4i7qpsNYsN1zVX7HRdjdTjJmU/q1r7DqgcxKDFxGk0+dOhVSI1Y6HpYw+iqSeWgSZ0HVbPeJcfi45T4DnNTKPZ06qN3uF6XHHmA3jizZFv8jx0qg6S3pXajHgiFihurHTv9ZTXtgbPvMkKCyOdhF6sMKKz8M8HAZopSTJ+l1pa6ssEAHwQWohza2BIdvYQkiRS77q+AZ2cRHsqwGYDVFzP8HDDpu7wcdybffw8FB/3BnBU+ChO6MJznA5c7hHeotitc0KwiiisuDiZv2KdXfrNdWqjrvgLuuY+MOvLeMO/AYsN1zlX4H+iOreIJuNnsWysNYjBmfNRVyTWipSQx52MNmSeGMt35yrLCbiltuGDxuuaOfYrk9VGO3rt3NdiNIz1ZaUT5yLNl6S3oXaou4jJfUmcW0kvth21s3MPcJiZfWaoxASuc1XlOx3enp6YcHUS0orVC2pwL3pOOsiZbeb/NzvvSvDe3GGqyF96Ajt4h1mJ2LAdmOzwTh8B15OIrlGEIb2Bgx/x8wAH8O8Nf/esJ+D0mqqmwi134PWy0GxPeW051wALQ67aoItI+kDBorPqybUMVnVIarJNe4v66MSUdURTfyt3uu2+8gfmbFLaSI2Qtn6ah5nCXToDPLLAsdpdCLhKL49Nhyt63K7ojtnjKfO6kV4SPH6oOpCWrbhx8udjaENbyVdUFVCWazA9tC60Zsp8qGJZvANOQkma1Q5r8FQJHmKTHaN03E5jVxBWSC+DIxCF6CEk18MMtEA6XhFwRDYqNPBf56FHW/hzRVliyRZ7+Hgy3v5Bq+W3PSCVdf7Xtywgmhu+CDil8Pw7Fjhy3KMDaXw1vjC1Kj3MCileSaT3e7iJpQcRd1iTtwEXX+ZyVG83bPDeB3cEnDrzo4Ky3CFP6oeTiQ/0o/xEZPFwVqkUcr5JLpEVKgZN9xrd9rCjN2G3mMMOBh+bD0cqtwtNun3QG0WqmT20orboNoGWcof1ZTXvgsO6Nje6qIXevYZiR31u+2krzdLduKg23dabe74u0MXwIeHiTNmNIOVWQtZcuWkApdsW1/hOw4BvAkhL7rxIkKIMzXfyQcf4nh1UXK8qcUAPnUv/7XcQK8Skihv7QFJ6HWMCC+n2C6M93ScYATlJpCm2BHl2gEBzwm0t9COsnqdBrSyuDnql+SiBd3UfBpB7xjGJjAx47m7Z4bwO+4yDrAlEXLuCHnAi0dSrZTBYTd3ShSuXsKnu0OJSUnoZWgyvVTyMCupmQXHmgg9FBp23TmH51lLMSDH/xdZJZSkN2w1jFpxYe0Ytrt4kOUV6x7xsMfPtU00mY/gjnw9Y4ViauU3diWzWsgK7oSEB1/PPLREtoLbDVA/XUB///3RWQmyqY8rwQhD3S/h2pKSPBlsEVorD+Bd+oCPrT6Re5zn3ZVCPA8ngPHxWflW17ePNdMuQxbpH0e4PjeF4G0umtfOSHKlz/oxol3yQlOtbHiLgqi4+IOvLfQn90lRvN2z/X7nRB2/+mIscwZN4hlth9nQHr6USV2z/3DHYa4iwK+cSjndBv6gR9pC1uR/PntO9cgWEXX1SkuzQPg+TjVTvfjYBoaGvI+M6ahIdve4cOBChP9RuIv6h+vLTi98QW9MQMFW+HwVmK7TWOWswammkDjtx/kFE6XbvnD/odtbbZ4Sdc9NsY2vDXxmWaE8SIQzP+XBHS/h1qKJ6RlsMVsxO2PndftTon3v1SfJh4Y6sOroQgCJ/u8xLmSm+8Vn5VvPB+h0PKY0uVjxGWzFMMCfFTJyw3bzidlPveGgHEXtZPOe9wUd+BS6WkHXJs23HbPzev3Fr7VX3cce6wp496zTQldaM9UJK8zdbP7wih6uef+4Q6iKkoy8kY1XZX4NE867VyfU0/ChqebNPCd38a2YvFaaYC/WBring+bG8R/S94+h7uHHnoKpzuHnE9LDPE0A9NPepJhIosVgZnzzrMph4GIkkpLDKa0AlsWzdVdVSUCk+AwRN9ayq0bm1MGAfkIJB9lMVllvyIuAivn81FF3nxXnJDI+XzhCQPGXdQj7sB/tkPc2WqF2hzbPdfrd0JwawZyIXI+63DbjCvJmdXTI9OJ3CpfkKH7/MLbTUkud/3t7snOHJJ+/RTqN77xi1TU+kbQnJonhQp4Pk4FwbxfOrMSJv0VEY3vIrPs1ti9G2iAmE06CykGtk/+5TQNZEy5htvbci0vTUPSKMGaBvuCz0aeeX7ARIFVLmzKUHL8VGpisOds98Ovd+nf/LEfWygM/KjUwUGSfEX7kMjK58XHV4PzCdhmXebpcReyCNRj1I8WGMc8RNyBH6WIO/CjapypMbZ7rt7vBIHKFsDhsyzXPNTkAMViUcs3akUN3m7GhXFbX7BYOC93rzncEz7MpP4KL0RD0uaU44dvFz5yjr6a+tpKfRyJWvHPckX9JF2qfvWjZEr7dllbEjtrSBvdbpf9SypdC2L1/vc/JdgnlFmJqx3zXppcI2KOvhAHCP3/CqGkeKn0RI+kXRHaFSMVcLlsdJzNwizLrOC4ycRgSFMuiuCwiL7glH268+LG9M9HPtzN3hqNVMj1b9C4AzfEds/B/c6xlLR+NxA9PQuBq/101UGQccOax0p6pK91YLYPOghY2NPjK72T3RdeuB8MudAv99w/3DHoR4rRvzPLBqU4GW4qVe6cR62VWM1T12+uLZXnnhsJOlJJh5Xln8mxHR/wO0v8bncjyZ01DfIXV7Bd+7oGdJH7gxOfkJsnYfdaPOHePV4y3w/sUGT/XyFQvFSeRM9luN9nMwrw7pU8wluXoeOPrIN5iSdDkuTns48vqqRM/+zj8qXKXCJcQsYdmAs8cL2Bj22E7Z4j+51jTNL73XCY1jwWEStXEovUtY5k0vvYvX9/4DNOsMLLfc0blR5/8MGfccJrG6/dnSDk9XCnsPUoujFHiQw3lSp7zqNWikfzGNkcEuf+v1EqPrtb/iRd5ON+z/MrPKEzIqSSZt1PeDq1p2deLI7kso4a1gYNn08CvOT8AMCDxZwXTxp/Hgf/XyGUBpr6vqYmu1IXCNm1iCUUmuZ7+TJ6XH1OaLcsUbzGuDj2g+FjUghL5Ha3jrkffYoI446tG3yJxFW/uAN/frX7nWyC7Z7j+p1jQir9bliOPegg5nG45mFGX+t4HEFyrJZv4H8hPnZTLjzhwoN5uZHXNl27Jx0s5E7nOjSoE+Cc9JtKlTvnUaslWPPMAeQHlmo3olT6OmLEgcpfhRt6lIuEznwHRZrmG6d8iB1K7ellZoUM0gnb9T9MIR/yKHnKtPbEFP5/hVBaSGpXm6P9Mti1aNEukkA8R/N/7rJKDYfZx0IuY8fTkZg5TK/2xgXOG2NcJI+4Vtynmelpr8BHHcpin5pOVVxqn64IfOzTK97vZANs9xzV7xyTE9bv4jzxTTexDAAwjyMOty93Hk48jimq3HQTcozIzW77cOGFttyU5Zsart2dIOTNm90pfeTBZGMWGsk3lap8zqNWKNGa56V5oUkZHPRo+VLp532WA7kzCW13h00kSgj1oeb+4EKQl8gE3D+3UqG7f4h8Y8ag8b/390TiYJTnxD9uFFJlMIJJLVoUUUbHfRaFFjSMm/FSqLVDAbbuakTZtch61kgH3YEmAboNT6PfPtf6h0mHaLWUy4nT7/ANrjCH8rZ753f3/87zZJyrxT7e9m0NEnfgmvc7Wf92z0H97jH2+F7LgsXvuv2GIavdF8FiPAik53Ei4/BVAxKC2SYwjfBCLYIN70hxs/vCE+DRK/fBB0eWl2+6tv52R09mqP0+/HCBGkm9qVTZcx61XoI1z0vzQnFclG+oLZVRKmdC2+9U/9j7BwczkNqZ4OFfLEWixNZDNabAukEzJ8rGl6gFeB5yQ3evxFXg7lSQarcRrZA+7XZV9RAkrUQ224ESMYwUs8FOp6O8OOCD8llKwhH58bDjCy5b1j5vdvJ83KZo8eLPbP0Q77adAa977DV83GNr3u9kA2z3HNLvciW+oPe7fr9ccp1nLZplATo+tdyJbs8GSnRuO6S1fnaDuUwffPAJn3HCL6WfZPmmm+pvd9hkf86tskshvZXaaOJNpSqf86h1ikfzJLEVEkCrJZxittuK99Rmz96sbndacVElVrrdCDSLL2lQyHToFXDNTXkNoLv5iMf9lJytaUoXaMOirjrrE1voEYhauU3I7m4g5EUc/LtTPoEysM4akxM59QPqJvKO7EYzgqiLsETvHNxOjFmXYa87cNX7nWyA5/0E9DtcSZrg7HcVZl9LWdTTc3EMt+bXzUi44l3UvB+OLy/uc7wSksCCyWI4nc09PYuQa3ENDrD74IO/fl03B2csd6h+xgnXAhd8Qre7fbLfioa7TWWPxADZbZJT19ab8M1jA+UrlqoRBFY7dvvoRPf+StyAdySXap01uV7KJknabagnZbEStfRdPwJmbZUeVYmRGMCUkrC0rY9l1RPw1SRaPlfYkV1bau7dlXuzEUbcuRwu/Cn9UuYtxr1CsWa87B0HnW7ly4RzDoymxdS4gafj3jfB837C+Z1SFQW938XZq6IALLzBjyb3FFl5XA/KLBNQ3YA0QxIfvhAoIP1u37cIuwMHH5yv3IF/CCZuu6MmuxGpX+lMb8V+gEX6TaUqckFbcUI3jxWmVdWvZvsfZI+yWe8ymyqdNcW8mN35TMXzpMI8dihLTspqYD5lmQzOiPC7c5ATLVcQaJ+XM8J65YenTdb9YYcXUs5H8tYFzgrxhXI2D6epxc/KZtngVvZOlo5P+50sfvPHed5POL/DqXw3Gr8LppdYv1RFFjwop80Px4wDtwD0DxkydZGJRVOnSjDbD2+GaneuM3ntEu4XHMBuy4l5y31rIozdFAe77ZOlVvr7pV360d37ieS6qVTrVnDzmGHajpGCH9k7+oDttVpmMk5tJZ9udjqL1qvLrW5VCE3TE9ETitlxeSUiy9bikxKsjgmc/IxC8VddNoeNqNiyZefYOLVcCk8GI32/k07ON87zfmL5HUnpUcIy4uj31NyaHrepUxmUHpZ+ziMDC52mQ6b2oEASgam82nHHHUgQdh98cCQUMmu5kaDa/e5YdrsfZlKrZbozu/QTrkGDe/kZPHLdVKp1J3Dz2IUl8n3s/f3CR8lUlvkSjjRN2dtLConS41AVMlwDoJzgjgMrZ/HD6sYNHlxXR7fvMxTE5ZcgcHD8B3/AbcyOE5oTz8fkuiQwqvc76VEK+LyfUH6H1WNfNmUOsbmUgH5vIdDTfJX7T1DzrYCyYIFwfCr3b+4BFma7E30Uu1nYJeWOJJW7bPfmsrvozU7vrLLRtk1RitY8lqadTlPJUtRLMti8LHFraq60GCoOnqp9Wt1wzx5bDqZbdpGJXW8voARE5ANZ0UX1WZku8Ck86jpOJxXJ9Z1xab+Tfczn/QTzu4K+971pvi/7smPHCrz9XitBN56DKt2F92dpRvqhjn3R4QoLFgBTgWZI4kLONnArIYrdTth9jCHOeE4rN2n3JrM7z8mZ5DyNk1wnzgI1JPHSc2TYeZS/feGtLt7xsvRqvoSi5oM4urhoFpcQY5H2WKCdKLuCc4sWGQ9gODnXojoKY0SUXW0E/BIh6TcJ/CvjWNbJJNf8SazAP9YvJ5dbDu4g+J6pc+VenkTkwcEuYT6wIZsVTZxO5xvAnRVaIifjOWPTfieDPu8njt9ZpsiQBWgsqMynnhT3SsPjvIf7OMW+MQeVF/w+cZ4DjHbcequH3ZARq3w3N0u3a0Y6XqDZlG+3dq/H7rjMUuJOg1r90rum4vEB9AcP44eXlfqRZeW6AQ3J72sh4VqgDZvQy7+ogvUAbrV120zte/zj/zNg3KMPHx6mpZaLnVhe3PMec9zcZLrfmofp8Ya2807/QRsU+ZS+bhYXbK2q+pG2sCBmXeLIAivLuFhnInv2ACtWwOX6gRfMsLkWilHweIR+rKPR2NZdQyCfwgT82NW2nr2cPWZkZGc6NpEBTPI/lzPwJvOWpxNXXScH9MKDWCrspO0D2DhKaBS5DtLAuQxIY+930rjd8wwRbb0X5pW/3k8kv6udS0F/v4jtx0zq0kzPiXs3JbNxxCPOfLiIFjsqRDyoA3jBL5qOxQZy3R1AMed7oeJ2p8pa58PFI5PjXWjKt9/NarHb22eQvNegfn+lWXkzFv3Vbu0j/5Xft/BdSEM8czcBNmzYrGsvy23F+hX2ma6TRgRSS81LnFZaZLOx1ZIGVz+naD5z25khBs+79LrJB/jdQ+hfFiRQVQylW4+qCixbFi+XsRnPcagMQjNCBXzKUUdlIFvC/aNJcjL5sf9eQC8Efla/uCyfCx7nQFDx5bdfwUlsRV2+sZE1CDIizbzfSdt2zzzuKeu98LjnrvcTx++CwOkEcebYno6PutEdPLknED/u+bU73b3KOfieqlts4CqLW3AMj+fgSmlYuzWKRVqAer61OmeNlYBsaz5VSZ+a7+Lhgrd78fiFsNtueKVN37kbsKhSjwOPulCdlue8/U8jDdnpb2vECWaIbIXa67K10dTkdr1/lybB85VaKLBQ2irNccOgBPdb8zBtN7xaFh1iwpiJuinnHC/WHkALwCnhiNQ/4gqjOhMYtCsHiLj9M6MBlE/5FEqDgr0ipiS+t1UyLsLNbATkZLgFgeEuUm2EB+Wsi2Mt8AdOmaYXSHWAT52dKvT38axxv5Om7Z7duOfhxj2+3o3fjakFqt9ZdigJ5hxWL3goMnO8cWYGfaNxB34CzCrM3nbGVedgRPOLfZWRiF/w6OfnB87YVhjuw6GHavnWBBIBtc66SMcrXK8h30dpg7HHvWWHqetNEey+iTFcjdNfea9B4uSxFqYq/yPf1yakITsP5+tcuStBWyADxfYFA+b4ZQHXoSuppc5QYuMTYm21tMFVlZqHSX6CuDbatFMqEQyIfIDfPYUFQcY8FlBZ5ghjbMECc7lQ7QtCAJpxcxmKNK44VVdjzvhrB//xq51VxmWcP9cgwaKj/0PiYBpZMA6SBt3/i01NCc1n9CD7AKT/qXK/k6LfY7d79uMeX+/Fj3t0uWcHvye6HsXvipTgugeqEOIIcY3EHRN0HPqdTH23nQFBTSs2Qyk4TpkGGMOhLMPzznuNFU+i9Mp8G9yuutFX3/SrJ0/Jdza7PHcNYQwDqSgx+4S/3Sd4w5W/wlMO8I6Fl9SL0MADWerHplSCNMT8XndSzAMKYrJx7frtio61pQvulrqYDzzJAdBk0uCyyA8T03qqEh1iQgFbrdwQWdzfkxCyBwed0QAN/sqAuM5qhBy3JjixUwjtaTTjE0EGJCBFgEOAjzQBfiO7T2ls5F24JNqREn1ATxjf/15NTZMyeTAMJASjQO9T434nW9nvkeWelbjH1ntR4h5Z7tnD78muR/odyABmQpb9XwXZnjF+UMdM3KFBB+d4FWafYaYqpWIH9IKbGcNnFFBwzvS63VJ4oNKwFxfmVLHPlVkW6Z53EeYbhjJGpJ94xHHnKcz+mb52n3GGaLgKNyCKew3yJyUV9yzClLbyY9wxGyL7YzeCCegrzU82Jzbs0YahYxmxXLlKXKU4Dqu35bU6tpuiR7xTKE92mN+Ld7Kj+slPfwAiu8AyTMXiOdkKbNimgXPAkymDOCgGolSifz4nNwC/4et5Vk7ctc8a0EqqiL99PpMmFTJ4jJxO1gD6kmD7nXTze3a5ZynuXWBEint2uedC4p7G84Hf0TF4XuKFG3Y/X4h6IPSOVy22XnA17GJY1r1ut5pvzPgiRUSLXytZpIk0fNWlE1h4Op3a0JntZjcMeNlw5a/wQb+ZOw1ccZd8H5xAVT03TyunQYZoX3yCt2Ijr2mwGOBJt6pe5ELnMd3J8LRSJ0wuC64h6hYyLhbZbPlhArQdDjFSEPd1k5XBQUNciAxLkK+R3RDKTh8+p7tFxHsj2oLZZkBL2WRut/AzSLZHmcx4NK0i/rlCsdPhdN9GdXR0UKg3VlLUlbn1nzVlcAZcCIL7vo+630m3jt/nnxjLrsU91ygXwHLPxcS9XuP5WJU8YO27WvUMPthS22EVTIt6To43Bj612PuvSii4GnYxYVoTuV53XTsV9QmHr/TB867Eea5yNmwkoY84loCaTdrdyW4Y8JcpDFcMYWp7fhBaIc45ATt7K9zdIQ3ZqUwD09BL5zwjbmOeRX+zwxNa5jVpC20ltZLF8TC48rZiexdMthXILrYVfN2Y7KD9bAyiypKDr+j+nTv9GraElzfYTUJjaCgJp2viCG+Fm5xtfh/HFNF0Tj6ZAR/XTXCysqlA4YFNk0gztm3Zki/XvN9JF79n5iJfoMU9gxj34gmJFRR4e6Xng3KvtiisoIWE6V416jk6XqfYhP379YLLYRd1olmvC6xrW/Rd6Um0oaZ8byzsTpbjzBbEw25jOQpO9xnktcGCQuiRMvWnjSW0+rOBNETtzDhA1jxSeEjz6l9FDTdDbua8mauWOnGCWSptRR03LTRIg8v6rXmYtltLePrh5Hl3Xzf5AL8N7Z0x0R80D1WLDKOd0COB4Icy2Nn0OK/pT+rM/lSnFYeh2COtzQrNhKASBKwalxo3Ik1DbmRRbHls11t1cqgnMrMBwz8Zer+Tfn7vggucuOchxr0LLpADr5/nA8584B0K8BtNIOAC4UwIu3rUi2b2/qA9qeBxHP9b0Wv9keoZ8EanF6ie13cxlPoZS+yWDxsNZgc2vMK4xT7HficSk+1+SO+KKk70V3pnUi3ughiiDEe0HTbm9zzd8gbXbpD9iVwhVmazLuzRnAdVyu2XOq3MuiPOdj9Ma80TPAG/aXXKAAirmk8YZyLDSHzd5PoO/tPXzeL+KkRkyBgczAO+nvuDtc12PxYssAVdAKIMdp5gPvb3V6Yz6wufqhaaGUesjwHY7kcapQXifVVpkMl2qgbvRo61wgV9JnlNLjD8sZH3O+nodi8Q496NQfy4h6QFXh/Xsy+x75B9Oev2xEIH1wJnzmyTo14Isz16UsHZSCi7UlTPmyyvqwlrubXRNWbTYYS4htt9BrHPsR93GgTdgQd8pwW4ywLp6nL3mxGEDB8bKfmEZpGG7DzcfpWRhoeH2bAxe50YYUfsxtSpcGjUCNUbieCqwHyD3XLYo5Vxj+bl9krNnjNTEq/MpLyk3KawVRsHGylIlRSazPrtDVHwm1SHszs3X/neH8T3/wDDkg87GALu09z2rqewTpu9bhbvjN0vWACJXLQGY2rnsv7+SLu9ghUUU/i6F563FQuCMB9XVBW+Lg9nvrycPeaoo8Yq5KggkaOsfAp0x3wcO8pDqUcg1xiyRSD2ViXm+9YeiK3Ux32BVOozMTTyVznHEHq/kzHcrk8hgRfuephD9z103yFD+s3s3+/xrBvfODi4LSXqOZt9YwWh4M8qsOBsF88eJndGt12+l82aJZk61YRNembNWrZsmU2+V4sQzFsaPVdsdaNCs6DtNrYtR8F3ovDPsT/5o8NJk/jhodkPDu00ch0W2M8OrQy+Ai5BifVhM9IELrroImgQgPUmY9rW/az/zVJOTdvxJ7M0Jan4br/UlHJ73G5OqcOoHQcEc01Ud1CFksKEtEn047awE4HUgmWDYShUzapFizK+ZhQfm53ucG+3LW1RPB/bTSKNY5Fv2lEyoaF15FNve9eI5gyDChxkXlZLQC0d+7gvvP1eDm6cKfCaXY/O8n3ZJGrLY5ztTsJu1DNntqVEPUezrzLQt733awV/VnLBjVYXN+Bc78tfjeqNZSway5bp+S7N+E2c4n3VBd/YydOUWA4yWyoMaBxjDNm4ukU23Gyo2Psc+515vcpHh5NHVlWFiDXSHHbY8AABVwD4rt2KIACbIv8LapHNmzVj0F7Z7IznsvH8yfsRKLXteEsxFgsIH7TnY/Rb8efHiv1TZU10zVe9JM3OFvZjmel1nAEurQZlN7GNbSwIzobsatXuH9yQ4A2L1Msd4fkIL6J+z5cFFnG71Z6PK9pVDqhV37SjRKKUTahNgrrz08WsAD8vemxD5CUDitjHfeHqdv24Z8C4x8gReL0837777rtgX51lyAznzGedaUutB51YZhdUcNuDvoGW0H33VXIuBi1QxAwvDFUO1fJNqk++XpDSFvrQg83OWb4SiU17BSdmyIabDRV7n2O/6Vbe2nIIiknv7JJ5sqn7MtC99gJ14fqgc7gX+tcE8faiu/JgulQnzTZnlsD/Fu0gNJp2t9he2ch2mhvPH32vEYcLe41ot5tAbmxuLHa34PZ0ifm4e1HTxGyxPa4wbMat+kheCZ5rPv6okHV2cYPvJEN7y0Lr2FtLxR2AZthGK1A1i1sB8QIOn6YuOWh8pPTb14PMAkc8H5etSESwMcOAcJFv00TcuVH+37a4rvdnAk7F+hc/YvjK+xWoUFfoRWMf94Sr230WjXusR4UEXqTnM+Zcr3hX6p2d2e6k1ClBJ4zZodqjCr5sXUa+5IqogWLQIaiR7kN1UdBykOVXCixwwQUb6VPfcWbTSXjCUxHNK3jx0ycaHhfUtYxTkra23K/ExJa0q4iEhZ0Nr4KQOH3asssu5UL/AqRqcp1MH1vpRYoXutA0msJtql/z1cFBwriA2L8hOv7UNAY6Fotxe6c9l/u4KrBV2x7aRznBR8U1hUHt6UKwgr1ul23IADFLWcPktslpx7eWBwcHLad9d0biXcDh1GX2fR9XhYJ5viyziNutdn0crMomGey/MZkmE5N8RiyCfyguPWenGiEf0EQ67gnVXicDuV0bhwoJvD6e79BuCdzX3ZvKcq/1woI+pgWdQGYXV3DDGod1RZ4t8g2RZWII5coCLybYXv4VBADNnmMyHPGZuMw8nGk33Cyo63yO7nTaUdvashsUnVAg7CrCGr5CqRYX7d9v+dCj/Qv9i0E8kN2h+Dn8YwP/q2u13coOqfs1XwVfIt5zlrDWlD/+ZBFj2GJ8ypjrY0Dx58eq8uSDRgQfhdeNMHgdhOcLe1QNMmAGyjLorenUdIuybFm7P3jo4V3A4dTrHeG/vgItxxeBZY54PrZaldgltwlmFMHSa1nj2M9IUyjdu1P9ftwME5PuIIKG+Gzv456gIR+VJ8Rxu3Y6sJjA6+P5upX1jmVGv4uYcl+WI+rFMDtUe1LBY7HFX0nrMkW0qudDZZ22BZA6K7TUM21YADQ7N+Mqb+qLLJyIdgI1u+G4oWL/c+xP2+LjTikmKiGhSpnRbdg/B3Hh+qctqxf6N6Crk63zepFivMDQaFxbSV/zVYvwnKW9a8BcIWjH7LULLdZHxhXa9tA+ygk+JrlGkJ4ugtFIiO6htxBwFyygRxrQXhAkbuwDPETKgPCaSVtq3/cx4vtikTahIgz3RETD7NzkkEJB1STjVakD7ieC2oW6BTQD47I9j3tiGJgnEUuFAG7XmNViAq+L51OqAIQZ/S7xLCnqhTL7qqt6UMGhp1GBzPOmUijjNk6dsm2j3UZTE1/aXrA6DECzU12PQtkPELMYznG48jn2041Oicgr06IHPHTqK8m7DlDsOZQL/Ws4rfsc/pGB/xVbzbCfbeVrvooo/qj9FZ4/j08pMLk9Nn+fo22PK3RXSj4KrxvFNYu8ovjixqNdVmSavNVu409ZsKK/fxB82cloRaQLOJxyuSMUH1dVii8GaZa+5GNZJtS7RqtVdnJMoWlSh79IJRpVUPBqRBCk/b50iPR3/5U3TKYZjsLbbCSbig1exz0xFJ6sMECQKG634MDr4/mUOUGx15hv4lmeqBfC7Kt6UMFjgn80xAZ/6S0NGR9/jg2TSaE8aSZyL5RHaTFz6ukodmHgADR7GBiBsN/m4eBJKTiP8Dn248SjvLVl75ep8MvVoLijn8xx+rTlWcvKsHnucwFlneRZDIH/VTaEbrfYStlgDnkpPWfiXiMSsIzZa+b2fIzo/vxYFZPTvqqs4Fyaa8r+QYizDhjXq+AGo78fQjxMjQOtKo5TGWKNdAGHU+aZuD4Cri8M4QUvDFSk1BGMksGkmxm4aVKjnwHxyxgy11khQ3izkNiy+Hf/5czevUnS77wBp6m7XEqe4HDcE7yqxN3tGis68KI9H/oSzaEsW6mzH0ZPqGszqVEvhtk9qOAxgT9oItfqKRSI5O82frzU8UbTcy4mxRddvN6cEdTy8qcQanYSHrWcGGW/AR7i+KHB8JKhgPA59qe1vJPFRKF75oO7NwTlZPkX80WnT1tmUS70r83WfQ7/yMD/yq2m38+2+zVfJbj+uEAzcfwpAv2Sx31tmx0rM6W3attjq+5K1UecjE4ZvML+QdxsE+gJUCXh3jhUkXen25WDeAGH9Q5cHwHXFw/39SP5CLFVrf/eVgm3otiOgtRPMgRJmfkobML8IY1SPgCvt8gB27Lwd/8Vg/Q7bwAr100dPI57gugqpxu38OLu99CKDrxoz4c5V/K90ux39/O3XjNEvQhmF19whdXdWq5htzrYlW4ZuvNN31HXz267jZfCCVlgxb9StgLJf5KRzSyvei9rRWk5sX3AmP0CavZwlMteBICMJtw6FvwFBsO5mymfY/9Q0taWW9qeIoRWvN+50mKBzyzKsDntNIumTsDA/ypbTbdbbKVssKWqUvEnoXuvFYNpzB4y9l/q/vxY9ZMlH4XXjeKatn8QJ5vRYqBzVZXAoKlRCqoNdBz3c30EXF883HFPyUcSYQVwPw9VNQESjLDFIbFbvElF5cT1jR0+zlCvh/uKsangi1WrVcqmWJaXE+Lf/VcA8m+9AaVbeI9NBH/cE6XyT/r9D/6yWHH2eyRVcODFeT50ZrL4D9n+V8pWWGnD/hnqGBQ5+JcS9ZzNPlFjJnfBJcQaF1Z6/JgCunOjLzc2O9ZZRt+AkvWwh6npYNg7sNvfrQ4Qs3P1qdkw/o2hc9H64O2p0Y8X6A3nbqZ8jv3iwkpma8v9/i9UKX72870h6AeaxSWCzcZZhGETgB6p6yR0XzWB/5XMl1pos2632OrXfLUqledMfLd5SBl/gt/9qnFzndvT5/2XV2jao7ytYrLko/u6kQYvyxafLglbRQZFWgT5NSPO/hd8DCQMd2m+v+AjpSxdrHHBrU5XqdQ169Yi+/5o7CgJvP/2++C94UzAOf3GUoXBHqnKC3+t4nKL/MB0Chbyt8Yh/d1/+bJ3b3FxAOl/8JdFd70hFOHHPVFME3Z6tWWjGmvPSwy7eQJv+lQXyPMJ96X7PUqHhd8VAqRxWI96QLPRfa/YAangvn8YdwGGx3K1A5Oks0xwttx5TL9ohGc4bQYGntXS8gFhNoW2J12ZMdhhVRjwgNFw2FCx8jn2s80tDwtf9yA3KDqT1NKuIvSVlP3I5t3GWbQL/btqVUBdJ9UyhDLwv2yrMarbLbZSNtxOs+KPv9MIffypBAGM2T/3ufq8f4nd5Sy6yZKP/utmWcJ38N9/HUVnVahXVcvSzkWF1/DFuYa0xA3l9RVQhqW43Wr1tZOGaMnAHwE02y6/md45kFoqgXqa1t4CI9u3b1dzVOsjsNtxb7nlFmzTaRYs5Bb797PnHXAE0mTQtVskj71KJoGPe+K1Q1HmhCDZjel5afEsoAU+Ke4lTnVhPF8JZYAE3Js3vzuz33ho/dCjHtJsr9z/5viloNgnSsPd93D/TGLBRdRca1UVaL8/cYr8fxc3lvk3PDX5XZ38v5A5yxMgefpy4OzgLR8QZvOtt7pK+OXr+rzIRhjRYbDnwWY4bIxY+Rz7U7fX2E9jIvvdarszkbOKzlgH6e9ixS9i6WUMitBzMPutFn77axf6F7jorrs0deI9RuE7tYH/FVuNNJoyqV9O/6ZU/KE7jUgZfRreOYKoxuy1bk+Z9w9o7LZ8gk2Sj+7rZoHgmqVd9duXCikYZdBh0FTbMD6QSN4v/b/i46qmaL8biRYCNjCgsEUGprb37ePNyB3zpd09pI0d4sZ9thu3Cf5A+1jDREnelcg+0hCLy26uuODmUkaBfyH/8qpy5x1wkC8YTYgeOwv0uCde+9rXDgrN1V9VirnnxaKZjS8nXiUqhl3iosHieCGeT+l3DRlPj7tqrwcz+6/mGnwprXHiXjrXaA0XkXk2bXSYSfn+l4uXIoxm9rsKnL4EoFq+r5FWPZS2Dwiz/zoO93UN1+50SGU4AQM8NOV+uM3wkRjJpYvoW7w0VU8TbdjAteZ4/zSfpt3C7fNaLlvc8HOxZY5oxnJR8fYwQfkaqN2SjxlcI+gvJJkWRntTdQHHAO31JLxhTuYbCMNN9lvwPMVviq1Sq8arLXMytoT8AVoVwdDs3azAlFEKjeLGfbaLwZ+InU0d5r3JqK2VJuYVhqEXQM9dSXtUaVD20xNfk/27/wrxBQN10IIQoMc9kZReqxEdGr/H/+ZP5qqrEmlf83CD4wV5vmtSwjfe/e5ViYxqvR7S7FHDCRFbbHm6V3FxZlRtuAzkWWFTsdp1ucxZ179BlVi0tDAm+6Ort7Pyu0Q+n9fL5yuninx/PTX3UCx47aCUtg8Qs69K7V4yEF5kZyYSW4p+YLmNhjcjI1WlfI79bLmhTIfNHsi3swPSEbQepLtyzFb7mq3Ga83RJzTtZjBI23DJBM0ur0/z6Ts2pWnlDhuObitlloZh0mG/K8ZyTbwAK1NmSr+foj0sSMPIvG6SXPNQXjeEFmNQBbwjDuCD/poXn7xZZRhLfuvPueR3IhVgJbQqQtuYnu44mFvmy6SruzXo0ywJ79xjY2wf+ZMXMTREvdeqz/XwVFKP0OYBOdlxiZTnHbD3LKTfCfnS9wOj8iTMcU8UOXuZjjQz30qHye/99RZu2VVzAvfoqIvye5/Nd7YEX+CXfvszfy9Fq2BwvBjP9+dZBGXfoEwoWlpaTM7Uyu8ocfdbLZ8Gyh3k6yk6B4PXAzne54365RbjnsJVV5lyq92u4out4538wz/8N5UJr1eX8T+NXqDHbf0u5ZOQCkz9Yci3EsUXJcTuot2xmDeoo88PfKbB8NLuaoXyOfYnBC41oPb35zvhg82Qo5nT7ZdrgXShf8PZYgfefz2adgMutZTtdpHugOXZqnzHpjTxa74akMrsPGFppY1gx21fgJUpM6WfItttImUY9ffrrjHaaGZamEOrrapN6geRlmVQJO1L/++/eGaVYSz5Lbid4HciFQV9YPUe5tYFFsxj3rx5TIHOHFrctsD6X7FrnzVMdKaneUJ+7mJpnHpqSxh6B9lxJ0mrm0nmf94Bt0MB4kvfs99LcNiJE7iUVzVyyov2osnv/VTyqz/Gb4u+3A/njDPOuOqD1N6P+/GX/npgjnd1TgkJuY+ZMwUe/A7njCBY7iBarwc1G4e7KXZK3JsDKziW+7ajV+cpuMfVDpL3ck6809Kih178Lj+UkQULKN8/PJnybV/wMH5h230YUMyAfzP7odyx4PovHAuUz7Ff2mhg4mFbDeY74YOtW63136peAFgmXejfqmkC6+X9Ne3mcATuF2mecrWfT/fUPuv/iF7mVitHYSOQcVs23ajMlFY8HjaSLpawOdUxyTUWFdvttrf16RRaBuJPe1Am8TXjjCwFlGEs+q2ORYp+J7RpVzdmZqsexDoJ94Q/M28e30DuO/MEjRDUkt9WzWPtiPaHNwllEoDqBYUVQJ97XG7v5X3eAcMDD9xnBJ0rHXbivSlheG9a0zgUl5nfsqUBuovmnleUdfv3/16l82OQ/QnrnVKH0MP968wv/c8EON7W9gVlT5GZqd78jhEcRKbcV6u/wM1e908ylPtEr9z/ZF2+gntf7aDkq+Y53xCBZMJPjLcVD4TZv3zjwOB5RfrMz/zrONzXwx9uBopNgOFuCv5LOkRk9i/S59g/mPLLU43S/gFPycse3642RNHJl61eJlzoX0tKinZjALQdv89N20v+3FP4rP8NSplzFNZ6FrGO2XNVVefblqafGcXix7KUYQTPofgUEkAqf5wkguYzqNMyfg4CaV/6f2G8R/CxkvwW3E7xO5mxKLDJj6oalyHm4yjH+KMMZOcmOgnpKaDstxWLRGOKCWfJsQdi79VNb1uow7f/Kqo1j36WtiLD7fyjZ6SY6Ezf0xMPGMZqUeL8UCFDcsLvJemJT3yvmKT6fOZn0sslpQF6Wovf++UbB9ofbli37uAgWLrbKgV3HIoe4ghDYPNX0/PbNjhejOf75fKbByLbG0FmOG/2+b4t8ck4uQ74JSyCMu1iB8zsXy6/uS3ZfVtSOKXYTEi57x7L/dXUPbcxHf9ltve33Q+JfD9dwXO+qawvFf0u5fsx3IoHwTyE2TeXdl+1fvTkwQcJZrtHgwAw3KMku5+hNZwl7SL6atHYC6rZT/jAWv8r1AsAwrChqIIA7HAE7urnXJ22ck/5s/5v62UeHEwqLMW4zoGakDDfNqK0m1RaYb7go4v2FOpAoZJpRVoegz7Ca0bOBgQfK9lvJVv2W6mvJEPBehdrLh0OfpauADyaVdw3uQrT01gdZ//tmgahE/Pq1JN846dVvE3xEhCwrKdQ2bbNAdGn0MADI1G8Wlxx8aoiJTcsJLE+n0nJOuTEiY3VOSU3f/R5551HWLfuVYLjduOEqFZs4hHhvH/ZPXL3zJxf+s8wOF6Y5zvwQIXJitjkmvlkCeVOiHo4swu7D/bLffeUYjMvzztvTrn1hoNIUr6FQr4P5Hw7MvynjN0lNrvNdLYBy/3R2XA7y5TPsV/ISZDCTvgAODnls/YfJGjaTT/Fss9rzV6upFnkz/q/rZQ5+QlzUY7Zq6qtzrctVY8HU1nZbsnHlo/vmoArEWoigxF0htCyaMNCf19kVvCxUvxOyG61fL8dhOqYi1gtwRZ1AHKnxXKjpPwlrQV/mK6AR18B2tPTI5C2iGD+6K7Mrl4NnSs6ikKd+V74B+Sn1Sp5gyP/p1xK+S+PrLMWv/ZgcJpdNnXc+SKSUjcm/Wp6ftu/tIbd9pfmXs8wMDLoRN/zSuCv/lve8pZmajobwdHwS/+jPzRgcrw41zPinHsW1o86ym+/Gxy9JQadCGZ/dCz2P4zF9oUW2S149PSWH51WcIPdekJ/yMd8GxXzTSIsd/DWgcxm7P5VLNyyI5lh0NvNmQlguVMLziFcRN+0bK2LznfCB2p/CJi8QBg2DFUQgNWLLRrbmMmnzbPIn/V/W3/OEucusJON6xxojU3jtq36mrGZptWE6xXAsiPiU+hBsnPTSkHxM6+eTFDUcbe63prJot8pOJYGrdJbDVi32RF72+ROA9bi/bGK6rB2bSEKjPIxoJ//LqqxjCZ+pEWbtPtLrJD/puh5j5tv7qb4wAPHyxgZo5S+nPw2J8mZIvjwzcU+t4akiZcvU/7B7Wb1Gfkv/44d/xB+k9/y7unc/Za3BBdhjCE18GaMfDu+1fJpjVWrIJCfd16OuBeciyUPru5Ii3pYswu7X5/tBqRcu8JuoOHafA943gsvd2RI6Ab+UWYzdh85MqRktZsOtA+5goXdRsO5C8rn2C/lGGbJe8IHylnUk62ftT+vUbabborrLPJn/d9Wy9xKLayAmLST1eO2rfZ8cF+JC+Jzp6C45vwS91pJp012yeSsAeU8aB43w2LPFfcp6rhbVW/pUeOlEPxOIVim+rq+PN62oi5TjHHD2nEfiNsmDxmahfnj41Dj/sUTuNaKidW8Nt5s3ttuvfUNbzj6tKcdR9L2TFom3zfdk5vgAw8cg3UrzmfZv+CXNEgkGVapI7/5w3NK3WA58fV5RqmPeczNN3/py4cxm24q1TbrpZKHkpf91R9lxy3PQ5GKTVxCF4GkuFfXbsH10PPG5t6b7/rGbQM2t1aBxJmwWSS4h362Wnd9ico2h+WggzX7o664mSak3UVFr/gomOH19ji+x7HlfrnWRUK5dxRX7h3B6Wup3RKrq9lwmNnUimc84xkYu8lQf2F3AmJ47NGKxW440UKvflQaV13Nd8IHm7W+XufphLRsmT9sWv2BsiUit5u+f60xumw3yyzoxj3dBvZSO7SF5yyhsBprM5qxaEWVTeO2rXINAvqdgnMHFgivLzbcq0ZsEMzDf920FvdXLWYQ6o0fsA1MhYbQ3x/YrfuZV8v7SQs+WeV6a5S/eAW/KV6TMb0qMLpPYIoS7PAY0M3t149/AW4Y6PciUEiEJtTWXnwhBzP5Wg7h03anbJuwf3Wv2YsY4ROV7wBwgg08MIx9pW26KXPOPQsrW/3yjQNzX03Pbzv1XUspf/3fLCe+QiRfTZrrcXgYAbKvUDvC0IPf+/eX7Vp217sCNJaLBec+Ee5613+puu1wQtzzAl9K6JkJtLBgGQWjbmBGDTpgsz8qmY23uzD8o1CGxz8WJ1huLPsMYiNva0dR5d7RgqjLMFCbi9UfW7sOY/bfIW7dScsdaLuF5Y63Qgyv2m3/c+xP+NUrOqJSq0rtzPeBHDSeuv7WCQsW+MOmv2LI7aa0xLIok0xQz8JeoX7NVxOes8HB9MJu3p3RjNkrW149btu2hOcj7YJd+j4a+qsK0J5CF+d1A+zsp1QNMmgwzhFabMMgcV31iOJxE/aMKn2IPSuKNtbUm9RRrLRxQ/KbVR3GkhiT8LKneB8ASMzOro50EjCZLG/trJZFiYYLqY23+7EGegKZ4va6w/DAA8MNp9ktS76Cwz/pJxEhGccxMVFYTd2kn/STDh/eSvJjNiVe3fF48HuXXHJJrHokGXUyuJwQ9waRLKFn5k9R5GFxfNmMHvXAZv8d0nYdP95sM1xi0C5wf5l548Fw/MwHyH3tRz2qOB71qPPii66wgsC8LPHWBMjst775sAPMZuJvxRjeDup9ju5kQ9Gt1MNm38w4sKQTPuDnInutFurNGHcFZ5dobH8/qnChf9vst4tUJ2Tofxm3V+7ymt3h9X52z9WBz/PKZj+lG+E503c7UBpZ/rGOFg2nGbNnbw8Yt22F56NpJ4n7/NDXTbuxIg1e9vy2vdeNOe+zfpeWD5vZ3ULwULTCQ79betxsiy27xTquXLO796+3XM9NqpfpdCJ+X5ChIf4HTMCD1JrM2ch1QjyPRS3GpIq534CPEp7G4CPLrSfFalc9Ru8jt/wKbu6XNPjsREqHGTlmTqWm+k6n08OHn30JpeAye3H4h3cZIDzO+bZu2WLkG+WJxXhrv3feJZfE0Qfgoz86QWnUAeIIyyWXnCfHvaOPFhg8Wg49H0D72nd5VBj6+QlD/FF3uYscdC7YijT79cTsw9lsrOGHieGvBxlex+edRN7LzDv/yJ+kSPu8X2SecPRRn15UuT/9UXc57yIh9FyrjNfNj3sHMvvPUo04fPNhuN3ip5EIMLwRqIqQtBM+4F/sYLdb0oYN3XRvgHaDHPCzSFNVucvMHuPsNX2ruEJcbW0e921bIZZ9X6soTV7AkJMwjBr5KfR/k0vbncbTTmIMUkzVegD0Y86CBSt2Lq7Q7HanSuLVgcRJqwpwVW6VWP5HEIRFcX7fXLMKGUGQWMxIWiJojPfbbm/06NGDCuDfw20WZOCBNxPeFw0cxaZE9bPfTGEEACkdO3b48DSnNz+7ml2vRvc3eSUW45nNTJCM/1aaLsx+T/7Df8mBcwzk0w9kmmLMy0tmzrtIjHu7Q9ld6vroo8XQc9GfpBztu0Dkg+Gfh/g8YdS7y5MvEoPOBVizb8pmO9hdGH4TyPAaIu9lbrlhzOuPUo72895H5T16l7t8elHl/vS73OWLn/dVZB2GaPcq8bodyOw/SzXi8L86DLf72DGhADC8aVva7UXhsRDa7Z255JprHEUYNm0AHvffWMm8Wzm2Z0/O3Vfwxy1Lqy6Pm/NDGtywL6mHYtyW4H39WF/YlvAftcYR+csg3ItvVZ/l+UhfN4TUW7OgaUv7fVhADrGyVVWhGQnxlQ87Bst4XqM7n49TBfpeaAs7Qh37vnevN6Fe4kCrmdhH6XQETQQrXPFPBQqBKxB+nNN1VOllEdTbo5JXIS4v+kWgP37ggTfbjPmf7NOvv2ioAgv/61hw+BgpAChfGf7YlJB/oyuulxk6dCdis80sdKfxL3qRhd+7PVAMv/mcX/wzJJD7gvHAd4fozMwXB8eFuLd799Gh7HWpjHnsFkLPzS963jtWtTv6Phrf0bvcBcgqGPXu+OjnXfShnNPhzO6AZg9nzXYy/EMNhuvMZtOlwJ8gycebP/QdK9oeveMd7/IV+x3cXlS5H3mXO97xHqnqdKVDMko0HGP2389rmn1BNhttN/9RrCUAhjdNg7HDbM9pz1gBIfkFWNmi5+NUuW5Whve/xrHgDpt2u4k4xf0X8pRnYZV40m4b4Dmr1NJIBZCOW5ZUvfcct+3bVng+INqbbgX59o1p0usLmzI814Rf5f7rJraywB5hZb8j1gLO4c/Gg7LEEafZiGCo/XNPYhuF4FpvTu3yP5dqz660plE7oDL0Wx95NScY6QzcnqaJ1eTvhVLCX/yENR6pYrX4J9cchybSKq9KKc1XxD02bOCBz7d1y1byw8xHxoy/PnToUNzsC053PP7jmOBcOihNi9SSDqXiein2rTRdHEBsBpj1gBeRqH7vKU95yvDvlPKvv6vKv/uys+/5SOTAjII88p7R65sH92nci2WbRFMLTkPPQ4NE1+/4yEcWEfce+cg7Rp9z3anTcTT7Nbfc4sMtt7zGargo94Ris3LHJww8fz+ajhbHg2Co5R8f1utm67LdHdDsX92+c4AmfTnGFwCGC787x9rZJYau8CFOZTDymVD5JZemAfzi/mv291sh+yXpR5pAf5KzgjHScctu3Qxnt4J224fLX6YCD+rrq8lK03iBdATOu7/lHeesMBbA5ru0V6zoJzMuml2Kn/nemF4i419v9g+ft/nf1OWrs8++8sorBZvYglbXSRX5rkH2/4AYUHDOuU3Y3ti/0S+G8xZ4YsEqZELRxj32e7+GWfbfHWivwAMDYCWunDzr+qChQ8cPF7KT4h8eAU7TKU+4k8zH+PFDBx1wwE63J0gn5fHEE00EDMm30nQhZfxwKnR1d+M//IvKMvNv/uBkWS5a9KBIcP6hocikQLF099SWPcOS7+YljwUPjj/oQYvK/JSLHvQg9HqVt/ouYrWH2e1PgqcWYLhGQrF5uc9GedAba7uMLvpKwoFGMeW+YNGpDzKuJ7t5w4mizW6pN4chFAyGW2iyC4SucAEW0oXUL/N1tT7JTgufRDzi/mtMhmUBzReG6yAphlAIetyyDFfki57jttRuDyfOJz/YZzUz5MXz/PU5+OIZ2YnxMg7lBfZAZ5ctW+CMBTQh3sN+I2AUwM5sL5umQRh1wYwrpeq1Vfq4T7abgTP8ATFQAjd1vGMy3L8RLOwp1qjK8yjHcSO4uMfirtcEHtjAiRw5cacDSHdKFFeFaP7BqzR9BPFnkI/bC+T65MmUEXC6lEkbgoBUF0ot+L1TT41xz0imiAMCce/UU43zbpHUZ672S24Cz4Ni6Mldbox6D4K4p7HaxWxsu3sZXovlvuzUKBcUU+4LwOVVpd2dxezkr0Wzj5HEIS4AcMfkU9jN1jNhMFxBVTztdpwYzOSfH5WPX9x/7d1szMIBI81ZwRjxfR8Q/MZteaqkGvCEUuWg0tFePBWRVgv6ZBu0URYsaLeb/n5c5iB8NnZtaNZuq68n7M+eW71FruRcGWCNriSAvZm2VPpYLeDuq69r5jhp5Op26Syn5Ko9YUnQbQLHj5+qKe6xba8KPLAJGv6fZGTXX2PFk3X+BxecNBIEBQ6pJAgIKP4Jhg2rZc63dcs2FcVTm/wOOj0T93IKjXsgwq/9RWWCCJEvjDtg5MtXci/qhaIrnE7rZnYNhvt6z1ONvLG2S6OY532/9fq/lpe6LGYX7po1+5iQmE9ux/Z3WsGLwfCotNP5v4v6BcIp7r+oyUKFuC8+iyrXQakY5BrFe0QggPuNCH4uG3bKKU94wikosV3uwEvVJfUs2oD3TnR/iTO14edQd/rjXJcGon3ZmGa9DXMivMdL88K+s8+mrU54lKWvJiOzkf0+0FvnDRbCNn+kX6gJJ2Alq4YMFbvOKWPVFhl3UT81kHDDJwabbfafZGRXX2PFk9WnvcaKJ+vklv/JP1mbp+rsL3b7J7Xav61uqewAs//6HSo/1w4b9rSn/ScZ2dXNIKN2vuJpw1SB9ELY2V9M3NsfAw80WsRLszWxCBf8Jafki0zc278/P8FV9Dm1NZ+OtX5m12H4or/kFRyLXdDzTgou22KqbPnjWlbxGJuIe9cxVf6Vc1BVG65gSaBiLCkiJNtYkE4pcKRhg7jH/dcyzq1NEksIqcVRvu+DAAjPx8815KT16KUqZO7rS6L2XKs1+IsME7bRzv6djNgD484ILWDy6wn7s+dfb9pKiO6EWH2Oo9x8QJPvmlzmCw/cFiHB/ki/sHXs2KuK+NOZBRKcpryyf3eg6TM+6FanBEOFz7d1y3Z2wwTJggVfQ4mqm6zNU9VXvWoTkgWpAmVkk01e9aq9KSeYs8CegNOl+z30OkXFPRA37m3dyk0uuRP5SMEzl/wCU2w36GSrPc2uw/ALtrq6v+jnfb/oda12l1qm6ZTfhksNPSYQraAMb5b45Nfgtn1DeVeGsEXqh0caNtAvfNx/dSuYAZPlSA69WhJRZnGL2dr3feDZb9T9zNz+9i9gyEmQ2/ssUczHVc5awMQczAiT1xWRncELHCFolzrmn3l7Hf3rTfjks4MyPvmTj3tOEJpEggVKB9BM98eqcBPKGs9NIs+NSynFn84mJnGQzyv7dwd6L0OhQ6qxiQDZxIp2OnXSAhSdYDMrIOsGAe/xxtouyy69tMC4t38/L4lrmUpuCr4/MymlrsTstg3U7FjsQp73osqdYSrJTSnR/5nslHgZvkRhSTGzpHPhNbiuDZuIe9x/bePcoFnqiN+KWBzN+z4IAPxnRvPRpVaoHdwXj4njJMOZCG+TifKmzDsssHX0r3dp5JNBQ8IayHNYq1eCRPvkssyuCfeAbmk0JWE610jbFiFPLZRwqrJ/d6D38tATD9jCZoFE99KWb8cF5J0K7M0igMAvv4Nhp6fGvVwltwW/oGdEPWezYxgOZ+tXEg4su/TSYipquUHjDmrl3LtIKjH4GA5fzcyxPS/NCyi/Daiys4SHgiX5/IMjDBv4HeIZ919dt9q40TRzyO62AZ+zQL8wAS92rnzfB53nuG2XyfmaSfHRvZ6VlFEhvmznbFdLaFanSpeyaTrvduvc600G6nEByGxdeeXZBtLobCJomuZNKBPOdKI65TYHVqhUSPnTA11ok/27A32+rVt2nqgBDhqxuhz5wk2npsT+CuZxm7yKxICPBb8eFvfy4I96mMhXTNTrYcWuxHDB1aIortzH9CXu51z+b4FLxyCGKxktmCUxdGWZ8fi4x0n1c2a0Bvzj/nuFZYp1lv7+ChkNVP2kOPIUvOF9H3Sd57ht17X685H59VXmxAwnRrFSlg3CUGuj+Nfb2nFWoe9gNIPbS/NCUSrqJtzQrea4w8ebse1PbjPVk0rmiZ412r870PN1XkXCrprwIFN9+mcBWh9A/Bn27WoDgSO8YjGy58a9jCUvAL3U3maHMByDWu4z8nKGLXfhSLefKjk25b4YDP9nATay/u40VHtPjpGGxz1ukvA0TsQ/7r+lFwcFXrhFHYi7bSBEQc+9g533SqF63wfXdF3nOW7bhfF7qaS9yEbLMleElymbA6LMnEzLcS/NCwVDmGxWpputOzxHD91F3MCFyInTU6ea4t8daBOzXmPFkxWSWbPW5qnKsX+Gfbtyt2O/hhJVHkr1rbOC1JBZs46927EPPeNYeB7mLa39XrGRr4Co1/OK7WB4I8OrWCrwMJzUOzqO02n+haO/veIdT7cbi7cpz8znfYAd89D0saul4pTFUZa9CiDEfIwcF1IBUROnmzVfJO8TmmEl4fYDbrh/d6AVziCOPRaeN2tWinDGsQ8lPixoQuWhD1Xwnn0D68+4FCRr3LOernf4XpM3rGQFLqrgvUCxKzH8DLfYpty5MeV2C/4zQWZTpkKJG9dxMfwYgRhuCaJv0VTZ8DZO40KQM/fw96BDmY9kHVHQHONskHHfKitVDqp0qiTKtLncJtrzN7od2i1cu9trqEb1uOMS2BpJipo9InQq7YILSc97I/y7A43ioQ+9Jz/v2DNSh2MZeN6sWb5gkiLxS0DJXvLs6KX2N9vfcHez55KCF5VlYKeke3AynEAM11Ofyzm3nssBtw3d7+LmzfZVxLvVL8zgEndh/uHplDUpUY41qTTvkSECeV8zmo8ZXMtArmTeYYGso3+7M7jE8K7pcUjmsEncKSae9zRtvn93oGfBY5gPc2wKoQuQxn5v3oiylCgLEAmY2QXTabETVU4DGG4Loq/l3HM313WZPSSfazk3/uIt1j942/RJdiM+SR1D3H/RcRf2RwFCJV+JdO8dIgR5XzOSj1lcS3zxMK+KstK/3aK0+9atHijHeWIsa+S0zgg5c2eiEf/dgeZQlSBl5KEkZzyUnwekt98rMvL1iKjnbXZdhpel7u9c4/wr5Y3683eNYLgxiL5GNm/WsFabe13XBfoHbRtKv1v1RF/xScBM1ZRPCRZrrPsM+f2luQliiVpiiXR/L0P+47Z5XzOSj1lcS3zxOF7hXG0/1KTGHPd2c643Zys3Kgq942fGP/fz+Y104gFnAL/XA4JW0Y67m+1e9QZOx9h5yZTYqd7sSF2s23U+//zbhqEY7VY44d36PjEg7sL+4WM6K1YFMpZI+b4Xev9x27yvGcXHLK4V9OLJGWn82y1Iu0OE18x1yNI7Z4z4Ex83A/i9+bPvXiM3pa0gHcc5rli3j8vnn3/bUAwHecfUQLtnaOW30R7KvH9Y1QSxROqUve7vZch93Bb7M6P4mMW15BdPT3zNo+sYpd2d+L41C71vo7NmTjxg9s/evgac+Xtbi4BKPv/c24aj6O1iPgaeK4rJlrcSoT106sM9kkqU5/sy5D5ui/2ZUXzM4lrqi6cHUPxwi9LuJsCjCXh2/Sk3Pm5ZOr/eioB7nc8//7ZhultaZyzflEyWVjRzk8FxFxZbEYsguqF67xDu47bYnxnJxyyuJb54ekAULH64xWn3rYmCZnKubwVHCnU7lTjGuSjW+yrqQFZN617KwSfuwk4rWUuket8L3uO22J8ZzccsriW+eIqn+OEWqd1dd9SfUs7byVnXtMWbQRAdrtS73ly8MoN62yzlplub1TdzW8laIs17h3Af9x3/SByY1/8I092YT1Jn82bl5lk+cRf2siutQGKJNH8vQ97jvuMlpTg24Nr1zWhZMHNj6X5nlR/sn6SOKe6/gLgLw4HMm/1ICJ+gzggWOl+J5PfI4O+3sI+m5GMe13o4xQ+3YO2ue07t+mQSRXs9d5auj/ox8NyOSHGFkrzHUX1NNLCPpuBjVtd6bigsfrhFa3fZnetzsRYAUFNBSU4AAAA4QklNA+0AAAAAABAASAAAAAEAAQBIAAAAAQABOEJJTQQoAAAAAAAMAAAAAj/wAAAAAAAAOEJJTQRDAAAAAAANUGJlVwEQAAUBAAAAAAA=",
                bg: "data:image/webp;base64,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",
                konami:
                  "data:image/webp;base64,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"
              });
          }
        },
        b = {
          name: "surf",
          stringLookup: { title: "themeSurfTitle" },
          setup() {
            (this.gameColor = {
              boundary: "rgba(255,255,255,0.2)",
              accent: "rgb(141,249,196)",
              fx: "rgba(255,255,255,0.6)",
              hitbox: "#000000"
            }),
              (this.menuColor = {
                text: "#000000",
                bevel: "rgba(255,255,255,0.6)",
                bgHalf: "#CCEFFB",
                bgFull: "#FFFFFF",
                bgFocus: "linear-gradient(180deg, #FFDD85 0%, #FFC356 100%)",
                background: "#38C2EE",
                shadowFill: "rgba(0,0,0,0.6)",
                notifyFill: "rgba(0,0,0,0.6)",
                notifyText: "#FFFFFF",
                overlay: "rgba(0,0,0,0.4)",
                tint: "180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%"
              }),
              (this.playerSprite = {
                head: [
                  { x: 19, y: -12 },
                  { x: 86, y: -19 },
                  { x: 150, y: -20 },
                  { x: 214, y: -21 },
                  { x: 278, y: -20 },
                  { x: 342, y: -19 },
                  { x: 400, y: 2 },
                  { x: 464, y: 2 },
                  { x: 527, y: -16 },
                  { x: 578, y: -15 }
                ]
              }),
              (this.imageSource = {
                player:
                  "data:image/webp;base64,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",
                objects:
                  "data:image/webp;base64,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",
                bg: "data:image/webp;base64,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",
                konami:
                  "data:image/webp;base64,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"
              });
          }
        };
      class C {
        constructor() {
          if (C.sys) return C.sys;
          (C.sys = this),
            (this.sheet = {
              player: {
                w: 64,
                h: 96,
                fps: 6,
                str: "crash",
                hitbox: { x: 20, y: 48, w: 24, h: 24 },
                poseData: {
                  up: 0,
                  left: 64,
                  downleft: 128,
                  down: 192,
                  downright: 256,
                  right: 320,
                  crash: 384,
                  end: 448,
                  air1: 512,
                  air2: 576,
                  chase: 192
                },
                hair: 21,
                extra: 21,
                friend: 192,
                outfit: [320, 384, 448]
              },
              npc: {
                w: 64,
                h: 64,
                fps: 0,
                str: "crash",
                group: "npc",
                hitbox: { x: 20, y: 32, w: 24, h: 24 },
                poseData: { left: 1152, right: 1216, crash: 1280 }
              },
              foe: {
                w: 128,
                h: 128,
                fps: 6,
                str: "crash",
                group: "foe",
                hitbox: { x: 32, y: 80, w: 64, h: 40 },
                poseData: {
                  chase: [
                    { x: 1152, y: 256 },
                    { x: 1280, y: 256 },
                    { x: 1408, y: 256 },
                    { x: 1536, y: 256 }
                  ],
                  crash: [
                    { x: 1664, y: 256 },
                    { x: 1792, y: 256 }
                  ],
                  end: [
                    { x: 1152, y: 384 },
                    { x: 1280, y: 384 },
                    { x: 1408, y: 384 },
                    { x: 1536, y: 384 },
                    { x: 1664, y: 384 },
                    { x: 1792, y: 384 }
                  ]
                }
              },
              wall: {
                w: 64,
                h: 64,
                fps: 0,
                str: "crash",
                fx: 12,
                group: "top",
                hitbox: { x: 6, y: 16, w: 52, h: 32 },
                poseData: {
                  sw: [{ x: 0, y: 448 }],
                  s: [{ x: 64, y: 448 }],
                  se: [{ x: 128, y: 448 }],
                  w: [{ x: 192, y: 448 }],
                  e: [{ x: 256, y: 448 }],
                  n: [{ x: 320, y: 448 }],
                  b: [{ x: 384, y: 448 }],
                  f1: [{ x: 448, y: 448 }],
                  f2: [{ x: 512, y: 448 }],
                  f3: [{ x: 576, y: 448 }]
                }
              },
              wallDecor: {
                w: 32,
                h: 32,
                fps: 0,
                poseData: {
                  a: [{ x: 384, y: 416 }],
                  b: [{ x: 416, y: 416 }],
                  c: [{ x: 448, y: 416 }],
                  d: [{ x: 480, y: 416 }],
                  e: [{ x: 512, y: 416 }],
                  f: [{ x: 544, y: 416 }],
                  g: [{ x: 576, y: 416 }],
                  h: [{ x: 608, y: 416 }]
                }
              },
              snag: {
                w: 64,
                h: 64,
                fps: 6,
                str: "crash",
                fx: 12,
                group: "top",
                hitbox: { x: 16, y: 36, w: 32, h: 20 },
                poseData: {
                  side1: [{ x: 0, y: 64 }],
                  side2: [{ x: 64, y: 64 }],
                  hurdle1: [{ x: 128, y: 64 }],
                  hurdle2: [{ x: 192, y: 64 }],
                  vehicle1: [{ x: 256, y: 64 }],
                  vehicle2: [{ x: 320, y: 64 }],
                  common1: [{ x: 384, y: 64 }],
                  common2: [{ x: 448, y: 64 }],
                  common3: [{ x: 512, y: 64 }],
                  common4: [{ x: 576, y: 64 }],
                  common5: [{ x: 640, y: 64 }],
                  warn1: [{ x: 704, y: 64 }],
                  isle1: [{ x: 768, y: 64 }],
                  isle2: [{ x: 832, y: 64 }],
                  isle3: [{ x: 896, y: 64 }],
                  special1: [{ x: 1536, y: 192 }],
                  special2: [{ x: 1600, y: 192 }],
                  special3: [{ x: 1664, y: 192 }],
                  special4: [{ x: 1728, y: 192 }]
                }
              },
              snagsml: {
                w: 64,
                h: 64,
                fps: 6,
                str: "crash",
                fx: 12,
                group: "top",
                hitbox: { x: 22, y: 36, w: 20, h: 20 },
                poseData: {
                  debris1: [{ x: 384, y: 0 }],
                  debris2: [{ x: 448, y: 0 }],
                  beacon1: [{ x: 512, y: 0 }],
                  point1: [{ x: 576, y: 0 }],
                  rare1: [{ x: 640, y: 0 }],
                  decor1: [{ x: 704, y: 0 }],
                  decor2: [{ x: 768, y: 0 }],
                  decor3: [{ x: 832, y: 0 }],
                  decor4: [{ x: 896, y: 0 }]
                }
              },
              snagtall: {
                w: 64,
                h: 128,
                fps: 6,
                str: "crash",
                fx: 36,
                group: "top",
                hitbox: { x: 12, y: 88, w: 40, h: 24 },
                poseData: {
                  tall1: [{ x: 640, y: 384 }],
                  tall2: [{ x: 704, y: 384 }],
                  tall3: [{ x: 768, y: 384 }],
                  tall4: [{ x: 832, y: 384 }],
                  tall5: [{ x: 896, y: 384 }],
                  tall6: [{ x: 768, y: 256 }],
                  tall7: [{ x: 832, y: 256 }],
                  tall8: [{ x: 896, y: 256 }]
                }
              },
              spin: {
                w: 32,
                h: 32,
                fps: 0,
                str: "avoid",
                fx: 4,
                group: "top",
                hitbox: { x: 8, y: 20, w: 16, h: 12 },
                poseData: {
                  spin1: [{ x: 384, y: 384 }],
                  spin2: [{ x: 416, y: 384 }],
                  spin3: [{ x: 448, y: 384 }],
                  spin4: [{ x: 480, y: 384 }],
                  spin5: [{ x: 512, y: 384 }],
                  spin6: [{ x: 544, y: 384 }]
                }
              },
              spiral: {
                w: 128,
                h: 128,
                fps: 6,
                str: "avoid",
                group: "btm",
                hitbox: { x: 16, y: 32, w: 96, h: 64 },
                poseData: {
                  spiral: [
                    { x: 0, y: 128 },
                    { x: 128, y: 128 },
                    { x: 256, y: 128 }
                  ]
                }
              },
              block: {
                w: 128,
                h: 128,
                fps: 0,
                str: "crash",
                group: "top",
                hitbox: { x: 24, y: 64, w: 80, h: 40 },
                poseData: { block1: [{ x: 384, y: 256 }], block2: [{ x: 512, y: 256 }], block3: [{ x: 640, y: 256 }] }
              },
              blockbig: {
                w: 192,
                h: 128,
                fps: 0,
                str: "crash",
                group: "top",
                hitbox: { x: 24, y: 64, w: 144, h: 40 },
                poseData: {
                  blockbig1: [{ x: 384, y: 128 }],
                  blockbig2: [{ x: 576, y: 128 }],
                  blockbig3: [{ x: 768, y: 128 }]
                }
              },
              marker: {
                w: 64,
                h: 64,
                fps: 0,
                str: "crash",
                fx: 12,
                group: "top",
                hitbox: { x: 20, y: 36, w: 24, h: 20 },
                poseData: { default: [{ x: 1792, y: 192 }], pass: [{ x: 1856, y: 192 }] }
              },
              guide: {
                w: 32,
                h: 32,
                fps: 0,
                str: "avoid",
                fx: 4,
                group: "top",
                hitbox: { x: 4, y: 20, w: 24, h: 12 },
                poseData: { default: [{ x: 576, y: 384 }], pass: [{ x: 608, y: 384 }] }
              },
              slow: {
                w: 64,
                h: 64,
                fps: 6,
                str: "avoid",
                group: "btm",
                hitbox: { x: 4, y: 8, w: 56, h: 48 },
                poseData: {
                  slow1: [
                    { x: 1536, y: 0 },
                    { x: 1536, y: 64 },
                    { x: 1536, y: 128 }
                  ],
                  slow2: [
                    { x: 1600, y: 0 },
                    { x: 1600, y: 64 },
                    { x: 1600, y: 128 }
                  ],
                  slow3: [
                    { x: 1664, y: 0 },
                    { x: 1664, y: 64 },
                    { x: 1664, y: 128 }
                  ]
                }
              },
              slowbig: {
                w: 192,
                h: 64,
                fps: 6,
                str: "avoid",
                group: "btm",
                hitbox: { x: 8, y: 8, w: 176, h: 48 },
                poseData: {
                  slowbig: [
                    { x: 1536, y: 0 },
                    { x: 1536, y: 64 },
                    { x: 1536, y: 128 }
                  ]
                }
              },
              bump: {
                w: 64,
                h: 64,
                fps: 6,
                str: "avoid",
                group: "btm",
                hitbox: { x: 4, y: 8, w: 56, h: 48 },
                poseData: {
                  bump1: [
                    { x: 1728, y: 0 },
                    { x: 1728, y: 64 },
                    { x: 1728, y: 128 }
                  ],
                  bump2: [
                    { x: 1792, y: 0 },
                    { x: 1792, y: 64 },
                    { x: 1792, y: 128 }
                  ],
                  bump3: [
                    { x: 1856, y: 0 },
                    { x: 1856, y: 64 },
                    { x: 1856, y: 128 }
                  ]
                }
              },
              bumpbig: {
                w: 192,
                h: 64,
                fps: 6,
                str: "avoid",
                group: "btm",
                hitbox: { x: 8, y: 8, w: 176, h: 48 },
                poseData: {
                  bumpbig: [
                    { x: 1728, y: 0 },
                    { x: 1728, y: 64 },
                    { x: 1728, y: 128 }
                  ]
                }
              },
              ramp: {
                w: 64,
                h: 64,
                fps: 6,
                str: "boost",
                fx: 12,
                group: "top",
                hitbox: { x: 8, y: 8, w: 48, h: 24 },
                poseData: {
                  ramp: [
                    { x: 960, y: 0 },
                    { x: 960, y: 64 },
                    { x: 960, y: 128 },
                    { x: 960, y: 192 }
                  ]
                }
              },
              boost: {
                w: 64,
                h: 64,
                fps: 6,
                str: "boost",
                fx: 12,
                group: "top",
                hitbox: { x: 0, y: 0, w: 64, h: 64 },
                poseData: {
                  boost: [
                    { x: 1024, y: 0 },
                    { x: 1024, y: 64 },
                    { x: 1024, y: 128 },
                    { x: 1024, y: 192 }
                  ]
                }
              },
              life: {
                w: 64,
                h: 64,
                fps: 6,
                str: "boost",
                fx: 12,
                group: "top",
                hitbox: { x: 0, y: 0, w: 64, h: 64 },
                poseData: {
                  life: [
                    { x: 1088, y: 0 },
                    { x: 1088, y: 64 },
                    { x: 1088, y: 128 },
                    { x: 1088, y: 192 }
                  ]
                }
              },
              coin: {
                w: 64,
                h: 64,
                fps: 6,
                str: "boost",
                fx: 12,
                group: "top",
                hitbox: { x: 0, y: 0, w: 64, h: 64 },
                poseData: {
                  coin: [
                    { x: 960, y: 256 },
                    { x: 960, y: 320 },
                    { x: 960, y: 384 },
                    { x: 960, y: 448 }
                  ]
                }
              },
              friend: {
                w: 64,
                h: 64,
                fps: 6,
                str: "boost",
                fx: 12,
                group: "top",
                hitbox: { x: -32, y: -32, w: 128, h: 128 },
                poseData: {
                  friend: [
                    { x: 1024, y: 256 },
                    { x: 1024, y: 320 },
                    { x: 1024, y: 384 },
                    { x: 1024, y: 448 }
                  ],
                  crash: [{ x: 1024, y: 256 }]
                }
              },
              lure: {
                w: 64,
                h: 64,
                fps: 6,
                str: "avoid",
                fx: 12,
                group: "top",
                hitbox: { x: -64, y: -64, w: 192, h: 192 },
                poseData: {
                  lure: [
                    { x: 1088, y: 256 },
                    { x: 1088, y: 320 },
                    { x: 1088, y: 384 },
                    { x: 1088, y: 448 }
                  ]
                }
              },
              ambient: {
                w: 64,
                h: 64,
                fps: 6,
                fx: 12,
                group: "btm",
                hitbox: { x: 0, y: 0, w: 64, h: 64 },
                poseData: {
                  ambient1: [
                    { x: 1344, y: 0 },
                    { x: 1344, y: 64 },
                    { x: 1344, y: 128 },
                    { x: 1344, y: 192 }
                  ],
                  ambient2: [
                    { x: 1408, y: 0 },
                    { x: 1408, y: 64 },
                    { x: 1408, y: 128 },
                    { x: 1408, y: 192 }
                  ],
                  ambient3: [
                    { x: 1472, y: 0 },
                    { x: 1472, y: 64 },
                    { x: 1472, y: 128 },
                    { x: 1472, y: 192 }
                  ]
                }
              },
              finish: {
                w: 384,
                h: 192,
                fps: 0,
                str: "boost",
                group: "top",
                hitbox: { x: 0, y: 128, w: 384, h: 192 },
                poseData: { default: [{ x: 0, y: 256 }] }
              },
              checkpoint: {
                w: 384,
                h: 192,
                fps: 0,
                str: "boost",
                group: "top",
                hitbox: { x: 64, y: 128, w: 256, h: 64 },
                poseData: { default: [{ x: 0, y: 256 }] }
              },
              gate: { w: 192, h: 64, str: "boost", group: "btm", hitbox: { x: 0, y: 0, w: 192, h: 64 } },
              trigger: { w: 256, h: 256, str: "boost", group: "btm", hitbox: { x: 0, y: 0, w: 256, h: 256 } },
              fx: {
                w: 96,
                h: 64,
                fps: 6,
                poseData: {
                  effect: [
                    { x: 96, y: 0 },
                    { x: 192, y: 0 },
                    { x: 288, y: 0 }
                  ]
                }
              }
            });
        }
      }
      C.sys = null;
      class u {
        constructor(A, t, e) {
          (this.type = A), (this.x = t), (this.y = e), this.reset();
        }
        reset() {
          const A = C.sys.sheet[this.type];
          (this.w = A.w),
            (this.h = A.h),
            (this.fx = A.fx),
            (this.hit = !1),
            (this.hitbox = {
              x: this.x - this.w / 2 + A.hitbox.x,
              y: this.y - this.h / 2 + A.hitbox.y,
              w: A.hitbox.w,
              h: A.hitbox.h
            });
        }
        move(A) {
          this.shift(-A.x, -A.y);
        }
        shift(A = 0, t = 0) {
          (this.x += A), (this.hitbox.x += A), (this.y += t), (this.hitbox.y += t);
        }
        update() {}
        draw() {}
      }
      class B extends u {
        constructor(A, t, e, s) {
          super(A, t, e), (this.pose = s);
        }
        reset() {
          super.reset(),
            (this.time = 0),
            (this.sleep = !1),
            (this.anim = "looping"),
            (this.pickup = !1),
            (this.decor = void 0),
            (this.gateId = void 0);
        }
        update() {
          "paused" !== this.anim && (this.time += gA.sys.game.time.loop);
        }
        draw() {
          this.pickup
            ? J.sys.drawPickup(this)
            : (void 0 !== this.fx && "hidden" !== this.anim && J.sys.drawFx(this.time, this.x, this.y + this.fx),
              J.sys.drawLayer(this.type, this.pose, this.x, this.y, this.time, this.anim, this),
              void 0 !== this.decor && J.sys.drawLayer("wallDecor", this.decor, this.x, this.y - 24));
        }
      }
      class p extends B {
        constructor(A, t, e, s) {
          super(A, t, e, s), (this.speed = null), (this.timer = null), this.reset();
        }
        reset() {
          super.reset(),
            (this.objectsHit = []),
            (this.radian = 0),
            (this.speed = { current: 6, raw: 6, max: 13, accel: 0.025 }),
            (this.timer = { crash: 0, direction: 0 }),
            (this.style = t(0, 3)),
            this.changeState("crash"),
            this.resume();
        }
        update() {
          super.update(), this.isCrashed() || (this.updateDirection(), this.updateSpeed(), this.updatePosition());
        }
        crash() {
          this.changeState("crash");
        }
        resume() {
          const A = Math.random() > 0.5 ? "right" : "left";
          (this.timer.crash = 0), (this.timer.direction = 1), this.changeState(A);
        }
        slow() {
          this.speed.raw *= 0.5;
        }
        isCrashed() {
          return !(
            this.timer.crash <= 0 ||
            ((this.timer.crash -= gA.sys.game.time.loop), this.timer.crash <= 0 && (this.resume(), 1))
          );
        }
        changeState(A) {
          if (this.state === A) return;
          let t;
          switch (((this.state = A), A)) {
            case "left":
              t = -65;
              break;
            case "right":
              t = -115;
              break;
            case "crash":
              t = 90;
          }
          (this.pose = A),
            (this.radian = (t * Math.PI) / 180),
            "crash" === A && ((this.timer.crash += 1.5), (this.speed.raw = 0));
        }
        updateDirection() {
          if (((this.timer.direction -= gA.sys.game.time.loop), this.timer.direction <= 0)) {
            this.timer.direction = t(50, 200) / 100;
            const A = "left" === this.state ? "right" : "left";
            this.changeState(A);
          }
        }
        updateSpeed() {
          const A = this.speed,
            t = A.accel * gA.sys.game.time.scale;
          (this.speed.raw = A.raw <= A.max ? (A.raw += t) : (A.raw -= t)),
            (this.speed.current = A.raw * gA.sys.game.time.scale);
        }
        updatePosition() {
          const A = this.speed.current * -Math.cos(this.radian),
            t = this.speed.current * -Math.sin(this.radian);
          this.shift(A, t);
        }
        draw() {
          J.sys.drawNpc(this.pose, this.style, this.x, this.y);
        }
      }
      class w extends B {
        constructor(A, t, e, s) {
          super(A, t, e, s);
        }
        reset() {
          super.reset(),
            (this.objectsHit = []),
            (this.radian = 0),
            (this.dist = 0),
            (this.speed = { current: 3, raw: 3, max: 9, accel: 0.05 }),
            this.changeState("chase");
        }
        update() {
          super.update(),
            this.hit
              ? this.updateEnding()
              : this.isCrashed() || (this.updateDirection(), this.updateSpeed(), this.updatePosition());
        }
        updateEnding() {
          const A = { x: gA.sys.session.x - this.x, y: gA.sys.session.y - 64 - this.y };
          if (Math.hypot(A.x, A.y) < 8) this.shift(A.x, A.y), this.changeState("end"), (gA.sys.game.caught = !0);
          else {
            const t = Math.atan2(A.y, A.x),
              e = Math.cos(t),
              s = Math.sin(t);
            this.shift(e, s);
          }
        }
        crash() {
          this.changeState("crash");
        }
        resume() {
          this.changeState("chase");
        }
        slow() {
          this.speed.raw *= 0.5;
        }
        ending() {
          this.hit = !0;
        }
        isCrashed() {
          return !(
            this.timer.crash <= 0 ||
            ((this.timer.crash -= gA.sys.game.time.loop), this.timer.crash <= 0 && (this.resume(), 1))
          );
        }
        changeState(A) {
          if (this.state !== A) {
            switch (((this.state = A), (this.timer = { crash: 0, direction: 0 }), A)) {
              case "chase":
                break;
              case "crash":
                (this.timer.crash += 1.25), (this.speed.raw = 0);
                break;
              case "end":
                (this.anim = "oneshot"),
                  (this.time = 0),
                  (this.speed.current = 0),
                  (this.speed.raw = 0),
                  (this.speed.max = 0);
            }
            this.pose = A;
          }
        }
        updateDirection() {
          if (
            ((this.dist = Math.hypot(gA.sys.session.x - this.x, gA.sys.session.y - this.y)),
            (this.timer.direction -= gA.sys.game.time.loop),
            this.timer.direction <= 0)
          ) {
            this.timer.direction += (t(25, 100) / 100) * (this.dist / gA.sys.session.y);
            const A = gA.sys.session.x - this.x,
              e = gA.sys.session.y - this.y,
              s = (180 * Math.atan2(e, A)) / Math.PI;
            this.radian = (s * Math.PI) / 180;
          }
        }
        updateSpeed() {
          const A = this.speed,
            t = A.accel * gA.sys.game.time.scale,
            e = this.y >= gA.sys.session.y;
          A.raw < A.max && !e ? (this.speed.raw += t) : e ? (this.speed.raw -= t) : (this.speed.raw = A.max),
            (this.speed.current = A.raw * gA.sys.game.time.scale);
        }
        updatePosition() {
          const A = (this.dist / gA.sys.session.y) * 15,
            t = (Math.cos(16 * this.time) * A * Math.PI) / 180,
            e = this.speed.current * Math.cos(this.radian + t),
            s = this.speed.current * Math.sin(this.radian + t);
          this.shift(e, s);
        }
        draw() {
          J.sys.drawLayer(this.type, this.pose, this.x, this.y, this.time, this.anim, this);
        }
      }
      const y = {
          delay: 150,
          hide(A) {
            A && A.setAttribute("hidden", "");
          },
          show(A) {
            A && A.removeAttribute("hidden");
          },
          clear(A) {
            A.replaceChildren();
          },
          focusButton(A) {
            this.focusGroup(A), document.querySelector(".focused") ? this.unfocusButton() : A.focus();
          },
          unfocusButton() {
            document.activeElement.blur();
          },
          focusGroup(A) {
            const t = document.querySelector(".focused");
            t && this.classDel(t, "focused");
            const e = A.closest(".focus-group");
            e && this.classAdd(e, "focused");
          },
          clickEffect(A, t) {
            A.stopPropagation(),
              this.classAdd(t, "clickfx"),
              setTimeout(function () {
                y.classDel(t, "clickfx");
              }, this.delay);
          },
          clickButton(A) {
            A ? A.click() : document.activeElement.click();
          },
          clickActionButton() {
            const A = document.getElementById("action-button");
            A ? this.clickButton(A) : z.sys.inputToggle();
          },
          clickEvent(A, t, e = !1) {
            if (e) {
              const e = this.delay;
              A.addEventListener("click", function () {
                setTimeout(function () {
                  t.apply(A);
                }, e);
              });
            } else
              A.addEventListener("click", function () {
                t.apply(A);
              });
          },
          create(A, t, e, s, n) {
            const i = document.createElement(A);
            return (
              t && t.insertAdjacentElement("beforeend", i),
              e && (i.id = e),
              s && this.classAdd(i, s),
              n && (i.textContent = n),
              i
            );
          },
          createButton(A, t = "Button", e) {
            const s = this.create("button", A);
            return (
              this.classAdd(s, "btn"),
              s.setAttribute("aria-label", t),
              s.setAttribute("name", t),
              s.setAttribute("title", t),
              s.setAttribute("type", "button"),
              s.addEventListener("click", function (A) {
                y.clickEffect(A, s), y.focusGroup(s);
              }),
              void 0 !== e && this.setRowAttribute(s, e),
              s
            );
          },
          setRowAttribute(A, t) {
            A.setAttribute("data-row", t.toString());
          },
          createTextButton(A, t, e, s) {
            const n = this.createButton(A, t, s);
            return (this.create("span", n).textContent = t), this.classAdd(n, e), n;
          },
          createIconButton(A, t, e, s = "Button") {
            const n = this.createButton(A, s, e);
            return t && this.createIconSVG(n, t), n;
          },
          createIconSVG(A, t) {
            const e = "http://www.w3.org/2000/svg",
              s = document.createElementNS(e, "svg");
            s.setAttribute("xmlns", e),
              s.setAttribute("viewBox", "0 0 24 24"),
              s.setAttribute("focusable", "false"),
              this.classAdd(s, "icon");
            const n = document.createElementNS(e, "path");
            return (
              n.setAttribute("d", this.icon[t]),
              this.classAdd(n, t),
              s.insertAdjacentElement("beforeend", n),
              A.insertAdjacentElement("beforeend", s),
              s
            );
          },
          classAdd(...A) {
            const t = A.shift();
            A.forEach((A) => {
              t.classList.add(A);
            });
          },
          classDel(...A) {
            const t = A.shift();
            A.forEach((A) => {
              t.classList.remove(A);
            });
          },
          icon: {
            close:
              "M4.2097 4.3871L4.29289 4.29289C4.65338 3.93241 5.22061 3.90468 5.6129 4.2097L5.70711 4.29289L12 10.585L18.2929 4.29289C18.6834 3.90237 19.3166 3.90237 19.7071 4.29289C20.0976 4.68342 20.0976 5.31658 19.7071 5.70711L13.415 12L19.7071 18.2929C20.0676 18.6534 20.0953 19.2206 19.7903 19.6129L19.7071 19.7071C19.3466 20.0676 18.7794 20.0953 18.3871 19.7903L18.2929 19.7071L12 13.415L5.70711 19.7071C5.31658 20.0976 4.68342 20.0976 4.29289 19.7071C3.90237 19.3166 3.90237 18.6834 4.29289 18.2929L10.585 12L4.29289 5.70711C3.93241 5.34662 3.90468 4.77939 4.2097 4.3871L4.29289 4.29289L4.2097 4.3871Z",
            play: "M5 5.27368C5 3.56682 6.82609 2.48151 8.32538 3.2973L20.687 10.0235C22.2531 10.8756 22.2531 13.124 20.687 13.9762L8.32538 20.7024C6.82609 21.5181 5 20.4328 5 18.726V5.27368Z",
            playCircle:
              "M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM10.8556 8.15498C10.0225 7.69354 9 8.29608 9 9.24847V14.7516C9 15.704 10.0225 16.3065 10.8556 15.8451L16.6134 12.6561C16.852 12.524 17 12.2727 17 12C17 11.7273 16.852 11.4761 16.6134 11.3439L10.8556 8.15498Z",
            pause:
              "M5.74609 3C4.7796 3 3.99609 3.7835 3.99609 4.75V19.25C3.99609 20.2165 4.7796 21 5.74609 21H9.24609C10.2126 21 10.9961 20.2165 10.9961 19.25V4.75C10.9961 3.7835 10.2126 3 9.24609 3H5.74609ZM14.7461 3C13.7796 3 12.9961 3.7835 12.9961 4.75V19.25C12.9961 20.2165 13.7796 21 14.7461 21H18.2461C19.2126 21 19.9961 20.2165 19.9961 19.25V4.75C19.9961 3.7835 19.2126 3 18.2461 3H14.7461Z",
            editBody:
              "M17.7541 14.0002C18.9961 14.0002 20.0029 15.007 20.0029 16.2491V17.1675C20.0029 17.7409 19.8237 18.2999 19.4903 18.7664C17.9445 20.9296 15.4202 22.0013 11.9999 22.0013C8.57891 22.0013 6.05595 20.9292 4.51379 18.7648C4.18182 18.2989 4.00342 17.7411 4.00342 17.169V16.2491C4.00342 15.007 5.01027 14.0002 6.25229 14.0002H17.7541ZM11.9999 2.00488C14.7613 2.00488 16.9999 4.24346 16.9999 7.00488C16.9999 9.76631 14.7613 12.0049 11.9999 12.0049C9.23845 12.0049 6.99988 9.76631 6.99988 7.00488C6.99988 4.24346 9.23845 2.00488 11.9999 2.00488Z",
            editOutfit:
              "M7 20.75C6.82422 20.75 6.66146 20.7174 6.51172 20.6523C6.36198 20.5872 6.22852 20.4993 6.11133 20.3887C5.99414 20.278 5.90625 20.1478 5.84766 19.998C5.78906 19.8483 5.75651 19.6823 5.75 19.5V10.75H3.77734C3.46484 10.75 3.19466 10.6523 2.9668 10.457C2.73893 10.2617 2.59896 10.0111 2.54688 9.70508L2.09766 6.99023C2.09115 6.95768 2.08789 6.92188 2.08789 6.88281C2.08789 6.84375 2.08464 6.80794 2.07812 6.77539C2.07812 6.50195 2.15299 6.26432 2.30273 6.0625C2.45247 5.86068 2.6543 5.71094 2.9082 5.61328C2.98633 5.58724 3.12956 5.53516 3.33789 5.45703C3.54622 5.37891 3.79362 5.28776 4.08008 5.18359C4.36654 5.07943 4.68555 4.96549 5.03711 4.8418C5.38867 4.7181 5.73698 4.59115 6.08203 4.46094C6.42708 4.33073 6.76888 4.20703 7.10742 4.08984C7.44596 3.97266 7.7487 3.86849 8.01562 3.77734C8.28255 3.6862 8.50391 3.61458 8.67969 3.5625C8.85547 3.51042 8.95964 3.48112 8.99219 3.47461C9.14193 3.47461 9.26888 3.51367 9.37305 3.5918C9.47721 3.66992 9.55208 3.78385 9.59766 3.93359C9.68229 4.20052 9.79948 4.44466 9.94922 4.66602C10.099 4.88737 10.2812 5.07943 10.4961 5.24219C10.7109 5.40495 10.9421 5.52865 11.1895 5.61328C11.4368 5.69792 11.707 5.74349 12 5.75C12.2995 5.75 12.5794 5.70443 12.8398 5.61328C13.1003 5.52214 13.3379 5.38867 13.5527 5.21289C13.7676 5.03711 13.9499 4.83203 14.0996 4.59766C14.2493 4.36328 14.3633 4.09961 14.4414 3.80664C14.4805 3.6569 14.5521 3.53971 14.6562 3.45508C14.7604 3.37044 14.8939 3.32487 15.0566 3.31836C15.1022 3.31836 15.2682 3.36719 15.5547 3.46484C15.8411 3.5625 16.1927 3.69271 16.6094 3.85547C17.026 4.01823 17.4753 4.1875 17.957 4.36328C18.4388 4.53906 18.8945 4.7181 19.3242 4.90039C19.7539 5.08268 20.1348 5.23242 20.4668 5.34961C20.7988 5.4668 21.0169 5.55143 21.1211 5.60352C21.3685 5.69466 21.5638 5.84766 21.707 6.0625C21.8503 6.27734 21.9219 6.51823 21.9219 6.78516V6.88281C21.9219 6.91536 21.9186 6.94792 21.9121 6.98047L21.4531 9.70508C21.401 10.0111 21.2611 10.2617 21.0332 10.457C20.8053 10.6523 20.5352 10.75 20.2227 10.75H18.25V19.5C18.25 19.6758 18.2174 19.8385 18.1523 19.9883C18.0872 20.138 17.9993 20.2682 17.8887 20.3789C17.778 20.4896 17.6445 20.5807 17.4883 20.6523C17.332 20.724 17.1693 20.7565 17 20.75H7Z",
            editHair:
              "M16.5312 3.875C17.1237 3.89453 17.6738 4.02148 18.1816 4.25586C18.6895 4.49023 19.1354 4.80599 19.5195 5.20312C19.9036 5.60026 20.2031 6.05924 20.418 6.58008C20.6328 7.10091 20.7435 7.65755 20.75 8.25V17.625C20.75 18.0547 20.6686 18.4583 20.5059 18.8359C20.3431 19.2135 20.1217 19.5456 19.8418 19.832C19.5618 20.1185 19.2298 20.3431 18.8457 20.5059C18.4616 20.6686 18.0547 20.75 17.625 20.75H16.375C15.9453 20.75 15.5417 20.6686 15.1641 20.5059C14.7865 20.3431 14.4544 20.1217 14.168 19.8418C13.8815 19.5618 13.6569 19.2298 13.4941 18.8457C13.3314 18.4616 13.25 18.0547 13.25 17.625C13.25 17.5404 13.2598 17.4688 13.2793 17.4102C13.2988 17.3516 13.3379 17.2897 13.3965 17.2246C13.5267 17.0553 13.6536 16.8926 13.7773 16.7363C13.901 16.5801 14.0215 16.4141 14.1387 16.2383C14.627 15.5286 15.0143 14.7832 15.3008 14.002C15.5872 13.2207 15.737 12.3939 15.75 11.5215C15.4245 10.89 15.1608 10.2357 14.959 9.55859C14.7572 8.88151 14.6237 8.1849 14.5586 7.46875C13.4062 8.11979 12.1888 8.60807 10.9062 8.93359C9.6237 9.25911 8.32161 9.44466 7 9.49023V11.375C7 12.2669 7.13346 13.1328 7.40039 13.9727C7.66732 14.8125 8.06445 15.5905 8.5918 16.3066C8.70247 16.4694 8.81966 16.6191 8.94336 16.7559C9.06706 16.8926 9.19401 17.0358 9.32422 17.1855C9.38281 17.2572 9.42513 17.3255 9.45117 17.3906C9.47721 17.4557 9.49349 17.5339 9.5 17.625C9.5 18.0547 9.41862 18.4583 9.25586 18.8359C9.0931 19.2135 8.87174 19.5456 8.5918 19.832C8.31185 20.1185 7.97982 20.3431 7.5957 20.5059C7.21159 20.6686 6.80469 20.75 6.375 20.75C5.76953 20.75 5.20312 20.6361 4.67578 20.4082C4.14844 20.1803 3.68294 19.8678 3.2793 19.4707C2.87565 19.0736 2.56315 18.6113 2.3418 18.084C2.12044 17.5566 2.00651 16.987 2 16.375C2 15.5938 2.04883 14.8223 2.14648 14.0605C2.24414 13.2988 2.41667 12.5436 2.66406 11.7949C2.88542 11.1243 3.03841 10.4375 3.12305 9.73438C3.20768 9.03125 3.25 8.32812 3.25 7.625C3.25 6.86328 3.38997 6.14388 3.66992 5.4668C3.94987 4.78971 4.36003 4.18424 4.90039 3.65039C5.43424 3.11654 6.03971 2.70964 6.7168 2.42969C7.39388 2.14974 8.11328 2.00651 8.875 2C10.2227 2 11.5345 2.15951 12.8105 2.47852C14.0866 2.79753 15.3268 3.26302 16.5312 3.875Z",
            editExtras:
              "M7.90885 5H8.75C9.16421 5 9.5 5.33579 9.5 5.75C9.5 6.1297 9.21785 6.44349 8.85177 6.49315L8.75 6.5H7.90885C7.7339 6.5 7.56563 6.5611 7.4322 6.67094L7.35655 6.74259L5.283 8.999L8.74883 8.99956C9.90849 8.99956 10.8632 9.87687 10.9856 11.004H13.0132C13.1356 9.87687 14.0903 8.99956 15.25 8.99956L18.727 8.999L16.6438 6.74141C16.5254 6.61317 16.3669 6.53102 16.1962 6.5072L16.0925 6.5H15.25C14.8358 6.5 14.5 6.16421 14.5 5.75C14.5 5.3703 14.7822 5.05651 15.1482 5.00685L15.25 5H16.0925C16.6579 5 17.2 5.21269 17.6133 5.59178L17.7462 5.72424L21.3881 9.67141C21.4384 9.72588 21.479 9.78579 21.5101 9.84906C21.816 10.2334 21.9988 10.7201 21.9988 11.2496V14.7461C21.9988 16.541 20.5438 17.9961 18.7488 17.9961H16.25C14.4551 17.9961 13 16.541 13 14.7461L12.999 12.504H10.998L10.9988 14.7461C10.9988 16.541 9.54376 17.9961 7.74883 17.9961H5.25C3.45507 17.9961 2 16.541 2 14.7461V11.2496C2 10.6879 2.20576 10.1744 2.54602 9.78017L2.58382 9.72499L2.6277 9.67259L6.25196 5.72776C6.63545 5.31035 7.16059 5.05479 7.72092 5.00785L7.90885 5H8.75H7.90885Z",
            back: "M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12.2801 16.5307C12.0138 16.797 11.5972 16.8212 11.3036 16.6033L11.2195 16.5307L7.21863 12.5299C6.95233 12.2636 6.92816 11.8468 7.14609 11.5532L7.21873 11.4691L11.2203 7.46911C11.5132 7.17628 11.9881 7.17637 12.2809 7.46931C12.5471 7.73563 12.5713 8.1523 12.3534 8.44587L12.2807 8.52997L9.55878 11.2507L16.2505 11.2504C16.6302 11.2504 16.944 11.5325 16.9936 11.8986L17.0005 12.0004C17.0005 12.3801 16.7183 12.6939 16.3523 12.7435L16.2505 12.7504L9.56078 12.7507L12.2801 15.47C12.5464 15.7363 12.5706 16.153 12.3527 16.4466L12.2801 16.5307Z",
            star: "M10.7878 3.10215C11.283 2.09877 12.7138 2.09876 13.209 3.10215L15.567 7.87987L20.8395 8.64601C21.9468 8.80691 22.3889 10.1677 21.5877 10.9487L17.7724 14.6676L18.6731 19.9189C18.8622 21.0217 17.7047 21.8627 16.7143 21.342L11.9984 18.8627L7.28252 21.342C6.29213 21.8627 5.13459 21.0217 5.32374 19.9189L6.2244 14.6676L2.40916 10.9487C1.60791 10.1677 2.05005 8.80691 3.15735 8.64601L8.42988 7.87987L10.7878 3.10215Z",
            caretLeft:
              "M15 17.8983C15 18.9722 13.7351 19.5462 12.9268 18.839L6.61617 13.3172C5.81935 12.6199 5.81935 11.3804 6.61617 10.6831L12.9268 5.16132C13.7351 4.45412 15 5.02809 15 6.10204V17.8983Z",
            caretRight:
              "M9 6.1017C9 5.0278 10.2649 4.4538 11.0732 5.161L17.3838 10.6828C18.1807 11.3801 18.1807 12.6196 17.3838 13.3169L11.0732 18.8387C10.2649 19.5459 9 18.9719 9 17.898L9 6.1017Z",
            settings:
              "M12.0127 2.25C12.7466 2.25846 13.4777 2.34326 14.1942 2.50304C14.5069 2.57279 14.7408 2.83351 14.7763 3.15196L14.9465 4.67881C15.0235 5.37986 15.6155 5.91084 16.3211 5.91158C16.5108 5.91188 16.6984 5.87238 16.8737 5.79483L18.2743 5.17956C18.5656 5.05159 18.906 5.12136 19.1234 5.35362C20.1356 6.43464 20.8894 7.73115 21.3282 9.14558C21.4228 9.45058 21.3139 9.78203 21.0568 9.9715L19.8154 10.8866C19.4612 11.1468 19.2521 11.56 19.2521 11.9995C19.2521 12.4389 19.4612 12.8521 19.8161 13.1129L21.0587 14.0283C21.3158 14.2177 21.4248 14.5492 21.3302 14.8543C20.8916 16.2685 20.1382 17.5649 19.1266 18.6461C18.9093 18.8783 18.5693 18.9483 18.278 18.8206L16.8716 18.2045C16.4693 18.0284 16.0072 18.0542 15.627 18.274C15.2468 18.4937 14.9938 18.8812 14.9454 19.3177L14.7764 20.8444C14.7415 21.1592 14.5126 21.4182 14.2045 21.4915C12.7561 21.8361 11.247 21.8361 9.79852 21.4915C9.49039 21.4182 9.26153 21.1592 9.22667 20.8444L9.05785 19.32C9.00826 18.8843 8.75483 18.498 8.37491 18.279C7.995 18.06 7.53369 18.0343 7.13269 18.2094L5.72606 18.8256C5.43471 18.9533 5.09452 18.8833 4.87727 18.6509C3.86511 17.5685 3.11168 16.2705 2.67369 14.8548C2.57935 14.5499 2.68835 14.2186 2.94533 14.0293L4.18867 13.1133C4.54281 12.8531 4.75196 12.4399 4.75196 12.0005C4.75196 11.561 4.54281 11.1478 4.1882 10.8873L2.94565 9.97285C2.68828 9.78345 2.57918 9.45178 2.67386 9.14658C3.11261 7.73215 3.86643 6.43564 4.87861 5.35462C5.09608 5.12236 5.43643 5.05259 5.72773 5.18056L7.12811 5.79572C7.53105 5.97256 7.99429 5.94585 8.37626 5.72269C8.75658 5.50209 9.00977 5.11422 9.05866 4.67764L9.22873 3.15196C9.26425 2.83335 9.49835 2.57254 9.81129 2.50294C10.5286 2.34342 11.2604 2.25865 12.0127 2.25ZM12.0002 8.99995C10.3433 8.99995 9.00018 10.3431 9.00018 12C9.00018 13.6568 10.3433 15 12.0002 15C13.657 15 15.0002 13.6568 15.0002 12C15.0002 10.3431 13.657 8.99995 12.0002 8.99995Z",
            editPlayer:
              "M12.4906 17.865L16.3555 14.0002H6.25278C5.01076 14.0002 4.00391 15.007 4.00391 16.2491V17.169C4.00391 17.7411 4.18231 18.2989 4.51427 18.7648C5.90203 20.7125 8.08402 21.7757 10.9999 21.9691C10.9958 21.7863 11.016 21.5982 11.0636 21.4078L11.5213 19.5771C11.6833 18.9291 12.0183 18.3373 12.4906 17.865ZM12.0004 2.00488C14.7618 2.00488 17.0004 4.24346 17.0004 7.00488C17.0004 9.76631 14.7618 12.0049 12.0004 12.0049C9.23894 12.0049 7.00036 9.76631 7.00036 7.00488C7.00036 4.24346 9.23894 2.00488 12.0004 2.00488ZM19.0999 12.6695L13.1974 18.5719C12.8533 18.916 12.6092 19.3472 12.4911 19.8194L12.0334 21.6501C11.8344 22.4462 12.5556 23.1674 13.3517 22.9683L15.1824 22.5106C15.6545 22.3926 16.0857 22.1485 16.4299 21.8043L22.3323 15.9019C23.2249 15.0093 23.2249 13.5621 22.3323 12.6695C21.4397 11.7768 19.9925 11.7768 19.0999 12.6695Z",
            editTheme:
              "M11.5575 13.646L11.4738 13.717L4.54678 20.517C5.04198 20.8223 5.62528 20.9984 6.24971 20.9984H11.1644L11.5202 19.5754C11.6821 18.9274 12.0172 18.3357 12.4894 17.8635L14.5993 15.7536L12.5246 13.717L12.4312 13.639C12.1697 13.4543 11.8167 13.4567 11.5575 13.646ZM16.503 8.25165C16.503 7.83631 16.1663 7.4996 15.751 7.4996C15.3356 7.4996 14.9989 7.83631 14.9989 8.25165C14.9989 8.667 15.3356 9.0037 15.751 9.0037C16.1663 9.0037 16.503 8.667 16.503 8.25165ZM15.6598 14.6931L13.5753 12.6467L13.4468 12.5298C12.6141 11.8285 11.3934 11.8265 10.5586 12.524L10.4231 12.6467L3.48515 19.4577C3.17757 18.9612 3 18.3757 3 17.7487V6.24971C3 4.45495 4.45495 3 6.24971 3H17.7487C19.5435 3 20.9984 4.45495 20.9984 6.24971V11.0115C20.0657 10.9311 19.1051 11.2478 18.3913 11.9616L15.6598 14.6931ZM13.4991 8.25165C13.4991 9.49535 14.5073 10.5036 15.751 10.5036C16.9947 10.5036 18.0029 9.49535 18.0029 8.25165C18.0029 7.00795 16.9947 5.99974 15.751 5.99974C14.5073 5.99974 13.4991 7.00795 13.4991 8.25165ZM19.0984 12.6686L13.1965 18.5705C12.8524 18.9146 12.6083 19.3458 12.4903 19.8179L12.0327 21.6484C11.8336 22.4445 12.5547 23.1656 13.3508 22.9666L15.1813 22.5089C15.6534 22.3909 16.0846 22.1468 16.4287 21.8027L22.3306 15.9008C23.2231 15.0082 23.2231 13.5611 22.3306 12.6686C21.4381 11.7761 19.991 11.7761 19.0984 12.6686Z",
            checkmark:
              "M15.2197 8.96967L10.75 13.4393L8.78033 11.4697C8.48744 11.1768 8.01256 11.1768 7.71967 11.4697C7.42678 11.7626 7.42678 12.2374 7.71967 12.5303L10.2197 15.0303C10.5126 15.3232 10.9874 15.3232 11.2803 15.0303L16.2803 10.0303C16.5732 9.73744 16.5732 9.26256 16.2803 8.96967C15.9874 8.67678 15.5126 8.67678 15.2197 8.96967Z",
            share:
              "M6.74658 3.99954H10.2108C10.625 3.99954 10.9608 4.33533 10.9608 4.74954C10.9608 5.12924 10.6786 5.44303 10.3126 5.49269L10.2108 5.49954H6.74658C5.55572 5.49954 4.58094 6.4247 4.50177 7.59549L4.49658 7.74954V17.2495C4.49658 18.4404 5.42174 19.4152 6.59253 19.4944L6.74658 19.4995H16.2473C17.4382 19.4995 18.413 18.5744 18.4921 17.4036L18.4973 17.2495V16.7518C18.4973 16.3375 18.8331 16.0018 19.2473 16.0018C19.627 16.0018 19.9408 16.2839 19.9905 16.65L19.9973 16.7518V17.2495C19.9973 19.2538 18.425 20.8908 16.4465 20.9943L16.2473 20.9995H6.74658C4.74232 20.9995 3.10531 19.4272 3.00178 17.4487L2.99658 17.2495V7.74954C2.99658 5.74528 4.56894 4.10827 6.54742 4.00474L6.74658 3.99954H10.2108H6.74658ZM14.5006 6.54385V3.74954C14.5006 3.12557 15.2074 2.78949 15.6876 3.13934L15.7697 3.20828L21.7643 8.95828C22.0441 9.22663 22.0696 9.65765 21.8407 9.95561L21.7644 10.0407L15.7698 15.7926C15.3196 16.2246 14.5877 15.9472 14.5077 15.3584L14.5006 15.2514V12.4495L14.1798 12.4433C11.5223 12.4354 9.25072 13.5265 7.31495 15.7445C6.81934 16.3124 5.88968 15.8764 6.0094 15.1323C6.83639 9.99188 9.60847 7.08782 14.1986 6.57397L14.5006 6.54385V3.74954V6.54385Z",
            copylink:
              "M9 7C9.55228 7 10 7.44772 10 8C10 8.51284 9.61396 8.93551 9.11662 8.99327L9 9H7C5.34315 9 4 10.3431 4 12C4 13.5977 5.24892 14.9037 6.82373 14.9949L7 15H9C9.55228 15 10 15.4477 10 16C10 16.5128 9.61396 16.9355 9.11662 16.9933L9 17H7C4.23858 17 2 14.7614 2 12C2 9.31125 4.12231 7.11818 6.78311 7.00462L7 7H9ZM17 7C19.7614 7 22 9.23858 22 12C22 14.6888 19.8777 16.8818 17.2169 16.9954L17 17H15C14.4477 17 14 16.5523 14 16C14 15.4872 14.386 15.0645 14.8834 15.0067L15 15H17C18.6569 15 20 13.6569 20 12C20 10.4023 18.7511 9.09634 17.1763 9.00509L17 9H15C14.4477 9 14 8.55228 14 8C14 7.48716 14.386 7.06449 14.8834 7.00673L15 7H17ZM7 11H17C17.5523 11 18 11.4477 18 12C18 12.5128 17.614 12.9355 17.1166 12.9933L17 13H7C6.44772 13 6 12.5523 6 12C6 11.4872 6.38604 11.0645 6.88338 11.0067L7 11H17H7Z"
          }
        },
        m = {
          setup() {
            window.addEventListener("keydown", (A) => m.onKeydown(A)),
              window.addEventListener("keyup", (A) => m.onKeyup(A));
          },
          reset() {
            this.pressed = {};
          },
          onKeydown(A) {
            const t = A.key.toLowerCase();
            if ((z.sys.changeInput(z.sys.Keys), !this.pressed[t])) {
              switch (((this.pressed[t] = !0), t)) {
                case "arrowdown":
                case "s":
                  z.sys.routeInput(K.Down);
                  break;
                case "arrowleft":
                case "a":
                  z.sys.routeInput(K.Left);
                  break;
                case "arrowright":
                case "d":
                  z.sys.routeInput(K.Right);
                  break;
                case "arrowup":
                case "w":
                  z.sys.routeInput(K.Up);
                  break;
                case "enter":
                case " ":
                  z.sys.spacebarEnterKeydown(A);
                  break;
                case "tab":
                  z.sys.tabKeydown(A);
                  break;
                case "escape":
                  z.sys.routeInput(K.Back);
                  break;
                case "f":
                  z.sys.routeInput(K.Boost);
              }
              z.sys.checkCheatCode(t);
            }
          },
          onKeyup(A) {
            const t = A.key.toLowerCase();
            "tab" === t && z.sys.tabKeyup(A), delete this.pressed[t];
          }
        },
        f = {
          setup() {
            window.addEventListener("click", (A) => f.onClick(A)),
              window.addEventListener("mousemove", (A) => f.onMouseMove(A)),
              window.addEventListener("contextmenu", (A) => f.onContextMenu(A));
          },
          reset() {
            this.last = void 0;
          },
          onClick(A) {
            z.sys.changeInput(z.sys.Mouse);
          },
          onMouseMove(A) {
            if (!gA.sys.isState(lA.Play)) return;
            const t = { x: A.clientX, y: A.clientY },
              e = z.sys.checkAngle(gA.sys.session, t);
            this.last !== e && ((this.last = e), z.sys.routeInput(e, !0));
          },
          onContextMenu(A) {
            A.preventDefault(), z.sys.changeInput(z.sys.Mouse), z.sys.routeInput(K.Boost);
          }
        },
        x = {
          setup() {
            window.addEventListener("touchstart", (A) => x.onTouchStart(A)),
              window.addEventListener("touchmove", (A) => x.onTouchMove(A)),
              window.addEventListener("touchend", (A) => x.onTouchEnd(A));
          },
          reset() {
            (this.last = void 0), (this.swipe = 0), (this.touch = { down: { x: 0, y: 0 }, move: { x: 0, y: 0 } });
          },
          onTouchStart(A) {
            if (!this.ignored(A) && (z.sys.changeInput(z.sys.Touch), A.targetTouches)) {
              const t = A.targetTouches[0];
              (this.last = void 0),
                (this.swipe = Date.now()),
                (this.touch = { down: { x: t.clientX, y: t.clientY }, move: { x: t.clientX, y: t.clientY } });
            }
          },
          onTouchMove(A) {
            if (this.ignored(A)) return;
            const t = A.targetTouches[0],
              e = Date.now() - this.swipe > 80;
            if (((this.touch.move = { x: t.clientX, y: t.clientY }), gA.sys.isState(lA.Play) && e)) {
              const A = z.sys.checkAngle(gA.sys.session, this.touch.move);
              this.last !== A && ((this.last = A), z.sys.routeInput(A, !0));
            }
          },
          onTouchEnd(A) {
            if (this.ignored(A)) return;
            const t = this.touch.move.x - this.touch.down.x,
              e = this.touch.move.y - this.touch.down.y;
            let s;
            this.last = void 0;
            let n = !1;
            Math.abs(t) < 10 && Math.abs(e) < 10
              ? ((n = !0), (s = z.sys.checkAngle(gA.sys.session, this.touch.down)))
              : Date.now() - this.swipe <= 400 && (s = z.sys.checkAngle(this.touch.down, this.touch.move)),
              s && !gA.sys.isState(lA.Menu) && (z.sys.routeInput(s, n), z.sys.checkCheatCode(s));
          },
          ignored: (A) => !!A.target.closest("button") || (A.cancelable && A.preventDefault(), !1)
        },
        v = {
          setup() {
            window.addEventListener("gamepadconnected", (A) => v.onConnect(A)),
              window.addEventListener("gamepaddisconnected", (A) => v.onDisconnect(A)),
              (this.list = []),
              (this.button = [
                "a",
                "b",
                "x",
                "y",
                "lb",
                "rb",
                "lt",
                "rt",
                "select",
                "start",
                "lstick",
                "rstick",
                "up",
                "down",
                "left",
                "right",
                "home",
                "touchpad"
              ]),
              (this.event = {
                default: { ms: 0, weak: 0.4, strong: 0.4 },
                tiny: { ms: 100, weak: 0.05, strong: 0 },
                small: { ms: 100, weak: 0.15, strong: 0 },
                big: { ms: 600, weak: 0.5, strong: 0 },
                boost: { ms: 3e3, weak: 0, strong: 0.25 },
                pickup: { ms: 200, weak: 0.2, strong: 0 },
                air: { ms: 200, weak: 0, strong: 0.15 },
                slow: { ms: 400, weak: 0, strong: 0.15 },
                crash: { ms: 300, weak: 0.4, strong: 0.4 }
              }),
              this.vibrate(),
              (this.linked = { index: void 0, pad: void 0, pressed: {} });
          },
          reset() {
            this.last = void 0;
          },
          vibrate(A = "default") {
            (this.current = this.event[A]), (this.timer = this.current.ms);
          },
          applyVibration() {
            if (z.sys.isInput(z.sys.Gamepad)) {
              const A = this.timer / this.current.ms;
              this.linked.pad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: this.current.ms,
                weakMagnitude: A * this.current.weak,
                strongMagnitude: A * this.current.strong
              });
            }
          },
          onConnect(A) {
            v.list.push(A.gamepad.index);
          },
          onDisconnect(A) {
            const t = v.list.indexOf(A.gamepad.index);
            t > -1 && v.list.splice(t, 1),
              (this.linked = { index: void 0, pad: void 0, pressed: {} }),
              this.reset(),
              z.sys.isInput(z.sys.Gamepad) && z.sys.changeInput(z.sys.Keys);
          },
          setGamepad(A, t) {
            (this.linked = { index: A, pad: t, pressed: {} }), z.sys.changeInput(z.sys.Gamepad);
          },
          update() {
            if (!(this.list.length <= 0))
              if (void 0 === this.linked.index)
                this.list.forEach((A) => {
                  const t = navigator.getGamepads()[A];
                  if (t) {
                    const e = this.checkJoysticks(t),
                      s = this.checkButtons(t);
                    (e || s) && this.setGamepad(A, t);
                  }
                });
              else {
                this.timer > 0 && this.updateVibrations();
                const A = navigator.getGamepads()[this.linked.index];
                if (A) {
                  const t = this.checkJoysticks(A),
                    e = this.checkButtons(A);
                  this.routeJoystick(t), this.routeButton(e);
                }
              }
          },
          updateVibrations() {
            this.applyVibration(), (this.timer -= 1e3 * gA.sys.game.time.loop), this.timer <= 0 && this.vibrate();
          },
          checkJoysticks(A) {
            const t = 0.5,
              e = A.axes[0] > t || A.axes[2] > t,
              s = A.axes[0] < -0.5 || A.axes[2] < -0.5,
              n = A.axes[1] > t || A.axes[3] > t,
              i = A.axes[1] < -0.5 || A.axes[3] < -0.5;
            let r;
            return (
              (e || s || i || n) &&
                (r =
                  !n || e || s
                    ? !s || i || n
                      ? !e || i || n
                        ? s && n
                          ? K.DownLeft
                          : e && n
                            ? K.DownRight
                            : K.Up
                        : K.Right
                      : K.Left
                    : K.Down),
              r
            );
          },
          routeJoystick(A) {
            this.last !== A && ((this.last = A), A && (z.sys.routeInput(A, !0), z.sys.changeInput(z.sys.Gamepad)));
          },
          checkButtons(A) {
            let t;
            for (let s = 0; s < A.buttons.length; s++)
              if ("object" == typeof (e = A.buttons[s]) ? e.pressed : 1 === e) {
                if (this.linked.pressed[this.button[s]]) return;
                switch (((this.linked.pressed[this.button[s]] = !0), this.button[s])) {
                  case "a":
                    t = K.Click;
                    break;
                  case "b":
                    t = K.Back;
                    break;
                  case "lb":
                  case "left":
                    t = K.Left;
                    break;
                  case "rb":
                  case "right":
                    t = K.Right;
                    break;
                  case "lt":
                  case "rt":
                    t = K.Boost;
                    break;
                  case "up":
                    t = K.Up;
                    break;
                  case "down":
                    t = K.Down;
                    break;
                  case "select":
                  case "start":
                  case "home":
                  case "touchpad":
                    t = K.Settings;
                }
              } else this.linked.pressed[this.button[s]] = !1;
            var e;
            return t;
          },
          routeButton(A) {
            A && (z.sys.routeInput(A), z.sys.checkCheatCode(A), z.sys.changeInput(z.sys.Gamepad));
          }
        },
        E = "recordActions";
      var D, Q, k;
      !(function (A) {
        (A[(A.CUSTOMIZED_CHARACTER = 0)] = "CUSTOMIZED_CHARACTER"), (A[(A.SHARE = 1)] = "SHARE");
      })(D || (D = {})),
        (function (A) {
          (A[(A.Surf = 0)] = "Surf"),
            (A[(A.Classic = 1)] = "Classic"),
            (A[(A.Ski = 2)] = "Ski"),
            (A[(A.Bike = 3)] = "Bike"),
            (A[(A.Seasonal = 4)] = "Seasonal"),
            (A[(A.Special_Event = 5)] = "Special_Event"),
            (A[(A.New_Theme = 6)] = "New_Theme");
        })(Q || (Q = {})),
        (function (A) {
          (A[(A.Classic = 0)] = "Classic"),
            (A[(A.Buoy = 1)] = "Buoy"),
            (A[(A.Speed = 2)] = "Speed"),
            (A[(A.Collector = 3)] = "Collector");
        })(k || (k = {}));
      const I = r(),
        M = {
          setup() {
            (this.flyout = y.create("div", document.body, "flyout-share", "modal")),
              y.classAdd(this.flyout, "flyout"),
              (this.button = void 0),
              (this.close = void 0);
            const A = y.create("div", this.flyout, void 0, "modal-row"),
              t = I.getString("gameShare");
            y.create("span", A, void 0, "flyout-title", t),
              O.sys.buildCloseButton(M, A),
              y.create("div", this.flyout, void 0, "flyout-rule");
            const e = y.create("div", this.flyout, void 0, "modal-row"),
              s = o() ? I.getString("shareMobile") : I.getString("shareCopy"),
              n = o() ? "share" : "copylink",
              i = I.getString("shareCopySuccess"),
              r = y.createIconButton(e, n, void 0, s);
            r.setAttribute("data-menu", "2"),
              y.classAdd(r, "btn-full"),
              (this.shareString = y.create("span", r, void 0, void 0, s)),
              o()
                ? y.clickEvent(
                    r,
                    function () {
                      c(E, D.SHARE);
                    },
                    !0
                  )
                : y.clickEvent(
                    r,
                    function () {
                      var A;
                      c(E, D.SHARE),
                        (A = I.getString("shareLink")),
                        navigator.clipboard.writeText(A),
                        M.updateShare(i),
                        setTimeout(function () {
                          M.updateShare(s);
                        }, 2e3);
                    },
                    !0
                  ),
              y.hide(this.flyout);
          },
          updateShare(A) {
            this.shareString.textContent = A;
          }
        },
        H = r(),
        F = {
          setup() {
            (this.flyout = y.create("div", document.body, "dialog-credits", "modal")),
              y.classAdd(this.flyout, "dialog"),
              (this.button = void 0);
            const A = y.create("div", this.flyout, void 0, "modal-row"),
              t = H.getString("settingsCredits");
            y.create("span", A, void 0, "flyout-title", t),
              O.sys.buildCloseButton(F, A),
              this.addNames("settingsCreditsDesign", "Parker Young, William Devereux, Scott Porterfield, Michael Diaz"),
              this.addNames(
                "settingsCreditsEngineering",
                "Parker Young, Connor Smith, Steven Lengieza, Ryan Ata, Jose Luis Teran, Adina Shanholtz, Ray Rivers, 陈嘉钰, 傅远, 胡雨阳, 郑俊豪"
              ),
              this.addNames(
                "settingsSpecialThanks",
                "Jonathan Merrin, Patrick Evan Little, Charles Duval, Addison Kaufmann, Rachel Weil, Joseph Oak, Amanda Velasco Gallardo, Ramya Challa, Chris Pirih"
              ),
              this.addNames("settingsModifiedBy", "iamEvanYT, yell0wsuit");
            const e = y.create("div", this.flyout, void 0, "modal-row"),
              s = H.getString("actionClose"),
              n = y.createTextButton(e, s, "btn-half");
            n.setAttribute("data-menu", "2"),
              y.clickEvent(
                n,
                function () {
                  O.sys.toggleFlyout(F);
                },
                !0
              ),
              y.hide(this.flyout);
          },
          addNames(A, t) {
            const e = y.create("div", this.flyout, void 0, "modal-col"),
              s = H.getString(A);
            y.create("span", e, void 0, "flyout-header", s), y.create("span", e, void 0, "flyout-text", t);
          }
        },
        S = r(),
        U = {
          setup() {
            (this.flyout = y.create("div", document.body, "dialog-reset", "modal")),
              y.classAdd(this.flyout, "dialog"),
              (this.button = void 0);
            const A = y.create("div", this.flyout, void 0, "modal-row"),
              t = S.getString("settingsResetAllStatsDialogTitle");
            y.create("span", A, void 0, "flyout-title", t), O.sys.buildCloseButton(U, A);
            const e = y.create("div", this.flyout, void 0, "modal-col"),
              s = S.getString("settingsResetAllStatsDialogText");
            y.create("span", e, void 0, "flyout-text", s);
            const n = y.create("div", this.flyout, void 0, "modal-row"),
              i = S.getString("settingsResetAllStats"),
              r = y.createTextButton(n, i, "btn-half");
            r.setAttribute("data-menu", "2"),
              y.clickEvent(
                r,
                function () {
                  d.resetData(), P.sys.updateTheme(), L.updateAllToggles(), dA.sys.changeState(lA.Menu);
                },
                !0
              );
            const a = S.getString("actionCancel"),
              o = y.createTextButton(n, a, "btn-half");
            o.setAttribute("data-menu", "2"),
              y.clickEvent(
                o,
                function () {
                  O.sys.toggleFlyout(U);
                },
                !0
              ),
              y.hide(this.flyout);
          }
        },
        N = r(),
        L = {
          setup() {
            (this.flyout = y.create("div", document.body, "flyout-settings", "modal")),
              y.classAdd(this.flyout, "flyout"),
              (this.button = void 0);
            const A = y.create("div", this.flyout, void 0, "modal-row"),
              t = N.getString("gameSettings");
            y.create("span", A, void 0, "flyout-title", t),
              O.sys.buildCloseButton(L, A),
              y.create("div", this.flyout, void 0, "flyout-rule");
            const e = N.getString("settingsHighVisiblityToggle");
            this.buildToggle(e, "toggle-hitbox", this.flyout, 2);
            const s = N.getString("settingsReducedSpeedToggle");
            this.buildToggle(s, "toggle-speed", this.flyout, 3);
            const n = N.getString("settingsReducedMotionToggle");
            this.buildToggle(n, "toggle-motion", this.flyout, 4), y.create("div", this.flyout, void 0, "flyout-rule");
            const i = y.create("div", this.flyout, void 0, "modal-row"),
              r = N.getString("settingsResetAllStats"),
              a = y.createTextButton(i, r, "btn-small");
            a.setAttribute("data-menu", "5"),
              y.clickEvent(a, function () {
                O.sys.toggleFlyout(U);
              });
            const o = N.getString("settingsCredits"),
              c = y.createTextButton(i, o, "btn-small");
            c.setAttribute("data-menu", "5"),
              y.clickEvent(c, function () {
                O.sys.toggleFlyout(F);
              }),
              y.hide(this.flyout);
          },
          buildToggle(A, t, e, s) {
            const n = y.create("div", e, void 0, "modal-row");
            y.create("span", n, void 0, "input-title", A), y.create("span", n, void 0, "input-label");
            const i = y.createButton(n, A);
            i.setAttribute("data-menu", s.toString()), y.classDel(i, "btn"), y.classAdd(i, "toggle"), (i.id = t);
            const r = y.create("span", i, void 0, "toggle-display");
            return (
              this.updateToggle(i),
              y.clickEvent(i, function () {
                L.changeToggle(i), L.updateToggle(i);
              }),
              r
            );
          },
          changeToggle(A) {
            switch (A.id) {
              case "toggle-hitbox":
                gA.sys.toggleHitbox();
                break;
              case "toggle-speed":
                gA.sys.toggleSpeed();
                break;
              case "toggle-motion":
                gA.sys.toggleMotion();
            }
            gA.sys.saveSessionSettings();
          },
          updateToggle(A) {
            let t;
            switch (A.id) {
              case "toggle-hitbox":
                t = gA.sys.checkHitbox();
                break;
              case "toggle-speed":
                t = gA.sys.checkSpeed();
                break;
              case "toggle-motion":
                t = gA.sys.checkMotion();
            }
            A.setAttribute("aria-pressed", t);
            const e = t ? "settingsOn" : "settingsOff";
            (A.previousElementSibling.innerText = N.getString(e)), dA.sys.render();
          },
          updateAllToggles() {
            this.updateToggle(document.querySelector("#toggle-hitbox")),
              this.updateToggle(document.querySelector("#toggle-speed")),
              this.updateToggle(document.querySelector("#toggle-motion"));
          }
        },
        Y = r();
      class O {
        constructor() {
          if (O.sys) return O.sys;
          (O.sys = this), (this.Share = M), (this.Settings = L), (this.Credits = F), (this.Reset = U);
        }
        setup() {
          (this.active = void 0),
            (this.list = [this.Share, this.Settings, this.Credits, this.Reset]),
            this.list.forEach((A) => {
              A.setup();
            }),
            (this.overlay = y.create("div", cA.sys.ui, "ui-overlay")),
            y.hide(this.overlay);
        }
        overlayScreen() {
          this.isFlyoutOpen() ? y.show(this.overlay) : y.hide(this.overlay);
        }
        toggleFlyout(A = L) {
          this.isOpen(A)
            ? this.closeFlyout(A)
            : (this.closeAllFlyouts(), gA.sys.isState(lA.Play) && dA.sys.changeState(lA.Pause), this.openFlyout(A));
        }
        isOpen(A) {
          return null === A.flyout.getAttribute("hidden");
        }
        isFlyoutOpen() {
          const A = this.isOpen(this.Share),
            t = this.isOpen(this.Settings),
            e = this.isOpen(this.Credits),
            s = this.isOpen(this.Reset);
          return !!(A || t || e || s);
        }
        closeAllFlyouts() {
          this.list.forEach((A) => {
            this.isOpen(A) && this.closeFlyout(A);
          });
        }
        openFlyout(A) {
          this.setupHideOnClick(A.flyout),
            y.show(A.flyout),
            this.overlayScreen(),
            y.focusButton(A.close),
            (this.active = A),
            void 0 !== A.button && A.button.setAttribute("aria-expanded", "true");
        }
        closeFlyout(A) {
          y.hide(A.flyout),
            this.overlayScreen(),
            (this.active = void 0),
            void 0 !== A.button && (y.focusButton(A.button), A.button.setAttribute("aria-expanded", "false"));
        }
        setupHideOnClick(A) {
          const t = (t) => {
              A.contains(t.target) || null !== A.getAttribute("hidden") || (O.sys.closeAllFlyouts(), e());
            },
            e = () => {
              document.removeEventListener("click", t);
            };
          document.addEventListener("click", t);
        }
        focusFlyoutElement(A) {
          const t = Array.from(this.active.flyout.querySelectorAll("button")),
            e = document.activeElement;
          A.shiftKey || t.indexOf(e) + 1 !== t.length
            ? A.shiftKey && 0 === t.indexOf(e) && (y.focusButton(t[t.length - 1]), A.preventDefault())
            : (y.focusButton(t[0]), A.preventDefault());
        }
        buildCloseButton(A, t) {
          const e = Y.getString("actionClose");
          (A.close = y.createIconButton(t, "close", void 0, e)),
            y.classAdd(A.close, "dismiss"),
            A.close.setAttribute("data-menu", "1"),
            y.clickEvent(A.close, function () {
              O.sys.closeAllFlyouts();
            });
        }
      }
      O.sys = null;
      class G {
        constructor() {
          if (G.sys) return G.sys;
          (G.sys = this), this.defineLegend(), this.defineClusters();
        }
        defineLegend() {
          (this.legend = {
            wall: {
              sw: ["sw"],
              s: ["s"],
              se: ["se"],
              w: ["w"],
              e: ["e"],
              n: ["n"],
              b: ["b"],
              f1: ["f1"],
              f2: ["f2"],
              f3: ["f3"],
              f: ["f1", "f2", "f3"]
            },
            snag: {
              b1: ["side1", "side2"],
              b2: ["hurdle1", "hurdle2"],
              b3: ["vehicle1", "vehicle2"],
              b4: ["common1", "common2", "common3", "common4", "common5"],
              b5: ["warn1"],
              b6: ["isle1", "isle2", "isle3"],
              b7: ["special1", "special2", "special3", "special4"]
            },
            snagsml: {
              c1: ["debris1", "debris2"],
              c2: ["beacon1"],
              c3: ["point1"],
              c4: ["rare1"],
              c5: ["decor1", "decor2", "decor3", "decor4"]
            },
            snagtall: { t1: ["tall1", "tall2"], t2: ["tall3"], t3: ["tall4", "tall5", "tall6", "tall7", "tall8"] },
            spin: { o: ["spin1", "spin2", "spin3", "spin4", "spin5", "spin6"] },
            ramp: { i1: ["ramp"] },
            lure: { i2: ["lure"] },
            boost: { i3: ["boost"] },
            life: { i4: ["life"] },
            coin: { i5: ["coin"] },
            friend: { i6: ["friend"] },
            ambient: { a: ["ambient1", "ambient2", "ambient3"] },
            slow: { s1: ["slow1", "slow2", "slow3"] },
            bump: { s2: ["bump1", "bump2", "bump3"] },
            slowbig: { s3: ["slowbig"] },
            bumpbig: { s4: ["bumpbig"] },
            spiral: { s5: ["spiral"] },
            block: { m1: ["block1", "block2", "block3"] },
            blockbig: { m2: ["blockbig1", "blockbig2", "blockbig3"] },
            marker: { z1: ["default"] },
            guide: { z2: ["default"] },
            gate: { z3: [""] },
            trigger: { z4: [""] },
            finish: { f1: ["default"] },
            checkpoint: { p1: ["default"] }
          }),
            (this.group = {
              tiny: [
                "tiny1",
                "tiny2",
                "tiny3",
                "tiny4",
                "tiny5",
                "tiny6",
                "tiny7",
                "tiny8",
                "tiny9",
                "tiny10",
                "tiny11",
                "tiny12",
                "tiny13",
                "tiny14",
                "tiny15",
                "tiny16",
                "tiny17",
                "tiny18"
              ],
              small: [
                "small1",
                "small2",
                "small3",
                "small4",
                "small5",
                "small6",
                "small7",
                "small8",
                "small9",
                "small10",
                "small11",
                "small12",
                "small13",
                "small14",
                "small15",
                "small16"
              ],
              medium: [
                "medium1",
                "medium2",
                "medium3",
                "medium4",
                "medium5",
                "medium6",
                "medium7",
                "medium8",
                "medium9"
              ],
              large: ["large1", "large2", "large3", "large4", "large5", "large6"]
            });
        }
        defineClusters() {
          (this.spawnSingle = {
            snag: [
              "side1",
              "side2",
              "hurdle1",
              "hurdle2",
              "common1",
              "common2",
              "common3",
              "common4",
              "common5",
              "isle1",
              "isle2",
              "isle3",
              "vehicle1",
              "vehicle2"
            ],
            ambient: ["ambient1", "ambient2", "ambient3"],
            slow: ["slow1", "slow2", "slow3"],
            bump: ["bump1", "bump2", "bump3"],
            slowbig: ["slowbig"],
            bumpbig: ["bumpbig"],
            spiral: ["spiral"],
            block: ["block1", "block2", "block3"],
            snagsml: ["rare1", "point1", "decor1", "decor2", "decor3", "decor4"],
            snagtall: ["tall3", "tall4", "tall5", "tall6", "tall7", "tall8"],
            spin: ["spin1", "spin2", "spin3", "spin4", "spin5", "spin6"]
          }),
            (this.library = {
              allNormal: {
                large1: {
                  snagsml: [
                    [-6, 1, "c2"],
                    [18, 12, "c1"]
                  ],
                  slow: [
                    [23, 8],
                    [-26, 6],
                    [22, 16],
                    [-23, 20]
                  ],
                  snag: [
                    [-19, 17, "b6"],
                    [-11, 17, "b1"],
                    [7, 8, "b1"],
                    [19, 4, "b6"]
                  ],
                  bump: [
                    [18, 10],
                    [-12, 4],
                    [-15, 18],
                    [-5, 11],
                    [3, 9],
                    [-19, 7]
                  ],
                  snagtall: [
                    [-16, 6, "t1"],
                    [17, 5, "t3"],
                    [-22, 8, "t3"]
                  ],
                  bumpbig: [[11, 15]],
                  wall: [
                    [-6, 18, "b"],
                    [-6, 14, "n"],
                    [9, 12, "f"],
                    [13, 12, "se"],
                    [5, 12, "sw"],
                    [-8, 8, "se"],
                    [13, 8, "n"],
                    [-12, 8, "f"]
                  ],
                  blockbig: [
                    [-16, 12],
                    [10, 3]
                  ],
                  slowbig: [[7, 21]]
                },
                large2: {
                  snag: [
                    [14, 3, "b4"],
                    [-9, 3, "b2"],
                    [-1, 4, "b4"],
                    [-13, 12, "b1"],
                    [8, 18, "b2"],
                    [-3, 2, "b6"],
                    [17, 5, "b4"],
                    [18, 1, "b4"]
                  ],
                  snagtall: [
                    [2, 6, "t3"],
                    [-7, 14, "t1"]
                  ],
                  bump: [
                    [-3, 12],
                    [-15, 14],
                    [6, 15],
                    [4, 20],
                    [-4, 22],
                    [15, 2]
                  ],
                  slow: [
                    [1, 2],
                    [-22, 16],
                    [14, 17],
                    [-12, 23]
                  ],
                  slowbig: [
                    [-15, 6],
                    [20, 10]
                  ],
                  wall: [
                    [1, 12, "w"],
                    [5, 12, "f"],
                    [9, 12, "se"],
                    [-3, 16, "f"],
                    [1, 16, "e"],
                    [1, 20, "b"]
                  ],
                  bumpbig: [[-7, 18]],
                  blockbig: [[-6, 8]]
                },
                large3: {
                  snagsml: [
                    [12, 11, "c1"],
                    [11, 2, "c2"],
                    [-15, 10, "c1"]
                  ],
                  bumpbig: [
                    [-6, 3],
                    [-14, 7]
                  ],
                  snag: [
                    [-10, 3, "b4"],
                    [17, 4, "b4"],
                    [-5, 6, "b4"],
                    [20, 7, "b4"],
                    [-3, 8, "b4"],
                    [-10, 8, "b1"],
                    [11, 8, "b4"],
                    [-19, 9, "b4"],
                    [-6, 11, "b4"],
                    [8, 12, "b4"],
                    [5, 14, "b4"],
                    [-5, 14, "b2"],
                    [-11, 18, "b4"],
                    [9, 18, "b2"],
                    [14, 21, "b4"]
                  ],
                  slow: [
                    [-22, 3],
                    [23, 3],
                    [-2, 22]
                  ],
                  bump: [
                    [16, 8],
                    [-9, 16],
                    [5, 19],
                    [7, 10]
                  ],
                  slowbig: [
                    [-18, 14],
                    [17, 15]
                  ]
                },
                large4: {
                  bumpbig: [[-2, 16]],
                  snagsml: [[13, 16, "c1"]],
                  bump: [
                    [3, 8],
                    [14, 10],
                    [-14, 10]
                  ],
                  snag: [
                    [-8, 14, "b6"],
                    [9, 1, "b4"],
                    [-9, 2, "b4"],
                    [-12, 4, "b4"],
                    [13, 6, "b4"],
                    [11, 8, "b4"],
                    [12, 12, "b1"],
                    [10, 15, "b4"],
                    [-3, 5, "b6"],
                    [-10, 17, "b2"]
                  ],
                  slow: [
                    [-4, 5],
                    [-17, 8],
                    [17, 15],
                    [10, 21],
                    [-4, 22]
                  ],
                  blockbig: [[-4, 10]],
                  slowbig: [[-15, 17]],
                  snagtall: [
                    [-9, 6, "t3"],
                    [-13, 12, "t3"]
                  ]
                },
                large5: {
                  snagsml: [
                    [-17, 5, "c1"],
                    [5, 16, "c1"]
                  ],
                  snagtall: [
                    [-1, 8, "t3"],
                    [14, 7, "t3"],
                    [-4, 12, "t1"]
                  ],
                  snag: [
                    [-2, 17, "b1"],
                    [10, 10, "b1"],
                    [-15, 2, "b4"],
                    [1, 2, "b6"],
                    [-13, 4, "b4"]
                  ],
                  slowbig: [[-6, 21]],
                  wall: [
                    [4, 14, "s"],
                    [8, 14, "se"],
                    [0, 14, "f"],
                    [-8, 14, "sw"],
                    [4, 10, "n"]
                  ],
                  blockbig: [[7, 5]],
                  slow: [
                    [14, 17],
                    [-17, 13],
                    [-9, 9],
                    [19, 5]
                  ],
                  bump: [
                    [-10, 15],
                    [-3, 5],
                    [-9, 3],
                    [14, 12]
                  ]
                },
                large6: {
                  snagsml: [
                    [-18, 4, "c1"],
                    [-5, 8, "c1"]
                  ],
                  snag: [
                    [10, 4, "b2"],
                    [12, 11, "b6"],
                    [-12, 11, "b6"],
                    [0, 22, "b1"],
                    [-3, 19, "b4"],
                    [9, 13, "b4"],
                    [19, 11, "b4"],
                    [-19, 9, "b4"],
                    [16, 8, "b1"],
                    [6, 6, "b4"],
                    [-15, 6, "b3"],
                    [-6, 4, "b4"],
                    [-10, 2, "b4"],
                    [-10, 14, "b1"]
                  ],
                  slowbig: [
                    [14, 21],
                    [-15, 19]
                  ],
                  bumpbig: [[10, 8]],
                  bump: [
                    [-3, 23],
                    [6, 16],
                    [16, 13],
                    [-14, 12],
                    [20, 6],
                    [-4, 4],
                    [-12, 4],
                    [-7, 7]
                  ],
                  slow: [
                    [-2, 15],
                    [25, 8],
                    [-24, 6],
                    [5, 3]
                  ],
                  spin: [
                    [5, 12],
                    [-3, 1]
                  ],
                  snagtall: [
                    [-10, 7, "t3"],
                    [10, 8, "t3"]
                  ]
                },
                medium1: {
                  snag: [
                    [4, 1, "b1"],
                    [3, 10, "b4"],
                    [-10, 8, "b6"],
                    [-7, 12, "b1"],
                    [7, 16, "b2"]
                  ],
                  snagtall: [[-8, 4, "t3"]],
                  slow: [[-3, 2]],
                  slowbig: [[3, 6]],
                  wall: [
                    [-3, 10, "n"],
                    [1, 14, "f"],
                    [5, 14, "se"],
                    [-3, 14, "sw"]
                  ],
                  bump: [
                    [-11, 10],
                    [9, 14]
                  ],
                  snagsml: [[7, 1, "c1"]]
                },
                medium2: {
                  snag: [
                    [8, 5, "b6"],
                    [-5, 15, "b4"],
                    [7, 14, "b1"],
                    [5, 3, "b2"],
                    [-10, 11, "b4"],
                    [0, 9, "b1"],
                    [-4, 7, "b4"],
                    [-11, 4, "b4"],
                    [-7, 3, "b4"],
                    [-11, 15, "b4"]
                  ],
                  snagtall: [
                    [10, 1, "t3"],
                    [-9, 5, "t3"]
                  ],
                  slow: [
                    [-2, 14],
                    [10, 10]
                  ],
                  snagsml: [[-8, 13, "c1"]],
                  bump: [
                    [-13, 12],
                    [-3, 4],
                    [4, 14]
                  ]
                },
                medium3: {
                  slow: [
                    [15, 8],
                    [-1, 16],
                    [-13, 14]
                  ],
                  snag: [
                    [-9, 18, "b4"],
                    [5, 17, "b2"],
                    [2, 10, "b4"],
                    [-8, 10, "b6"],
                    [9, 16, "b6"]
                  ],
                  snagtall: [
                    [6, 0, "t3"],
                    [-11, 7, "t3"],
                    [0, 4, "t1"]
                  ],
                  spin: [
                    [13, 3],
                    [13, 13],
                    [11, 8]
                  ],
                  bump: [
                    [-7, 4],
                    [4, 9]
                  ],
                  wall: [
                    [-9, 6, "b"],
                    [8, 6, "e"],
                    [4, 6, "f"],
                    [8, 10, "n"],
                    [4, 14, "sw"],
                    [8, 14, "se"]
                  ],
                  snagsml: [[-7, 16, "c1"]]
                },
                medium4: {
                  snag: [
                    [5, 9, "b2"],
                    [-3, 4, "b4"],
                    [5, 5, "b4"],
                    [3, 7, "b1"],
                    [-3, 13, "b4"],
                    [-8, 5, "b6"]
                  ],
                  snagtall: [[-6, 6, "t3"]],
                  slow: [
                    [3, 2],
                    [-8, 12],
                    [6, 13]
                  ],
                  bump: [
                    [10, 6],
                    [-1, 11]
                  ]
                },
                medium5: {
                  slowbig: [[-6, 17]],
                  snagsml: [[4, 15, "c1"]],
                  blockbig: [[-5, 6]],
                  bump: [
                    [8, 6],
                    [-11, 9],
                    [9, 13]
                  ],
                  wall: [
                    [-2, 12, "sw"],
                    [2, 12, "f"]
                  ],
                  snagtall: [
                    [1, 2, "t3"],
                    [6, 10, "t1"],
                    [-6, 9, "t3"]
                  ],
                  snag: [
                    [-10, 13, "b4"],
                    [6, 2, "b4"],
                    [3, 7, "b6"]
                  ],
                  slow: [
                    [-14, 3],
                    [13, 10]
                  ]
                },
                medium6: {
                  bump: [
                    [-10, 12],
                    [9, 2],
                    [-1, 2],
                    [9, 15],
                    [-10, 5],
                    [0, 9]
                  ],
                  snag: [
                    [-6, 12, "b2"],
                    [10, 12, "b1"]
                  ],
                  wall: [
                    [-10, 9, "sw"],
                    [-6, 5, "w"],
                    [6, 9, "w"],
                    [10, 5, "e"],
                    [-2, 5, "s"],
                    [6, 5, "s"],
                    [10, 9, "se"],
                    [6, 13, "b"],
                    [-6, 9, "se"]
                  ],
                  snagsml: [
                    [5, 2, "c1"],
                    [-1, 11, "c1"]
                  ],
                  snagtall: [[2, 3, "t1"]],
                  bumpbig: [[-2, 14]]
                },
                medium7: {
                  snag: [
                    [-11, 11, "b6"],
                    [11, 3, "b4"]
                  ],
                  snagtall: [
                    [-6, 3, "t3"],
                    [-12, 7, "t3"]
                  ],
                  slow: [[3, 14]],
                  blockbig: [[-4, 8]],
                  bump: [[7, 4]],
                  slowbig: [
                    [11, 9],
                    [-4, 4]
                  ],
                  spin: [[2, 1]]
                },
                medium8: {
                  snag: [
                    [8, 2, "b4"],
                    [-9, 2, "b4"],
                    [-8, 4, "b2"],
                    [1, 4, "b4"],
                    [3, 6, "b4"],
                    [-10, 7, "b4"],
                    [0, 10, "b1"]
                  ],
                  slow: [[-13, 4]],
                  bump: [[-3, 4]],
                  slowbig: [[7, 9]]
                },
                medium9: {
                  spin: [[2, 1]],
                  bump: [
                    [12, 3],
                    [-8, 7],
                    [8, 8],
                    [-2, 10]
                  ],
                  block: [
                    [-7, 2],
                    [7, 4]
                  ],
                  snag: [
                    [-4, 6, "b4"],
                    [11, 7, "b4"],
                    [-10, 9, "b4"],
                    [-7, 11, "b4"]
                  ]
                },
                small1: {
                  slow: [[7, 3]],
                  snag: [
                    [-6, 5, "b4"],
                    [-2, 9, "b3"]
                  ],
                  bump: [
                    [-4, 3],
                    [4, 9]
                  ],
                  block: [[1, 4]],
                  snagsml: [[7, 7, "c1"]],
                  snagtall: [[-8, 6, "t2"]]
                },
                small2: {
                  slow: [[7, 3]],
                  snag: [
                    [-6, 5, "b4"],
                    [-2, 9, "b3"]
                  ],
                  bump: [
                    [-4, 3],
                    [4, 9]
                  ],
                  block: [[1, 4]],
                  snagsml: [[7, 7, "c1"]],
                  snagtall: [[-8, 6, "t2"]]
                },
                small3: {
                  bump: [
                    [-7, 5],
                    [3, 3]
                  ],
                  snag: [[0, 9, "b6"]],
                  block: [[-1, 4]],
                  snagtall: [[4, 6, "t3"]],
                  slow: [[7, 4]],
                  slowbig: [[-6, 9]]
                },
                small4: {
                  snag: [
                    [-6, 4, "b2"],
                    [1, 4, "b1"],
                    [8, 3, "b4"],
                    [-1, 6, "b4"]
                  ],
                  slowbig: [[-5, 10]],
                  slow: [[9, 9]],
                  bump: [[4, 6]],
                  bumpbig: [[-2, 2]],
                  spin: [[-11, 3]]
                },
                small5: {
                  bump: [
                    [-8, 5],
                    [5, 3]
                  ],
                  slow: [[-11, 10]],
                  wall: [[-6, 8, "b"]],
                  snag: [[8, 4, "b4"]],
                  snagtall: [[-2, 5, "t3"]],
                  bumpbig: [[2, 10]]
                },
                small6: {
                  slow: [
                    [-2, 2],
                    [2, 8],
                    [-4, 11]
                  ],
                  snag: [
                    [6, 2, "b4"],
                    [-7, 3, "b4"],
                    [-4, 4, "b1"],
                    [4, 5, "b4"],
                    [8, 7, "b4"],
                    [-6, 7, "b4"],
                    [3, 11, "b2"]
                  ],
                  bump: [
                    [10, 4],
                    [-10, 6]
                  ]
                },
                small7: {
                  slow: [
                    [-4, 2],
                    [6, 6],
                    [-8, 6],
                    [-2, 8],
                    [2, 10]
                  ],
                  snag: [
                    [-8, 2, "b4"],
                    [5, 2, "b4"],
                    [0, 5, "b4"],
                    [6, 8, "b4"],
                    [-6, 9, "b4"]
                  ]
                },
                small8: {
                  snag: [
                    [-2, 2, "b4"],
                    [-4, 6, "b1"],
                    [7, 8, "b4"]
                  ],
                  bump: [
                    [6, 4],
                    [-8, 8]
                  ],
                  wall: [
                    [2, 6, "n"],
                    [2, 10, "se"],
                    [-2, 10, "sw"]
                  ]
                },
                small9: {
                  wall: [
                    [2, 2, "n"],
                    [2, 6, "se"],
                    [-6, 6, "w"],
                    [-6, 10, "sw"],
                    [-2, 10, "s"],
                    [2, 10, "f"],
                    [6, 10, "se"]
                  ],
                  snag: [
                    [-4, 2, "b4"],
                    [8, 6, "b4"]
                  ],
                  slow: [
                    [10, 2],
                    [-10, 8]
                  ],
                  bump: [
                    [-8, 3],
                    [10, 11]
                  ],
                  snagtall: [[-2, 4, "t1"]],
                  slowbig: [[-1, 14]]
                },
                small10: {
                  snag: [
                    [2, 2, "b4"],
                    [6, 4, "b4"],
                    [-3, 4, "b4"],
                    [1, 6, "b4"],
                    [-3, 8, "b4"],
                    [2, 9, "b4"]
                  ],
                  slow: [
                    [-1, 2],
                    [-7, 9]
                  ],
                  bump: [
                    [-6, 4],
                    [6, 8]
                  ]
                },
                small11: {
                  snag: [
                    [-6, 2, "b4"],
                    [2, 2, "b4"],
                    [-7, 8, "b4"],
                    [5, 8, "b4"]
                  ],
                  wall: [
                    [-4, 6, "sw"],
                    [0, 6, "f"],
                    [4, 6, "se"]
                  ],
                  bump: [[0, 8]]
                },
                small12: {
                  snag: [
                    [-5, 1, "b4"],
                    [9, 2, "b4"],
                    [-8, 7, "b4"]
                  ],
                  slow: [
                    [6, 2],
                    [-9, 4]
                  ],
                  blockbig: [[1, 4]],
                  slowbig: [[4, 9]]
                },
                small13: {
                  spin: [
                    [7, 1, "o"],
                    [-9, 3, "o"]
                  ],
                  bump: [
                    [-2, 2],
                    [-8, 8],
                    [2, 10]
                  ],
                  snag: [
                    [3, 2, "b4"],
                    [0, 8, "b4"],
                    [6, 9, "b4"]
                  ],
                  wall: [
                    [-4, 6, "w"],
                    [0, 6, "f"],
                    [4, 6, "se"],
                    [-4, 10, "b"]
                  ]
                },
                small14: {
                  bump: [
                    [4, 2],
                    [6, 6],
                    [-8, 8]
                  ],
                  bumpbig: [
                    [-4, 4],
                    [0, 10]
                  ],
                  snag: [
                    [4, 4, "b4"],
                    [-4, 6, "b2"]
                  ]
                },
                small15: {
                  snag: [
                    [5, 1, "b4"],
                    [-6, 2, "b4"],
                    [9, 3, "b2"],
                    [-9, 4, "b4"],
                    [-6, 6, "b1"],
                    [-2, 7, "b2"],
                    [-7, 9, "b4"]
                  ],
                  bump: [
                    [6, 4],
                    [-3, 4],
                    [-11, 8]
                  ]
                },
                small16: {
                  snag: [
                    [-4, 1, "b4"],
                    [7, 3, "b4"],
                    [-9, 4, "b4"],
                    [-1, 5, "b4"],
                    [4, 7, "b2"],
                    [-6, 8, "b2"]
                  ],
                  bump: [
                    [4, 4],
                    [-4, 6]
                  ]
                },
                tiny1: {
                  snag: [
                    [4, 2, "b1"],
                    [-4, 3, "b4"]
                  ],
                  bumpbig: [[0, 6]]
                },
                tiny2: {
                  bump: [
                    [4, 2],
                    [-4, 4]
                  ],
                  snag: [
                    [0, 4, "b2"],
                    [2, 7, "b4"]
                  ]
                },
                tiny3: {
                  bumpbig: [[0, 2]],
                  snag: [
                    [0, 3, "b2"],
                    [3, 6, "b4"]
                  ],
                  spin: [[-4, 4, "o"]]
                },
                tiny4: {
                  snag: [
                    [4, 2, "b4"],
                    [-4, 4, "b4"]
                  ],
                  bump: [
                    [-1, 4],
                    [4, 5]
                  ]
                },
                tiny5: {
                  bump: [
                    [2, 2],
                    [4, 6]
                  ],
                  slow: [[-4, 4]],
                  spin: [[-2, 6, "o"]]
                },
                tiny6: { bump: [[0, 2]], wall: [[2, 4, "b"]], bumpbig: [[0, 6]] },
                tiny7: {
                  snag: [
                    [0, 1, "b4"],
                    [-4, 2, "b4"],
                    [-1, 4, "b2"],
                    [4, 5, "b4"]
                  ]
                },
                tiny8: {
                  snag: [
                    [4, 2, "b1"],
                    [-4, 2, "b4"],
                    [2, 4, "b4"],
                    [-2, 6, "b1"],
                    [5, 6, "b4"]
                  ]
                },
                tiny9: {
                  snag: [
                    [0, 2, "b4"],
                    [-3, 3, "b2"],
                    [5, 3, "b4"],
                    [1, 5, "b2"]
                  ],
                  bump: [
                    [5, 6],
                    [-4, 6]
                  ]
                },
                tiny10: {
                  snag: [
                    [4, 2, "b4"],
                    [-4, 2, "b4"],
                    [0, 4, "b4"],
                    [2, 6, "b4"]
                  ],
                  bump: [[-3, 5]]
                },
                tiny11: {
                  spin: [[0, 1, "o"]],
                  snag: [
                    [-5, 2, "b4"],
                    [5, 3, "b4"]
                  ],
                  wall: [
                    [-4, 6, "sw"],
                    [0, 6, "se"]
                  ],
                  bump: [[4, 8]]
                },
                tiny12: {
                  snag: [
                    [-3, 1, "b4"],
                    [4, 2, "b4"],
                    [0, 3, "b1"],
                    [-5, 5, "b4"],
                    [3, 6, "b4"]
                  ]
                },
                tiny13: {
                  snag: [
                    [-5, 1, "b4"],
                    [3, 1, "b4"],
                    [0, 3, "b1"],
                    [-4, 4, "b4"],
                    [3, 6, "b4"]
                  ]
                },
                tiny14: {
                  snag: [
                    [-4, 1, "b4"],
                    [4, 3, "b4"],
                    [-7, 4, "b4"]
                  ],
                  slowbig: [[-2, 4]]
                },
                tiny15: {
                  wall: [
                    [4, 2, "n"],
                    [4, 6, "se"],
                    [-4, 6, "sw"]
                  ],
                  snag: [[-2, 2, "b4"]],
                  snagtall: [[0, 4, "t1"]]
                },
                tiny16: {
                  slow: [
                    [-4, 2],
                    [4, 2],
                    [-2, 6]
                  ],
                  snag: [
                    [0, 2, "b1"],
                    [3, 4, "b4"]
                  ]
                },
                tiny17: {
                  bump: [[1, 2]],
                  snag: [
                    [-3, 2, "b4"],
                    [4, 2, "b4"],
                    [-1, 4, "b4"],
                    [2, 6, "b1"]
                  ]
                },
                tiny18: {
                  slow: [[-2, 1]],
                  snag: [
                    [4, 1, "b4"],
                    [-4, 2, "b4"],
                    [0, 3, "b1"],
                    [-2, 5, "b4"]
                  ]
                }
              },
              allPassive: {
                passive1: {
                  spin: [
                    [4, 2],
                    [-7, 7],
                    [-3, 1],
                    [-1, 10],
                    [6, 7]
                  ],
                  slow: [
                    [-7, 4],
                    [6, 12]
                  ],
                  spiral: [[0, 6]]
                },
                passive2: {
                  slow: [
                    [-13, 7],
                    [-1, 2],
                    [14, 3]
                  ],
                  slowbig: [[3, 13]],
                  spin: [
                    [10, 5],
                    [-6, 4]
                  ],
                  bump: [
                    [-10, 3],
                    [5, 2],
                    [-8, 10],
                    [11, 9]
                  ],
                  bumpbig: [[1, 7]]
                },
                passive3: {
                  bump: [
                    [2, 3],
                    [7, 9],
                    [-6, 8],
                    [-4, 4]
                  ],
                  slow: [
                    [-9, 5],
                    [-11, 10],
                    [1, 10],
                    [9, 4]
                  ],
                  bumpbig: [[1, 6]],
                  slowbig: [[-1, 14]]
                },
                passive4: {
                  slow: [
                    [10, 9],
                    [-9, 10],
                    [-7, 3]
                  ],
                  bump: [
                    [5, 9],
                    [-3, 4],
                    [4, 5]
                  ],
                  spin: [
                    [-12, 2],
                    [10, 4]
                  ],
                  bumpbig: [[-2, 7]],
                  slowbig: [
                    [4, 2],
                    [1, 13]
                  ]
                },
                passive5: {
                  spiral: [
                    [7, 6],
                    [-8, 4]
                  ],
                  slowbig: [
                    [3, 2],
                    [6, 10],
                    [-2, 13]
                  ],
                  slow: [
                    [-10, 9],
                    [-3, 7]
                  ]
                }
              }
            });
        }
      }
      G.sys = null;
      class T {
        constructor() {
          if (T.sys) return T.sys;
          (T.sys = this),
            (this.grid = 64),
            (this.slots = 3),
            (this.gap = 1024),
            (this.all = []),
            (this.top = []),
            (this.btm = []),
            (this.npc = []),
            (this.foe = []);
        }
        reset() {
          this.storeObjects(),
            (this.all = []),
            (this.prevClusters = []),
            (this.top = []),
            (this.btm = []),
            (this.npc = []),
            (this.foe = []),
            (this.lairBuilt = !1),
            (this.endingFoe = void 0),
            this.merge();
        }
        start() {
          j.spawnStart();
        }
        refreshMenuModeCluster() {
          this.reset(), j.spawnMenuCluster(), this.merge();
        }
        refreshMenuThemeCluster() {
          this.reset();
          const A = gA.sys.session.x,
            t = gA.sys.session.y;
          T.sys.buildCluster(cA.sys.active.menuCluster, A, t, "menu1"), this.merge();
        }
        calcClusterSlots() {
          this.slots = 2 * Math.ceil((gA.sys.session.h - gA.sys.session.y) / this.gap) + 3;
        }
        update() {
          this.putToSleep(), j.spawnUpdate(), this.merge();
        }
        passed(A) {
          const t = gA.sys.game.dist.y + (gA.sys.session.h - gA.sys.session.y);
          return !(A.next >= t || ((A.next += A.add), 0));
        }
        ready(A) {
          return !(A.next >= gA.sys.game.dist.unit || ((A.next += A.add), 0));
        }
        getNextLevelHeight(A) {
          return A - gA.sys.game.dist.y + gA.sys.session.y;
        }
        buildCluster(A, t, n, i) {
          i || (i = e(Object.keys(G.sys.library[A]).filter((A) => !this.prevClusters.includes(A))));
          const r = G.sys.library[A][i],
            a = [];
          this.prevClusters.unshift(i), this.prevClusters.length > 14 && this.prevClusters.pop();
          for (const A in r)
            if (r.hasOwnProperty(A)) {
              const i = r[A],
                o = i.length;
              for (let r = 0; r < o; r++) {
                const o = i[r];
                let c;
                if (o.length > 2) {
                  const t = o[2];
                  c = "string" == typeof t ? e(G.sys.legend[A][t]) : t[0];
                } else {
                  const t = s(G.sys.legend[A], !0);
                  c = e(G.sys.legend[A][t]);
                }
                const l = t + o[0] * (this.grid / 4),
                  g = n + o[1] * (this.grid / 4),
                  d = this.buildObject(A, l, g, c);
                a.push(d);
              }
            }
        }
        buildNpc() {
          const A = t(1, 13),
            e = (Math.random() / 2 + 0.25) * gA.sys.session.w,
            s = A < V.entity.speed.raw ? gA.sys.session.h + 24 : -24;
          this.buildObject("npc", e, s, "left").speed.max = A;
        }
        buildFoe() {
          const A = (Math.random() / 2 + 0.25) * gA.sys.session.w;
          this.buildObject("foe", A, -32, "chase").speed.raw = V.entity.speed.raw + 1;
        }
        buildCrashedFriend() {
          const A = 48 * (Math.random() - 0.5);
          this.buildObject("friend", V.entity.x + A, V.entity.y - 32, "crash").hit = !0;
          const t = j.active;
          t.distance.friend.next = gA.sys.game.dist.unit + t.distance.friend.add;
        }
        buildCheckpoint(A, t) {
          (j.active.pixels.next += j.active.pixels.add),
            (this.top = this.sleep(this.top, -64, gA.sys.session.h + 64)),
            this.buildCluster("endlessCheckpoints", A, t);
        }
        buildLair() {
          (this.lairBuilt = !0),
            (j.active.pixels.next += 1280),
            (this.top = this.sleep(this.top, -64, gA.sys.session.h + 64));
          const A = gA.sys.session.x - (gA.sys.session.h - gA.sys.session.y) - 256,
            t = gA.sys.session.h + 256;
          this.buildCluster("endlessLair", A, t);
        }
        buildObject(A, t, s, n) {
          const i = gA.sys.game.dist.x,
            r = gA.sys.game.dist.y;
          (t = Math.floor(t) + (i - Math.floor(i))), (s = Math.floor(s) + (r - Math.floor(r)));
          let a = this.wake(A, t, s, n);
          switch ((a || (a = this.createObject(A, t, s, n)), a.type)) {
            case "wall":
              !(function (A, t) {
                !["f1", "f2", "f3"].includes(t) &&
                  Math.random() < 0.5 &&
                  (A.decor = e(["a", "b", "c", "d", "e", "f", "g", "h"]));
              })(a, n);
              break;
            case "ambient":
              a.anim = "hidden";
              break;
            case "marker":
            case "guide":
            case "gate":
              !(function (A) {
                A.gateId = j.active.counter;
              })(a);
              break;
            case "coin":
              a.time = s / 100;
              break;
            default:
              a.time = Math.random();
          }
          return this[C.sys.sheet[A].group].push(a), a;
        }
        createObject(A, t, e, s) {
          switch (A) {
            case "gate":
            case "trigger":
              return new u(A, t, e);
            case "foe":
              return new w(A, t, e, s);
            case "npc":
              return new p(A, t, e, s);
            default:
              return new B(A, t, e, s);
          }
        }
        merge() {
          function A(A, t) {
            return A.pickup ? -1 : t.pickup ? 1 : A.hitbox.y + A.hitbox.h - (t.hitbox.y + t.hitbox.h);
          }
          const t = this.top.concat(this.npc).concat(this.foe);
          V.entity.distance.air
            ? (t.sort((t, e) => A(t, e)), t.push(V.entity))
            : (t.push(V.entity), t.sort((t, e) => A(t, e))),
            (this.all = this.btm.concat(t));
        }
        storeObjects() {
          if (this.sleeping)
            this.sleeping = this.sleeping.concat(this.top).concat(this.btm).concat(this.npc).concat(this.foe);
          else {
            (this.populate = {
              wall: 40,
              snag: 40,
              snagsml: 20,
              snagtall: 5,
              spin: 10,
              ramp: 6,
              lure: 3,
              slow: 20,
              slowbig: 10,
              bump: 20,
              bumpbig: 10,
              coin: 2,
              boost: 2,
              life: 1,
              spiral: 5,
              ambient: 10,
              blockbig: 6,
              block: 4,
              friend: 1,
              foe: 2,
              npc: 10
            }),
              (this.sleeping = []);
            for (const A in this.populate)
              if (this.populate.hasOwnProperty(A)) {
                const t = this.populate[A];
                for (let e = 0; e < t; e++) {
                  const t = this.createObject(A, 0, 0, void 0);
                  this.sleeping.push(t);
                }
              }
          }
        }
        wake(A, t, e, s) {
          let n;
          const i = this.wakeFromSleep(A, s);
          return i ? ((n = i), n.shift(t - n.x, e - n.y), n.reset(), n) : null;
        }
        wakeFromSleep(A, t) {
          let e = this.sleeping;
          const s = e.length;
          for (let n = 0; n < s; n++) if (e[n].type === A) return (e[n].pose = t), (e = e.splice(n, 1)), e[n];
          return null;
        }
        putToSleep() {
          (this.top = this.sleep(this.top)),
            (this.btm = this.sleep(this.btm)),
            (this.npc = this.sleep(this.npc, -64, gA.sys.session.h + 64)),
            (this.foe = this.sleep(this.foe, -256));
        }
        sleep(A, t = -64, e = 1e4) {
          function s(A) {
            return A.y > t && A.y < e && !A.sleep;
          }
          const n = A.filter((A) => !s(A));
          return (this.sleeping = this.sleeping.concat(n)), A.filter((A) => s(A));
        }
      }
      T.sys = null;
      const R = {
          update() {
            (this.allObjects = this.filterVisible(T.sys.top.concat(T.sys.btm))), j.active.checkCollisions();
          },
          checkPlayerObjects() {
            const A = V.entity;
            for (let t = 0; t < this.allObjects.length; t++) {
              const e = this.allObjects[t];
              if (!this.collision(A, e) || e.hit || A.distance.air)
                this.playerPassed(e) &&
                  ("ambient" === e.type && "hidden" === e.anim
                    ? ((e.anim = "oneshot"), (e.time = 0))
                    : j.active.checkPass(e));
              else
                switch (((e.hit = !0), e.type)) {
                  case "wall":
                  case "snag":
                  case "snagsml":
                  case "snagtall":
                  case "block":
                  case "blockbig":
                    Z.playerCrash();
                    break;
                  case "slow":
                  case "slowbig":
                  case "bump":
                  case "bumpbig":
                    A.slow();
                    break;
                  case "spin":
                  case "spiral":
                    A.spin();
                    break;
                  case "boost":
                  case "life":
                  case "coin":
                  case "friend":
                    Z.collectItem(e);
                    break;
                  case "checkpoint":
                    Z.gameCheckpoint();
                    break;
                  default:
                    j.active.collisionEvent(e);
                }
            }
          },
          checkFoeObjects() {
            for (let A = 0; A < this.allObjects.length; A++) {
              const t = this.allObjects[A];
              this.collision(V.entity, t) && ("lure" === t.type ? (t.hit = !0) : (t.sleep = !0));
            }
          },
          checkPlayerFoes() {
            const A = V.entity;
            if (A.distance.air) return;
            const t = T.sys.foe.length,
              e = T.sys.npc.length;
            for (let s = 0; s < t; s++) {
              const t = T.sys.foe[s];
              this.collision(t, A) &&
                !t.hit &&
                t.timer.crash <= 0 &&
                (gA.sys.game.shields.current > 0
                  ? (t.crash(), Z.removeShield())
                  : A.isFoe
                    ? t.crash()
                    : (t.ending(), (T.sys.endingFoe = t), Z.gameLose()));
              for (let A = 0; A < e; A++) {
                const e = T.sys.npc[A];
                this.collision(t, e) && e.timer.crash <= 0 && e.crash();
              }
            }
          },
          checkPlayerNpcs() {
            const A = V.entity;
            if (A.distance.air) return;
            const t = T.sys.npc.length;
            for (let e = 0; e < t; e++) {
              const t = T.sys.npc[e];
              this.collision(t, A) &&
                t.timer.crash <= 0 &&
                (A.distance.boost || A.isFoe
                  ? t.crash()
                  : gA.sys.game.shields.current > 0
                    ? (t.crash(), Z.removeShield())
                    : Z.playerCrash());
            }
          },
          checkFoeNpcObject() {
            for (let A = 0; A < this.allObjects.length; A++) {
              const t = this.allObjects[A];
              T.sys.npc.forEach((A) => {
                this.collideNpcsFoes(t, A);
              }),
                T.sys.foe.forEach((A) => {
                  this.collideNpcsFoes(t, A);
                });
            }
          },
          collideNpcsFoes(A, t) {
            if (!(A.y < 16) && this.collision(t, A) && !t.objectsHit.includes(A))
              switch ((t.objectsHit.push(A), A.type)) {
                case "wall":
                case "snag":
                case "snagsml":
                case "snagtall":
                case "block":
                case "blockbig":
                case "ramp":
                  t.crash();
                  break;
                default:
                  t.slow();
              }
          },
          filterVisible: (A) =>
            A.filter((A) =>
              (function (A) {
                return (
                  (A.y > -64 && A.y < gA.sys.session.h + 64 && A.x > -64 && A.x < gA.sys.session.w + 64) ||
                  "gate" === A.type
                );
              })(A)
            ),
          collectAnim(A) {
            (A.pickup = !0), (A.time = 0), (A.anim = "ending"), (A.fx = void 0);
          },
          collision: (A, t) =>
            !(
              t.hitbox.x + t.hitbox.w < A.hitbox.x ||
              A.hitbox.x + A.hitbox.w < t.hitbox.x ||
              t.hitbox.y + t.hitbox.h < A.hitbox.y ||
              A.hitbox.y + A.hitbox.h < t.hitbox.y
            ),
          playerPassed: (A) => A.hitbox.y + A.hitbox.h < V.entity.hitbox.y
        },
        Z = {
          gameCheckpoint() {
            this.playerBoost(!0),
              T.sys.npc.forEach((A) => {
                A.crash();
              }),
              T.sys.foe.forEach((A) => {
                A.crash();
              });
          },
          gameFinishline() {
            (gA.sys.game.finish = !0), V.entity.gameOver(), V.entity.finishline(), dA.sys.changeState(lA.Over);
          },
          gameLose() {
            (gA.sys.game.lives.current = 0),
              (gA.sys.game.boosts.current = 0),
              (gA.sys.game.shields.current = 0),
              V.entity.gameOver(),
              V.entity.lose(),
              dA.sys.changeState(lA.Over);
          },
          playerAir(A) {
            V.entity.air(A), z.sys.feedback("air");
          },
          playerBoost(A = !1) {
            (!A && (gA.sys.game.boosts.current <= 0 || V.entity.distance.boost)) ||
              (A || gA.sys.game.cheat.boosts || gA.sys.delItem(gA.sys.game.boosts, 1),
              V.entity.boost(),
              cA.sys.refreshStatsUI(),
              z.sys.feedback("boost"));
          },
          gamePassGate(A) {
            j.active.passGate(A.gateId);
            const t = T.sys.buildObject("ambient", V.entity.x, V.entity.y);
            (t.hit = !0), R.collectAnim(t), this.changeGatePose(A, "pass"), z.sys.feedback("small");
          },
          changeGatePose(A, t) {
            T.sys.all
              .filter((t) => t.gateId === A.gateId)
              .forEach((A) => {
                A.pose = t;
              });
          },
          gameLair() {
            V.entity.changeToFoe(),
              this.removeFriend(),
              T.sys.top
                .filter((A) => "lure" === A.type)
                .forEach((A) => {
                  T.sys.buildObject("foe", A.x, A.y, W.Chase), (A.sleep = !0);
                }),
              (gA.sys.game.cheat.used = !0),
              cA.sys.sendNotification("cheat"),
              z.sys.feedback("big");
          },
          playerCrash() {
            if (V.entity.distance.immune) return;
            z.sys.feedback("crash");
            const A = gA.sys.game.cheat;
            if (gA.sys.game.friend)
              return this.removeFriend(), (V.entity.distance.immune = 128), void cA.sys.refreshStatsUI();
            A.lives || A.safety || gA.sys.delItem(gA.sys.game.lives, 1),
              cA.sys.refreshStatsUI(),
              gA.sys.game.lives.current <= 0 ? this.gameLose() : V.entity.crash();
          },
          collectItem(A) {
            switch (A.type) {
              case "boost":
                gA.sys.addItem(gA.sys.game.boosts, 1);
                break;
              case "life":
                gA.sys.addItem(gA.sys.game.lives, 1);
                break;
              case "coin":
                gA.sys.game.coins += 1;
                break;
              case "friend":
                this.addFriend();
            }
            cA.sys.refreshStatsUI(), R.collectAnim(A), z.sys.feedback("pickup");
          },
          addFriend() {
            V.entity.isFoe ||
              (gA.sys.addItem(gA.sys.game.shields, 3), (gA.sys.game.friend = !0), J.sys.createPlayerSprite());
          },
          removeFriend() {
            gA.sys.game.friend &&
              !gA.sys.game.cheat.safety &&
              (gA.sys.delItem(gA.sys.game.shields, 3),
              (gA.sys.game.friend = !1),
              T.sys.buildCrashedFriend(),
              J.sys.createPlayerSprite(),
              (j.active.distance.friend.next = gA.sys.game.dist.unit + j.active.distance.friend.add));
          },
          removeShield() {
            z.sys.feedback("small"), gA.sys.game.cheat.safety || gA.sys.delItem(gA.sys.game.shields, 1);
          }
        };
      var K, W;
      !(function (A) {
        (A.Settings = "settings"),
          (A.Back = "back"),
          (A.Click = "click"),
          (A.Left = "left"),
          (A.Right = "right"),
          (A.Down = "down"),
          (A.Up = "up"),
          (A.DownLeft = "downleft"),
          (A.DownRight = "downright"),
          (A.Boost = "boost");
      })(K || (K = {}));
      class z {
        constructor() {
          if (z.sys) return z.sys;
          (z.sys = this),
            (this.doubleDelay = 300),
            (this.Keys = m),
            (this.Mouse = f),
            (this.Touch = x),
            (this.Gamepad = v);
        }
        setup() {
          (this.active = o() ? this.Touch : this.Keys),
            (this.list = [this.Keys, this.Mouse, this.Touch, this.Gamepad]),
            this.list.forEach((A) => {
              A.setup(), A.reset();
            }),
            this.defineCodes(),
            this.reset();
        }
        reset() {
          this.list.forEach((A) => {
            A.reset();
          }),
            (this.last = 0),
            (this.possible = []);
        }
        update() {
          document.hasFocus() && v.update();
        }
        routeInput(A, t = !1) {
          switch (A) {
            case K.Settings:
              return void this.inputSettings();
            case K.Back:
              return void this.inputBack();
            case K.Click:
              return void this.inputClick();
          }
          O.sys.isFlyoutOpen()
            ? this.moveFocus(O.sys.active.flyout, A, "menu")
            : gA.sys.isState(lA.Play)
              ? (!t && this.isDouble(A) && (A = K.Boost), V.entity.routeAction(A, t))
              : this.moveFocus(document, A, "row");
        }
        moveFocus(A, t, e) {
          const s = [K.Left, K.Right].includes(t),
            n = [K.Up, K.Down].includes(t);
          if (s || n) {
            const n = document.activeElement,
              i = document.querySelector(".focused"),
              r = !!n && "button" === n.nodeName.toLowerCase() && n.dataset.hasOwnProperty(e);
            if (i && i.querySelector(".btn").dataset.hasOwnProperty(e))
              if (s) {
                const A = t === K.Left ? "caretLeft" : "caretRight",
                  e = i.querySelector("." + A).closest(".btn");
                y.clickButton(e);
              } else {
                const s = Number(i.querySelector(".btn").getAttribute("data-" + e)),
                  n = t === K.Up ? -1 : 1,
                  r = A.querySelector("[data-" + e + "='" + (s + n) + "']");
                r && y.focusButton(r);
              }
            else if (r) {
              const i = Number(n.getAttribute("data-" + e));
              if (s) {
                const s = Array.from(A.querySelectorAll("[data-" + e + "='" + i + "']")),
                  r = s.indexOf(n),
                  a = s[r + (t === K.Left ? -1 : 1)];
                void 0 !== a && y.focusButton(a);
              } else {
                const s = t === K.Up ? -1 : 1,
                  n = A.querySelector("[data-" + e + "='" + (i + s) + "']");
                n && y.focusButton(n);
              }
            } else y.focusButton(A.querySelector("[data-" + e + "='1']"));
          }
        }
        isDouble(A) {
          if (A !== K.Down || V.entity.distance.boost) return !1;
          const t = Date.now(),
            e = t - this.last <= this.doubleDelay;
          return (this.last = t), !!e;
        }
        tabKeydown(A) {
          A && O.sys.isFlyoutOpen() && O.sys.focusFlyoutElement(A);
        }
        tabKeyup(A) {
          A && y.focusGroup(A.target);
        }
        spacebarEnterKeydown(A) {
          "button" !== document.activeElement.nodeName.toLowerCase() && (A.preventDefault(), y.clickActionButton());
        }
        resetGame() {
          dA.sys.changeState(lA.Menu);
        }
        inputClick() {
          y.clickButton(void 0);
        }
        inputBack() {
          O.sys.isFlyoutOpen()
            ? O.sys.closeAllFlyouts()
            : gA.sys.isState(lA.Menu)
              ? cA.sys.changeMenu(cA.sys.Main)
              : this.inputToggle();
        }
        inputToggle() {
          switch (gA.sys.getState()) {
            case lA.Play:
              dA.sys.changeState(lA.Pause);
              break;
            case lA.Pause:
              dA.sys.changeState(lA.Play);
              break;
            case lA.Over:
              dA.sys.changeState(lA.Menu);
              break;
            case lA.Menu:
              dA.sys.changeState(lA.Play);
          }
        }
        inputSettings() {
          gA.sys.isState(lA.Play) && dA.sys.changeState(lA.Pause),
            void 0 !== cA.sys.buttonSettings && O.sys.toggleFlyout();
        }
        checkAngle(A, t) {
          const e = (180 * Math.atan2(A.y - t.y, A.x - t.x)) / Math.PI;
          return e <= 0 && e >= -55
            ? K.Left
            : e >= -180 && e <= -125
              ? K.Right
              : e < -55 && e > -75
                ? K.DownLeft
                : e > -125 && e < -105
                  ? K.DownRight
                  : e > 0 && e < 180
                    ? K.Up
                    : K.Down;
        }
        checkCheatCode(A) {
          if (!gA.sys.isState(lA.Menu)) return;
          const t = this.isInput(z.sys.Keys) ? this.codes.keys : this.codes.directional;
          (this.possible = this.possible.filter((e) => A === t[e.idx][e.pos])),
            t
              .filter((t) => A === t[0])
              .forEach((A) => {
                this.possible.push({ idx: t.indexOf(A), pos: 0 });
              }),
            this.possible.some((A) => {
              if ((A.pos++, A.pos === t[A.idx].length)) {
                let t = "code";
                switch (A.idx) {
                  case 0:
                    this.cheat("lives"), (t = "cheatcode");
                    break;
                  case 1:
                    this.cheat("boosts"), (t = "cheatcode");
                    break;
                  case 2:
                    this.cheat("safety"), (t = "cheatcode");
                    break;
                  case 3:
                    J.sys.createPlayerSprite("konami");
                    break;
                  case 4:
                    V.entity.scale = 2;
                }
                cA.sys.sendNotification(t);
              }
            });
        }
        cheat(A) {
          const t = gA.sys.game.cheat;
          if (gA.sys.isState(lA.Menu))
            switch (((t.used = !0), (t[A] = !0), A)) {
              case "lives":
                gA.sys.addItem(gA.sys.game.lives, 1);
                break;
              case "boosts":
                gA.sys.addItem(gA.sys.game.boosts, 1);
                break;
              case "safety":
                Z.addFriend();
            }
          t.lives || t.boosts || t.safety || (t.used = !1), cA.sys.updateIcons();
        }
        changeInput(A) {
          this.isInput(A) || ((this.active = A), this.active.reset(), gA.sys.saveSessionSettings());
        }
        isInput(A) {
          return this.active === A;
        }
        feedback(A) {
          v.vibrate(A);
        }
        defineCodes() {
          this.codes = {
            keys: [
              ["m", "i", "c", "r", "o", "s", "o", "f", "t"],
              ["e", "d", "g", "e"],
              ["s", "a", "f", "e"],
              [
                "arrowup",
                "arrowup",
                "arrowdown",
                "arrowdown",
                "arrowleft",
                "arrowright",
                "arrowleft",
                "arrowright",
                "b",
                "a"
              ],
              ["b", "i", "g"]
            ],
            directional: [
              ["left", "down", "right", "up", "left", "down", "right", "up"],
              ["up", "down", "up", "down"],
              ["up", "right", "down", "left"],
              ["up", "up", "down", "down", "left", "right", "left", "right"],
              ["up", "up", "up", "up"]
            ]
          };
        }
      }
      (z.sys = null),
        (function (A) {
          (A.Left = "left"),
            (A.Right = "right"),
            (A.Down = "down"),
            (A.Up = "up"),
            (A.DownLeft = "downleft"),
            (A.DownRight = "downright"),
            (A.Crash = "crash"),
            (A.End = "end"),
            (A.Air1 = "air1"),
            (A.Air2 = "air2"),
            (A.Chase = "chase");
        })(W || (W = {}));
      class V extends B {
        constructor() {
          if ((super("player", gA.sys.session.x, gA.sys.session.y, W.Down), V.entity)) return V.entity;
          V.entity = this;
        }
        reset() {
          super.reset(),
            (this.speed = {
              current: 0,
              x: 0,
              y: 0,
              raw: 0,
              min: 1,
              max: 7.5,
              base: 7.5,
              accel: 0.02,
              airAdd: 2.5,
              boostAdd: 5
            }),
            (this.timer = { crash: 0 }),
            (this.distance = { air: void 0, boost: void 0, immune: void 0 }),
            (this.angle = 0),
            (this.drift = 0),
            (this.radian = 0),
            (this.direction = W.Up),
            (this.shadow = 0),
            (this.scale = 1),
            (this.boostFx = []),
            (this.driftFx = []),
            (this.isFoe = !1),
            (this.poses = [
              W.Left,
              W.Left,
              W.Left,
              W.DownLeft,
              W.Down,
              W.DownRight,
              W.Right,
              W.Right,
              W.Right,
              W.DownRight,
              W.Down,
              W.DownLeft
            ]);
        }
        move() {}
        unlockForNewGame() {
          this.reset(), this.changeDirection(W.Down);
        }
        update() {
          super.update(),
            this.updateAngle(),
            this.updateTimer(),
            this.updateDistance(),
            this.updateLineFx(),
            this.direction === W.Up || this.timer.crash || (this.updateDrift(), this.updateSpeed());
        }
        routeAction(A, t = !1) {
          if (!(this.timer.crash || (this.distance.air && A !== K.Down)))
            switch (A) {
              case K.Up:
                this.up();
                break;
              case K.Down:
                this.down();
                break;
              case K.Left:
              case K.Right:
              case K.DownLeft:
              case K.DownRight:
                this.changeDirection(A, t);
                break;
              case K.Boost:
                Z.playerBoost();
            }
        }
        changeDirection(A, t = !1) {
          if (A === this.direction) return;
          let e;
          switch (
            (t || A !== W.Left
              ? t || A !== W.Right || (A = this.direction === W.DownRight ? W.Right : W.DownRight)
              : (A = this.direction === W.DownLeft ? W.Left : W.DownLeft),
            A)
          ) {
            case W.Left:
              e = -42;
              break;
            case W.Right:
              e = -138;
              break;
            case W.DownLeft:
              e = -60;
              break;
            case W.DownRight:
              e = -120;
              break;
            case W.Down:
              e = -90;
              break;
            default:
              e = 0;
          }
          (this.direction = A),
            this.changePose(A),
            (this.drift = e),
            (0 !== e && 0 !== this.angle) || (this.angle = e),
            (this.radian = (this.angle * Math.PI) / 180);
        }
        changePose(A) {
          this.isFoe && (A = A === W.Up ? W.Crash : W.Chase), (this.pose = A);
        }
        updateAngle() {
          (this.speed.x = this.speed.current * -Math.cos(this.radian)),
            (this.speed.y = this.speed.current * -Math.sin(this.radian));
        }
        updateTimer() {
          this.timer.crash &&
            ((this.timer.crash -= gA.sys.game.time.loop * gA.sys.game.time.scale),
            this.timer.crash <= 0 && ((this.timer.crash = void 0), this.endCrash()));
        }
        updateDistance() {
          for (const A in this.distance)
            this.distance[A] &&
              this.distance.hasOwnProperty(A) &&
              ((this.distance[A] -= this.speed.current),
              this.distance[A] <= 0 &&
                ((this.distance[A] = void 0), "boost" === A ? this.endBoost() : "air" === A && this.endAir()));
        }
        updateDrift() {
          if (this.drift === this.angle) return;
          const A = (3600 * gA.sys.game.time.loop) / this.speed.current;
          Math.abs(this.drift - this.angle) < A
            ? (this.angle = this.drift)
            : (this.angle += this.drift < this.angle ? -A : A),
            (this.radian = (this.angle * Math.PI) / 180);
        }
        updateSpeed() {
          const A = this.distance.air || this.distance.boost ? 8 : 1,
            t = this.speed;
          this.setMinPlayerSpeed();
          const e = t.accel * A * gA.sys.game.time.scale;
          (this.speed.raw = t.raw <= t.max ? (t.raw += e) : (t.raw -= e)),
            (this.speed.current = t.raw * gA.sys.game.time.scale);
        }
        up() {
          this.changeDirection(W.Up), this.stopPlayerSpeed(), z.sys.feedback("tiny");
        }
        down() {
          if (this.distance.air) {
            const A = this.pose === W.Air1 ? W.Air2 : W.Air1;
            this.changePose(A), z.sys.feedback("small");
          } else this.changeDirection(W.Down);
        }
        crash() {
          (this.timer.crash = 1), this.stopPlayerSpeed(), (this.distance.immune = 96), this.changePose(W.Crash);
        }
        air(A) {
          this.timer.crash ||
            (this.down(),
            this.distance.boost && (this.distance.boost += A),
            (this.distance.air = A),
            (this.speed.max = this.speed.base + this.speed.airAdd),
            (this.shadow = 0),
            this.changePose(W.Air1));
        }
        boost() {
          (this.distance.boost = 2e3), (this.speed.max = this.speed.base + this.speed.boostAdd);
        }
        endCrash() {
          this.up(), z.sys.reset(), z.sys.feedback("tiny");
        }
        endAir() {
          (this.distance.immune = 256),
            this.distance.boost || (this.speed.max = this.speed.base),
            this.changePose(W.Down),
            z.sys.reset(),
            z.sys.feedback("slow");
        }
        endBoost() {
          (this.speed.max = this.speed.base), z.sys.feedback("tiny");
        }
        slow() {
          (this.speed.raw *= 0.7), z.sys.feedback("slow");
        }
        changeToFoe() {
          (this.isFoe = !0),
            this.changePose(W.Chase),
            (this.speed.base += 3),
            (this.speed.max = this.speed.base),
            (this.hitbox.x -= 32),
            (this.hitbox.y -= 32),
            (this.hitbox.w += 64),
            (this.hitbox.h += 64);
        }
        spin() {
          const A = Math.random() > 0.5;
          switch (this.direction) {
            case W.DownRight:
            case W.Right:
              this.changeDirection(A ? W.Left : W.DownLeft, !0);
              break;
            case W.DownLeft:
            case W.Left:
              this.changeDirection(A ? W.Right : W.DownRight, !0);
              break;
            default:
              this.changeDirection(A ? W.Left : W.Right, !0);
          }
          (this.speed.raw *= 0.9), z.sys.feedback("slow");
        }
        gameOver() {
          (this.distance.immune = 0), this.stopPlayerSpeed(), (this.boostFx = []), (this.driftFx = []);
        }
        lose() {
          this.changePose(W.Crash);
        }
        finishline() {
          this.changePose(W.Up);
        }
        stopPlayerSpeed() {
          (this.speed.current = 0), (this.speed.raw = 0), (this.speed.max = 0), (this.speed.x = 0), (this.speed.y = 0);
        }
        setMinPlayerSpeed() {
          (this.speed.raw = Math.max(this.speed.raw, this.speed.min)),
            (this.speed.max = Math.max(this.speed.max, this.speed.base));
        }
        updateLineFx() {
          this.moveLines(this.boostFx, 0.8),
            (this.boostFx = this.boostFx.filter((A) => A.time < 0.5)),
            this.distance.boost && this.speed.current > 0 && this.addLine(this.boostFx),
            this.moveLines(this.driftFx, 1.2),
            (this.driftFx = this.driftFx.filter((A) => A.time < 0.5)),
            this.drift !== this.angle && this.speed.current > this.speed.max / 3 && this.addLine(this.driftFx);
        }
        moveLines(A, t) {
          A.length <= 0 ||
            A.forEach((A) => {
              (A.start.x -= this.speed.x * t),
                (A.end.x -= this.speed.x),
                (A.start.y -= this.speed.y * t),
                (A.end.y -= this.speed.y),
                (A.time += gA.sys.game.time.loop);
            });
        }
        addLine(A) {
          const t = 16 - 32 * Math.random();
          A.push({
            start: { x: this.x + t, y: this.y + 8 },
            end: { x: this.x + t - 3 * this.speed.x, y: this.y + 8 - 3 * this.speed.y },
            time: 0.01
          });
        }
        drawMenu() {
          const A = gA.sys.session.x,
            t = gA.sys.session.y,
            e = gA.sys.game.time.elapsed,
            s = Math.floor(e * C.sys.sheet.player.fps) % this.poses.length;
          J.sys.drawPlayerSprite(this.poses[s], A, t, this.scale + 1);
        }
        draw() {
          if (gA.sys.isState(lA.Menu)) this.drawMenu();
          else if (
            (this.boostFx.length > 0 && J.sys.drawLineFx(this.boostFx, "accent"),
            this.driftFx.length > 0 && J.sys.drawLineFx(this.driftFx, "fx"),
            this.isFoe)
          )
            J.sys.drawLayer("foe", this.pose, this.x, this.y, this.time, this.anim);
          else {
            if (
              (gA.sys.game.friend && J.sys.drawShield(this.x, this.y + 8),
              this.distance.air &&
                (this.distance.air < 256
                  ? (this.shadow = this.distance.air / 4)
                  : this.shadow < 64
                    ? (this.shadow += 3 * gA.sys.game.time.scale)
                    : (this.shadow = 64),
                J.sys.drawShadow(this.x, this.y + 16, this.shadow)),
              this.distance.immune)
            ) {
              const A = Math.floor(4 * gA.sys.game.time.elapsed) % 2 == 0;
              J.sys.ctx.globalAlpha = A ? 0.4 : 0.7;
            }
            J.sys.drawPlayerSprite(this.pose, this.x, this.y, this.scale);
          }
        }
      }
      V.entity = null;
      const j = {
        Endless: {
          id: "endless",
          menuCluster: "endlessMenu",
          stringLookup: { title: "modeEndlessTitle", howto: "modeEndlessHowToPlay" },
          setup() {
            this.loadClusters(), (this.edge = void 0);
          },
          reset() {
            (this.pixels = { next: 0, add: 800 }),
              (this.distance = {
                foe: { next: 1e3, add: 480 },
                npc: { next: 30, add: 100 },
                ramp: { next: 500, add: 500 },
                boost: { next: 650, add: 500 },
                lure: { next: 700, add: 500 },
                friend: { next: 3e3, add: 3e3 },
                life: { next: 2e3, add: 1e3 },
                checkpoint: { next: 5e3, add: 5e3 },
                save: { next: 1e3, add: 250 }
              });
          },
          getScore: () => Math.floor(gA.sys.game.dist.unit),
          getScoreFormatted() {
            return this.getScore().toString();
          },
          getHighScore: () => gA.sys.highScore.endless,
          getHighScoreFormatted() {
            return this.getHighScore().toString();
          },
          scoreMeter() {
            return this.getScore() / this.getHighScore();
          },
          almostHighScore() {
            return this.scoreMeter() >= 0.9;
          },
          saveScore() {
            if (gA.sys.game.cheat.used) return;
            const A = this.getScore();
            A > gA.sys.highScore.endless && ((gA.sys.highScore.endless = A), gA.sys.triggerHighScore());
          },
          buildStartScene() {
            const A = gA.sys.session.x,
              t = gA.sys.session.y + 128;
            T.sys.buildCluster("endlessStarts", A, t);
          },
          update() {
            const A = T.sys.passed(this.pixels),
              t = T.sys.ready(this.distance.foe),
              e = T.sys.ready(this.distance.npc),
              s = T.sys.ready(this.distance.save);
            A && this.buildNextLevel(),
              t && T.sys.buildFoe(),
              e && T.sys.buildNpc(),
              s && this.saveScore(),
              this.checkDistances();
          },
          checkCollisions() {
            V.entity.isFoe ? R.checkFoeObjects() : R.checkPlayerObjects(),
              R.checkFoeNpcObject(),
              R.checkPlayerFoes(),
              R.checkPlayerNpcs();
          },
          collisionEvent(A) {
            switch (A.type) {
              case "trigger":
                Z.gameLair();
                break;
              case "ramp":
                Z.playerAir(1e3);
            }
          },
          checkDistances() {
            const A = gA.sys.game.dist,
              t = A.y < 8e3 && A.x < -6400,
              e = A.unit > gA.sys.highScore.endless;
            t && !T.sys.lairBuilt && T.sys.buildLair(), !gA.sys.game.highScore && e && this.saveScore();
          },
          checkPass(A) {
            "lure" === A.type &&
              A.hit &&
              A.y + 192 < V.entity.y &&
              (T.sys.buildObject("foe", A.x, A.y + 32, "chase"), (A.sleep = !0));
          },
          buildNextLevel() {
            let A = gA.sys.session.x;
            switch (V.entity.direction) {
              case "left":
                A += 4 * -T.sys.grid;
                break;
              case "downleft":
                A += 2 * -T.sys.grid;
                break;
              case "right":
                A += 4 * T.sys.grid;
                break;
              case "downright":
                A += 2 * T.sys.grid;
            }
            const e = T.sys.getNextLevelHeight(this.pixels.next);
            if (T.sys.ready(this.distance.checkpoint)) return void T.sys.buildCheckpoint(A, e);
            const s = Math.floor(T.sys.slots / 2);
            for (let n = -s; n <= s; n++) {
              let s = 0,
                i = 0,
                r = "allNormal";
              0 === n
                ? V.entity.distance.air
                  ? (r = "allPassive")
                  : T.sys.ready(this.distance.life)
                    ? (r = "endlessLives")
                    : T.sys.ready(this.distance.friend)
                      ? (r = "endlessFriends")
                      : T.sys.ready(this.distance.boost)
                        ? (r = "endlessBoosts")
                        : T.sys.ready(this.distance.ramp)
                          ? (r = "endlessRamps")
                          : T.sys.ready(this.distance.lure) && (r = "endlessLures")
                : ((s = t(-5, 5) * T.sys.grid), (i = t(0, 8) * T.sys.grid));
              const a = A + n * T.sys.gap + s,
                o = e + i;
              T.sys.buildCluster(r, a, o), this.buildEndlessRandomSnags(a, o);
            }
          },
          buildEndlessRandomSnags(A, s) {
            const n = T.sys.gap,
              i = this.pixels.add / 2,
              r = [
                [-n / 2, 0],
                [-n / 4, i],
                [n / 4, i]
              ],
              a = r.length;
            for (let n = 0; n < a; n++) {
              if (Math.random() < 0.33) continue;
              const i = r[n][0] + t(-2, 2) * T.sys.grid,
                a = r[n][1] + t(-2, 2) * T.sys.grid;
              let c = "snag";
              Math.random() < 0.6 && (c = "string" == typeof (o = e(Object.keys(G.sys.spawnSingle))) ? o : "");
              const l = e(G.sys.spawnSingle[c]);
              T.sys.buildObject(c, A + i, s + a, l);
            }
            var o;
          },
          loadClusters() {
            this.library = {
              endlessMenu: {
                menu1: {
                  snagsml: [
                    [34, 0, "c4"],
                    [35, -4, "c5"],
                    [-25, 16, "c3"],
                    [21, 13, "c3"],
                    [-18, 10, "c3"],
                    [-21, 13, "c3"],
                    [18, 10, "c3"],
                    [25, 16, "c3"],
                    [-34, -13, "c1"],
                    [31, -3, "c5"]
                  ],
                  snag: [
                    [13, 0, "b4"],
                    [-30, -15, "b4"],
                    [-35, -11, "b4"],
                    [-42, -2, "b1"],
                    [-28, 0, "b6"],
                    [40, -1, "b4"],
                    [-13, -1, "b4"],
                    [-26, -15, "b4"],
                    [-31, -7, "b4"],
                    [-11, -3, "b4"],
                    [-22, -9, "b5"],
                    [43, 1, "b4"],
                    [33, -15, "b6"],
                    [-23, -2, "b6"],
                    [-39, -2, "b3"],
                    [24, -13, "b3"],
                    [16, -3, "b1"]
                  ],
                  bump: [
                    [15, -1],
                    [-25, 2],
                    [-42, 0],
                    [35, -9],
                    [40, 4],
                    [-31, 10],
                    [-25, -7],
                    [-34, -9],
                    [24, 7]
                  ],
                  wall: [
                    [22, 4, "f"],
                    [26, 0, "e"],
                    [-31, 7, "f"],
                    [-27, 7, "se"],
                    [26, 4, "se"],
                    [18, 4, "sw"]
                  ],
                  friend: [[28, 9]],
                  spin: [
                    [-36, 13],
                    [40, -6],
                    [-40, -5]
                  ],
                  slow: [
                    [-31, -1],
                    [22, -8],
                    [-45, 5],
                    [27, 25],
                    [11, -22],
                    [43, -17],
                    [-9, 32],
                    [16, 18],
                    [-13, 5],
                    [11, 6],
                    [45, 7],
                    [-39, -18],
                    [47, -7],
                    [-49, 19],
                    [-21, 37],
                    [-44, -9]
                  ],
                  block: [
                    [-20, 0],
                    [29, -11]
                  ],
                  slowbig: [
                    [19, -17],
                    [-37, 29],
                    [31, -25],
                    [-9, -19],
                    [-21, 23],
                    [-27, -11],
                    [12, 34],
                    [-25, -25],
                    [34, 37],
                    [43, 23],
                    [-39, 11]
                  ],
                  snagtall: [
                    [35, -14, "t3"],
                    [39, 0, "t2"],
                    [-35, 5, "t1"],
                    [22, -2, "t1"]
                  ],
                  lure: [[-27, -11]],
                  spiral: [[34, 9]]
                }
              },
              endlessStarts: {
                start1: {
                  snag: [
                    [18, 21, "b4"],
                    [31, 14, "b4"],
                    [-39, 18, "b4"],
                    [20, 12, "b4"],
                    [36, 17, "b4"],
                    [-32, 20, "b1"],
                    [-22, 24, "b4"],
                    [-17, 22, "b4"],
                    [-40, 12, "b2"],
                    [-22, 12, "b4"],
                    [-31, 13, "b4"],
                    [41, 11, "b4"],
                    [37, 12, "b1"],
                    [15, 11, "b2"]
                  ],
                  wall: [
                    [-28, 8, "f"],
                    [36, 4, "n"],
                    [-36, 4, "n"],
                    [28, 8, "f"],
                    [32, 8, "s"],
                    [20, 8, "sw"],
                    [-20, 8, "se"],
                    [-24, 8, "s"],
                    [-36, 8, "sw"],
                    [26, 12, "n"],
                    [-26, 12, "n"],
                    [26, 16, "se"],
                    [22, 16, "f"],
                    [14, 16, "f"],
                    [-18, 16, "f"],
                    [18, 16, "s"],
                    [10, 16, "sw"],
                    [-10, 16, "se"],
                    [-22, 16, "s"],
                    [-26, 16, "sw"],
                    [36, 8, "se"]
                  ],
                  slowbig: [
                    [-26, 3],
                    [26, 2],
                    [-36, 16],
                    [-20, 21],
                    [35, 21],
                    [22, 26]
                  ],
                  boost: [
                    [4, 2],
                    [-4, 2]
                  ],
                  snagsml: [
                    [12, 27, "c3"],
                    [-9, 11, "c3"],
                    [-8, 20, "c3"],
                    [9, 11, "c3"],
                    [8, 20, "c3"],
                    [-12, 27, "c3"]
                  ],
                  slow: [
                    [-14, 10],
                    [14, 10]
                  ],
                  bump: [
                    [-33, 12],
                    [-24, 18],
                    [-42, 10],
                    [-40, 4],
                    [40, 8],
                    [22, 10],
                    [40, 16],
                    [28, 18],
                    [14, 18],
                    [-12, 18],
                    [-34, 22],
                    [31, 11]
                  ],
                  snagtall: [
                    [-32, 6, "t1"],
                    [24, 6, "t1"],
                    [-14, 14, "t1"],
                    [14, 21, "t2"]
                  ]
                },
                start2: {
                  snagsml: [
                    [25, 18, "c5"],
                    [26, 23, "c4"],
                    [12, 27, "c3"],
                    [-9, 11, "c3"],
                    [-8, 20, "c3"],
                    [8, 20, "c3"],
                    [9, 11, "c3"],
                    [-12, 27, "c3"],
                    [30, 19, "c5"],
                    [21, 20, "c5"],
                    [32, 26, "c5"],
                    [33, 22, "c5"]
                  ],
                  slow: [
                    [41, 22],
                    [-40, 5],
                    [42, 6],
                    [-44, 23],
                    [-47, 15]
                  ],
                  snag: [
                    [-39, 8, "b4"],
                    [37, 17, "b4"],
                    [-18, 4, "b6"],
                    [35, 7, "b1"],
                    [-41, 17, "b4"],
                    [-14, 21, "b4"],
                    [-39, 19, "b3"],
                    [-36, 23, "b4"],
                    [-25, 26, "b2"],
                    [40, 11, "b3"],
                    [28, 3, "b6"],
                    [-16, 19, "b1"],
                    [-34, 11, "b6"],
                    [33, 15, "b4"],
                    [18, 15, "b6"]
                  ],
                  bumpbig: [[-24, 24]],
                  slowbig: [
                    [22, 32],
                    [-20, 31],
                    [-36, 28],
                    [-28, 3],
                    [23, 3],
                    [45, 16],
                    [39, 28]
                  ],
                  snagtall: [
                    [28, 13, "t3"],
                    [-27, 8, "t3"],
                    [-31, 6, "t3"],
                    [18, 6, "t1"],
                    [-18, 14, "t1"],
                    [-42, 8, "t2"]
                  ],
                  blockbig: [
                    [22, 11],
                    [-19, 8]
                  ],
                  boost: [
                    [-4, 2],
                    [4, 2]
                  ],
                  wall: [
                    [26, 8, "f"],
                    [30, 8, "e"],
                    [-34, 16, "n"],
                    [-30, 20, "s"],
                    [-22, 20, "se"],
                    [-22, 16, "w"],
                    [-10, 16, "se"],
                    [10, 16, "sw"],
                    [-14, 16, "f"],
                    [-26, 20, "s"],
                    [-34, 20, "sw"],
                    [14, 12, "n"],
                    [30, 12, "sw"],
                    [14, 16, "se"],
                    [14, 8, "w"],
                    [22, 8, "s"],
                    [34, 12, "se"]
                  ],
                  bump: [
                    [-12, 19],
                    [37, 14],
                    [38, 9],
                    [-32, 23],
                    [-17, 22],
                    [-37, 14],
                    [32, 4],
                    [12, 6],
                    [-12, 12],
                    [-35, 7]
                  ],
                  block: [[-28, 13]]
                },
                start3: {
                  boost: [
                    [4, 2],
                    [-4, 2]
                  ],
                  lure: [[-34, 11]],
                  block: [
                    [40, 11],
                    [14, 15]
                  ],
                  wall: [[38, 17, "b"]],
                  slow: [
                    [-22, 25],
                    [23, 20],
                    [-30, 15],
                    [-48, 11],
                    [47, 14]
                  ],
                  snagsml: [
                    [-12, 27, "c3"],
                    [8, 20, "c3"],
                    [-8, 20, "c3"],
                    [-9, 11, "c3"],
                    [9, 11, "c3"],
                    [12, 27, "c3"]
                  ],
                  blockbig: [
                    [23, 9],
                    [-15, 16]
                  ],
                  bumpbig: [
                    [31, 15],
                    [-18, 12]
                  ],
                  snag: [
                    [27, 17, "b4"],
                    [-25, 7, "b4"],
                    [-40, 7, "b6"],
                    [-13, 9, "b4"],
                    [-12, 20, "b6"],
                    [43, 18, "b1"],
                    [-23, 13, "b4"],
                    [-31, 24, "b5"],
                    [-37, 16, "b4"],
                    [-43, 12, "b4"],
                    [-36, 8, "b4"],
                    [-27, 5, "b4"],
                    [19, 13, "b6"],
                    [-29, 8, "b4"],
                    [-42, 15, "b4"],
                    [-44, 17, "b4"],
                    [31, 11, "b3"],
                    [-41, 10, "b4"],
                    [-17, 5, "b5"],
                    [17, 19, "b6"]
                  ],
                  bump: [
                    [43, 16],
                    [-30, 7],
                    [-41, 20],
                    [-32, 26],
                    [-39, 13],
                    [15, 12],
                    [13, 21]
                  ],
                  slowbig: [
                    [-28, 20],
                    [-43, 25],
                    [22, 25],
                    [37, 22],
                    [30, 5]
                  ],
                  snagtall: [
                    [30, 17, "t3"],
                    [21, 14, "t3"],
                    [-17, 20, "t3"],
                    [-39, 17, "t3"],
                    [-33, 4, "t3"],
                    [35, 7, "t3"]
                  ]
                }
              },
              endlessLair: {
                lair: {
                  trigger: [[0, 26]],
                  spiral: [
                    [2, 22],
                    [-6, 26],
                    [6, 30]
                  ],
                  block: [
                    [-32, 24],
                    [25, 38]
                  ],
                  blockbig: [[-25, 13]],
                  lure: [
                    [18, 26, ["lure"]],
                    [-2, 14, ["lure"]],
                    [-10, 16, ["lure"]],
                    [-16, 20, ["lure"]],
                    [-18, 26, ["lure"]],
                    [16, 32, ["lure"]],
                    [10, 36, ["lure"]],
                    [-16, 33, ["lure"]]
                  ],
                  slowbig: [
                    [30, 19],
                    [-11, 2],
                    [-26, 42],
                    [34, 44],
                    [-29, 8],
                    [20, 53],
                    [13, 7],
                    [-3, 51]
                  ],
                  bump: [
                    [-37, 37],
                    [15, 44],
                    [30, 32],
                    [-17, 15],
                    [-30, 32],
                    [-28, 21],
                    [31, 39],
                    [35, 25],
                    [22, 47],
                    [10, 49]
                  ],
                  snag: [
                    [-33, 19, "b4"],
                    [-23, 32, "b4"],
                    [-29, 38, "b3"],
                    [9, 51, "b4"],
                    [26, 46, "b4"],
                    [11, 3, "b5"],
                    [-3, 5, "b4"],
                    [-6, 10, "b4"],
                    [-15, 11, "b4"],
                    [29, 24, "b4"],
                    [11, 43, "b4"],
                    [27, 30, "b4"],
                    [-21, 17, "b4"],
                    [-26, 30, "b4"],
                    [16, 47, "b4"],
                    [-35, 15, "b6"],
                    [-11, 5, "b4"],
                    [-12, 9, "b6"],
                    [35, 37, "b4"],
                    [36, 28, "b4"],
                    [-26, 24, "b4"],
                    [-38, 26, "b4"],
                    [-40, 28, "b4"],
                    [-36, 30, "b4"],
                    [37, 32, "b4"],
                    [-16, 6, "b4"],
                    [-25, 18, "b4"],
                    [26, 34, "b4"],
                    [-18, 8, "b4"],
                    [2, 9, "b4"],
                    [31, 15, "b5"],
                    [31, 35, "b4"],
                    [24, 43, "b4"],
                    [5, 48, "b4"],
                    [33, 30, "b6"],
                    [19, 44, "b6"]
                  ],
                  wall: [[-33, 36, "b"]],
                  snagtall: [
                    [-24, 33, "t3"],
                    [-9, 6, "t3"],
                    [20, 40, "t3"],
                    [-31, 16, "t3"],
                    [31, 26, "t3"],
                    [25, 19, "t2"],
                    [-20, 35, "t2"]
                  ],
                  slow: [
                    [6, 17],
                    [2, 36],
                    [-21, 23],
                    [14, 24],
                    [40, 36],
                    [-10, 32],
                    [-8, 20],
                    [-38, 19]
                  ],
                  bumpbig: [
                    [7, 46],
                    [-1, 8],
                    [-29, 29]
                  ],
                  snagsml: [
                    [-29, 34, "c1"],
                    [-35, 32, "c1"],
                    [29, 21, "c1"],
                    [25, 23, "c1"]
                  ]
                }
              },
              endlessLives: {
                life1: {
                  bump: [
                    [10, 12],
                    [-5, 14],
                    [0, 1]
                  ],
                  snag: [
                    [17, 8, "b6"],
                    [-1, 3, "b6"],
                    [-16, 13, "b6"],
                    [-11, 15, "b6"]
                  ],
                  slow: [
                    [-20, 8],
                    [-4, 6],
                    [-3, 19],
                    [7, 17],
                    [12, 5]
                  ],
                  blockbig: [[-11, 9]],
                  life: [[1, 12]],
                  snagtall: [
                    [-8, 16, "t3"],
                    [-10, 4, "t3"],
                    [-3, 0, "t3"],
                    [14, 9, "t3"]
                  ],
                  slowbig: [[-19, 18]],
                  block: [[9, 7]]
                },
                life2: {
                  snagtall: [
                    [-4, 0, "t3"],
                    [-15, 6, "t3"],
                    [-9, 15, "t3"],
                    [10, 9, "t3"]
                  ],
                  bump: [[-11, 23]],
                  snagsml: [[-8, 20, "c1"]],
                  slowbig: [
                    [7, 23],
                    [13, 8],
                    [-21, 20]
                  ],
                  slow: [
                    [18, 15],
                    [-22, 8],
                    [-12, 5]
                  ],
                  spin: [[-4, 20]],
                  wall: [[-12, 20, "b"]],
                  life: [[-2, 13]],
                  blockbig: [
                    [9, 15],
                    [-14, 11]
                  ],
                  snag: [
                    [-20, 15, "b6"],
                    [3, 2, "b6"]
                  ],
                  block: [[-1, 5]]
                }
              },
              endlessFriends: {
                friend1: {
                  friend: [[-1, 12]],
                  snagsml: [[-18, 15, "c1"]],
                  bumpbig: [[11, 4]],
                  blockbig: [[14, 8]],
                  wall: [
                    [-12, 8, "w"],
                    [-8, 8, "se"],
                    [-16, 12, "f"],
                    [-12, 12, "se"]
                  ],
                  snagtall: [
                    [-20, 10, "t1"],
                    [6, 5, "t3"]
                  ],
                  spin: [[4, 9]],
                  bump: [
                    [-15, 8],
                    [10, 13],
                    [-11, 16],
                    [-10, 4]
                  ],
                  slow: [
                    [7, 19],
                    [-18, 3]
                  ],
                  snag: [
                    [15, 13, "b2"],
                    [6, 12, "b4"],
                    [-8, 14, "b4"],
                    [11, 15, "b1"],
                    [20, 5, "b6"]
                  ]
                },
                friend2: {
                  slow: [
                    [-11, 18],
                    [13, 2]
                  ],
                  snag: [
                    [-1, 1, "b4"],
                    [-18, 14, "b1"],
                    [18, 10, "b4"],
                    [14, 6, "b4"],
                    [8, 8, "b4"],
                    [-10, 11, "b6"],
                    [-7, 13, "b4"],
                    [17, 14, "b4"]
                  ],
                  slowbig: [
                    [-18, 3],
                    [12, 19]
                  ],
                  bump: [
                    [-16, 12],
                    [15, 11],
                    [-7, 8],
                    [2, 2]
                  ],
                  snagtall: [
                    [11, 9, "t2"],
                    [-20, 8, "t3"]
                  ],
                  snagsml: [[8, 12, "c1"]],
                  block: [[-13, 7]],
                  friend: [[1, 9]]
                }
              },
              endlessBoosts: {
                boost1: {
                  spin: [[-15, 8]],
                  spiral: [[-2, 12]],
                  boost: [[-4, 19]],
                  slowbig: [[8, 8]],
                  blockbig: [
                    [9, 14],
                    [-7, 4]
                  ],
                  snagsml: [
                    [-20, 14, "c1"],
                    [-14, 20, "c1"]
                  ],
                  bump: [
                    [5, 22],
                    [-10, 13],
                    [-11, 19],
                    [2, 3],
                    [-15, 5],
                    [16, 19]
                  ],
                  snag: [
                    [-13, 14, "b4"],
                    [-10, 16, "b4"],
                    [-13, 1, "b6"],
                    [-9, 8, "b6"],
                    [4, 18, "b6"]
                  ],
                  snagtall: [
                    [-16, 15, "t2"],
                    [17, 14, "t3"],
                    [8, 18, "t3"]
                  ]
                },
                boost2: {
                  boost: [[-9, 16]],
                  snagsml: [[-10, 9, "c1"]],
                  bumpbig: [[-3, 2]],
                  snagtall: [[-7, 4, "t1"]],
                  bump: [
                    [-5, 22],
                    [15, 20],
                    [17, 12],
                    [-15, 6],
                    [15, 4]
                  ],
                  wall: [
                    [5, 22, "se"],
                    [1, 22, "sw"],
                    [1, 18, "e"],
                    [-3, 18, "sw"],
                    [13, 16, "b"],
                    [13, 12, "n"],
                    [9, 8, "sw"],
                    [-3, 6, "se"],
                    [-11, 6, "sw"],
                    [13, 8, "e"]
                  ],
                  snag: [
                    [11, 3, "b1"],
                    [18, 15, "b2"],
                    [-6, 8, "b4"],
                    [-14, 14, "b4"],
                    [-6, 24, "b2"]
                  ]
                },
                boost3: {
                  slowbig: [[-10, 3]],
                  snag: [
                    [-14, 5, "b2"],
                    [7, 5, "b6"],
                    [-6, 12, "b1"],
                    [4, 2, "b4"],
                    [-10, 8, "b4"],
                    [10, 14, "b4"],
                    [8, 22, "b4"],
                    [-8, 22, "b4"],
                    [7, 19, "b4"],
                    [-17, 7, "b4"]
                  ],
                  bump: [
                    [-12, 22],
                    [12, 20],
                    [16, 2],
                    [8, 2],
                    [-14, 10],
                    [-10, 14],
                    [14, 13],
                    [12, 3]
                  ],
                  slow: [
                    [16, 8],
                    [-2, 23],
                    [-3, 9]
                  ],
                  block: [[10, 8]],
                  boost: [[4, 14]],
                  bumpbig: [[-10, 18]],
                  wall: [[-4, 16, "b"]]
                },
                boost4: {
                  bumpbig: [[7, 19]],
                  snagsml: [[6, 6, "c1"]],
                  boost: [
                    [4, 10],
                    [-4, 10]
                  ],
                  snagtall: [[7, 14, "t3"]],
                  snag: [
                    [-10, 5, "b4"],
                    [8, 8, "b4"],
                    [-6, 16, "b1"],
                    [-4, 4, "b4"],
                    [-8, 8, "b4"],
                    [-8, 13, "b2"],
                    [4, 4, "b4"],
                    [9, 12, "b4"],
                    [-6, 6, "b6"]
                  ],
                  bump: [
                    [12, 8],
                    [-12, 18],
                    [-8, 20],
                    [8, 23]
                  ],
                  slow: [
                    [-15, 15],
                    [14, 15],
                    [16, 10],
                    [-14, 9]
                  ],
                  spin: [
                    [-7, 2],
                    [10, 3]
                  ]
                },
                boost5: {
                  boost: [[-1, 12]],
                  bump: [
                    [11, 8],
                    [-8, 22],
                    [14, 16],
                    [-6, 16],
                    [-6, 8],
                    [-14, 6],
                    [-2, 4]
                  ],
                  wall: [
                    [13, 12, "f"],
                    [-4, 20, "se"],
                    [-8, 20, "f"],
                    [-16, 20, "sw"],
                    [-12, 20, "s"],
                    [-12, 16, "n"],
                    [-8, 12, "se"],
                    [-12, 12, "w"],
                    [-10, 6, "b"],
                    [-2, 2, "se"],
                    [9, 12, "sw"],
                    [-10, 2, "w"]
                  ],
                  snag: [
                    [-16, 10, "b4"],
                    [-12, 8, "b4"],
                    [-6, 4, "b2"],
                    [5, 10, "b4"],
                    [-1, 23, "b4"]
                  ],
                  spin: [
                    [9, 17],
                    [7, 7],
                    [15, 5],
                    [1, 2]
                  ],
                  snagtall: [
                    [17, 10, "t1"],
                    [-6, 0, "t1"]
                  ]
                },
                boost6: {
                  snagtall: [[-6, 10, "t1"]],
                  spin: [
                    [6, 0],
                    [-4, 2],
                    [6, 16],
                    [-2, 18]
                  ],
                  boost: [[2, 14]],
                  snag: [
                    [-18, 11, "b1"],
                    [-12, 4, "b4"],
                    [14, 12, "b1"],
                    [-4, 7, "b4"]
                  ],
                  wall: [
                    [14, 4, "n"],
                    [-14, 8, "sw"],
                    [-10, 8, "e"],
                    [6, 8, "w"],
                    [14, 8, "se"],
                    [-10, 12, "sw"],
                    [-2, 12, "se"],
                    [6, 12, "b"],
                    [-14, 18, "b"],
                    [10, 8, "f"]
                  ],
                  bump: [
                    [-16, 2],
                    [18, 6],
                    [10, 14],
                    [-12, 22],
                    [-14, 13]
                  ]
                },
                boost7: {
                  boost: [[4, 14]],
                  snagtall: [
                    [-6, 4, "t3"],
                    [11, 1, "t3"]
                  ],
                  snag: [
                    [10, 7, "b4"],
                    [-9, 8, "b2"],
                    [4, 0, "b4"],
                    [-8, 14, "b4"],
                    [-4, 12, "b6"],
                    [6, 4, "b1"]
                  ],
                  bump: [
                    [-3, 9],
                    [-8, 12],
                    [5, 7]
                  ]
                },
                boost8: {
                  spin: [
                    [0, 3],
                    [7, 13]
                  ],
                  snag: [
                    [10, 4, "b4"],
                    [-6, 4, "b4"],
                    [-10, 6, "b4"],
                    [4, 14, "b4"],
                    [-10, 2, "b2"]
                  ],
                  bump: [
                    [-4, 8],
                    [6, 8],
                    [-8, 12]
                  ],
                  boost: [[-2, 14]]
                },
                boost9: {
                  snagtall: [[10, 0, "t1"]],
                  boost: [[0, 10]],
                  bump: [
                    [-13, 6],
                    [-4, 14],
                    [4, 6]
                  ],
                  snag: [
                    [12, 12, "b3"],
                    [6, 12, "b4"],
                    [-8, 4, "b4"]
                  ],
                  wall: [
                    [-10, 12, "sw"],
                    [-6, 12, "se"],
                    [8, 10, "b"],
                    [-10, 8, "n"],
                    [2, 2, "sw"],
                    [6, 2, "f"]
                  ],
                  snagsml: [[-8, 15, "c1"]]
                },
                boost10: {
                  bumpbig: [[10, 6]],
                  snag: [
                    [5, 11, "b1"],
                    [11, 9, "b4"],
                    [-8, 14, "b4"],
                    [-4, 12, "b4"],
                    [-10, 12, "b4"],
                    [8, 13, "b4"]
                  ],
                  bump: [
                    [8, 10],
                    [11, 1],
                    [4, 3]
                  ],
                  spiral: [[-7, 4]],
                  boost: [[0, 9]]
                },
                boost11: {
                  snag: [
                    [-14, 8, "b6"],
                    [-12, 6, "b4"]
                  ],
                  snagtall: [[13, 3, "t3"]],
                  boost: [[2, 8]],
                  wall: [
                    [-4, 10, "se"],
                    [-8, 10, "sw"],
                    [8, 6, "b"],
                    [-8, 6, "n"],
                    [8, 2, "e"],
                    [4, 2, "sw"]
                  ],
                  spin: [[-5, 1]],
                  snagsml: [[-5, 13, "c1"]],
                  bump: [
                    [11, 8],
                    [-4, 6],
                    [-12, 11]
                  ]
                }
              },
              endlessRamps: {
                ramp1: {
                  slowbig: [[-3, 2]],
                  boost: [[-2, 13]],
                  wall: [
                    [-6, 21, "b"],
                    [6, 17, "se"],
                    [-6, 17, "e"],
                    [-10, 17, "f"],
                    [-14, 17, "sw"],
                    [2, 17, "sw"],
                    [10, 13, "f"],
                    [6, 13, "w"]
                  ],
                  snag: [
                    [12, 8, "b4"],
                    [-10, 19, "b4"],
                    [3, 19, "b1"],
                    [-16, 13, "b4"],
                    [-2, 5, "b1"]
                  ],
                  snagtall: [[14, 11, "t1"]],
                  ramp: [
                    [8, 9],
                    [-12, 13],
                    [-2, 18]
                  ],
                  bump: [
                    [-16, 20],
                    [16, 5],
                    [11, 17],
                    [-17, 7]
                  ],
                  spin: [
                    [-15, 5],
                    [14, 3]
                  ]
                },
                ramp2: {
                  ramp: [[0, 17]],
                  bump: [
                    [10, 16],
                    [-10, 13]
                  ],
                  snag: [
                    [9, 2, "b6"],
                    [-13, 3, "b6"],
                    [8, 13, "b4"],
                    [-6, 9, "b4"]
                  ],
                  blockbig: [[9, 7]],
                  slowbig: [
                    [-11, 18],
                    [-17, 8]
                  ],
                  block: [[-6, 4]],
                  slow: [
                    [6, 17],
                    [-4, 13],
                    [16, 13],
                    [3, 2]
                  ],
                  spin: [
                    [2, 10],
                    [-2, 2]
                  ],
                  snagtall: [
                    [-11, 6, "t3"],
                    [11, 10, "t3"]
                  ]
                },
                ramp3: {
                  snagtall: [
                    [-15, 9, "t3"],
                    [0, 21, "t3"],
                    [-4, 10, "t1"]
                  ],
                  bump: [
                    [0, 12],
                    [-12, 13],
                    [-5, 20]
                  ],
                  snag: [
                    [11, 11, "b1"],
                    [9, 8, "b3"],
                    [14, 9, "b6"]
                  ],
                  slow: [
                    [13, 7],
                    [-18, 8],
                    [17, 16]
                  ],
                  ramp: [[4, 12]],
                  wall: [
                    [-8, 16, "sw"],
                    [-4, 16, "s"],
                    [0, 16, "f"],
                    [4, 16, "s"],
                    [8, 16, "f"],
                    [-8, 12, "w"],
                    [12, 16, "se"]
                  ],
                  slowbig: [
                    [0, 2],
                    [-12, 19]
                  ],
                  blockbig: [
                    [-8, 6],
                    [8, 19]
                  ]
                },
                ramp4: {
                  snagtall: [[10, 5, "t3"]],
                  bump: [
                    [-10, 10],
                    [8, 12],
                    [-12, 14],
                    [-4, 16],
                    [5, 17]
                  ],
                  ramp: [[0, 16]],
                  snag: [
                    [8, 14, "b2"],
                    [11, 11, "b6"],
                    [-6, 8, "b1"],
                    [-8, 4, "b4"],
                    [8, 4, "b4"],
                    [6, 8, "b4"],
                    [-4, 12, "b4"],
                    [4, 12, "b4"],
                    [-10, 12, "b4"],
                    [13, 14, "b4"],
                    [-8, 15, "b4"],
                    [-9, 7, "b3"]
                  ],
                  slow: [
                    [-7, 20],
                    [14, 2],
                    [-12, 4],
                    [-15, 8],
                    [14, 10],
                    [3, 22]
                  ]
                },
                ramp5: {
                  ramp: [
                    [-8, 4],
                    [8, 2]
                  ],
                  bump: [
                    [9, 6],
                    [-5, 5],
                    [-11, 6],
                    [5, 11]
                  ],
                  slowbig: [[-1, 9]],
                  snag: [
                    [-4, 12, "b4"],
                    [8, 10, "b4"],
                    [-10, 8, "b4"],
                    [-2, 4, "b4"],
                    [6, 5, "b4"]
                  ]
                },
                ramp6: {
                  slowbig: [[-4, 18]],
                  ramp: [[-2, 3]],
                  snag: [
                    [-11, 8, "b4"],
                    [3, 5, "b6"],
                    [6, 11, "b4"],
                    [1, 13, "b4"]
                  ],
                  blockbig: [[-2, 9]],
                  slow: [
                    [-8, 3],
                    [8, 8]
                  ],
                  snagtall: [
                    [-9, 12, "t2"],
                    [5, 13, "t3"],
                    [-13, 9, "t3"]
                  ],
                  bump: [
                    [9, 14],
                    [-13, 14],
                    [-8, 6]
                  ]
                },
                ramp7: {
                  snagsml: [[14, 12, "c1"]],
                  snagtall: [[-12, 12, "t1"]],
                  ramp: [
                    [4, 14],
                    [-4, 14]
                  ],
                  wall: [
                    [-8, 14, "se"],
                    [8, 14, "b"],
                    [12, 10, "se"],
                    [8, 10, "w"]
                  ],
                  bump: [
                    [1, 15],
                    [-9, 17],
                    [10, 16],
                    [-14, 11]
                  ],
                  snag: [
                    [-3, 2, "b4"],
                    [0, 11, "b1"],
                    [10, 6, "b4"],
                    [1, 1, "b6"],
                    [-1, 4, "b4"]
                  ],
                  slow: [
                    [-10, 4],
                    [14, 4]
                  ]
                },
                ramp8: {
                  bump: [
                    [-11, 7],
                    [-4, 4],
                    [10, 4]
                  ],
                  snag: [
                    [-10, 1, "b2"],
                    [8, 6, "b2"],
                    [10, 9, "b4"],
                    [-4, 0, "b4"],
                    [-8, 3, "b4"],
                    [-9, 6, "b4"]
                  ],
                  ramp: [[-1, 13]],
                  slow: [
                    [5, 4],
                    [-7, 12]
                  ],
                  wall: [[6, 10, "b"]],
                  snagsml: [[8, 12, "c1"]],
                  slowbig: [[0, 19]]
                }
              },
              endlessLures: {
                lure1: {
                  lure: [[-2, 11]],
                  spiral: [
                    [-13, 3],
                    [11, 7]
                  ],
                  slow: [
                    [16, 2],
                    [-8, 14]
                  ],
                  snag: [
                    [2, 1, "b5"],
                    [-3, 0, "b4"],
                    [-1, 3, "b4"]
                  ],
                  slowbig: [
                    [0, 7],
                    [-17, 9],
                    [10, 13]
                  ]
                },
                lure2: {
                  bump: [
                    [21, 6],
                    [7, 21],
                    [-1, 12],
                    [21, 18],
                    [8, 13],
                    [-20, 16]
                  ],
                  wall: [
                    [12, 10, "w"],
                    [12, 14, "w"],
                    [12, 18, "b"],
                    [4, 14, "b"],
                    [16, 14, "f"],
                    [4, 10, "n"],
                    [16, 10, "se"]
                  ],
                  snag: [
                    [-17, 14, "b4"],
                    [-18, 7, "b4"],
                    [-14, 16, "b5"],
                    [-16, 10, "b1"],
                    [1, 20, "b4"],
                    [18, 17, "b4"],
                    [0, 8, "b5"],
                    [-20, 12, "b6"],
                    [13, 6, "b4"],
                    [18, 4, "b4"]
                  ],
                  snagtall: [
                    [-21, 8, "t3"],
                    [20, 12, "t1"]
                  ],
                  slow: [[-10, 9]],
                  slowbig: [
                    [4, 5],
                    [-16, 22]
                  ],
                  bumpbig: [[1, 17]],
                  snagsml: [[14, 3, "c1"]],
                  lure: [[-8, 13]]
                },
                lure3: {
                  slow: [[0, 7]],
                  bump: [
                    [21, 7],
                    [12, 2],
                    [-16, 13]
                  ],
                  snagsml: [[17, 6, "c1"]],
                  snag: [
                    [9, 4, "b4"],
                    [-7, 0, "b4"],
                    [-5, 3, "b5"],
                    [-16, 9, "b4"],
                    [-8, 11, "b4"],
                    [-12, 12, "b4"],
                    [-17, 6, "b4"],
                    [-11, 8, "b3"],
                    [-2, 1, "b1"],
                    [7, 1, "b5"],
                    [19, 3, "b4"]
                  ],
                  spin: [[6, 10]],
                  slowbig: [
                    [-15, 3],
                    [-4, 17],
                    [16, 13]
                  ],
                  lure: [[2, 11]],
                  snagtall: [[15, 2, "t2"]]
                },
                lure4: {
                  slow: [
                    [-1, 15],
                    [8, 12]
                  ],
                  bump: [
                    [14, 9],
                    [-6, 11],
                    [-14, 12]
                  ],
                  snag: [
                    [12, 5, "b4"],
                    [-7, 2, "b5"],
                    [-15, 8, "b1"],
                    [-10, 9, "b6"],
                    [-7, 7, "b4"],
                    [9, 3, "b5"],
                    [10, 7, "b4"],
                    [13, 12, "b2"]
                  ],
                  lure: [[2, 9]],
                  slowbig: [[0, 5]],
                  snagtall: [[-12, 5, "t3"]]
                },
                lure5: {
                  slow: [[0, 13]],
                  bump: [
                    [5, 6],
                    [8, 11],
                    [-14, 5]
                  ],
                  snag: [
                    [-17, 5, "b2"],
                    [11, 9, "b4"],
                    [-9, 6, "b4"],
                    [-11, 2, "b5"],
                    [4, 3, "b5"]
                  ],
                  snagsml: [[-13, 7, "c1"]],
                  lure: [[-2, 7]],
                  snagtall: [[8, 5, "t2"]],
                  slowbig: [
                    [-3, 2],
                    [-11, 11]
                  ]
                }
              },
              endlessCheckpoints: {
                checkpoint1: {
                  snag: [
                    [25, 16, "b4"],
                    [22, 9, "b4"],
                    [17, 4, "b4"],
                    [-24, 14, "b4"],
                    [-25, 18, "b4"],
                    [-22, 16, "b4"],
                    [18, 7, "b4"],
                    [23, 18, "b6"]
                  ],
                  slow: [
                    [20, 2],
                    [-22, 22]
                  ],
                  slowbig: [
                    [-18, 2],
                    [16, 25],
                    [-15, 26]
                  ],
                  snagtall: [
                    [-24, 2, "t3"],
                    [16, 17, "t1"],
                    [-18, 10, "t1"],
                    [-26, 7, "t2"],
                    [-20, 6, "t3"],
                    [-29, 4, "t3"],
                    [22, 3, "t3"]
                  ],
                  boost: [
                    [2, 19],
                    [-2, 26],
                    [2, 32]
                  ],
                  bump: [
                    [19, 12],
                    [11, 19],
                    [-17, 16],
                    [27, 19]
                  ],
                  wall: [
                    [14, 16, "f"],
                    [14, 12, "se"],
                    [-10, 16, "se"],
                    [-14, 16, "w"],
                    [-14, 12, "f"],
                    [-14, 20, "b"],
                    [10, 16, "sw"],
                    [18, 16, "se"]
                  ],
                  checkpoint: [[0, 8]],
                  life: [
                    [3, 1],
                    [-3, 1]
                  ]
                },
                checkpoint2: {
                  blockbig: [[19, 6]],
                  block: [[-22, 9]],
                  checkpoint: [[0, 8]],
                  slowbig: [
                    [-23, 2],
                    [21, 25],
                    [-20, 26]
                  ],
                  boost: [
                    [2, 26],
                    [-2, 20],
                    [-2, 33]
                  ],
                  snagtall: [
                    [-14, 10, "t1"],
                    [18, 18, "t1"],
                    [-20, 5, "t3"],
                    [14, 2, "t3"],
                    [22, 9, "t3"]
                  ],
                  wall: [
                    [10, 20, "sw"],
                    [-18, 20, "b"],
                    [-14, 16, "f"],
                    [10, 16, "n"],
                    [14, 12, "se"],
                    [-10, 16, "se"],
                    [-18, 16, "w"],
                    [14, 20, "f"]
                  ],
                  life: [
                    [3, 1],
                    [-3, 1]
                  ],
                  snag: [
                    [-24, 14, "b4"],
                    [22, 18, "b4"],
                    [-15, 3, "b4"],
                    [22, 1, "b6"],
                    [-26, 5, "b6"],
                    [-29, 8, "b4"],
                    [24, 15, "b4"]
                  ],
                  bump: [
                    [-27, 11],
                    [16, 15],
                    [-13, 19],
                    [12, 23],
                    [26, 19]
                  ],
                  slow: [
                    [28, 9],
                    [-29, 15]
                  ],
                  snagsml: [[-23, 17, "c1"]]
                },
                checkpoint3: {
                  wall: [
                    [14, 20, "se"],
                    [-18, 12, "sw"],
                    [-14, 20, "f"],
                    [-10, 16, "n"],
                    [-14, 8, "n"],
                    [18, 8, "n"],
                    [18, 12, "se"],
                    [10, 20, "sw"],
                    [10, 16, "n"],
                    [14, 12, "f"],
                    [-14, 12, "s"],
                    [-10, 20, "se"],
                    [-26, 8, "b"]
                  ],
                  snagsml: [[-21, 6, "c1"]],
                  snag: [
                    [23, 8, "b6"],
                    [-28, 4, "b4"],
                    [-31, 7, "b4"],
                    [-27, 13, "b6"],
                    [-32, 11, "b6"],
                    [21, 3, "b4"],
                    [16, 4, "b2"]
                  ],
                  snagtall: [
                    [21, 14, "t3"],
                    [-24, 9, "t3"],
                    [-18, 18, "t1"]
                  ],
                  slowbig: [
                    [-22, 4],
                    [19, 25]
                  ],
                  life: [
                    [-3, 1],
                    [3, 1]
                  ],
                  checkpoint: [[0, 8]],
                  boost: [[0, 19]],
                  ramp: [
                    [4, 27],
                    [0, 25],
                    [-4, 27]
                  ],
                  bump: [
                    [-14, 16],
                    [17, 16],
                    [-28, 10]
                  ],
                  slow: [
                    [-22, 17],
                    [27, 7]
                  ],
                  block: [[26, 11]]
                }
              }
            };
          }
        },
        TimeTrial: {
          id: "timetrial",
          menuCluster: "timetrialMenu",
          stringLookup: { title: "modeTimetrialTitle", howto: "modeTimetrialHowToPlay" },
          setup() {
            this.loadClusters(),
              (this.edge = 576),
              (this.clusters = [
                "start",
                "intro",
                "act1a",
                "act1b",
                "act2a",
                "act2b",
                "act3a",
                "act3b",
                "act4a",
                "act4b",
                "act5a",
                "act5b",
                "act6a",
                "act6b",
                "act7a",
                "act7b",
                "finish"
              ]);
          },
          reset() {
            (this.counter = 0),
              (this.pixels = { next: 0, add: 1088 }),
              (this.distance = { friend: { next: 3e3, add: 3e3 } });
          },
          getScore: () => gA.sys.game.time.elapsed - 2 * gA.sys.game.coins,
          getScoreFormatted() {
            return i(this.getScore());
          },
          getHighScore: () => Math.min(3599.99, gA.sys.highScore.timetrial),
          getHighScoreFormatted() {
            return i(this.getHighScore());
          },
          scoreMeter() {
            return 1 - this.getScore() / this.getHighScore();
          },
          almostHighScore() {
            return this.scoreMeter() <= 0.1;
          },
          saveScore() {
            if (gA.sys.game.cheat.used) return;
            const A = this.getScore();
            A < gA.sys.highScore.timetrial &&
              gA.sys.game.finish &&
              ((gA.sys.highScore.timetrial = A), gA.sys.triggerHighScore());
          },
          buildStartScene() {
            this.buildNextLevel();
          },
          update() {
            T.sys.passed(this.pixels) && this.buildNextLevel(), this.checkDistances();
          },
          checkCollisions() {
            R.checkPlayerObjects();
          },
          collisionEvent(A) {
            switch (A.type) {
              case "finish":
                Z.gameFinishline();
                break;
              case "ramp":
                Z.playerAir(576);
            }
          },
          checkPass(A) {
            A.hit;
          },
          checkDistances() {
            const A = gA.sys.game.dist;
            Math.abs(A.x) > this.edge && Z.gameLose();
          },
          buildNextLevel() {
            if (this.counter >= this.clusters.length) return;
            const A = this.clusters[this.counter],
              t = gA.sys.session.x - gA.sys.game.dist.x,
              e = T.sys.getNextLevelHeight(this.pixels.next);
            T.sys.buildCluster("timetrialScenes", t, e, A), (this.counter += 1);
          },
          loadClusters() {
            this.library = {
              timetrialMenu: {
                menu1: {
                  snag: [
                    [-31, -8, "b1"],
                    [-22, 2, "b1"],
                    [-25, -8, "b4"],
                    [-26, -5, "b4"],
                    [25, 8, "b3"],
                    [31, -7, "b2"],
                    [32, -11, "b4"],
                    [-27, 6, "b6"],
                    [31, 1, "b4"],
                    [24, 5, "b1"],
                    [30, -1, "b1"],
                    [24, -4, "b4"]
                  ],
                  block: [[30, 10]],
                  snagsml: [
                    [-30, -3, "c5"],
                    [-32, -1, "c4"],
                    [-28, 1, "c5"],
                    [25, -2, "c1"],
                    [18, -5, "c3"],
                    [-21, -8, "c3"],
                    [25, 16, "c3"],
                    [18, 10, "c3"],
                    [-21, 13, "c3"],
                    [-18, 10, "c3"],
                    [-25, 16, "c3"],
                    [21, 13, "c3"],
                    [-18, -5, "c3"],
                    [21, -8, "c3"],
                    [-32, 2, "c5"]
                  ],
                  wall: [
                    [18, 0, "n"],
                    [-18, 0, "n"],
                    [-18, 4, "b"],
                    [18, 4, "b"]
                  ],
                  ramp: [
                    [-12, 2],
                    [26, -12],
                    [-26, -12],
                    [12, 2]
                  ],
                  bump: [
                    [30, -8],
                    [29, 3],
                    [-22, 6],
                    [-23, -5],
                    [-31, -11]
                  ],
                  slow: [
                    [16, -6],
                    [-20, -16],
                    [-37, 0],
                    [28, -3],
                    [-39, -18],
                    [-40, -7],
                    [37, 5],
                    [-48, 19],
                    [46, 17],
                    [50, 9],
                    [-47, -12],
                    [40, -17],
                    [45, -11],
                    [-43, 6],
                    [-17, -8],
                    [17, -15]
                  ],
                  slowbig: [
                    [31, 16],
                    [38, 25],
                    [-40, 26],
                    [-33, 16],
                    [-48, 2],
                    [46, -4]
                  ],
                  blockbig: [[-29, 9]],
                  snagtall: [[33, 5, "t3"]]
                }
              },
              timetrialScenes: {
                start: {
                  snagtall: [
                    [-17, 45, "t3"],
                    [16, 47, "t3"],
                    [-20, 22, "t1"]
                  ],
                  snag: [
                    [22, 20, "b4"],
                    [-14, 20, "b4"],
                    [-28, 22, "b4"],
                    [18, 26, "b4"],
                    [-20, 26, "b4"],
                    [30, 28, "b4"],
                    [-34, 28, "b4"],
                    [-16, 30, "b4"],
                    [20, 32, "b4"],
                    [30, 34, "b4"],
                    [-30, 36, "b4"],
                    [22, 40, "b4"],
                    [-20, 56, "b2"]
                  ],
                  bump: [
                    [-26, 20],
                    [28, 24],
                    [14, 26],
                    [-16, 26],
                    [-28, 28],
                    [20, 30],
                    [-22, 34],
                    [26, 42],
                    [10, 48],
                    [22, 50],
                    [-8, 50],
                    [-26, 52],
                    [-12, 56],
                    [-16, 58]
                  ],
                  wall: [
                    [12, 24, "sw"],
                    [16, 24, "f"],
                    [20, 24, "se"],
                    [-12, 24, "se"],
                    [-16, 24, "f"],
                    [-24, 24, "w"],
                    [24, 28, "n"],
                    [-24, 28, "n"],
                    [16, 30, "b"],
                    [24, 32, "sw"],
                    [28, 32, "f"],
                    [32, 32, "se"],
                    [-20, 32, "se"],
                    [-24, 32, "s"],
                    [-28, 32, "f"],
                    [-32, 32, "sw"]
                  ],
                  ramp: [
                    [14, 40],
                    [-14, 40]
                  ],
                  spin: [
                    [-12, 44],
                    [12, 52]
                  ],
                  blockbig: [
                    [-16, 50],
                    [17, 44]
                  ],
                  slow: [
                    [-28, 50],
                    [28, 52],
                    [-4, 52],
                    [6, 54],
                    [-26, 58],
                    [-21, 45]
                  ],
                  snagsml: [[-24, 46, "c5"]],
                  coin: [[0, 60]]
                },
                intro: {
                  ramp: [[0, 54]],
                  coin: [[22, 44]],
                  boost: [[-22, 44]],
                  bumpbig: [
                    [-20, 20],
                    [18, 18]
                  ],
                  slow: [
                    [8, 46],
                    [-4, 44],
                    [-34, 42],
                    [34, 36],
                    [8, 36],
                    [30, 34],
                    [-18, 24],
                    [18, 22],
                    [-32, 22],
                    [-12, 20],
                    [-30, 18],
                    [24, 16]
                  ],
                  spin: [
                    [20, 26],
                    [-22, 26],
                    [-10, 20],
                    [32, 18],
                    [-32, 18],
                    [12, 14]
                  ],
                  bump: [
                    [-8, 62],
                    [8, 60],
                    [-30, 48],
                    [12, 46],
                    [-8, 46],
                    [-34, 46],
                    [30, 44],
                    [-14, 44],
                    [32, 40],
                    [26, 34],
                    [-26, 34],
                    [-14, 24],
                    [30, 22],
                    [12, 22],
                    [-28, 22],
                    [28, 18],
                    [-2, 10],
                    [6, 8],
                    [-6, 6],
                    [2, 4]
                  ],
                  block: [[-9, 38]],
                  snagtall: [[14, 37, "t3"]],
                  snagsml: [
                    [30, 36, "c2"],
                    [-4, 6, "c2"],
                    [10, 42, "c4"],
                    [-28, 38, "c1"]
                  ],
                  snag: [
                    [-4, 60, "b2"],
                    [1, 6, "b2"],
                    [4, 60, "b4"],
                    [-2, 58, "b4"],
                    [16, 42, "b4"],
                    [-30, 42, "b4"],
                    [-8, 42, "b4"],
                    [26, 40, "b4"],
                    [-16, 40, "b4"],
                    [12, 36, "b4"],
                    [-14, 36, "b4"],
                    [-10, 34, "b4"],
                    [2, 8, "b4"],
                    [-2, 4, "b4"],
                    [24, 36, "b6"],
                    [-26, 36, "b3"]
                  ]
                },
                act1a: {
                  snagsml: [
                    [-18, 11, "c1"],
                    [5, 46, "c1"]
                  ],
                  bump: [
                    [-17, 32],
                    [-6, 57],
                    [-14, 56],
                    [10, 60],
                    [16, 56],
                    [6, 50],
                    [-34, 48],
                    [30, 48],
                    [-4, 46],
                    [-32, 42],
                    [-22, 40],
                    [-12, 40],
                    [34, 40],
                    [10, 38],
                    [-30, 34],
                    [32, 34],
                    [18, 30],
                    [-26, 24],
                    [30, 24],
                    [14, 18],
                    [-20, 16],
                    [20, 16],
                    [-10, 14],
                    [14, 12],
                    [-14, 10]
                  ],
                  snag: [
                    [7, 55, "b6"],
                    [12, 58, "b4"],
                    [14, 56, "b2"],
                    [-6, 48, "b4"],
                    [-10, 40, "b4"],
                    [12, 40, "b4"],
                    [-18, 34, "b2"],
                    [18, 28, "b4"],
                    [16, 16, "b4"],
                    [-16, 14, "b4"],
                    [-12, 12, "b4"],
                    [18, 12, "b4"],
                    [-7, 54, "b6"],
                    [-9, 58, "b1"],
                    [12, 14, "b1"]
                  ],
                  wall: [
                    [-26, 48, "b"],
                    [-10, 52, "se"],
                    [-14, 52, "sw"],
                    [10, 52, "sw"],
                    [14, 52, "se"],
                    [-10, 48, "n"],
                    [10, 48, "n"],
                    [26, 48, "b"],
                    [-26, 44, "n"],
                    [-6, 44, "se"],
                    [-10, 44, "w"],
                    [6, 44, "sw"],
                    [10, 44, "e"],
                    [26, 44, "n"],
                    [-26, 40, "n"],
                    [-6, 40, "n"],
                    [6, 40, "n"],
                    [26, 40, "n"],
                    [-22, 36, "se"],
                    [-26, 36, "w"],
                    [-6, 36, "n"],
                    [6, 36, "n"],
                    [22, 36, "sw"],
                    [26, 36, "e"],
                    [-22, 32, "n"],
                    [-6, 32, "n"],
                    [6, 32, "n"],
                    [22, 32, "n"],
                    [-18, 28, "se"],
                    [-22, 28, "w"],
                    [-6, 28, "n"],
                    [6, 28, "n"],
                    [-18, 24, "n"]
                  ],
                  life: [[-20, 48]],
                  bumpbig: [
                    [32, 52],
                    [-32, 30],
                    [32, 30],
                    [-29, 54]
                  ],
                  coin: [[24, 14]],
                  spiral: [
                    [6, 8],
                    [-6, 6]
                  ]
                },
                act1b: {
                  snag: [
                    [4, 32, "b4"],
                    [8, 36, "b2"],
                    [-8, 46, "b1"],
                    [-6, 44, "b7"],
                    [-10, 40, "b4"],
                    [-22, 38, "b4"],
                    [-4, 36, "b3"],
                    [-28, 28, "b2"],
                    [28, 8, "b4"],
                    [2, 6, "b4"],
                    [0, 4, "b4"],
                    [11, 34, "b6"],
                    [26, 27, "b2"]
                  ],
                  bump: [
                    [-3, 40],
                    [0, 60],
                    [2, 50],
                    [-24, 48],
                    [-32, 46],
                    [34, 46],
                    [-30, 42],
                    [6, 40],
                    [20, 40],
                    [32, 38],
                    [-20, 36],
                    [-8, 34],
                    [-32, 34],
                    [30, 34],
                    [8, 32],
                    [-30, 30],
                    [-22, 24],
                    [24, 24],
                    [-34, 24],
                    [30, 10],
                    [-28, 10],
                    [0, 8],
                    [32, 25]
                  ],
                  snagtall: [
                    [-6, 37, "t3"],
                    [10, 39, "t3"],
                    [-22, 30, "t1"],
                    [0, 56, "t1"]
                  ],
                  spiral: [
                    [-2, 26],
                    [6, 22]
                  ],
                  bumpbig: [
                    [32, 18],
                    [-32, 16]
                  ],
                  ramp: [
                    [-16, 14],
                    [16, 14]
                  ],
                  wall: [
                    [-4, 58, "sw"],
                    [4, 58, "se"],
                    [4, 54, "n"],
                    [-26, 44, "sw"],
                    [-22, 44, "se"],
                    [26, 44, "se"],
                    [22, 44, "sw"],
                    [-26, 40, "n"],
                    [26, 40, "n"],
                    [-26, 36, "n"],
                    [22, 36, "sw"],
                    [26, 36, "e"],
                    [-18, 32, "se"],
                    [-26, 32, "w"],
                    [22, 32, "n"],
                    [-18, 28, "n"],
                    [18, 28, "s"],
                    [14, 28, "sw"],
                    [22, 28, "e"],
                    [-18, 24, "w"],
                    [-10, 24, "se"],
                    [-14, 24, "f"],
                    [18, 24, "n"],
                    [-22, 20, "sw"],
                    [-18, 20, "e"],
                    [22, 20, "se"],
                    [18, 20, "w"],
                    [-22, 16, "n"],
                    [22, 16, "n"],
                    [-22, 12, "n"],
                    [22, 12, "n"]
                  ],
                  coin: [[3, 36]]
                },
                act2a: {
                  snag: [
                    [8, 41, "b2"],
                    [7, 46, "b6"],
                    [12, 54, "b2"],
                    [28, 52, "b2"],
                    [30, 48, "b4"],
                    [28, 42, "b4"],
                    [12, 42, "b4"],
                    [24, 38, "b4"],
                    [-6, 26, "b4"],
                    [-13, 18, "b4"],
                    [5, 12, "b6"],
                    [10, 44, "b4"],
                    [-6, 55, "b4"]
                  ],
                  snagtall: [
                    [30, 43, "t2"],
                    [-16, 22, "t1"],
                    [16, 10, "t3"],
                    [9, 47, "t3"]
                  ],
                  snagsml: [
                    [10, 15, "c4"],
                    [12, 12, "c5"],
                    [9, 11, "c5"],
                    [25, 40, "c1"]
                  ],
                  blockbig: [[10, 7]],
                  boost: [[24, 48]],
                  spin: [
                    [10, 38],
                    [20, 34],
                    [6, 32],
                    [-6, 30]
                  ],
                  wall: [
                    [4, 40, "b"],
                    [4, 36, "e"],
                    [0, 36, "sw"],
                    [-10, 36, "b"],
                    [-10, 32, "n"],
                    [-8, 24, "se"],
                    [-12, 24, "f"]
                  ],
                  bumpbig: [
                    [-18, 46],
                    [32, 38],
                    [-20, 38],
                    [32, 30],
                    [-24, 30],
                    [-26, 22],
                    [-28, 14]
                  ],
                  bump: [
                    [12, 58],
                    [8, 56],
                    [2, 56],
                    [34, 54],
                    [-22, 54],
                    [4, 52],
                    [-20, 50],
                    [36, 48],
                    [34, 42],
                    [-12, 42],
                    [-18, 42],
                    [0, 40],
                    [-28, 40],
                    [8, 36],
                    [32, 34],
                    [-22, 34],
                    [-28, 34],
                    [-14, 32],
                    [-36, 30],
                    [-32, 28],
                    [32, 26],
                    [-12, 26],
                    [-26, 26],
                    [28, 24],
                    [34, 24],
                    [34, 20],
                    [-36, 18],
                    [-22, 18],
                    [-30, 18],
                    [30, 16],
                    [-36, 12],
                    [-28, 10],
                    [-22, 8],
                    [-26, 6]
                  ],
                  coin: [[14, 19]]
                },
                act2b: {
                  snagtall: [
                    [-20, 26, "t1"],
                    [4, 6, "t1"],
                    [6, 48, "t1"],
                    [-8, 46, "t2"]
                  ],
                  wall: [
                    [-4, 4, "e"],
                    [-8, 4, "sw"],
                    [-24, 6, "se"],
                    [12, 8, "e"],
                    [8, 8, "f"],
                    [0, 8, "f"],
                    [-4, 8, "sw"],
                    [-32, 10, "w"],
                    [-28, 10, "se"],
                    [12, 12, "b"],
                    [-32, 14, "n"],
                    [-32, 18, "b"],
                    [-12, 28, "se"],
                    [-16, 28, "f"],
                    [-4, 42, "b"],
                    [2, 50, "f"],
                    [-2, 50, "w"],
                    [-26, 50, "n"],
                    [-2, 54, "n"],
                    [-26, 54, "b"],
                    [-2, 58, "se"],
                    [-6, 58, "sw"],
                    [-28, 6, "w"]
                  ],
                  bump: [
                    [16, 6],
                    [-10, 8],
                    [-36, 8],
                    [18, 12],
                    [6, 16],
                    [12, 16],
                    [-28, 18],
                    [8, 20],
                    [32, 20],
                    [4, 22],
                    [10, 24],
                    [24, 24],
                    [36, 28],
                    [12, 30],
                    [8, 32],
                    [-16, 32],
                    [2, 34],
                    [0, 42],
                    [6, 42],
                    [-6, 52],
                    [-30, 52],
                    [30, 54],
                    [4, 54],
                    [-22, 54],
                    [-28, 56],
                    [32, 60],
                    [-8, 60],
                    [-26, 60],
                    [24, 62]
                  ],
                  snag: [
                    [-6, 10, "b4"],
                    [32, 12, "b4"],
                    [-36, 12, "b4"],
                    [-26, 14, "b4"],
                    [34, 16, "b4"],
                    [32, 22, "b4"],
                    [28, 24, "b4"],
                    [34, 24, "b4"],
                    [-12, 24, "b4"],
                    [-8, 26, "b1"],
                    [-24, 26, "b1"],
                    [30, 26, "b4"],
                    [32, 28, "b4"],
                    [26, 28, "b4"],
                    [-14, 34, "b4"],
                    [30, 36, "b4"],
                    [-10, 44, "b4"],
                    [-24, 46, "b4"],
                    [32, 56, "b4"],
                    [30, 58, "b4"],
                    [26, 60, "b4"]
                  ],
                  ramp: [
                    [-16, 12],
                    [26, 16]
                  ],
                  bumpbig: [
                    [4, 28],
                    [4, 38],
                    [0, 46]
                  ],
                  coin: [[-30, 34]],
                  life: [[24, 34]]
                },
                act3a: {
                  blockbig: [[0, 52]],
                  block: [
                    [-36, 34],
                    [-14, 11]
                  ],
                  ramp: [
                    [20, 6],
                    [8, 6],
                    [-18, 6],
                    [-10, 30],
                    [14, 54],
                    [-24, 54]
                  ],
                  bumpbig: [
                    [-8, 8],
                    [24, 24],
                    [-6, 34],
                    [36, 42],
                    [-36, 46],
                    [36, 58],
                    [-10, 58]
                  ],
                  boost: [
                    [-10, 22],
                    [26, 56]
                  ],
                  snagsml: [[25, 27, "c1"]],
                  snagtall: [
                    [0, 30, "t2"],
                    [-23, 12, "t3"],
                    [3, 55, "t3"],
                    [32, 30, "t3"],
                    [30, 26, "t3"],
                    [-31, 37, "t3"]
                  ],
                  bump: [
                    [-26, 4],
                    [-20, 12],
                    [-22, 18],
                    [-4, 26],
                    [-34, 26],
                    [22, 28],
                    [-18, 32],
                    [-32, 32],
                    [32, 36],
                    [-8, 38],
                    [0, 46],
                    [36, 54],
                    [20, 54],
                    [-36, 54],
                    [-2, 60],
                    [-10, 15],
                    [-35, 39]
                  ],
                  snag: [
                    [28, 30, "b6"],
                    [-8, 51, "b6"],
                    [-24, 2, "b4"],
                    [-8, 6, "b4"],
                    [-26, 8, "b4"],
                    [-28, 10, "b4"],
                    [-8, 12, "b4"],
                    [-16, 14, "b4"],
                    [28, 18, "b4"],
                    [12, 18, "b4"],
                    [22, 20, "b4"],
                    [0, 24, "b4"],
                    [-36, 28, "b4"],
                    [-2, 28, "b4"],
                    [2, 28, "b4"],
                    [-34, 30, "b4"],
                    [-20, 30, "b4"],
                    [-6, 30, "b4"],
                    [36, 32, "b4"],
                    [26, 34, "b4"],
                    [28, 36, "b4"],
                    [-6, 36, "b4"],
                    [-36, 42, "b4"],
                    [32, 44, "b4"],
                    [34, 48, "b4"],
                    [-34, 48, "b4"],
                    [2, 48, "b4"],
                    [32, 50, "b4"],
                    [18, 56, "b4"],
                    [-8, 56, "b4"],
                    [-4, 58, "b4"],
                    [36, 60, "b4"],
                    [-6, 49, "b4"],
                    [10, 16, "b6"]
                  ]
                },
                act3b: {
                  snag: [
                    [31, 50, "b6"],
                    [-8, 34, "b3"],
                    [-33, 32, "b6"],
                    [-22, 60, "b4"],
                    [-26, 58, "b4"],
                    [32, 58, "b4"],
                    [-28, 56, "b4"],
                    [26, 56, "b4"],
                    [-36, 54, "b4"],
                    [-24, 54, "b4"],
                    [-34, 50, "b4"],
                    [14, 48, "b4"],
                    [-16, 44, "b4"],
                    [12, 44, "b4"],
                    [36, 42, "b4"],
                    [34, 36, "b4"],
                    [-36, 34, "b4"],
                    [0, 32, "b4"],
                    [-32, 24, "b4"],
                    [28, 24, "b4"],
                    [32, 20, "b4"],
                    [-34, 18, "b4"],
                    [0, 16, "b4"],
                    [30, 16, "b4"],
                    [-16, 14, "b4"],
                    [34, 14, "b4"],
                    [26, 12, "b4"],
                    [-24, 10, "b4"],
                    [12, 10, "b4"],
                    [22, 10, "b4"],
                    [16, 8, "b4"],
                    [30, 8, "b4"],
                    [-20, 6, "b4"],
                    [-26, 4, "b2"]
                  ],
                  bump: [
                    [32, 46],
                    [-32, 52],
                    [8, 48],
                    [16, 46],
                    [-10, 38],
                    [24, 38],
                    [-30, 34],
                    [-4, 32],
                    [4, 30],
                    [-32, 28],
                    [30, 26],
                    [-2, 20],
                    [-6, 18],
                    [28, 18],
                    [-36, 16],
                    [22, 16],
                    [-18, 12],
                    [32, 10],
                    [34, 6]
                  ],
                  snagsml: [
                    [18, 42, "c2"],
                    [15, 13, "c1"]
                  ],
                  snagtall: [
                    [-36, 27, "t3"],
                    [10, 45, "t3"],
                    [20, 11, "t3"],
                    [34, 46, "t3"]
                  ],
                  life: [[-26, 46]],
                  coin: [[22, 22]],
                  bumpbig: [
                    [-32, 62],
                    [34, 60],
                    [30, 54],
                    [-16, 42],
                    [-38, 22],
                    [32, 18],
                    [-20, 8]
                  ],
                  ramp: [
                    [-18, 38],
                    [14, 38],
                    [-4, 14],
                    [28, 4]
                  ]
                },
                act4a: {
                  snagsml: [
                    [6, 57, "c1"],
                    [14, 23, "c1"]
                  ],
                  snag: [
                    [-16, 52, "b6"],
                    [-26, 5, "b4"],
                    [42, 52, "b4"],
                    [38, 46, "b4"],
                    [31, 42, "b4"],
                    [-34, 52, "b4"],
                    [-37, 49, "b4"],
                    [-12, 62, "b4"],
                    [14, 58, "b4"],
                    [-14, 58, "b4"],
                    [38, 54, "b4"],
                    [-10, 50, "b4"],
                    [42, 50, "b4"],
                    [32, 46, "b4"],
                    [-34, 46, "b4"],
                    [30, 44, "b4"],
                    [-32, 44, "b4"],
                    [12, 42, "b4"],
                    [-34, 42, "b4"],
                    [-42, 42, "b4"],
                    [34, 40, "b4"],
                    [-36, 40, "b4"],
                    [-40, 40, "b4"],
                    [16, 38, "b4"],
                    [10, 36, "b4"],
                    [6, 34, "b4"],
                    [18, 30, "b4"],
                    [-8, 30, "b4"],
                    [-10, 26, "b4"],
                    [-32, 26, "b4"],
                    [-14, 24, "b4"],
                    [10, 22, "b4"],
                    [-10, 20, "b4"],
                    [-14, 20, "b4"],
                    [-32, 16, "b4"],
                    [-12, 8, "b4"],
                    [-28, 8, "b4"],
                    [6, 6, "b4"],
                    [-10, 6, "b4"],
                    [34, 4, "b4"],
                    [30, 2, "b4"],
                    [-12, 2, "b4"],
                    [-41, 45, "b4"],
                    [-39, 47, "b4"],
                    [-32, 54, "b4"],
                    [40, 48, "b4"],
                    [35, 47, "b4"],
                    [-26, 14, "b6"],
                    [2, 8, "b6"],
                    [8, 61, "b3"],
                    [-13, 54, "b1"]
                  ],
                  snagtall: [
                    [14, 33, "t3"],
                    [-12, 27, "t3"],
                    [-30, 5, "t3"],
                    [7, 23, "t2"],
                    [32, 10, "t3"]
                  ],
                  bump: [
                    [5, 24],
                    [-43, 42],
                    [-34, 49],
                    [10, 62],
                    [4, 60],
                    [-16, 60],
                    [10, 56],
                    [-10, 56],
                    [40, 54],
                    [-30, 54],
                    [-12, 48],
                    [36, 46],
                    [-42, 46],
                    [36, 40],
                    [-38, 40],
                    [14, 40],
                    [6, 38],
                    [18, 34],
                    [4, 32],
                    [10, 28],
                    [16, 26],
                    [-16, 26],
                    [-34, 24],
                    [18, 22],
                    [-8, 22],
                    [-30, 18],
                    [-36, 18],
                    [30, 10],
                    [-14, 6],
                    [6, 4],
                    [-8, 4],
                    [-28, 4],
                    [29, 42],
                    [-17, 55]
                  ],
                  boost: [
                    [18, 46],
                    [-28, 40]
                  ],
                  bumpbig: [
                    [-10, 32],
                    [-30, 12],
                    [32, 6]
                  ],
                  ramp: [
                    [24, 22],
                    [-24, 22],
                    [0, 4]
                  ]
                },
                act4b: {
                  slowbig: [
                    [-16, 42],
                    [-14, 32],
                    [17, 43],
                    [30, 39],
                    [-32, 26],
                    [-31, 37]
                  ],
                  ramp: [
                    [22, 18],
                    [0, 8],
                    [-22, 12]
                  ],
                  snag: [
                    [15, 34, "b4"],
                    [-9, 58, "b6"],
                    [-6, 10, "b4"],
                    [34, 62, "b4"],
                    [-32, 62, "b4"],
                    [-30, 60, "b4"],
                    [32, 58, "b4"],
                    [8, 58, "b4"],
                    [12, 56, "b4"],
                    [-12, 56, "b4"],
                    [-34, 56, "b4"],
                    [36, 54, "b4"],
                    [28, 40, ["special4"]],
                    [18, 38, ["special3"]],
                    [-28, 38, ["special1"]],
                    [-16, 36, ["special2"]],
                    [-6, 30, "b4"],
                    [26, 28, "b4"],
                    [-4, 28, "b4"],
                    [-8, 28, "b4"],
                    [-24, 28, "b3"],
                    [16, 26, "b4"],
                    [-12, 26, "b4"],
                    [28, 24, "b4"],
                    [14, 24, "b4"],
                    [-18, 22, "b4"],
                    [26, 20, "b4"],
                    [12, 20, "b4"],
                    [-16, 20, "b4"],
                    [-20, 20, "b4"],
                    [8, 18, "b4"],
                    [32, 16, "b4"],
                    [-24, 16, "b4"],
                    [2, 14, "b4"],
                    [-26, 14, "b4"],
                    [30, 12, "b4"],
                    [-2, 12, "b4"],
                    [-28, 12, "b4"],
                    [-30, 10, "b4"],
                    [32, 8, "b4"],
                    [34, 6, "b4"],
                    [-12, 6, "b4"],
                    [-34, 6, "b4"],
                    [30, 4, "b4"],
                    [-10, 4, "b4"],
                    [16, 2, "b4"],
                    [-14, 2, "b4"],
                    [-30, 2, "b4"],
                    [-34, 0, "b4"],
                    [-8, 8, "b6"],
                    [-1, 30, "b6"],
                    [0, 33, "b4"]
                  ],
                  snagtall: [
                    [-32, 57, "t3"],
                    [18, 29, "t3"],
                    [-14, 22, "t3"],
                    [-28, 5, "t3"],
                    [13, 3, "t3"],
                    [30, 17, "t3"],
                    [4, 14, "t3"],
                    [-26, 17, "t3"]
                  ],
                  blockbig: [
                    [26, 34],
                    [-26, 32]
                  ],
                  coin: [[6, 28]],
                  friend: [[-8, 18]],
                  bumpbig: [
                    [-32, 18],
                    [34, 16],
                    [32, 10],
                    [7, 18]
                  ],
                  bump: [
                    [30, 62],
                    [10, 62],
                    [-10, 62],
                    [-36, 62],
                    [36, 60],
                    [-14, 58],
                    [-30, 58],
                    [32, 56],
                    [10, 54],
                    [14, 32],
                    [-4, 32],
                    [22, 28],
                    [-10, 26],
                    [-18, 26],
                    [16, 24],
                    [10, 22],
                    [-22, 22],
                    [-32, 22],
                    [28, 18],
                    [-20, 18],
                    [-30, 14],
                    [-10, 10],
                    [16, 6],
                    [-32, 4],
                    [32, 2],
                    [12, 2]
                  ],
                  snagsml: [[14, 60, "c1"]]
                },
                act5a: {
                  spiral: [
                    [10, 36],
                    [0, 32]
                  ],
                  coin: [[6, 30]],
                  slow: [
                    [0, 36],
                    [12, 24],
                    [0, 24]
                  ],
                  snag: [
                    [22, 50, "b4"],
                    [-14, 44, "b4"],
                    [-8, 42, "b4"],
                    [-12, 40, "b4"],
                    [-22, 20, "b2"]
                  ],
                  snagsml: [
                    [-18, 50, "c5"],
                    [16, 48, "c5"],
                    [8, 46, "c5"],
                    [10, 42, "c5"],
                    [-12, 20, "c5"],
                    [26, 16, "c5"],
                    [16, 14, "c5"],
                    [-6, 12, "c5"],
                    [-18, 12, "c5"]
                  ],
                  bump: [
                    [-18, 58],
                    [-22, 52],
                    [10, 50],
                    [-10, 46],
                    [20, 16],
                    [-6, 16],
                    [-28, 16],
                    [28, 14],
                    [-10, 14],
                    [14, 12]
                  ],
                  blockbig: [
                    [-14, 52],
                    [16, 44],
                    [-18, 16],
                    [24, 10]
                  ],
                  spin: [
                    [-2, 48],
                    [18, 4]
                  ],
                  slowbig: [
                    [32, 36],
                    [-20, 30],
                    [12, 28],
                    [-2, 28],
                    [-8, 6],
                    [12, 2]
                  ]
                },
                act5b: {
                  bumpbig: [[0, 17]],
                  blockbig: [
                    [-10, 51],
                    [-28, 36],
                    [17, 32]
                  ],
                  slowbig: [
                    [-31, 52],
                    [-22, 32],
                    [-24, 14],
                    [24, 16],
                    [-10, 24],
                    [21, 45]
                  ],
                  bump: [
                    [-20, 37],
                    [10, 38],
                    [28, 2],
                    [-30, 10],
                    [-34, 46],
                    [33, 41],
                    [3, 10],
                    [-5, 49]
                  ],
                  wall: [
                    [20, 40, "f"],
                    [0, 6, "se"],
                    [-4, 6, "w"],
                    [-4, 10, "n"],
                    [4, 14, "se"],
                    [-4, 14, "s"],
                    [-8, 14, "sw"],
                    [24, 36, "n"],
                    [28, 40, "se"],
                    [24, 40, "s"],
                    [12, 40, "sw"],
                    [-24, 40, "n"],
                    [-28, 44, "w"],
                    [-24, 44, "se"],
                    [10, 46, "b"],
                    [-8, 48, "b"],
                    [-28, 48, "b"]
                  ],
                  snagtall: [
                    [16, 38, "t1"],
                    [0, 12, "t1"],
                    [-9, 42, "t3"]
                  ],
                  snag: [
                    [-23, 47, "b1"],
                    [30, 4, "b4"],
                    [-26, 4, "b4"],
                    [-32, 6, "b4"],
                    [26, 10, "b4"],
                    [8, 16, "b1"],
                    [-12, 46, "b1"],
                    [29, 35, "b1"],
                    [25, 6, "b6"]
                  ],
                  snagsml: [
                    [21, 2, "c2"],
                    [32, 38, "c1"],
                    [10, 34, "c5"],
                    [-26, 8, "c4"],
                    [24, 30, "c5"],
                    [-30, 39, "c5"],
                    [-20, 40, "c5"],
                    [-14, 49, "c5"],
                    [34, 8, "c2"],
                    [-20, 8, "c2"],
                    [-34, 10, "c2"]
                  ],
                  life: [[2, 42]],
                  coin: [[-22, 54]]
                },
                act6a: {
                  snagtall: [
                    [14, 45, "t3"],
                    [30, 33, "t3"],
                    [-7, 30, "t3"],
                    [-30, 35, "t3"],
                    [-14, 8, "t3"],
                    [-44, 20, "t3"],
                    [28, 27, "t2"]
                  ],
                  snag: [
                    [12, 44, "b4"],
                    [-20, 50, "b6"],
                    [-25, 4, "b2"],
                    [16, 58, "b6"],
                    [34, 41, "b4"],
                    [-8, 14, "b6"],
                    [12, 60, "b4"],
                    [-18, 54, "b4"],
                    [12, 54, "b4"],
                    [-12, 52, "b4"],
                    [-16, 48, "b4"],
                    [34, 48, "b4"],
                    [10, 48, "b4"],
                    [30, 44, "b4"],
                    [18, 44, "b4"],
                    [16, 42, "b4"],
                    [28, 40, "b4"],
                    [-34, 38, "b4"],
                    [-4, 38, "b4"],
                    [-32, 34, "b4"],
                    [-26, 34, "b4"],
                    [-10, 34, "b4"],
                    [32, 32, "b4"],
                    [8, 30, "b4"],
                    [4, 28, "b4"],
                    [0, 26, "b4"],
                    [32, 26, "b4"],
                    [14, 14, "b4"],
                    [18, 12, "b4"],
                    [24, 10, "b4"],
                    [-24, 8, "b4"],
                    [-28, 6, "b4"],
                    [-22, 6, "b4"],
                    [-8, 6, "b4"],
                    [-43, 14, "b6"],
                    [-10, 11, "b4"],
                    [-12, 13, "b4"],
                    [14, 56, "b3"],
                    [-28, 39, "b6"],
                    [16, 49, "b4"]
                  ],
                  snagsml: [
                    [26, 22, "c1"],
                    [6, 34, "c2"],
                    [-8, 40, "c1"]
                  ],
                  bumpbig: [
                    [-18, 14],
                    [22, 16]
                  ],
                  coin: [[22, 58]],
                  life: [[-26, 48]],
                  ramp: [[4, 20]],
                  bump: [
                    [8, 58],
                    [-22, 54],
                    [10, 52],
                    [-14, 50],
                    [30, 48],
                    [-4, 42],
                    [16, 40],
                    [-24, 38],
                    [-10, 38],
                    [-36, 34],
                    [36, 28],
                    [4, 26],
                    [30, 24],
                    [22, 20],
                    [-12, 18],
                    [-28, 12],
                    [-20, 10],
                    [-16, 6]
                  ]
                },
                act6b: {
                  slowbig: [
                    [-12, 49],
                    [-27, 4],
                    [31, 49],
                    [40, 21],
                    [16, 5],
                    [2, 42],
                    [4, 2],
                    [35, 15],
                    [-38, 13],
                    [-18, 39],
                    [-33, 43]
                  ],
                  block: [
                    [-27, 12],
                    [28, 38]
                  ],
                  slow: [
                    [-35, 20],
                    [-14, 24],
                    [8, 16],
                    [-8, 18],
                    [14, 22],
                    [-2, 30],
                    [42, 42],
                    [-24, 27]
                  ],
                  snagtall: [
                    [15, 12, "t3"],
                    [-14, 5, "t3"],
                    [-19, 13, "t3"],
                    [-42, 19, "t3"],
                    [17, 43, "t3"]
                  ],
                  snagsml: [[-26, 22, "c1"]],
                  snag: [
                    [-20, 4, "b4"],
                    [-2, 4, "b4"],
                    [-22, 6, "b2"],
                    [-24, 8, "b4"],
                    [-18, 8, "b4"],
                    [-20, 10, "b4"],
                    [-14, 10, "b4"],
                    [-26, 16, "b4"],
                    [-32, 16, "b2"],
                    [-30, 20, "b4"],
                    [32, 24, "b4"],
                    [-38, 24, "b4"],
                    [-40, 26, "b4"],
                    [24, 28, "b4"],
                    [-36, 28, "b4"],
                    [-20, 30, "b4"],
                    [38, 30, "b2"],
                    [26, 32, "b4"],
                    [-22, 32, "b4"],
                    [30, 34, "b4"],
                    [36, 36, "b4"],
                    [16, 40, "b4"],
                    [20, 42, "b4"],
                    [12, 42, "b4"],
                    [24, 44, "b4"],
                    [4, 50, "b2"],
                    [14, 52, "b4"],
                    [28, 29, "b3"],
                    [1, 8, "b6"],
                    [22, 38, "b6"]
                  ],
                  bump: [
                    [-16, 4],
                    [4, 10],
                    [-22, 12],
                    [-16, 12],
                    [-28, 18],
                    [-24, 20],
                    [40, 24],
                    [-30, 24],
                    [34, 26],
                    [38, 28],
                    [-32, 28],
                    [-26, 30],
                    [34, 32],
                    [26, 32],
                    [-36, 36],
                    [34, 38],
                    [16, 38],
                    [20, 40],
                    [10, 42],
                    [20, 46],
                    [10, 50],
                    [0, 52],
                    [-12, 9]
                  ],
                  bumpbig: [
                    [0, 6],
                    [8, 46]
                  ],
                  spiral: [
                    [-6, 30],
                    [6, 38],
                    [2, 23]
                  ],
                  ramp: [[18, 34]],
                  boost: [[-14, 32]],
                  coin: [[-28, 50]]
                },
                act7a: {
                  snag: [
                    [33, 39, "b6"],
                    [-12, 12, "b4"],
                    [12, 14, "b2"],
                    [4, 22, "b1"],
                    [-34, 26, "b2"],
                    [18, 28, "b2"],
                    [-18, 30, "b1"],
                    [2, 56, "b4"],
                    [-12, 58, "b2"],
                    [28, 30, "b4"]
                  ],
                  snagsml: [[-10, 22, "c1"]],
                  snagtall: [
                    [0, 58, "t1"],
                    [20, 32, "t1"],
                    [-28, 32, "t1"],
                    [-30, 37, "t3"],
                    [0, 18, "t1"]
                  ],
                  wall: [
                    [24, 34, "f"],
                    [8, 12, "n"],
                    [8, 16, "se"],
                    [-8, 16, "n"],
                    [-4, 20, "f"],
                    [-8, 20, "sw"],
                    [8, 24, "b"],
                    [32, 30, "n"],
                    [-32, 30, "n"],
                    [32, 34, "se"],
                    [28, 34, "f"],
                    [-20, 34, "se"],
                    [-24, 34, "f"],
                    [-32, 34, "sw"],
                    [18, 38, "b"],
                    [-12, 52, "b"],
                    [8, 60, "se"],
                    [4, 60, "f"],
                    [-8, 60, "sw"],
                    [-4, 60, "f"],
                    [4, 16, "sw"]
                  ],
                  ramp: [
                    [0, 10],
                    [24, 28],
                    [-24, 28],
                    [6, 54],
                    [-6, 54]
                  ],
                  bump: [
                    [-6, 12],
                    [-12, 16],
                    [12, 18],
                    [6, 20],
                    [-4, 22],
                    [20, 30],
                    [-28, 30],
                    [-36, 32],
                    [36, 34],
                    [16, 34],
                    [28, 36],
                    [-18, 36],
                    [-10, 56],
                    [10, 58],
                    [0, 62]
                  ],
                  slowbig: [
                    [-28, 12],
                    [-2, 32],
                    [-24, 48],
                    [24, 56],
                    [32, 19]
                  ]
                },
                act7b: {
                  snagtall: [
                    [14, 46, "t3"],
                    [24, 16, "t1"],
                    [-4, 42, "t1"],
                    [-16, 16, "t1"],
                    [14, 13, "t3"]
                  ],
                  coin: [[0, 8]],
                  bump: [
                    [-26, 10],
                    [12, 16],
                    [-32, 18],
                    [-12, 18],
                    [-24, 20],
                    [28, 22],
                    [0, 32],
                    [2, 34],
                    [-24, 38],
                    [2, 42],
                    [18, 42],
                    [12, 46],
                    [-4, 48],
                    [10, 54]
                  ],
                  ramp: [
                    [-20, 12],
                    [20, 12],
                    [0, 28]
                  ],
                  wall: [
                    [-28, 14, "n"],
                    [28, 14, "n"],
                    [-28, 18, "sw"],
                    [-24, 18, "f"],
                    [28, 18, "se"],
                    [16, 18, "w"],
                    [16, 22, "sw"],
                    [20, 22, "s"],
                    [24, 22, "se"],
                    [-30, 24, "b"],
                    [-12, 44, "sw"],
                    [-8, 44, "f"],
                    [8, 44, "w"],
                    [12, 44, "f"],
                    [16, 44, "se"],
                    [4, 48, "sw"],
                    [8, 48, "se"],
                    [-20, 18, "s"],
                    [20, 18, "f"]
                  ],
                  snag: [
                    [-34, 14, "b4"],
                    [-14, 14, "b4"],
                    [32, 16, "b4"],
                    [30, 24, "b4"],
                    [2, 32, "b3"],
                    [-26, 40, "b4"],
                    [4, 44, "b4"],
                    [-8, 46, "b4"],
                    [-10, 50, "b2"]
                  ],
                  slowbig: [
                    [-14, 24],
                    [16, 32],
                    [-28, 44],
                    [28, 50],
                    [-6, 60]
                  ],
                  snagsml: [[12, 20, "c1"]]
                },
                finish: {
                  slowbig: [
                    [-27, 52],
                    [-47, 28],
                    [-25, 14],
                    [41, 44],
                    [12, 52],
                    [31, 14],
                    [44, 28],
                    [-44, 47]
                  ],
                  slow: [
                    [-45, 38],
                    [9, 23],
                    [-40, 16],
                    [31, 53],
                    [-10, 23],
                    [-11, 52]
                  ],
                  snag: [
                    [40, 30, "b2"],
                    [-42, 31, "b2"],
                    [33, 18, "b3"],
                    [-33, 36, "b1"],
                    [-26, 46, "b6"],
                    [30, 29, "b1"],
                    [-18, 33, "b1"],
                    [28, 43, "b3"],
                    [-29, 28, "b2"],
                    [-43, 22, "b3"]
                  ],
                  blockbig: [
                    [-20, 26],
                    [26, 21],
                    [14, 43]
                  ],
                  block: [
                    [-30, 20],
                    [19, 27],
                    [-23, 42]
                  ],
                  wall: [
                    [-26, 33, "f"],
                    [34, 29, "n"],
                    [26, 29, "n"],
                    [-34, 29, "n"],
                    [34, 33, "e"],
                    [18, 33, "f"],
                    [-34, 33, "sw"],
                    [22, 33, "s"],
                    [26, 33, "s"],
                    [-30, 33, "s"],
                    [-22, 33, "e"],
                    [30, 33, "f"],
                    [34, 37, "se"],
                    [-22, 37, "sw"],
                    [10, 37, "sw"],
                    [18, 37, "s"],
                    [22, 37, "e"],
                    [14, 37, "f"],
                    [30, 37, "sw"],
                    [-18, 37, "f"],
                    [-14, 37, "s"],
                    [-10, 37, "e"],
                    [22, 41, "b"],
                    [-14, 41, "w"],
                    [-10, 41, "se"],
                    [-10, 45, "f"],
                    [-14, 45, "sw"],
                    [-6, 45, "se"],
                    [32, 46, "b"]
                  ],
                  bump: [
                    [26, 38],
                    [-37, 34],
                    [35, 23],
                    [13, 27],
                    [33, 30],
                    [-17, 31],
                    [37, 34],
                    [7, 43],
                    [-7, 47],
                    [29, 47],
                    [-18, 41],
                    [-39, 28]
                  ],
                  snagsml: [
                    [36, 40, "c1"],
                    [-36, 38, "c1"],
                    [-20, 5, "c3"],
                    [-15, 10, "c3"],
                    [-12, 15, "c3"],
                    [12, 15, "c3"],
                    [-11, 19, "c3"],
                    [11, 19, "c3"],
                    [15, 10, "c3"],
                    [20, 5, "c3"],
                    [41, 24, "c1"]
                  ],
                  snagtall: [
                    [-36, 23, "t3"],
                    [14, 31, "t1"],
                    [-14, 31, "t1"],
                    [-31, 40, "t3"],
                    [19, 48, "t3"],
                    [24, 45, "t3"],
                    [16, 19, "t3"],
                    [-27, 37, "t3"],
                    [-22, 19, "t3"]
                  ],
                  coin: [[0, 5]],
                  finish: [[0, 29, ["default"]]],
                  bumpbig: [
                    [26, 26],
                    [15, 40],
                    [-28, 26]
                  ]
                }
              }
            };
          }
        },
        ZigZag: {
          id: "zigzag",
          menuCluster: "zigzagMenu",
          stringLookup: { title: "modeZigzagTitle", howto: "modeZigzagHowToPlay" },
          setup() {
            this.loadClusters(), (this.edge = void 0);
          },
          reset() {
            (this.counter = 0),
              (this.previousGate = -1),
              (this.pixels = { next: 0, add: 1200 }),
              (this.distance = {
                npc: { next: 30, add: 100 },
                friend: { next: 200, add: 500 },
                life: { next: 1e3, add: 2e3 }
              });
          },
          getScore: () => gA.sys.game.gates,
          getScoreFormatted() {
            return this.getScore().toString();
          },
          getHighScore: () => gA.sys.highScore.zigzag,
          getHighScoreFormatted() {
            return this.getHighScore().toString();
          },
          scoreMeter() {
            return this.getScore() / this.getHighScore();
          },
          almostHighScore() {
            return this.scoreMeter() >= 0.9;
          },
          saveScore() {
            if (gA.sys.game.cheat.used) return;
            const A = this.getScore();
            A > gA.sys.highScore.zigzag && ((gA.sys.highScore.zigzag = A), gA.sys.triggerHighScore());
          },
          buildStartScene() {
            const A = gA.sys.session.x,
              t = gA.sys.session.y + 512;
            T.sys.buildCluster("zigzagGates", A, t, "gateFirst"), (this.counter += 1);
          },
          update() {
            T.sys.passed(this.pixels) && this.buildNextLevel(), T.sys.ready(this.distance.npc) && T.sys.buildNpc();
          },
          checkCollisions() {
            R.checkPlayerObjects(), R.checkFoeNpcObject(), R.checkPlayerNpcs();
          },
          collisionEvent(A) {
            switch (A.type) {
              case "marker":
                Z.playerCrash();
                break;
              case "guide":
                V.entity.spin();
                break;
              case "gate":
                Z.gamePassGate(A);
                break;
              case "ramp":
                Z.playerAir(512);
            }
          },
          checkPass(A) {
            const t = A.gateId === this.previousGate;
            "gate" !== A.type ||
              t ||
              A.hit ||
              (gA.sys.game.friend ? (this.updateGate(A.gateId), Z.removeFriend()) : Z.gameLose());
          },
          passGate(A) {
            A - 1 === this.previousGate && (gA.sys.game.gates += 1), this.updateGate(A), this.saveScore();
          },
          updateGate(A) {
            this.previousGate = A;
          },
          buildNextLevel() {
            const A = gA.sys.session.x - gA.sys.game.dist.x,
              t = T.sys.getNextLevelHeight(this.pixels.next),
              e = this.counter % 2 != 0,
              s = e ? "gateLeft" : "gateRight",
              n = e ? A - 320 : A + 320;
            T.sys.buildCluster("zigzagGates", n, t, s), (this.counter += 1), this.createGateClusters(A, t, e);
          },
          createGateClusters(A, s, n) {
            const i = s + 0.5 * this.pixels.add;
            let r;
            T.sys.buildCluster("zigzagGateScenes", A, i);
            const a = T.sys.ready(this.distance.life);
            T.sys.ready(this.distance.friend) && !gA.sys.game.friend
              ? (r = "friend")
              : a
                ? (r = "life")
                : Math.random() < 0.1
                  ? (r = "spiral")
                  : Math.random() < 0.4 && (r = Math.random() > 0.5 ? "slowbig" : "bumpbig"),
              r && T.sys.buildObject(r, A, i, r);
            const o = n ? A + 64 : A - 64;
            T.sys.buildCluster("allNormal", o, s - 128, e(G.sys.group.small));
            const c = s + 0.25 * this.pixels.add,
              l = c + t(0, 8) * T.sys.grid,
              g = c + t(0, 8) * T.sys.grid;
            T.sys.buildCluster("allNormal", A - 560, l, e(G.sys.group.small)),
              T.sys.buildCluster("allNormal", A + 560, g, e(G.sys.group.small));
          },
          loadClusters() {
            this.library = {
              zigzagMenu: {
                menu1: {
                  guide: [
                    [17, 2],
                    [-17, 2],
                    [24, 8],
                    [25, -5],
                    [28, 2],
                    [-24, 8],
                    [-28, 2],
                    [-27, -3],
                    [17, -3],
                    [-17, -3],
                    [-25, -5],
                    [-27, 5],
                    [27, -3],
                    [27, 5],
                    [-14, 4],
                    [14, 4]
                  ],
                  snagtall: [
                    [-21, -17, "t2"],
                    [-22, 19, "t3"]
                  ],
                  bump: [
                    [19, -15],
                    [-18, 21],
                    [-31, 18],
                    [22, -18],
                    [40, 2],
                    [-35, 1],
                    [13, -2],
                    [-13, -2],
                    [-32, -6],
                    [34, -5],
                    [25, 23],
                    [29, 15],
                    [-24, -17]
                  ],
                  slow: [
                    [29, -11],
                    [-28, -21],
                    [-14, -20],
                    [43, 21],
                    [-40, -14],
                    [46, 1],
                    [-45, 6],
                    [-17, 12],
                    [14, -10],
                    [17, 13]
                  ],
                  snag: [
                    [-19, 17, "b4"],
                    [32, 15, "b4"],
                    [22, 21, "b2"],
                    [18, -18, "b1"],
                    [39, 4, "b4"],
                    [36, -7, "b4"],
                    [37, 0, "b4"],
                    [-33, -5, "b2"],
                    [-39, 0, "b4"],
                    [-10, -5, "b4"],
                    [10, -4, "b4"],
                    [11, -1, "b4"],
                    [-12, -1, "b4"],
                    [-37, 3, "b4"],
                    [-36, -7, "b4"],
                    [22, -16, "b3"],
                    [31, 18, "b4"],
                    [-18, -18, "b4"]
                  ],
                  slowbig: [
                    [35, 12],
                    [-29, 24],
                    [-45, -3],
                    [45, -8],
                    [29, 25],
                    [-35, 11],
                    [-21, -10],
                    [22, -22]
                  ],
                  blockbig: [[23, 17]],
                  marker: [
                    [-28, -1],
                    [-18, -1],
                    [18, -1],
                    [28, -1]
                  ],
                  snagsml: [
                    [35, 3, "c1"],
                    [-32, 15, "c1"]
                  ],
                  block: [[-26, 16]]
                }
              },
              zigzagGates: {
                gateFirst: {
                  guide: [
                    [13, -9],
                    [9, -5],
                    [-13, -9],
                    [-9, -5],
                    [5, 8],
                    [8, 2],
                    [7, 5],
                    [-9, 2],
                    [-8, -3],
                    [-11, -7],
                    [8, -3],
                    [11, -7]
                  ],
                  marker: [
                    [8, -1],
                    [-8, -1]
                  ],
                  gate: [[0, 1]]
                },
                gateLeft: {
                  guide: [
                    [-2, 12],
                    [-7, 5],
                    [9, -5],
                    [-5, -9],
                    [-8, -3],
                    [-7, -6],
                    [8, -3],
                    [-8, 2],
                    [-5, 8],
                    [9, 2]
                  ],
                  marker: [
                    [8, -1],
                    [-8, -1]
                  ],
                  gate: [[0, 1]]
                },
                gateRight: {
                  guide: [
                    [2, 12],
                    [7, 5],
                    [-9, 2],
                    [5, -9],
                    [8, -3],
                    [-8, -3],
                    [-9, -5],
                    [7, -6],
                    [8, 2],
                    [5, 8]
                  ],
                  gate: [[0, 1]],
                  marker: [
                    [-8, -1],
                    [8, -1]
                  ]
                }
              },
              zigzagGateScenes: {
                center1: {
                  snag: [
                    [-6, 10, "b2"],
                    [6, -11, "b4"],
                    [-6, -11, "b4"],
                    [-16, -3, "b4"],
                    [16, -1, "b4"],
                    [-10, 9, "b4"],
                    [8, 9, "b4"],
                    [-4, 8, "b4"]
                  ],
                  bump: [[4, -10]]
                },
                center2: {
                  snag: [
                    [4, -10, "b1"],
                    [-2, -10, "b4"],
                    [6, -8, "b4"],
                    [16, 4, "b4"],
                    [-16, 6, "b4"],
                    [2, 9, "b4"],
                    [-1, 11, "b4"]
                  ],
                  bump: [[-3, -8]]
                },
                center3: {
                  snag: [
                    [16, 1, "b1"],
                    [0, -11, "b4"],
                    [6, -10, "b4"],
                    [-4, -10, "b4"],
                    [14, -2, "b4"],
                    [-16, -2, "b4"],
                    [4, 10, "b4"],
                    [-3, 8, "b3"],
                    [-4, 10, "b4"]
                  ]
                },
                center4: {
                  bump: [[4, -11]],
                  snag: [
                    [6, -11, "b4"],
                    [-4, -9, "b4"],
                    [-16, 1, "b4"],
                    [14, 5, "b4"],
                    [-2, 9, "b4"],
                    [0, 11, "b6"]
                  ]
                },
                center5: {
                  snag: [
                    [-15, 1, "b4"],
                    [-16, -3, "b4"],
                    [6, 10, "b4"],
                    [0, 8, "b4"],
                    [14, 0, "b4"],
                    [-2, 10, "b6"],
                    [2, -10, "b4"],
                    [15, -3, "b2"]
                  ],
                  snagtall: [[-3, -13, "t3"]],
                  bump: [[2, 12]],
                  spin: [
                    [-13, 0],
                    [12, -2]
                  ]
                },
                center6: {
                  snagsml: [[14, 3, "c1"]],
                  snag: [
                    [-14, 2, "b4"],
                    [-16, -1, "b4"],
                    [12, 1, "b4"],
                    [14, -5, "b4"],
                    [-6, -9, "b4"],
                    [-1, 9, "b4"]
                  ],
                  snagtall: [[2, -12, "t3"]],
                  bump: [[-14, 0]]
                },
                center7: {
                  bump: [[-15, 1]],
                  snagsml: [[3, -9, "c1"]],
                  snag: [
                    [14, 1, "b3"],
                    [2, -11, "b4"],
                    [-16, -1, "b2"],
                    [13, -2, "b1"],
                    [-1, 9, "b4"],
                    [2, 7, "b4"],
                    [-5, -10, "b4"]
                  ]
                },
                center8: {
                  snag: [
                    [-4, -9, "b6"],
                    [15, 1, "b4"],
                    [2, -11, "b4"],
                    [-16, -1, "b4"],
                    [1, 7, "b6"],
                    [-5, -11, "b1"]
                  ],
                  wall: [[13, -2, "b"]],
                  snagsml: [[-16, 3, "c1"]],
                  snagtall: [[-1, 8, "t3"]],
                  bump: [[11, 0]]
                },
                center9: {
                  snagtall: [
                    [15, -2, "t2"],
                    [-4, -13, "t3"]
                  ],
                  snag: [
                    [13, -3, "b4"],
                    [-3, -9, "b4"],
                    [1, 8, "b4"],
                    [-15, 2, "b4"],
                    [-16, -2, "b4"]
                  ],
                  bump: [
                    [-1, 10],
                    [2, -9]
                  ],
                  snagsml: [[1, -11, "c1"]],
                  spin: [[-13, 0]]
                },
                center10: {
                  spin: [[0, 8]],
                  bump: [
                    [17, 1],
                    [-1, -8]
                  ],
                  snag: [
                    [16, 2, "b4"],
                    [-15, 0, "b4"],
                    [-14, -3, "b2"],
                    [-3, -11, "b1"],
                    [14, -1, "b3"],
                    [1, 10, "b4"]
                  ],
                  snagtall: [[1, -12, "t1"]]
                }
              }
            };
          }
        },
        Collector: {
          id: "collector",
          menuCluster: "collectorMenu",
          stringLookup: { title: "modeCollectorTitle", howto: "modeCollectorHowToPlay" },
          setup() {
            this.loadClusters(), (this.edge = void 0), (this.flagScore = !1);
          },
          reset() {
            (this.pixels = { next: 0, add: 1200 }),
              (this.distance = {
                npc: { next: 30, add: 100 },
                friend: { next: 1e3, add: 2e3 },
                save: { next: 1e3, add: 500 },
                generic: { next: 250, add: 250 }
              });
          },
          getScore: () => gA.sys.game.coins,
          getScoreFormatted() {
            return this.getScore().toString();
          },
          getHighScore: () => gA.sys.highScore.collector,
          getHighScoreFormatted() {
            return this.getHighScore().toString();
          },
          scoreMeter() {
            return this.getScore() / this.getHighScore();
          },
          almostHighScore() {
            return this.scoreMeter() >= 0.9;
          },
          saveScore() {
            if (gA.sys.game.cheat.used) return;
            const A = this.getScore();
            A > gA.sys.highScore.collector && ((gA.sys.highScore.collector = A), gA.sys.triggerHighScore());
          },
          buildStartScene() {
            const A = gA.sys.session.x,
              t = gA.sys.session.y + 320;
            T.sys.buildCluster("collectorStarts", A, t);
          },
          update() {
            !this.flagScore &&
              gA.sys.game.coins > gA.sys.highScore.collector &&
              (this.saveScore(), (this.flagScore = !0));
            const A = T.sys.passed(this.pixels),
              t = T.sys.passed(this.distance.save);
            A && this.buildNextLevel(), t && this.saveScore(), T.sys.ready(this.distance.npc) && T.sys.buildNpc();
          },
          checkCollisions() {
            R.checkPlayerObjects(),
              R.checkFoeNpcObject(),
              R.checkPlayerNpcs(),
              gA.sys.game.friend && this.coinMagnetCollision();
          },
          coinMagnetCollision() {
            const A = V.entity;
            R.allObjects
              .filter((t) =>
                (function (t) {
                  return !(
                    "coin" !== t.type ||
                    t.hit ||
                    V.entity.distance.air ||
                    Math.hypot(t.x - A.x, t.y - A.y) > 150
                  );
                })(t)
              )
              .forEach((A) => {
                (A.hit = !0), Z.collectItem(A);
              });
          },
          collisionEvent(A) {
            "ramp" === A.type && Z.playerAir(256);
          },
          checkPass(A) {
            A.hit;
          },
          buildNextLevel() {
            const A = gA.sys.session.x - gA.sys.game.dist.x,
              t = T.sys.getNextLevelHeight(this.pixels.next),
              s = T.sys.ready(this.distance.generic);
            T.sys.ready(this.distance.friend) && !gA.sys.game.friend
              ? T.sys.buildCluster("collectorFriends", A, t)
              : s
                ? T.sys.buildCluster("collectorScenes", A, t)
                : (T.sys.buildCluster("collectorCoinsOnly", A, t),
                  T.sys.buildCluster("allNormal", A, t + 256, e(G.sys.group.small)));
          },
          loadClusters() {
            this.library = {
              collectorMenu: {
                menu1: {
                  coin: [
                    [34, 8],
                    [30, 8],
                    [-34, 8],
                    [-26, 8],
                    [34, -8],
                    [-34, -8],
                    [38, -8],
                    [-42, -8],
                    [22, -12],
                    [-22, -12],
                    [-22, -16],
                    [30, 12],
                    [26, -16],
                    [22, -16],
                    [-18, 0],
                    [18, 4],
                    [14, 0],
                    [10, -4],
                    [18, -4],
                    [26, -4],
                    [-22, 0],
                    [-22, -4],
                    [-10, -4],
                    [-14, 0],
                    [-14, -4],
                    [-18, -4],
                    [-18, 4],
                    [-26, -4],
                    [22, -4],
                    [14, -4],
                    [22, 0],
                    [18, 0],
                    [-26, -16],
                    [-18, -16],
                    [18, -16],
                    [-38, -8],
                    [42, -8],
                    [-38, -4],
                    [38, -4],
                    [-30, 8],
                    [-30, 12],
                    [26, 8]
                  ],
                  slow: [
                    [53, -5],
                    [20, 16],
                    [50, 10],
                    [16, -9],
                    [-14, -10],
                    [24, -22],
                    [-44, 17],
                    [-32, 2],
                    [-20, 19],
                    [-42, -18],
                    [-52, -8]
                  ],
                  slowbig: [
                    [-26, -23],
                    [42, 23],
                    [-51, 6],
                    [-34, 25],
                    [35, 4],
                    [40, -17]
                  ]
                }
              },
              collectorStarts: {
                start1: {
                  coin: [
                    [20, 2],
                    [-20, 6],
                    [4, 30],
                    [-4, 30],
                    [4, 26],
                    [16, 2],
                    [-16, 2],
                    [12, 14],
                    [-12, 14],
                    [-12, 6],
                    [12, 2],
                    [8, 14],
                    [4, 14],
                    [0, 14],
                    [-4, 18],
                    [-8, 14],
                    [-8, 2],
                    [8, 6],
                    [-4, 6],
                    [4, 6],
                    [-4, 2],
                    [0, 2],
                    [4, 2],
                    [0, 6],
                    [-8, 6],
                    [8, 2],
                    [-4, 14],
                    [-8, 18],
                    [0, 18],
                    [4, 18],
                    [8, 18],
                    [12, 6],
                    [-12, 2],
                    [-12, 18],
                    [12, 18],
                    [-16, 6],
                    [16, 6],
                    [-4, 26],
                    [0, 26],
                    [0, 30],
                    [-20, 2],
                    [20, 6]
                  ]
                },
                start2: {
                  coin: [
                    [0, 22],
                    [8, 10],
                    [0, 10],
                    [-8, 10],
                    [-20, 2],
                    [16, 6],
                    [-16, 6],
                    [-12, 2],
                    [12, 6],
                    [4, 18],
                    [0, 18],
                    [-4, 14],
                    [8, 2],
                    [-8, 6],
                    [0, 6],
                    [4, 2],
                    [0, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [8, 6],
                    [-8, 2],
                    [-8, 14],
                    [-4, 18],
                    [0, 14],
                    [4, 14],
                    [8, 14],
                    [12, 2],
                    [-12, 6],
                    [-16, 2],
                    [16, 2],
                    [20, 2],
                    [-12, 10],
                    [-4, 10],
                    [12, 10],
                    [4, 10]
                  ]
                },
                start3: {
                  coin: [
                    [8, 2],
                    [-4, 16],
                    [8, 24],
                    [0, 28],
                    [-8, 24],
                    [8, 38],
                    [0, 38],
                    [-8, 38],
                    [16, 18],
                    [16, 22],
                    [16, 30],
                    [-16, 30],
                    [-16, 22],
                    [4, 42],
                    [-4, 42],
                    [8, 42],
                    [-12, 38],
                    [16, 34],
                    [20, 30],
                    [20, 22],
                    [16, 14],
                    [12, 10],
                    [-20, 26],
                    [-12, 10],
                    [20, 18],
                    [-20, 18],
                    [16, 10],
                    [12, 6],
                    [-8, 6],
                    [0, 6],
                    [4, 2],
                    [0, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [8, 6],
                    [-12, 6],
                    [-16, 10],
                    [-20, 14],
                    [20, 14],
                    [-16, 14],
                    [-20, 22],
                    [-20, 30],
                    [20, 26],
                    [-16, 34],
                    [-8, 42],
                    [12, 38],
                    [0, 42],
                    [-16, 18],
                    [-16, 26],
                    [16, 26],
                    [-4, 38],
                    [4, 38],
                    [-12, 34],
                    [12, 34],
                    [-4, 28],
                    [4, 28],
                    [4, 16],
                    [-8, 2]
                  ]
                }
              },
              collectorCoinsOnly: {
                coinsOnly1: {
                  slow: [
                    [14, 3],
                    [33, 32],
                    [-34, 33],
                    [-29, 17],
                    [22, 49]
                  ],
                  slowbig: [
                    [-26, 46],
                    [-17, 6],
                    [24, 17]
                  ],
                  coin: [
                    [16, 34],
                    [16, 30],
                    [-20, 26],
                    [-20, 34],
                    [-16, 30],
                    [8, 46],
                    [4, 46],
                    [0, 46],
                    [-8, 50],
                    [-4, 46],
                    [0, 10],
                    [-4, 6],
                    [4, 6],
                    [0, 2],
                    [-4, 2],
                    [4, 2],
                    [0, 6],
                    [-4, 10],
                    [4, 10],
                    [-8, 46],
                    [-4, 50],
                    [0, 50],
                    [4, 50],
                    [8, 50],
                    [-16, 26],
                    [-16, 34],
                    [-20, 30],
                    [16, 26],
                    [20, 26],
                    [20, 30],
                    [20, 34]
                  ]
                },
                coinsOnly2: {
                  slowbig: [
                    [-23, 43],
                    [25, 9]
                  ],
                  coin: [
                    [16, 34],
                    [16, 22],
                    [-16, 18],
                    [-16, 26],
                    [-16, 34],
                    [-8, 50],
                    [12, 50],
                    [4, 50],
                    [8, 46],
                    [-4, 46],
                    [-12, 46],
                    [8, 2],
                    [4, 6],
                    [0, 2],
                    [-4, 6],
                    [-8, 6],
                    [-8, 2],
                    [-4, 2],
                    [0, 6],
                    [4, 2],
                    [8, 6],
                    [-8, 46],
                    [4, 46],
                    [12, 46],
                    [8, 50],
                    [-4, 50],
                    [-12, 50],
                    [-16, 30],
                    [-16, 22],
                    [16, 18],
                    [16, 26],
                    [16, 30]
                  ],
                  slow: [
                    [22, 42],
                    [26, 29],
                    [-29, 21],
                    [-19, 5]
                  ]
                },
                coinsOnly3: {
                  slow: [
                    [23, 51],
                    [-28, 40],
                    [-17, 5],
                    [30, 29]
                  ],
                  slowbig: [
                    [-17, 51],
                    [-25, 12],
                    [18, 42],
                    [23, 7]
                  ],
                  coin: [
                    [20, 18],
                    [-20, 18],
                    [20, 34],
                    [20, 26],
                    [-20, 26],
                    [-20, 34],
                    [4, 54],
                    [-4, 54],
                    [0, 50],
                    [0, 46],
                    [-4, 46],
                    [8, 10],
                    [8, 2],
                    [-8, 6],
                    [-4, 10],
                    [-4, 6],
                    [4, 6],
                    [-4, 2],
                    [4, 2],
                    [4, 10],
                    [-8, 10],
                    [-8, 2],
                    [8, 6],
                    [4, 46],
                    [4, 50],
                    [-4, 50],
                    [0, 54],
                    [-16, 26],
                    [-16, 34],
                    [16, 26],
                    [16, 34],
                    [-16, 18],
                    [16, 18]
                  ]
                },
                coinsOnly4: {
                  slowbig: [
                    [21, 4],
                    [28, 39],
                    [-15, 48],
                    [-28, 17]
                  ],
                  slow: [
                    [12, 51],
                    [-19, 5],
                    [-28, 38],
                    [29, 18]
                  ],
                  coin: [
                    [24, 30],
                    [20, 26],
                    [20, 34],
                    [16, 38],
                    [-16, 38],
                    [-20, 34],
                    [-24, 30],
                    [-20, 26],
                    [2, 54],
                    [2, 50],
                    [12, 10],
                    [-16, 10],
                    [-12, 6],
                    [8, 2],
                    [-4, 2],
                    [4, 2],
                    [-8, 2],
                    [8, 6],
                    [-8, 6],
                    [-12, 10],
                    [12, 6],
                    [16, 10],
                    [-2, 50],
                    [-2, 54],
                    [-24, 26],
                    [-20, 30],
                    [-16, 34],
                    [-12, 38],
                    [12, 38],
                    [16, 34],
                    [20, 30],
                    [24, 26]
                  ]
                },
                coinsOnly5: {
                  slow: [
                    [23, 52],
                    [-30, 33],
                    [17, 4],
                    [28, 22],
                    [-27, 15]
                  ],
                  slowbig: [
                    [-19, 5],
                    [27, 38],
                    [-22, 50]
                  ],
                  coin: [
                    [-12, 54],
                    [-12, 46],
                    [-16, 38],
                    [-20, 30],
                    [12, 54],
                    [12, 46],
                    [16, 42],
                    [16, 34],
                    [20, 30],
                    [20, 22],
                    [-20, 22],
                    [8, 6],
                    [-8, 2],
                    [4, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [-8, 6],
                    [8, 2],
                    [-12, 10],
                    [-16, 14],
                    [-20, 18],
                    [16, 14],
                    [20, 18],
                    [12, 10],
                    [20, 26],
                    [16, 38],
                    [12, 50],
                    [-20, 26],
                    [-16, 34],
                    [-16, 42],
                    [-12, 50]
                  ]
                },
                coinsOnly6: {
                  slow: [
                    [-20, 7],
                    [-24, 37],
                    [16, 5],
                    [29, 33]
                  ],
                  slowbig: [
                    [27, 15],
                    [-28, 21]
                  ],
                  coin: [
                    [12, 38],
                    [-12, 38],
                    [16, 18],
                    [-12, 18],
                    [12, 14],
                    [16, 42],
                    [16, 38],
                    [16, 30],
                    [16, 26],
                    [-20, 26],
                    [-16, 30],
                    [-12, 14],
                    [8, 6],
                    [-8, 2],
                    [4, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [-8, 6],
                    [8, 2],
                    [-16, 14],
                    [-16, 26],
                    [-20, 30],
                    [-16, 38],
                    [-16, 42],
                    [20, 26],
                    [20, 30],
                    [16, 14],
                    [-16, 18],
                    [12, 18],
                    [-12, 42],
                    [12, 42]
                  ]
                },
                coinsOnly7: {
                  slow: [
                    [30, 34],
                    [-28, 12],
                    [-27, 46],
                    [16, 2],
                    [26, 49]
                  ],
                  slowbig: [
                    [30, 14],
                    [-21, 2],
                    [-30, 33]
                  ],
                  coin: [
                    [-16, 46],
                    [-12, 46],
                    [-20, 38],
                    [20, 38],
                    [8, 46],
                    [12, 38],
                    [16, 42],
                    [8, 42],
                    [-16, 42],
                    [-12, 42],
                    [-12, 38],
                    [20, 26],
                    [-24, 26],
                    [24, 18],
                    [-20, 22],
                    [-24, 18],
                    [-20, 18],
                    [-20, 14],
                    [20, 14],
                    [16, 14],
                    [16, 6],
                    [-16, 6],
                    [12, 10],
                    [-12, 6],
                    [8, 6],
                    [-8, 2],
                    [4, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [-8, 6],
                    [8, 2],
                    [12, 6],
                    [-12, 10],
                    [-16, 10],
                    [16, 10],
                    [20, 10],
                    [-20, 10],
                    [-16, 14],
                    [20, 18],
                    [-24, 22],
                    [20, 22],
                    [24, 22],
                    [-20, 26],
                    [24, 26],
                    [-16, 38],
                    [-8, 42],
                    [12, 42],
                    [16, 38],
                    [-8, 46],
                    [20, 42],
                    [-20, 42],
                    [12, 46],
                    [16, 46]
                  ]
                },
                coinsOnly8: {
                  slowbig: [
                    [-25, 40],
                    [25, 12]
                  ],
                  slow: [
                    [32, 28],
                    [-24, 8],
                    [25, 46],
                    [-31, 22]
                  ],
                  coin: [
                    [20, 18],
                    [-16, 18],
                    [16, 50],
                    [-12, 50],
                    [16, 46],
                    [-16, 46],
                    [16, 2],
                    [-16, 6],
                    [-12, 2],
                    [12, 6],
                    [16, 22],
                    [-20, 22],
                    [20, 34],
                    [20, 26],
                    [16, 30],
                    [-16, 34],
                    [-16, 30],
                    [-20, 26],
                    [8, 6],
                    [-8, 2],
                    [-8, 6],
                    [8, 2],
                    [-16, 26],
                    [-20, 30],
                    [-20, 34],
                    [16, 34],
                    [16, 26],
                    [20, 30],
                    [-16, 22],
                    [20, 22],
                    [12, 2],
                    [-12, 6],
                    [-16, 2],
                    [16, 6],
                    [-12, 46],
                    [12, 46],
                    [-16, 50],
                    [12, 50],
                    [-20, 18],
                    [16, 18]
                  ]
                },
                coinsOnly9: {
                  slowbig: [
                    [27, 14],
                    [-22, 6],
                    [-18, 45]
                  ],
                  slow: [
                    [18, 50],
                    [-32, 26],
                    [-28, 17],
                    [26, 38],
                    [19, 4]
                  ],
                  coin: [
                    [-8, 46],
                    [8, 50],
                    [4, 46],
                    [-4, 46],
                    [-4, 50],
                    [20, 18],
                    [-16, 18],
                    [12, 6],
                    [20, 22],
                    [-16, 22],
                    [-12, 10],
                    [20, 30],
                    [16, 34],
                    [-20, 34],
                    [-20, 30],
                    [8, 10],
                    [8, 2],
                    [-8, 6],
                    [-4, 10],
                    [-4, 6],
                    [4, 6],
                    [-4, 2],
                    [4, 2],
                    [4, 10],
                    [-8, 10],
                    [-8, 2],
                    [8, 6],
                    [-16, 30],
                    [-16, 34],
                    [16, 30],
                    [20, 34],
                    [-12, 6],
                    [-20, 22],
                    [16, 22],
                    [12, 10],
                    [-20, 18],
                    [16, 18],
                    [4, 50],
                    [8, 46],
                    [-8, 50]
                  ]
                },
                coinsOnly10: {
                  slow: [
                    [-32, 31],
                    [21, 3],
                    [33, 36],
                    [28, 16],
                    [-20, 2],
                    [-24, 46]
                  ],
                  slowbig: [
                    [23, 48],
                    [-29, 14]
                  ],
                  coin: [
                    [8, 46],
                    [8, 42],
                    [12, 42],
                    [16, 38],
                    [20, 38],
                    [24, 30],
                    [-20, 30],
                    [-20, 38],
                    [-12, 42],
                    [-8, 46],
                    [-16, 38],
                    [20, 26],
                    [-24, 26],
                    [24, 18],
                    [-20, 22],
                    [-24, 18],
                    [-20, 18],
                    [16, 6],
                    [-16, 6],
                    [12, 10],
                    [-12, 6],
                    [8, 6],
                    [-8, 2],
                    [4, 2],
                    [-4, 2],
                    [4, 6],
                    [-4, 6],
                    [-8, 6],
                    [8, 2],
                    [12, 6],
                    [-12, 10],
                    [-16, 10],
                    [16, 10],
                    [20, 10],
                    [-20, 10],
                    [20, 18],
                    [-24, 22],
                    [20, 22],
                    [24, 22],
                    [-20, 26],
                    [24, 26],
                    [-12, 38],
                    [-4, 42],
                    [-4, 46],
                    [-8, 42],
                    [-16, 42],
                    [-24, 30],
                    [20, 30],
                    [12, 38],
                    [16, 42],
                    [4, 42],
                    [4, 46]
                  ]
                }
              },
              collectorFriends: {
                friend1: {
                  coin: [
                    [8, 46],
                    [-4, 50],
                    [-4, 46],
                    [0, 46],
                    [0, 34],
                    [4, 26],
                    [-4, 30],
                    [-8, 26],
                    [0, 26],
                    [-4, 26],
                    [0, 30],
                    [4, 30],
                    [8, 26],
                    [0, 50],
                    [0, 54],
                    [-8, 46],
                    [4, 46],
                    [4, 50]
                  ],
                  snag: [
                    [21, 3, "b6"],
                    [12, 13, "b1"],
                    [-7, 12, "b4"],
                    [7, 10, "b4"],
                    [16, 11, "b2"]
                  ],
                  slow: [
                    [-17, 1],
                    [8, 17]
                  ],
                  bump: [
                    [-9, 2],
                    [-10, 14],
                    [11, 11],
                    [-14, 6]
                  ],
                  spin: [[5, 7]],
                  snagtall: [
                    [7, 3, "t3"],
                    [-19, 8, "t1"]
                  ],
                  wall: [
                    [-11, 10, "se"],
                    [-15, 10, "f"],
                    [-7, 6, "se"],
                    [-11, 6, "w"]
                  ],
                  blockbig: [[15, 6]],
                  bumpbig: [[12, 2]],
                  snagsml: [[-17, 13, "c1"]],
                  friend: [[0, 9]]
                },
                friend2: {
                  coin: [
                    [-8, 46],
                    [-4, 46],
                    [0, 54],
                    [0, 46],
                    [8, 26],
                    [0, 34],
                    [-4, 30],
                    [4, 26],
                    [0, 26],
                    [-4, 26],
                    [0, 30],
                    [4, 30],
                    [-8, 26],
                    [0, 50],
                    [-4, 50],
                    [4, 50],
                    [4, 46],
                    [8, 46]
                  ],
                  snagtall: [
                    [11, 9, "t2"],
                    [-21, 8, "t3"]
                  ],
                  friend: [[0, 9]],
                  block: [[-14, 7]],
                  bump: [
                    [1, 2],
                    [-8, 8],
                    [-17, 12],
                    [14, 11]
                  ],
                  slowbig: [
                    [11, 19],
                    [-19, 3]
                  ],
                  snag: [
                    [16, 14, "b4"],
                    [-8, 13, "b4"],
                    [-11, 11, "b6"],
                    [7, 8, "b4"],
                    [13, 6, "b4"],
                    [17, 10, "b4"],
                    [-19, 14, "b1"],
                    [-2, 1, "b4"]
                  ],
                  slow: [
                    [12, 2],
                    [-12, 18]
                  ],
                  snagsml: [[9, 14, "c1"]]
                }
              },
              collectorScenes: {
                scene1: {
                  slow: [
                    [33, 25],
                    [-26, 4],
                    [-1, 17],
                    [-17, 31],
                    [30, 15],
                    [22, 43],
                    [-33, 27]
                  ],
                  slowbig: [
                    [21, 35],
                    [-23, 39],
                    [-27, 12],
                    [27, 6]
                  ],
                  bump: [
                    [22, 28],
                    [3, 25],
                    [18, 18],
                    [-26, 20],
                    [-18, 17],
                    [-1, 28]
                  ],
                  wall: [
                    [16, 22, "sw"],
                    [24, 22, "se"],
                    [-4, 22, "sw"],
                    [0, 22, "f"],
                    [4, 22, "se"],
                    [-24, 22, "sw"],
                    [-16, 22, "se"],
                    [20, 22, "f"]
                  ],
                  snag: [
                    [25, 18, "b2"],
                    [15, 17, "b1"],
                    [-16, 18, "b1"],
                    [-25, 17, "b3"],
                    [-2, 24, "b4"]
                  ],
                  snagtall: [[-20, 20, "t1"]],
                  bumpbig: [
                    [-20, 25],
                    [20, 25]
                  ],
                  coin: [
                    [-10, 34],
                    [-6, 38],
                    [10, 38],
                    [16, 54],
                    [8, 54],
                    [0, 54],
                    [-8, 54],
                    [-16, 54],
                    [-8, 50],
                    [-4, 50],
                    [0, 50],
                    [8, 50],
                    [16, 50],
                    [12, 46],
                    [4, 46],
                    [0, 46],
                    [-16, 46],
                    [-8, 46],
                    [16, 10],
                    [16, 6],
                    [16, 2],
                    [-16, 6],
                    [12, 10],
                    [12, 2],
                    [-12, 2],
                    [-8, 6],
                    [8, 10],
                    [8, 2],
                    [0, 10],
                    [4, 6],
                    [-4, 6],
                    [0, 2],
                    [-4, 2],
                    [0, 6],
                    [4, 2],
                    [-4, 10],
                    [4, 10],
                    [8, 6],
                    [-8, 2],
                    [-8, 10],
                    [-12, 6],
                    [-12, 10],
                    [12, 6],
                    [-16, 2],
                    [-16, 10],
                    [-12, 46],
                    [-4, 46],
                    [8, 46],
                    [16, 46],
                    [12, 50],
                    [4, 50],
                    [-12, 50],
                    [-16, 50],
                    [-12, 54],
                    [-4, 54],
                    [4, 54],
                    [12, 54],
                    [6, 38],
                    [6, 34],
                    [10, 34],
                    [-6, 34],
                    [-10, 38]
                  ]
                },
                scene2: {
                  block: [
                    [-15, 4],
                    [16, 44]
                  ],
                  snagsml: [
                    [-11, 7, "c1"],
                    [-15, 47, "c2"]
                  ],
                  snag: [
                    [-18, 8, "b4"],
                    [-18, 12, "b3"],
                    [7, 34, "b4"],
                    [10, 32, "b4"],
                    [17, 49, "b6"],
                    [-21, 40, "b6"]
                  ],
                  coin: [
                    [-8, 42],
                    [-8, 30],
                    [-8, 18],
                    [4, 6],
                    [0, 6],
                    [-8, 14],
                    [-8, 38],
                    [-12, 26],
                    [8, 38],
                    [20, 10],
                    [20, 14],
                    [20, 18],
                    [28, 38],
                    [24, 40],
                    [12, 40],
                    [16, 38],
                    [16, 34],
                    [20, 22],
                    [20, 30],
                    [16, 26],
                    [16, 22],
                    [16, 30],
                    [20, 26],
                    [20, 34],
                    [20, 38],
                    [24, 36],
                    [8, 42],
                    [28, 42],
                    [16, 18],
                    [16, 14],
                    [16, 10],
                    [12, 36],
                    [-8, 26],
                    [-4, 38],
                    [4, 2],
                    [-4, 14],
                    [0, 2],
                    [-4, 18],
                    [-12, 30],
                    [-4, 42]
                  ],
                  slow: [
                    [-16, 30],
                    [5, 20],
                    [28, 19],
                    [-12, 52],
                    [-8, 3]
                  ],
                  bumpbig: [[-25, 33]],
                  wall: [
                    [4, 29, "sw"],
                    [12, 25, "n"],
                    [12, 29, "se"],
                    [24, 29, "sw"],
                    [24, 25, "n"],
                    [28, 29, "e"],
                    [28, 33, "b"]
                  ],
                  blockbig: [[-20, 36]],
                  snagtall: [
                    [21, 46, "t3"],
                    [8, 27, "t1"],
                    [-29, 40, "t3"],
                    [-22, 28, "t3"],
                    [-22, 9, "t2"]
                  ],
                  bump: [
                    [22, 51],
                    [13, 49],
                    [28, 25],
                    [-28, 37],
                    [5, 32],
                    [31, 35],
                    [-14, 10],
                    [-20, 6]
                  ],
                  slowbig: [
                    [-20, 45],
                    [-23, 18]
                  ]
                },
                scene3: {
                  slow: [
                    [-3, 41],
                    [31, 42],
                    [-26, 41],
                    [-29, 17],
                    [-2, 18],
                    [26, 14],
                    [-20, 23],
                    [21, 45],
                    [6, 37]
                  ],
                  bump: [
                    [6, 44],
                    [29, 21],
                    [25, 38],
                    [36, 23],
                    [4, 22],
                    [23, 5],
                    [-5, 29],
                    [-30, 33],
                    [-19, 7],
                    [-4, 54]
                  ],
                  snag: [
                    [-3, 45, "b4"],
                    [-4, 49, "b6"],
                    [32, 33, "b4"],
                    [30, 36, "b3"],
                    [33, 20, "b4"],
                    [19, 3, "b6"],
                    [-23, 17, "b6"],
                    [-2, 20, "b2"],
                    [1, 34, "b4"],
                    [-21, 34, "b4"],
                    [-20, 28, "b4"],
                    [32, 18, "b4"],
                    [28, 33, "b1"],
                    [4, 51, "b4"]
                  ],
                  block: [
                    [3, 46],
                    [19, 8],
                    [-29, 27]
                  ],
                  slowbig: [
                    [23, 53],
                    [-25, 4],
                    [24, 29],
                    [-23, 49],
                    [1, 59]
                  ],
                  coin: [
                    [10, 46],
                    [-14, 46],
                    [10, 54],
                    [10, 50],
                    [-14, 54],
                    [-10, 50],
                    [-8, 6],
                    [10, 26],
                    [10, 42],
                    [10, 38],
                    [14, 34],
                    [-10, 42],
                    [-10, 38],
                    [-10, 34],
                    [-14, 34],
                    [-10, 30],
                    [-10, 26],
                    [-10, 22],
                    [-9, 18],
                    [-7, 14],
                    [-9, 10],
                    [4, 2],
                    [4, 6],
                    [5, 10],
                    [7, 14],
                    [10, 22],
                    [10, 30],
                    [14, 26],
                    [14, 30],
                    [14, 22],
                    [13, 18],
                    [11, 14],
                    [9, 10],
                    [8, 6],
                    [8, 2],
                    [-4, 2],
                    [-8, 2],
                    [-4, 6],
                    [-5, 10],
                    [-11, 14],
                    [-13, 18],
                    [-14, 22],
                    [-14, 26],
                    [-14, 30],
                    [-14, 38],
                    [-14, 42],
                    [10, 34],
                    [14, 38],
                    [14, 42],
                    [9, 18],
                    [-14, 50],
                    [-10, 54],
                    [14, 50],
                    [14, 54],
                    [-10, 46],
                    [14, 46]
                  ],
                  bumpbig: [[-24, 10]],
                  blockbig: [
                    [-22, 12],
                    [0, 25]
                  ],
                  snagsml: [
                    [26, 18, "c4"],
                    [-27, 32, "c1"],
                    [20, 17, "c5"],
                    [21, 22, "c5"],
                    [30, 23, "c5"],
                    [3, 30, "c1"],
                    [24, 16, "c5"]
                  ],
                  snagtall: [
                    [-23, 30, "t2"],
                    [-1, 30, "t3"],
                    [14, 4, "t3"],
                    [-16, 6, "t3"],
                    [23, 33, "t1"],
                    [-1, 50, "t3"]
                  ]
                },
                scene4: {
                  wall: [
                    [18, 2, "n"],
                    [24, 10, "b"],
                    [-16, 50, "b"],
                    [-16, 46, "n"],
                    [16, 38, "e"],
                    [-12, 38, "se"],
                    [12, 38, "sw"],
                    [16, 42, "n"],
                    [12, 34, "n"],
                    [12, 30, "n"],
                    [12, 26, "n"],
                    [12, 22, "e"],
                    [-12, 22, "w"],
                    [-8, 18, "w"],
                    [-4, 18, "se"],
                    [-4, 14, "n"],
                    [4, 6, "n"],
                    [-4, 10, "n"],
                    [-4, 6, "n"],
                    [4, 10, "n"],
                    [4, 14, "n"],
                    [4, 18, "sw"],
                    [-8, 22, "se"],
                    [8, 22, "sw"],
                    [8, 18, "e"],
                    [-12, 26, "n"],
                    [-12, 30, "n"],
                    [-12, 34, "n"],
                    [-16, 42, "n"],
                    [-16, 38, "w"],
                    [16, 46, "n"],
                    [16, 50, "b"],
                    [-24, 10, "b"],
                    [-18, 2, "n"],
                    [18, 6, "b"]
                  ],
                  bump: [
                    [23, 6],
                    [38, 41],
                    [-39, 46],
                    [-28, 46],
                    [-22, 15],
                    [26, 36]
                  ],
                  snagtall: [
                    [-18, 4, "t1"],
                    [35, 29, "t3"],
                    [38, 42, "t3"],
                    [-39, 38, "t3"],
                    [-26, 40, "t3"]
                  ],
                  slowbig: [
                    [30, 53],
                    [35, 21],
                    [0, 22],
                    [-37, 24],
                    [-31, 53]
                  ],
                  slow: [
                    [36, 9],
                    [-33, 7]
                  ],
                  snag: [
                    [-37, 33, "b6"],
                    [-33, 31, "b4"],
                    [28, 14, "b2"],
                    [-28, 16, "b1"],
                    [30, 33, "b4"],
                    [30, 5, "b4"],
                    [-25, 13, "b3"],
                    [28, 8, "b1"],
                    [-28, 11, "b4"],
                    [-30, 47, "b4"],
                    [34, 42, "b4"],
                    [-36, 36, "b4"],
                    [39, 34, "b2"],
                    [-27, 4, "b2"],
                    [-22, 4, "b4"]
                  ],
                  bumpbig: [
                    [33, 47],
                    [24, 13]
                  ],
                  block: [
                    [28, 43],
                    [-29, 37],
                    [-34, 42]
                  ],
                  coin: [
                    [4, 54],
                    [-4, 54],
                    [-20, 22],
                    [4, 50],
                    [-8, 50],
                    [4, 46],
                    [0, 46],
                    [-20, 30],
                    [20, 26],
                    [-20, 26],
                    [8, 42],
                    [0, 42],
                    [-8, 42],
                    [0, 38],
                    [8, 38],
                    [4, 34],
                    [-4, 34],
                    [8, 30],
                    [8, 26],
                    [0, 30],
                    [-4, 30],
                    [0, 26],
                    [12, 10],
                    [12, 2],
                    [8, 6],
                    [-12, 6],
                    [-8, 10],
                    [-8, 2],
                    [-8, 6],
                    [-12, 10],
                    [-12, 2],
                    [8, 10],
                    [8, 2],
                    [12, 6],
                    [-4, 26],
                    [-8, 26],
                    [-8, 30],
                    [4, 26],
                    [4, 30],
                    [-8, 34],
                    [-8, 38],
                    [0, 34],
                    [8, 34],
                    [4, 38],
                    [-4, 38],
                    [-4, 42],
                    [4, 42],
                    [20, 30],
                    [-8, 46],
                    [-4, 46],
                    [8, 46],
                    [-4, 50],
                    [0, 50],
                    [8, 50],
                    [20, 22],
                    [-8, 54],
                    [0, 54],
                    [8, 54]
                  ],
                  blockbig: [[31, 37]],
                  snagsml: [[23, 15, "c1"]]
                },
                scene5: {
                  slow: [
                    [26, 3],
                    [-32, 30],
                    [20, 16],
                    [-36, 49],
                    [7, 30],
                    [32, 42],
                    [-26, 3]
                  ],
                  coin: [
                    [2, 50],
                    [0, 46],
                    [-2, 42],
                    [-6, 42],
                    [-10, 42],
                    [-12, 38],
                    [-12, 34],
                    [-20, 34],
                    [-18, 30],
                    [-20, 26],
                    [-18, 22],
                    [-20, 18],
                    [-16, 14],
                    [-2, 10],
                    [0, 6],
                    [-12, 18],
                    [2, 2],
                    [-2, 2],
                    [-8, 14],
                    [-4, 14],
                    [-4, 6],
                    [-6, 10],
                    [-10, 10],
                    [-12, 14],
                    [-16, 18],
                    [-22, 22],
                    [-24, 26],
                    [-22, 30],
                    [-16, 34],
                    [-16, 38],
                    [-8, 38],
                    [-4, 38],
                    [-4, 46],
                    [-2, 50]
                  ],
                  blockbig: [[-8, 27]],
                  snagsml: [[29, 14, "c1"]],
                  bumpbig: [
                    [-19, 9],
                    [-26, 46],
                    [20, 50],
                    [-9, 26]
                  ],
                  slowbig: [
                    [-16, 51],
                    [22, 33],
                    [-30, 18]
                  ],
                  block: [
                    [-27, 41],
                    [7, 22],
                    [8, 36]
                  ],
                  snagtall: [
                    [25, 45, "t1"],
                    [-21, 43, "t3"],
                    [8, 15, "t3"],
                    [-12, 4, "t1"],
                    [12, 4, "t1"],
                    [17, 23, "t2"],
                    [28, 8, "t1"],
                    [-30, 46, "t3"]
                  ],
                  bump: [
                    [5, 18],
                    [17, 9],
                    [22, 24],
                    [27, 13],
                    [10, 19],
                    [12, 43],
                    [-33, 41]
                  ],
                  snag: [
                    [-31, 6, "b1"],
                    [-30, 36, "b4"],
                    [-35, 42, "b4"],
                    [20, 21, "b4"],
                    [11, 10, "b1"],
                    [21, 26, "b4"],
                    [15, 11, "b3"],
                    [8, 19, "b4"],
                    [-10, 23, "b4"],
                    [16, 43, "b1"],
                    [11, 32, "b4"],
                    [-33, 45, "b6"]
                  ],
                  ramp: [[1, 30]],
                  wall: [
                    [-20, 10, "se"],
                    [13, 47, "sw"],
                    [21, 47, "s"],
                    [-28, 10, "sw"],
                    [16, 6, "s"],
                    [20, 6, "e"],
                    [-16, 6, "f"],
                    [20, 10, "sw"],
                    [24, 10, "f"],
                    [17, 47, "f"],
                    [21, 43, "n"],
                    [-20, 6, "w"],
                    [-24, 10, "f"]
                  ]
                },
                scene6: {
                  slowbig: [
                    [18, 35],
                    [24, 5],
                    [-15, 18],
                    [-26, 44]
                  ],
                  slow: [
                    [-24, 27],
                    [-28, 13],
                    [27, 45],
                    [26, 27],
                    [0, 15],
                    [-24, 5],
                    [18, 18],
                    [-14, 33]
                  ],
                  coin: [
                    [12, 50],
                    [16, 46],
                    [16, 42],
                    [8, 46],
                    [-12, 50],
                    [-16, 50],
                    [-16, 42],
                    [-12, 46],
                    [-8, 42],
                    [4, 30],
                    [-4, 30],
                    [4, 26],
                    [-4, 26],
                    [0, 22],
                    [12, 6],
                    [-12, 10],
                    [-12, 6],
                    [-8, 10],
                    [-8, 2],
                    [8, 6],
                    [4, 10],
                    [-4, 10],
                    [4, 2],
                    [-4, 2],
                    [-4, 6],
                    [4, 6],
                    [8, 2],
                    [8, 10],
                    [-8, 6],
                    [-12, 2],
                    [12, 2],
                    [12, 10],
                    [4, 22],
                    [-4, 22],
                    [0, 26],
                    [0, 30],
                    [-12, 42],
                    [-8, 46],
                    [-16, 46],
                    [-8, 50],
                    [8, 42],
                    [12, 42],
                    [12, 46],
                    [8, 50],
                    [16, 50]
                  ],
                  spiral: [[0, 38]]
                },
                scene7: {
                  slow: [
                    [-16, 28],
                    [-33, 22],
                    [-8, 4],
                    [8, 5],
                    [-16, 4],
                    [-5, 17],
                    [33, 46],
                    [-27, 36],
                    [30, 22],
                    [16, 32]
                  ],
                  slowbig: [
                    [-28, 43],
                    [30, 38]
                  ],
                  snagtall: [
                    [-1, 20, "t2"],
                    [13, 5, "t3"],
                    [-13, 4, "t3"]
                  ],
                  snag: [
                    [3, 21, "b4"],
                    [-10, 7, "b4"],
                    [12, 3, "b4"],
                    [1, 19, "b4"]
                  ],
                  bump: [
                    [10, 7],
                    [16, 5],
                    [-15, 7],
                    [3, 19]
                  ],
                  spiral: [
                    [0, 40],
                    [24, 16],
                    [-24, 16]
                  ],
                  coin: [
                    [-26, 50],
                    [26, 50],
                    [-22, 54],
                    [-14, 54],
                    [10, 54],
                    [-10, 54],
                    [2, 54],
                    [2, 50],
                    [18, 42],
                    [-18, 42],
                    [26, 30],
                    [-27, 30],
                    [-26, 2],
                    [26, 2],
                    [2, 2],
                    [-2, 2],
                    [26, 6],
                    [22, 6],
                    [-26, 6],
                    [-2, 6],
                    [14, 42],
                    [22, 30],
                    [-22, 30],
                    [-14, 38],
                    [6, 30],
                    [-10, 30],
                    [-10, 26],
                    [14, 14],
                    [-14, 14],
                    [-10, 14],
                    [-10, 18],
                    [-14, 18],
                    [10, 14],
                    [10, 18],
                    [14, 18],
                    [-6, 26],
                    [10, 26],
                    [6, 26],
                    [10, 30],
                    [-14, 42],
                    [-22, 26],
                    [22, 26],
                    [14, 38],
                    [2, 6],
                    [-22, 6],
                    [22, 2],
                    [-22, 2],
                    [-26, 26],
                    [26, 26],
                    [-18, 38],
                    [18, 38],
                    [-2, 50],
                    [-2, 54],
                    [-10, 50],
                    [10, 50],
                    [-14, 50],
                    [14, 50],
                    [14, 54],
                    [-6, 30],
                    [-22, 50],
                    [22, 50],
                    [22, 54],
                    [26, 54],
                    [-26, 54]
                  ]
                },
                scene8: {
                  snag: [
                    [36, 31, "b2"],
                    [40, 34, "b4"],
                    [22, 15, "b1"],
                    [-33, 32, "b4"],
                    [-30, 52, "b4"],
                    [-6, 31, "b1"],
                    [4, 26, "b4"],
                    [-29, 49, "b4"],
                    [-33, 50, "b3"],
                    [-35, 28, "b4"],
                    [-29, 29, "b4"],
                    [-28, 14, "b4"],
                    [39, 13, "b2"],
                    [28, 5, "b6"],
                    [37, 5, "b4"],
                    [20, 47, "b6"],
                    [34, 47, "b4"],
                    [35, 35, "b4"],
                    [30, 31, "b4"]
                  ],
                  bumpbig: [
                    [34, 34],
                    [0, 33],
                    [-23, 54]
                  ],
                  bump: [
                    [34, 50],
                    [18, 51],
                    [39, 8],
                    [-30, 10],
                    [23, 18],
                    [-32, 30],
                    [-20, 46],
                    [3, 23]
                  ],
                  snagtall: [
                    [37, 47, "t3"],
                    [27, 7, "t3"],
                    [-4, 24, "t1"],
                    [34, 16, "t1"],
                    [34, 53, "t3"]
                  ],
                  blockbig: [
                    [26, 50],
                    [-36, 14]
                  ],
                  block: [[33, 8]],
                  slow: [
                    [22, 4],
                    [-22, 35],
                    [-1, 18],
                    [23, 36],
                    [-23, 2],
                    [-33, 41]
                  ],
                  wall: [
                    [-30, 7, "f"],
                    [-26, 11, "b"],
                    [26, 14, "n"],
                    [30, 18, "f"],
                    [0, 30, "sw"],
                    [0, 26, "e"],
                    [4, 30, "se"],
                    [26, 18, "sw"],
                    [-26, 7, "e"],
                    [-34, 7, "sw"]
                  ],
                  slowbig: [
                    [26, 23],
                    [22, 57],
                    [0, 38],
                    [-16, 59],
                    [-29, 22]
                  ],
                  snagsml: [
                    [-26, 51, "c5"],
                    [-21, 54, "c5"],
                    [-16, 50, "c5"],
                    [-26, 46, "c5"],
                    [-17, 47, "c5"],
                    [-22, 49, "c4"],
                    [-39, 8, "c1"]
                  ],
                  coin: [
                    [14, 30],
                    [-6, 46],
                    [6, 42],
                    [6, 46],
                    [-8, 6],
                    [10, 26],
                    [10, 42],
                    [10, 38],
                    [-10, 42],
                    [-10, 38],
                    [-10, 26],
                    [-10, 22],
                    [-9, 18],
                    [-7, 14],
                    [-9, 10],
                    [4, 2],
                    [4, 6],
                    [5, 10],
                    [7, 14],
                    [10, 22],
                    [14, 26],
                    [14, 22],
                    [13, 18],
                    [11, 14],
                    [9, 10],
                    [8, 6],
                    [8, 2],
                    [-4, 2],
                    [-8, 2],
                    [-4, 6],
                    [-5, 10],
                    [-11, 14],
                    [-13, 18],
                    [-14, 22],
                    [-14, 26],
                    [-14, 42],
                    [14, 42],
                    [9, 18],
                    [10, 46],
                    [-6, 42],
                    [-10, 46],
                    [-14, 30]
                  ]
                },
                scene9: {
                  snagtall: [[4, 16, "t1"]],
                  coin: [
                    [0, 10],
                    [0, 2],
                    [4, 10],
                    [4, 2],
                    [-4, 6],
                    [8, 54],
                    [0, 54],
                    [-8, 54],
                    [8, 50],
                    [0, 50],
                    [-4, 50],
                    [8, 46],
                    [-4, 46],
                    [-8, 46],
                    [4, 42],
                    [-4, 42],
                    [-4, 38],
                    [4, 38],
                    [8, 34],
                    [0, 34],
                    [-8, 38],
                    [-8, 34],
                    [4, 30],
                    [-8, 30],
                    [8, 2],
                    [8, 10],
                    [-8, 6],
                    [-8, 2],
                    [-8, 10],
                    [8, 6],
                    [-4, 30],
                    [0, 30],
                    [8, 30],
                    [-4, 34],
                    [4, 34],
                    [8, 38],
                    [0, 38],
                    [-8, 42],
                    [0, 42],
                    [8, 42],
                    [0, 46],
                    [4, 46],
                    [-8, 50],
                    [4, 50],
                    [-4, 54],
                    [4, 54],
                    [-4, 10],
                    [-4, 2],
                    [4, 6],
                    [0, 6]
                  ],
                  wall: [
                    [16, 46, "b"],
                    [-16, 46, "b"],
                    [16, 34, "w"],
                    [-20, 34, "sw"],
                    [-4, 18, "s"],
                    [-16, 38, "w"],
                    [-16, 42, "n"],
                    [24, 10, "se"],
                    [8, 18, "e"],
                    [8, 22, "sw"],
                    [-8, 22, "se"],
                    [16, 2, "n"],
                    [-16, 2, "n"],
                    [-8, 18, "w"],
                    [-24, 10, "sw"],
                    [16, 42, "n"],
                    [16, 38, "e"],
                    [0, 18, "f"],
                    [12, 22, "se"],
                    [-12, 22, "sw"],
                    [-16, 34, "e"],
                    [20, 34, "se"],
                    [-16, 6, "se"],
                    [-20, 6, "w"],
                    [-20, 10, "se"],
                    [16, 6, "sw"],
                    [20, 6, "e"],
                    [20, 10, "sw"]
                  ]
                },
                scene10: {
                  slow: [
                    [-5, 19],
                    [31, 54],
                    [-30, 28],
                    [35, 29],
                    [-36, 38]
                  ],
                  slowbig: [
                    [-20, 53],
                    [30, 18],
                    [-30, 19],
                    [-18, 32],
                    [34, 42]
                  ],
                  spiral: [
                    [-17, 20],
                    [-6, 35]
                  ],
                  bump: [
                    [26, 6],
                    [-21, 46],
                    [-2, 29],
                    [24, 50],
                    [13, 49],
                    [17, 9],
                    [27, 13],
                    [-8, 46],
                    [-19, 12],
                    [-28, 5]
                  ],
                  wall: [
                    [16, 6, "f"],
                    [12, 6, "sw"],
                    [-12, 6, "se"],
                    [-20, 6, "f"],
                    [-28, 10, "sw"],
                    [-24, 6, "w"],
                    [20, 6, "e"],
                    [-24, 10, "se"],
                    [20, 10, "sw"],
                    [24, 10, "f"]
                  ],
                  snag: [
                    [-26, 2, "b6"],
                    [-23, 13, "b1"],
                    [-21, 47, "b4"],
                    [0, 21, "b3"],
                    [1, 28, "b4"],
                    [4, 23, "b4"],
                    [23, 46, "b1"],
                    [-12, 46, "b2"],
                    [-1, 25, "b6"],
                    [-3, 23, "b1"],
                    [-24, 43, "b4"],
                    [-31, 5, "b4"],
                    [31, 6, "b4"]
                  ],
                  bumpbig: [
                    [-19, 40],
                    [-14, 9]
                  ],
                  spin: [
                    [11, 9],
                    [22, 14]
                  ],
                  block: [[18, 48]],
                  snagtall: [
                    [28, 8, "t1"],
                    [12, 50, "t3"],
                    [-16, 4, "t1"]
                  ],
                  coin: [
                    [2, 50],
                    [4, 46],
                    [6, 42],
                    [4, 38],
                    [8, 38],
                    [12, 34],
                    [20, 26],
                    [4, 14],
                    [16, 38],
                    [16, 34],
                    [20, 18],
                    [12, 18],
                    [12, 14],
                    [8, 14],
                    [6, 10],
                    [0, 6],
                    [2, 2],
                    [-2, 2],
                    [4, 6],
                    [2, 10],
                    [8, 18],
                    [16, 14],
                    [16, 18],
                    [22, 22],
                    [24, 26],
                    [22, 30],
                    [20, 34],
                    [18, 22],
                    [18, 30],
                    [8, 34],
                    [12, 38],
                    [2, 42],
                    [0, 46],
                    [-2, 50]
                  ],
                  blockbig: [
                    [9, 26],
                    [-15, 41]
                  ],
                  snagsml: [[-24, 45, "c1"]],
                  ramp: [[-10, 25]]
                },
                scene11: {
                  slow: [
                    [1, 17],
                    [29, 38],
                    [-22, 21],
                    [26, 14],
                    [31, 5],
                    [-31, 13],
                    [-31, 29],
                    [-26, 40],
                    [-7, 2]
                  ],
                  spin: [[7, 1]],
                  slowbig: [
                    [-25, 53],
                    [-32, 4],
                    [25, 26],
                    [24, 51]
                  ],
                  snag: [
                    [-15, 50, "b1"],
                    [19, 45, "b2"]
                  ],
                  bump: [
                    [-19, 37],
                    [-3, 10],
                    [5, 9],
                    [20, 37]
                  ],
                  snagtall: [
                    [-18, 32, "t1"],
                    [18, 40, "t1"],
                    [1, 8, "t3"]
                  ],
                  wall: [
                    [22, 34, "se"],
                    [18, 34, "f"],
                    [14, 46, "b"],
                    [-22, 34, "sw"],
                    [-14, 34, "e"],
                    [-14, 46, "se"],
                    [14, 38, "n"],
                    [-14, 38, "n"],
                    [-14, 42, "n"],
                    [-18, 46, "sw"],
                    [14, 42, "w"],
                    [14, 34, "w"]
                  ],
                  blockbig: [[0, 4]],
                  snagsml: [[-6, 8, "c1"]],
                  coin: [
                    [-6, 54],
                    [6, 50],
                    [2, 54],
                    [-6, 50],
                    [7, 30],
                    [-3, 30],
                    [8, 26],
                    [-8, 26],
                    [6, 46],
                    [6, 42],
                    [-2, 46],
                    [-2, 42],
                    [2, 38],
                    [-2, 38],
                    [2, 34],
                    [-6, 34],
                    [16, 14],
                    [13, 18],
                    [-13, 18],
                    [15, 10],
                    [20, 2],
                    [-19, 10],
                    [-12, 14],
                    [-20, 2],
                    [-20, 6],
                    [-16, 2],
                    [16, 2],
                    [10, 22],
                    [-10, 22],
                    [16, 6],
                    [-16, 6],
                    [-16, 14],
                    [-15, 10],
                    [20, 6],
                    [19, 10],
                    [-9, 18],
                    [-6, 22],
                    [9, 18],
                    [6, 22],
                    [12, 14],
                    [-2, 34],
                    [6, 34],
                    [-6, 38],
                    [6, 38],
                    [-6, 42],
                    [-6, 46],
                    [2, 42],
                    [2, 46],
                    [-4, 26],
                    [4, 26],
                    [-7, 30],
                    [3, 30],
                    [-2, 50],
                    [-2, 54],
                    [2, 50],
                    [6, 54]
                  ]
                },
                scene12: {
                  slow: [
                    [31, 18],
                    [-8, 35],
                    [4, 17],
                    [-28, 44],
                    [-21, 3],
                    [-33, 22],
                    [-38, 34],
                    [25, 35]
                  ],
                  slowbig: [
                    [7, 39],
                    [7, 5],
                    [-31, 10],
                    [-28, 52]
                  ],
                  bump: [
                    [6, 11],
                    [-13, 24],
                    [1, 31],
                    [8, 21],
                    [25, 28]
                  ],
                  snagtall: [
                    [-11, 24, "t3"],
                    [10, 24, "t3"],
                    [25, 23, "t3"],
                    [7, 28, "t1"]
                  ],
                  coin: [
                    [-26, 34],
                    [-6, 50],
                    [-6, 46],
                    [-14, 46],
                    [-14, 42],
                    [-14, 38],
                    [-18, 38],
                    [-22, 34],
                    [-22, 26],
                    [-22, 22],
                    [-18, 18],
                    [-22, 14],
                    [-14, 14],
                    [-18, 10],
                    [-10, 10],
                    [-10, 6],
                    [-10, 2],
                    [-6, 2],
                    [-6, 6],
                    [-14, 6],
                    [-14, 10],
                    [-18, 14],
                    [-22, 18],
                    [-26, 22],
                    [-26, 26],
                    [-26, 30],
                    [-22, 30],
                    [-22, 38],
                    [-18, 34],
                    [-18, 42],
                    [-10, 42],
                    [-10, 46],
                    [-10, 50],
                    [-26, 18]
                  ],
                  snagsml: [
                    [9, 12, "c1"],
                    [16, 32, "c1"]
                  ],
                  snag: [
                    [11, 9, "b4"],
                    [9, 33, "b1"],
                    [21, 26, "b1"],
                    [12, 18, "b6"],
                    [14, 12, "b4"],
                    [-9, 28, "b4"]
                  ],
                  wall: [
                    [15, 30, "s"],
                    [19, 30, "se"],
                    [11, 30, "f"],
                    [3, 30, "sw"],
                    [15, 26, "n"]
                  ],
                  blockbig: [[18, 21]],
                  block: [[-7, 21]]
                },
                scene13: {
                  slow: [
                    [-25, 42],
                    [7, 35],
                    [34, 31],
                    [-26, 29],
                    [-14, 31],
                    [38, 15],
                    [23, 52],
                    [4, 16],
                    [-6, 7]
                  ],
                  slowbig: [
                    [-26, 9],
                    [31, 44],
                    [30, 6],
                    [-11, 44]
                  ],
                  bump: [
                    [9, 23],
                    [-9, 24],
                    [-20, 19],
                    [-13, 9],
                    [-5, 34]
                  ],
                  snag: [
                    [6, 21, "b4"],
                    [-11, 11, "b4"],
                    [-4, 31, "b6"],
                    [-21, 25, "b6"],
                    [-11, 25, "b4"],
                    [-8, 32, "b2"],
                    [-22, 33, "b4"]
                  ],
                  block: [[10, 25]],
                  snagtall: [
                    [-15, 11, "t2"],
                    [-13, 19, "t1"],
                    [-24, 22, "t3"],
                    [-7, 15, "t3"],
                    [5, 27, "t1"],
                    [10, 29, "t3"]
                  ],
                  coin: [
                    [6, 50],
                    [6, 46],
                    [10, 46],
                    [14, 42],
                    [18, 34],
                    [18, 38],
                    [22, 38],
                    [26, 34],
                    [26, 26],
                    [22, 34],
                    [22, 26],
                    [26, 18],
                    [18, 18],
                    [18, 14],
                    [14, 10],
                    [14, 6],
                    [10, 2],
                    [6, 2],
                    [6, 6],
                    [10, 6],
                    [10, 10],
                    [18, 10],
                    [14, 14],
                    [22, 14],
                    [22, 18],
                    [22, 22],
                    [22, 30],
                    [26, 22],
                    [26, 30],
                    [18, 42],
                    [14, 38],
                    [14, 46],
                    [10, 42],
                    [10, 50]
                  ],
                  snagsml: [[-20, 31, "c1"]],
                  wall: [
                    [-5, 29, "se"],
                    [-9, 29, "sw"],
                    [-5, 25, "n"],
                    [-9, 21, "f"],
                    [-5, 21, "e"],
                    [-22, 21, "b"]
                  ]
                },
                scene14: {
                  coin: [
                    [6, 50],
                    [-6, 2],
                    [-2, 2],
                    [-14, 34],
                    [-6, 46],
                    [-10, 30],
                    [-14, 38],
                    [-6, 50],
                    [-6, 30],
                    [-6, 54],
                    [-10, 50],
                    [10, 14],
                    [2, 6],
                    [6, 22],
                    [10, 18],
                    [-14, 42],
                    [-6, 34],
                    [6, 30],
                    [6, 26],
                    [14, 18],
                    [14, 14],
                    [10, 10],
                    [10, 6],
                    [6, 6],
                    [6, 2],
                    [14, 10],
                    [14, 22],
                    [10, 26],
                    [2, 30],
                    [-2, 30],
                    [-10, 38],
                    [-10, 42],
                    [10, 22],
                    [2, 26],
                    [2, 2],
                    [6, 10],
                    [-10, 46],
                    [-14, 46],
                    [-2, 26],
                    [-10, 34],
                    [-2, 54],
                    [-6, 26],
                    [-2, 50],
                    [-2, 6],
                    [-6, 6],
                    [2, 50],
                    [2, 54],
                    [6, 54]
                  ],
                  slowbig: [
                    [17, 54],
                    [-16, 7],
                    [-29, 33],
                    [25, 4]
                  ],
                  wall: [
                    [-17, 20, "f"],
                    [17, 46, "se"],
                    [13, 46, "s"],
                    [9, 46, "sw"],
                    [13, 42, "n"],
                    [-21, 20, "sw"]
                  ],
                  snagtall: [
                    [-24, 11, "t3"],
                    [-4, 16, "t3"],
                    [-13, 18, "t1"]
                  ],
                  snag: [
                    [-23, 16, "b4"],
                    [19, 42, "b1"],
                    [4, 44, "b3"],
                    [0, 15, "b1"],
                    [-19, 14, "b4"],
                    [-21, 11, "b4"]
                  ],
                  bump: [
                    [-17, 13],
                    [21, 45],
                    [11, 38]
                  ],
                  slow: [
                    [-23, 54],
                    [27, 29],
                    [15, 36],
                    [-31, 45],
                    [24, 17],
                    [-18, 25],
                    [-31, 16]
                  ],
                  blockbig: [[4, 39]],
                  block: [[-7, 13]]
                },
                scene15: {
                  slowbig: [
                    [28, 42],
                    [25, 4],
                    [-23, 5],
                    [-32, 36]
                  ],
                  slow: [
                    [25, 25],
                    [-23, 26],
                    [-32, 49],
                    [-29, 16],
                    [-19, 55],
                    [28, 14],
                    [35, 33],
                    [20, 54]
                  ],
                  snag: [
                    [-23, 39, "b4"],
                    [-18, 34, "b4"],
                    [-8, 38, "b1"],
                    [-18, 41, "b2"],
                    [19, 19, "b4"],
                    [13, 10, "b4"],
                    [-17, 43, "b4"]
                  ],
                  bump: [
                    [-8, 45],
                    [11, 13]
                  ],
                  wall: [
                    [-12, 42, "w"],
                    [-12, 38, "e"],
                    [-4, 42, "s"],
                    [-8, 42, "f"],
                    [-16, 38, "sw"],
                    [-12, 46, "b"]
                  ],
                  snagtall: [
                    [17, 15, "t3"],
                    [0, 40, "t1"],
                    [-21, 35, "t3"]
                  ],
                  blockbig: [[4, 15]],
                  coin: [
                    [-6, 50],
                    [-2, 50],
                    [6, 6],
                    [2, 2],
                    [6, 54],
                    [10, 50],
                    [10, 46],
                    [10, 42],
                    [10, 38],
                    [14, 34],
                    [10, 30],
                    [-2, 6],
                    [-10, 6],
                    [-6, 22],
                    [-14, 22],
                    [-10, 18],
                    [-14, 14],
                    [-10, 10],
                    [-6, 26],
                    [-2, 26],
                    [2, 26],
                    [-2, 30],
                    [2, 30],
                    [6, 26],
                    [6, 30],
                    [-6, 30],
                    [-6, 10],
                    [-14, 10],
                    [-10, 14],
                    [-14, 18],
                    [-10, 22],
                    [-10, 26],
                    [-6, 6],
                    [-6, 2],
                    [-2, 2],
                    [10, 34],
                    [6, 34],
                    [14, 38],
                    [14, 42],
                    [14, 46],
                    [6, 46],
                    [6, 50],
                    [2, 50],
                    [2, 54],
                    [2, 6],
                    [6, 2],
                    [-2, 54],
                    [-6, 54]
                  ],
                  block: [[12, 19]]
                }
              }
            };
          }
        },
        setup() {
          new G(),
            (this.active = this.Endless),
            (this.list = [this.Endless, this.TimeTrial, this.ZigZag, this.Collector]),
            this.list.forEach((A) => {
              A.setup(), A.reset(), n(A.library, G.sys.library);
            });
        },
        reset() {
          this.active.reset();
        },
        cycleMode(A) {
          const t = this.list,
            e = "prev" === A ? -1 : 1,
            s = t.indexOf(this.active),
            n = (t.length + s + e) % t.length;
          (this.active = t[n]), this.reset(), T.sys.refreshMenuModeCluster();
        },
        isMode(A) {
          return this.active === A;
        },
        spawnMenuCluster() {
          const A = gA.sys.session.x,
            t = gA.sys.session.y;
          T.sys.buildCluster(this.active.menuCluster, A, t, "menu1");
        },
        spawnStart() {
          this.active.buildStartScene();
        },
        spawnUpdate() {
          this.active.update();
        }
      };
      class J {
        constructor() {
          if (J.sys) return J.sys;
          (J.sys = this),
            (this.playerSprite = new Image()),
            (this.bodyColors = [
              "rgb(85, 49, 23)",
              "rgb(135, 76, 43)",
              "rgb(178, 91, 32)",
              "rgb(204, 125, 54)",
              "rgb(204, 142, 74)",
              "rgb(249, 173, 115)",
              "rgb(255, 209, 166)",
              "rgb(242, 170, 145)",
              "rgb(245, 192, 158)"
            ]),
            (this.hairColors = [
              "rgb(66, 55, 55)",
              "rgb(136, 90, 37)",
              "rgb(202, 127, 40)",
              "rgb(254, 211, 80)",
              "rgb(191, 191, 191)",
              "rgb(222, 89, 58)",
              "rgb(227, 93, 174)",
              "rgb(169, 111, 242)",
              "rgb(70, 211, 135)"
            ]),
            (this.outfitColors = [
              "rgb(227, 78, 78)",
              "rgb(191, 102, 233)",
              "rgb(89, 130, 237)",
              "rgb(75, 192, 192)",
              "rgb(146, 206, 69)",
              "rgb(236, 210, 76)",
              "rgb(243, 141, 83)",
              "rgb(232, 232, 232)",
              "rgb(126, 126, 126)"
            ]);
        }
        createPlayerSprite(A) {
          const t = 640,
            e = this.createCanvas(t, 288);
          if ((this.applyLayers(e.ctx, P.sys.playerImg, [0, 64, 128], t, 64, 16), "konami" === A))
            this.applyLayers(e.ctx, P.sys.konamiImg, [0, 0, 0], t, 64, 16);
          else {
            const A = this.createPlayerBody(t, 64);
            this.applyLayers(e.ctx, A, [0, 0, 0], t, 96);
          }
          gA.sys.game.friend && this.applyLayers(e.ctx, P.sys.playerImg, [192, 192, 192], t, 64, 16);
          const s = new Image();
          (s.src = e.canvas.toDataURL("image/png")),
            (() => {
              var A, t, e, n;
              (A = this),
                (t = void 0),
                (n = function* () {
                  yield s.decode(), (this.playerSprite.src = s.src);
                }),
                new ((e = void 0) || (e = Promise))(function (s, i) {
                  function r(A) {
                    try {
                      o(n.next(A));
                    } catch (A) {
                      i(A);
                    }
                  }
                  function a(A) {
                    try {
                      o(n.throw(A));
                    } catch (A) {
                      i(A);
                    }
                  }
                  function o(A) {
                    var t;
                    A.done
                      ? s(A.value)
                      : ((t = A.value),
                        t instanceof e
                          ? t
                          : new e(function (A) {
                              A(t);
                            })).then(r, a);
                  }
                  o((n = n.apply(A, t || [])).next());
                });
            })();
        }
        createPlayerBody(A, t) {
          const e = this.createCanvas(A, 96),
            s = this.colorize(P.sys.playerImg, 0, 256, this.bodyColors[gA.sys.settings.playerBodyColor], A, t);
          e.ctx.drawImage(s.canvas, 0, 0, A, t, 0, 16, A, t);
          const n = C.sys.sheet.player.outfit[gA.sys.settings.playerOutfitStyle],
            i = this.colorize(P.sys.playerImg, 0, n, this.outfitColors[gA.sys.settings.playerOutfitColor], A, t);
          e.ctx.drawImage(i.canvas, 0, 0, A, t, 0, 16, A, t);
          const r = 32,
            a = 64,
            o = gA.sys.settings.playerHairStyle * r,
            c = this.colorize(P.sys.playerImg, o, 512, this.hairColors[gA.sys.settings.playerHairColor], r, a),
            l = gA.sys.settings.playerExtraStyle * r,
            g = this.createCanvas(r, a);
          return (
            g.ctx.drawImage(P.sys.playerImg, l, 576, r, a, 0, 0, r, a),
            P.sys.playerSprite.head.forEach((A) => {
              e.ctx.drawImage(c.canvas, 0, 0, r, a, A.x, A.y + 16, r, a),
                e.ctx.drawImage(g.canvas, 0, 0, r, a, A.x, A.y + 16, r, a);
            }),
            e.canvas
          );
        }
        colorize(A, t, e, s, n, i) {
          const r = this.createCanvas(n, i);
          r.ctx.drawImage(A, t, e, n, i, 0, 0, n, i),
            (r.ctx.globalCompositeOperation = "source-atop"),
            (r.ctx.fillStyle = s),
            r.ctx.fillRect(0, 0, n, i);
          const a = this.createCanvas(n, i);
          return (
            a.ctx.drawImage(A, t, e, n, i, 0, 0, n, i),
            (a.ctx.globalCompositeOperation = "overlay"),
            a.ctx.drawImage(r.canvas, 0, 0, n, i, 0, 0, n, i),
            (a.ctx.globalCompositeOperation = "source-over"),
            a
          );
        }
        createCanvas(A, t) {
          const e = document.createElement("canvas");
          (e.width = A), (e.height = t);
          const s = e.getContext("2d");
          return (s.imageSmoothingEnabled = !1), { canvas: e, ctx: s };
        }
        applyLayers(A, t, e, s, n, i = 0) {
          A.drawImage(t, 0, e[0], s, n, 0, 0 + i, s, n),
            A.drawImage(t, 0, e[1], s, n, 0, n + 3 * i, s, n),
            A.drawImage(t, 0, e[2], s, n, 0, 2 * n + 5 * i, s, n);
        }
        createGameCanvas(A) {
          (this.canvas = A),
            (this.ctx = A.getContext("2d")),
            (this.offset = { x: 0, y: 0 }),
            (this.lineDash = { crash: [], boost: [8, 16], avoid: [0, 8] });
        }
        createBackground(A, t) {
          const e = this.createCanvas(t, t);
          this.bg = { canvas: e.canvas, ctx: e.ctx, pattern: e.ctx.createPattern(A, "repeat") };
        }
        updateBackground(A = 0, t = 0, e = { x: 0, y: 0 }) {
          (this.offset.x = this.offset.x + (e.x - A)), (this.offset.y = this.offset.y + (e.y - t));
        }
        drawBackground() {
          if (void 0 === this.bg) return;
          const A = Math.floor(this.offset.x),
            t = Math.floor(this.offset.y);
          this.ctx.save(),
            (this.ctx.fillStyle = this.bg.pattern),
            this.ctx.translate(-A, -t),
            this.ctx.fillRect(A, t, gA.sys.session.w, gA.sys.session.h),
            this.ctx.restore();
        }
        defineCanvas() {
          const A = window.getComputedStyle(this.canvas.parentNode);
          (gA.sys.session.w = parseInt(A.getPropertyValue("width"), 10)),
            (gA.sys.session.h = parseInt(A.getPropertyValue("height"), 10)),
            (this.canvas.style.width = gA.sys.session.w + "px"),
            (this.canvas.style.height = gA.sys.session.h + "px"),
            (this.canvas.width = gA.sys.session.w),
            (this.canvas.height = gA.sys.session.h),
            (gA.sys.session.x = Math.floor(0.5 * gA.sys.session.w)),
            (gA.sys.session.y = Math.floor(0.4 * gA.sys.session.h)),
            (this.ctx.imageSmoothingEnabled = !1);
        }
        clearCanvas() {
          this.ctx.clearRect(0, 0, gA.sys.session.w, gA.sys.session.h),
            (this.ctx.lineCap = "round"),
            (this.ctx.lineJoin = "round");
        }
        drawFx(A = 0, t = 0, e = 0) {
          gA.sys.settings.reducedMotion && (A = 0);
          const s = C.sys.sheet.fx,
            n = s.poseData.effect,
            i = Math.floor(A * s.fps) % n.length;
          this.draw(P.sys.objectsImg, s, t, e, n[i]);
        }
        drawPlayerSprite(A, t = 0, e = 0, s = 1) {
          const n = gA.sys.settings.reducedMotion ? 0 : gA.sys.game.time.elapsed,
            i = C.sys.sheet.player,
            r = gA.sys.game.caught ? i.poseData[W.End] : i.poseData[A],
            a = Math.floor(n * i.fps) % 3;
          this.drawScaled(this.playerSprite, i, t, e, { x: r, y: i.h * a }, s);
        }
        drawNpc(A, t, e, s) {
          const n = C.sys.sheet.npc,
            i = { x: n.poseData[A], y: 64 * t };
          this.draw(P.sys.objectsImg, n, e, s, i);
        }
        drawLayer(A, t, e = 0, s = 0, n = 0, i = "looping", r) {
          if ("hidden" === i) return;
          const a = C.sys.sheet[A],
            o = a.poseData[t],
            c = gA.sys.settings.reducedMotion && "oneshot" !== i ? o.length - 1 : Math.floor(n * a.fps) % o.length;
          if (
            (this.draw(P.sys.objectsImg, a, e, s, o[c]),
            ("oneshot" === i || "ending" === i) && Math.ceil(n * a.fps) > o.length - 1)
          )
            switch (i) {
              case "oneshot":
                r.anim = "paused";
                break;
              case "ending":
                r.sleep = !0;
            }
        }
        drawShadow(A, t, e) {
          const s = J.sys.ctx;
          s.beginPath(),
            s.arc(A, t + e, 20 - e / 12, 0, 2 * Math.PI),
            (s.fillStyle = "rgba(0,0,0," + (0.6 - e / 200) + ")"),
            s.fill();
        }
        drawLineFx(A, t) {
          const e = J.sys.ctx;
          (e.strokeStyle = P.sys[t]),
            A.forEach((A) => {
              const t = 0.5 - A.time;
              (e.lineWidth = 6 * t),
                e.beginPath(),
                e.moveTo(A.start.x, A.start.y),
                e.lineTo(A.end.x, A.end.y),
                e.stroke();
            });
        }
        drawShield(A, t) {
          const e = Math.cos(4 * gA.sys.game.time.elapsed) + 3,
            s = 32 + 4 * e,
            n = 40 + 5 * (Math.cos(4 * (gA.sys.game.time.elapsed + 2)) + 3),
            i = J.sys.ctx;
          i.beginPath(),
            i.ellipse(A, t, s, 0.7 * s, 0, 0, 2 * Math.PI),
            (i.strokeStyle = P.sys.accent),
            (i.lineWidth = 6 - e),
            i.stroke(),
            i.beginPath(),
            i.ellipse(A, t, n / 2, (n / 2) * 0.7, 0, 0, 2 * Math.PI),
            (i.fillStyle = P.sys.accent),
            i.fill();
        }
        drawPickup(A) {
          if (A.time >= 1) return (A.pickup = !1), void (A.sleep = !0);
          const t = A.time % 1,
            e = (A.h / 2) * (t / 1.5 + 0.5),
            s = A.h * Math.min(t, 0.5),
            n = J.sys.ctx;
          n.beginPath(),
            n.arc(A.x, A.y, e, 0, 2 * Math.PI),
            (n.strokeStyle = P.sys.accent),
            (n.lineWidth = 6 * (1 - t)),
            n.stroke(),
            n.beginPath(),
            n.arc(A.x, A.y, s, 0, 2 * Math.PI),
            (n.strokeStyle = P.sys.accent),
            (n.lineWidth = 6 * (1 - 2 * t)),
            n.stroke();
        }
        drawHitbox(A, t) {
          const e = C.sys.sheet[A].str;
          if (!e) return;
          const s = J.sys.ctx;
          s.beginPath(),
            (s.lineWidth = 4),
            (s.strokeStyle = P.sys.hitbox),
            s.setLineDash(this.lineDash[e]),
            s.strokeRect(Math.floor(t.x) + 1, Math.floor(t.y) + 1, t.w - 2, t.h - 2),
            s.setLineDash([]);
        }
        drawBoundaries() {
          const A = gA.sys.session.x - gA.sys.game.dist.x,
            t = J.sys.ctx;
          t.beginPath(),
            t.rect(0, 0, A - j.active.edge, gA.sys.session.h),
            t.rect(A + j.active.edge, 0, gA.sys.session.w, gA.sys.session.h),
            (t.fillStyle = P.sys.boundary),
            t.fill();
        }
        drawScaled(A, t, e, s, n, i = 1) {
          J.sys.ctx.drawImage(
            A,
            n.x,
            n.y,
            t.w,
            t.h,
            Math.floor(e - t.w / (2 / i)),
            Math.floor(s - t.h / (2 / i)),
            t.w * i,
            t.h * i
          ),
            (J.sys.ctx.globalAlpha = 1);
        }
        draw(A, t, e, s, n) {
          J.sys.ctx.drawImage(A, n.x, n.y, t.w, t.h, Math.floor(e - t.w / 2), Math.floor(s - t.h / 2), t.w, t.h),
            (J.sys.ctx.globalAlpha = 1);
        }
      }
      J.sys = null;
      class P {
        constructor() {
          if (P.sys) return P.sys;
          (P.sys = this), (this.Horizon = h), (this.Surf = b);
        }
        setup() {
          (this.list = [this.Horizon, this.Surf]),
            this.list.forEach((A) => {
              A.setup();
            }),
            (this.playerSprite = {}),
            (this.activeTheme = this.getTheme()),
            n(this.activeTheme.playerSprite, this.playerSprite),
            (this.objectsImg = new Image()),
            (this.playerImg = new Image()),
            (this.konamiImg = new Image()),
            (this.bgImg = new Image()),
            (this.bgSize = 256),
            (this.contrast = { boundary: "GrayText", accent: "LinkText", fx: "LinkText", hitbox: "CanvasText" });
        }
        getTheme() {
          let A = this.list[0];
          for (let t = 0; t < this.list.length; t++) this.list[t].name === gA.sys.settings.theme && (A = this.list[t]);
          return A;
        }
        cycleTheme(A) {
          const t = this.list,
            e = "prev" === A ? -1 : 1,
            s = t.indexOf(this.activeTheme) || 0,
            n = (t.length + s + e) % t.length;
          this.updateTheme(t[n]);
        }
        updateTheme(A = this.getTheme()) {
          this.loadNewTheme(A),
            (() => {
              var t, e, s, n;
              (t = this),
                (e = void 0),
                (n = function* () {
                  yield this.objectsTemp.decode(),
                    yield this.playerTemp.decode(),
                    yield this.konamiTemp.decode(),
                    yield this.bgTemp.decode(),
                    this.applyTheme(A),
                    this.checkForcedColors();
                }),
                new ((s = void 0) || (s = Promise))(function (A, i) {
                  function r(A) {
                    try {
                      o(n.next(A));
                    } catch (A) {
                      i(A);
                    }
                  }
                  function a(A) {
                    try {
                      o(n.throw(A));
                    } catch (A) {
                      i(A);
                    }
                  }
                  function o(t) {
                    var e;
                    t.done
                      ? A(t.value)
                      : ((e = t.value),
                        e instanceof s
                          ? e
                          : new s(function (A) {
                              A(e);
                            })).then(r, a);
                  }
                  o((n = n.apply(t, e || [])).next());
                });
            })(),
            (this.activeTheme = A),
            (gA.sys.settings.theme = this.activeTheme.name),
            gA.sys.saveSessionSettings();
        }
        checkForcedColors() {
          const A = window.matchMedia("(forced-colors:active)");
          (gA.sys.session.contrast = A.matches),
            gA.sys.session.contrast &&
              ((this.hitbox = this.contrast.hitbox),
              (this.boundary = this.contrast.boundary),
              (this.accent = this.contrast.accent),
              (this.fx = this.contrast.fx));
        }
        loadNewTheme(A) {
          (this.objectsTemp = new Image()),
            (this.objectsTemp.src = A.imageSource.objects),
            (this.playerTemp = new Image()),
            (this.playerTemp.src = A.imageSource.player),
            (this.konamiTemp = new Image()),
            (this.konamiTemp.src = A.imageSource.konami),
            (this.bgTemp = new Image()),
            (this.bgTemp.src = A.imageSource.bg);
        }
        applyTheme(A) {
          const t = A.gameColor;
          (this.objectsImg.src = this.objectsTemp.src),
            (this.playerImg.src = this.playerTemp.src),
            (this.konamiImg.src = this.konamiTemp.src),
            (this.bgImg.src = this.bgTemp.src),
            (this.hitbox = t.hitbox),
            (this.boundary = t.boundary),
            (this.accent = t.accent),
            (this.fx = t.fx),
            n(A.playerSprite, this.playerSprite),
            J.sys.createBackground(this.bgImg, this.bgSize),
            J.sys.createPlayerSprite(),
            cA.sys.buildIcons(),
            this.applyRootStyles(),
            delete this.objectsTemp,
            delete this.playerTemp,
            delete this.bgTemp;
        }
        applyRootStyles() {
          function A(A) {
            const t = "  --" + A + ": " + P.sys.activeTheme.menuColor[A] + ";";
            P.sys.rootStyles += "\n" + t;
          }
          const t = document.querySelectorAll('style[type="text/css"]')[0];
          t && t.remove(), (this.rootStyles = "");
          const e = Object.keys(this.activeTheme.menuColor);
          for (let t = 0; t < e.length; t++) A(e[t]);
          const s = ":root {" + this.rootStyles + "\n}",
            n = document.getElementsByTagName("head")[0],
            i = document.createElement("style");
          i.setAttribute("type", "text/css"), i.appendChild(document.createTextNode(s)), n.appendChild(i);
        }
      }
      P.sys = null;
      const X = r(),
        q = {
          buildMenu() {
            this.buildTopUI(), this.buildHeaderUI(), this.buildModeUI(), this.buildActionUI(), y.show(cA.sys.statsUI);
          },
          buildTopUI() {
            const A = X.getString("gameEditPlayer");
            (this.player = y.createIconButton(cA.sys.topLeft, "editPlayer", 1, A)),
              y.clickEvent(
                this.player,
                function () {
                  cA.sys.changeMenu(cA.sys.Player);
                },
                !0
              );
            const t = X.getString("gameEditTheme");
            (this.theme = y.createIconButton(cA.sys.topLeft, "editTheme", 1, t)),
              y.clickEvent(
                this.theme,
                function () {
                  cA.sys.changeMenu(cA.sys.Theme);
                },
                !0
              );
            const e = X.getString("gameShare");
            (cA.sys.buttonShare = y.createIconButton(cA.sys.topRight, "share", 1, e)),
              (M.button = cA.sys.buttonShare),
              y.clickEvent(cA.sys.buttonShare, function () {
                O.sys.toggleFlyout(M);
              });
            const s = X.getString("gameSettings");
            (cA.sys.buttonSettings = y.createIconButton(cA.sys.topRight, "settings", 1, s)),
              (L.button = cA.sys.buttonSettings),
              y.clickEvent(cA.sys.buttonSettings, function () {
                O.sys.toggleFlyout(L);
              });
          },
          buildHeaderUI() {
            (this.title = y.create("h1", cA.sys.headerUI, "ui-title")), this.refreshHeaderUI();
          },
          refreshHeaderUI() {
            this.title.textContent = "Edge Surf";
          },
          buildModeUI() {
            const A = y.create("div", cA.sys.secondaryUI, "alt-select"),
              t = X.getString("actionPrev"),
              e = y.createIconButton(A, "caretLeft", 2, t);
            y.clickEvent(e, function () {
              j.cycleMode("prev"), q.refreshModeUI();
            }),
              (this.modeTitle = y.create("span", A));
            const s = X.getString("actionNext"),
              n = y.createIconButton(A, "caretRight", 2, s);
            y.clickEvent(n, function () {
              j.cycleMode("next"), q.refreshModeUI();
            });
            const i = y.create("div", cA.sys.secondaryUI, "alt-info");
            (this.modeText = y.create("span", i)), y.classAdd(n.parentNode, "focus-group"), this.refreshModeUI();
          },
          refreshModeUI() {
            (this.modeTitle.textContent = X.getString(j.active.stringLookup.title)),
              (this.modeText.textContent = X.getString(j.active.stringLookup.howto)),
              cA.sys.refreshStatsUI();
          },
          buildActionUI() {
            const A = X.getString("menuMainButton"),
              t = cA.sys.buildActionButtonUI(cA.sys.actionUI, "playCircle", 3, A);
            y.clickEvent(
              t,
              function () {
                z.sys.inputToggle();
              },
              !0
            ),
              y.focusButton(t);
          }
        },
        _ = r(),
        $ = {
          buildMenu() {
            this.buildTopUI(),
              this.buildHeaderUI(),
              this.buildPreviewUI(),
              this.buildColorUI(),
              this.buildActionUI(),
              this.buildOutfit(),
              this.storePlayer();
          },
          buildTopUI() {
            const A = _.getString("actionBack"),
              t = y.createIconButton(cA.sys.topLeft, "back", 1, A);
            y.clickEvent(
              t,
              function () {
                $.revertPlayer(), cA.sys.changeMenu(cA.sys.Main);
              },
              !0
            );
          },
          buildHeaderUI() {
            const A = y.create("div", cA.sys.headerUI, "edit-nav"),
              t = _.getString("editPlayerOutfit");
            (this.editOutfit = y.createIconButton(A, "editOutfit", 2, t)),
              y.clickEvent(this.editOutfit, function () {
                $.buildOutfit();
              });
            const e = _.getString("editPlayerHair");
            (this.editHair = y.createIconButton(A, "editHair", 2, e)),
              y.clickEvent(this.editHair, function () {
                $.buildHair();
              });
            const s = _.getString("editPlayerBody");
            (this.editBody = y.createIconButton(A, "editBody", 2, s)),
              y.clickEvent(this.editBody, function () {
                $.buildBody();
              });
            const n = _.getString("editPlayerExtras");
            (this.editExtras = y.createIconButton(A, "editExtras", 2, n)),
              y.clickEvent(this.editExtras, function () {
                $.buildExtras();
              }),
              (this.subtitle = y.create("h2", cA.sys.headerUI, "ui-subtitle"));
          },
          buildPreviewUI() {
            const A = _.getString("actionPrev"),
              t = y.createIconButton(cA.sys.primaryUI, "caretLeft", 3, A);
            y.clickEvent(t, function () {
              $.previousPreview();
            });
            const e = _.getString("actionNext"),
              s = y.createIconButton(cA.sys.primaryUI, "caretRight", 3, e);
            y.clickEvent(s, function () {
              $.nextPreview();
            }),
              y.classAdd(s.parentNode, "focus-group");
          },
          buildColorUI() {
            (this.colorPicker = y.create("div", cA.sys.secondaryUI, "alt-select")),
              y.classAdd(this.colorPicker, "color-picker"),
              (this.colors = []);
            const A = _.getString("editPlayerColor");
            for (let t = 0; t < 9; t++)
              (this.colors[t] = y.createButton(this.colorPicker, A, 4)),
                y.classAdd(this.colors[t], "color"),
                y.clickEvent(this.colors[t], function () {
                  $.changeColor($.colors[t]);
                });
            (this.activeColor = this.colors[0]), y.create("div", this.activeColor, void 0, "check");
            const t = y.createIconSVG(this.activeColor, "checkmark");
            y.classAdd(t, "checkmark"), y.classAdd(this.activeColor, "selected");
          },
          buildActionUI() {
            const A = _.getString("actionSave"),
              t = cA.sys.buildActionButtonUI(cA.sys.actionUI, void 0, 5, A);
            y.clickEvent(
              t,
              function () {
                var A;
                cA.sys.changeMenu(cA.sys.Main),
                  c(E, D.CUSTOMIZED_CHARACTER),
                  c("recordBodyColor", a((A = d.data.settings).playerBodyColor, 8)),
                  c("recordHairStyle", a(A.playerHairStyle, 20)),
                  c("recordHairColor", a(A.playerHairColor, 8)),
                  c("recordOutfits", a(A.playerOutfitStyle, 3)),
                  c("recordOutfitColor", a(A.playerOutfitColor, 8)),
                  c("recordAccessory", a(A.playerExtraStyle, 20));
              },
              !0
            ),
              y.focusButton(t);
          },
          refreshUI(A) {
            this.subtitle.textContent = _.getString(A);
          },
          changeActive(A) {
            const t = document.querySelector(".active");
            t && y.classDel(t, "active"), y.classAdd(A, "active"), (this.activeSubmenu = A);
          },
          updateButtons(A, t, e) {
            cA.sys.primaryUI.querySelectorAll("button").forEach((t) => {
              A < 1 ? t.removeAttribute("data-row") : y.setRowAttribute(t, A);
            }),
              cA.sys.secondaryUI.querySelectorAll("button").forEach((A) => {
                t < 1 ? A.removeAttribute("data-row") : y.setRowAttribute(A, t);
              }),
              y.setRowAttribute(document.querySelector("#action-button"), e);
          },
          buildBody() {
            this.changeActive(this.editBody),
              this.refreshUI("editPlayerBody"),
              y.hide(cA.sys.primaryUI),
              y.show(cA.sys.secondaryUI),
              this.buildColorButtons(J.sys.bodyColors),
              this.changeColor(this.colors[gA.sys.settings.playerBodyColor]),
              this.updateButtons(0, 3, 4);
          },
          buildOutfit() {
            this.changeActive(this.editOutfit),
              this.refreshUI("editPlayerOutfit"),
              y.show(cA.sys.primaryUI),
              y.show(cA.sys.secondaryUI),
              this.buildColorButtons(J.sys.outfitColors),
              this.changeColor(this.colors[gA.sys.settings.playerOutfitColor]),
              this.updateButtons(3, 4, 5);
          },
          buildHair() {
            this.changeActive(this.editHair),
              this.refreshUI("editPlayerHair"),
              y.show(cA.sys.primaryUI),
              y.show(cA.sys.secondaryUI),
              this.buildColorButtons(J.sys.hairColors),
              this.changeColor(this.colors[gA.sys.settings.playerHairColor]),
              this.updateButtons(3, 4, 5);
          },
          buildExtras() {
            this.changeActive(this.editExtras),
              this.refreshUI("editPlayerExtras"),
              y.show(cA.sys.primaryUI),
              y.hide(cA.sys.secondaryUI),
              this.updateButtons(3, 0, 4);
          },
          buildColorButtons(A) {
            for (let t = 0; t < this.colors.length; t++) this.colors[t].style.backgroundColor = A[t];
          },
          previousPreview() {
            switch (this.activeSubmenu) {
              case this.editOutfit:
                gA.sys.settings.playerOutfitStyle =
                  (C.sys.sheet.player.outfit.length + gA.sys.settings.playerOutfitStyle - 1) %
                  C.sys.sheet.player.outfit.length;
                break;
              case this.editHair:
                gA.sys.settings.playerHairStyle =
                  (C.sys.sheet.player.hair + gA.sys.settings.playerHairStyle - 1) % C.sys.sheet.player.hair;
                break;
              case this.editExtras:
                gA.sys.settings.playerExtraStyle =
                  (C.sys.sheet.player.extra + gA.sys.settings.playerExtraStyle - 1) % C.sys.sheet.player.extra;
            }
            gA.sys.saveSessionSettings(), J.sys.createPlayerSprite();
          },
          nextPreview() {
            switch (this.activeSubmenu) {
              case this.editOutfit:
                gA.sys.settings.playerOutfitStyle =
                  (C.sys.sheet.player.outfit.length + gA.sys.settings.playerOutfitStyle + 1) %
                  C.sys.sheet.player.outfit.length;
                break;
              case this.editHair:
                gA.sys.settings.playerHairStyle =
                  (C.sys.sheet.player.hair + gA.sys.settings.playerHairStyle + 1) % C.sys.sheet.player.hair;
                break;
              case this.editExtras:
                gA.sys.settings.playerExtraStyle =
                  (C.sys.sheet.player.extra + gA.sys.settings.playerExtraStyle + 1) % C.sys.sheet.player.extra;
            }
            gA.sys.saveSessionSettings(), J.sys.createPlayerSprite();
          },
          previousEdit() {
            const A = this.activeColor.previousElementSibling || this.colorPicker.lastElementChild;
            this.changeColor(A);
          },
          nextEdit() {
            const A = this.activeColor.nextElementSibling || this.colorPicker.firstElementChild;
            this.changeColor(A);
          },
          changeColor(A) {
            A.appendChild(this.activeColor.getElementsByTagName("div")[0]),
              A.appendChild(this.activeColor.getElementsByTagName("svg")[0]),
              y.classDel(this.activeColor, "selected"),
              y.classAdd(A, "selected"),
              (this.activeColor = A);
            const t = this.activeColor.style.backgroundColor;
            switch (this.activeSubmenu) {
              case this.editBody:
                gA.sys.settings.playerBodyColor = J.sys.bodyColors.indexOf(t);
                break;
              case this.editOutfit:
                gA.sys.settings.playerOutfitColor = J.sys.outfitColors.indexOf(t);
                break;
              case this.editHair:
                gA.sys.settings.playerHairColor = J.sys.hairColors.indexOf(t);
            }
            gA.sys.saveSessionSettings(), J.sys.createPlayerSprite();
          },
          storePlayer() {
            this.revert = {
              playerBodyColor: gA.sys.settings.playerBodyColor,
              playerHairStyle: gA.sys.settings.playerHairStyle,
              playerHairColor: gA.sys.settings.playerHairColor,
              playerOutfitStyle: gA.sys.settings.playerOutfitStyle,
              playerOutfitColor: gA.sys.settings.playerOutfitColor,
              playerExtraStyle: gA.sys.settings.playerExtraStyle
            };
          },
          revertPlayer() {
            (gA.sys.settings.playerBodyColor = this.revert.playerBodyColor),
              (gA.sys.settings.playerHairStyle = this.revert.playerHairStyle),
              (gA.sys.settings.playerHairColor = this.revert.playerHairColor),
              (gA.sys.settings.playerOutfitStyle = this.revert.playerOutfitStyle),
              (gA.sys.settings.playerOutfitColor = this.revert.playerOutfitColor),
              (gA.sys.settings.playerExtraStyle = this.revert.playerExtraStyle),
              gA.sys.saveSessionSettings(),
              J.sys.createPlayerSprite();
          }
        },
        AA = r(),
        tA = {
          menuCluster: "themeMenu",
          revert: void 0,
          buildMenu() {
            this.buildTopUI(), this.buildHeaderUI(), this.buildThemeUI(), this.buildActionUI(), this.storeTheme();
          },
          buildTopUI() {
            const A = AA.getString("actionBack"),
              t = y.createIconButton(cA.sys.topLeft, "back", 1, A);
            y.clickEvent(
              t,
              function () {
                tA.revertTheme(), cA.sys.changeMenu(cA.sys.Main);
              },
              !0
            );
          },
          buildHeaderUI() {
            (this.title = y.create("h1", cA.sys.headerUI, "ui-title")), this.refreshHeaderUI();
          },
          refreshHeaderUI() {
            this.title.textContent = AA.getString(P.sys.activeTheme.stringLookup.title);
          },
          buildThemeUI() {
            const A = y.create("div", cA.sys.secondaryUI, "alt-select"),
              t = AA.getString("actionPrev"),
              e = y.createIconButton(A, "caretLeft", 2, t);
            y.clickEvent(e, function () {
              P.sys.cycleTheme("prev"), tA.refreshHeaderUI(), tA.refreshThemeUI();
            }),
              (this.altTitle = y.create("span", A));
            const s = AA.getString("actionNext"),
              n = y.createIconButton(A, "caretRight", 2, s);
            y.clickEvent(n, function () {
              P.sys.cycleTheme("next"), tA.refreshHeaderUI(), tA.refreshThemeUI();
            }),
              y.classAdd(n.parentNode, "focus-group"),
              this.refreshThemeUI();
          },
          refreshThemeUI() {
            const A = P.sys.list,
              t = AA.getStringF("themeMenuSubtitle", A.indexOf(P.sys.activeTheme) + 1, A.length);
            this.altTitle.textContent = t;
          },
          buildActionUI() {
            const A = AA.getString("actionSave"),
              t = cA.sys.buildActionButtonUI(cA.sys.actionUI, void 0, 3, A);
            y.clickEvent(
              t,
              function () {
                cA.sys.changeMenu(cA.sys.Main);
              },
              !0
            ),
              y.focusButton(t);
          },
          storeTheme() {
            this.revert = P.sys.activeTheme;
          },
          revertTheme() {
            P.sys.updateTheme(this.revert);
          },
          loadClusters() {
            this.library = {
              themeMenu: {
                menu1: {
                  snagsml: [
                    [34, 0, "c4"],
                    [35, -4, "c5"],
                    [-25, 16, "c3"],
                    [21, 13, "c3"],
                    [-18, 10, "c3"],
                    [-21, 13, "c3"],
                    [18, 10, "c3"],
                    [25, 16, "c3"],
                    [-34, -13, "c1"],
                    [31, -3, "c5"]
                  ],
                  snag: [
                    [13, 0, "b4"],
                    [-30, -15, "b4"],
                    [-35, -11, "b4"],
                    [-42, -2, "b1"],
                    [-28, 0, "b6"],
                    [40, -1, "b4"],
                    [-13, -1, "b4"],
                    [-26, -15, "b4"],
                    [-31, -7, "b4"],
                    [-11, -3, "b4"],
                    [-22, -9, "b5"],
                    [43, 1, "b4"],
                    [33, -15, "b6"],
                    [-23, -2, "b6"],
                    [-39, -2, "b3"],
                    [24, -13, "b3"],
                    [16, -3, "b1"]
                  ],
                  bump: [
                    [15, -1],
                    [-25, 2],
                    [-42, 0],
                    [35, -9],
                    [40, 4],
                    [-31, 10],
                    [-25, -7],
                    [-34, -9],
                    [24, 7]
                  ],
                  wall: [
                    [22, 4, "f"],
                    [26, 0, "e"],
                    [-31, 7, "f"],
                    [-27, 7, "se"],
                    [26, 4, "se"],
                    [18, 4, "sw"]
                  ],
                  friend: [[28, 9]],
                  spin: [
                    [-36, 13],
                    [40, -6],
                    [-40, -5]
                  ],
                  slow: [
                    [-31, -1],
                    [22, -8],
                    [-45, 5],
                    [27, 25],
                    [11, -22],
                    [43, -17],
                    [-9, 32],
                    [16, 18],
                    [-13, 5],
                    [11, 6],
                    [45, 7],
                    [-39, -18],
                    [47, -7],
                    [-49, 19],
                    [-21, 37],
                    [-44, -9]
                  ],
                  block: [
                    [-20, 0],
                    [29, -11]
                  ],
                  slowbig: [
                    [19, -17],
                    [-37, 29],
                    [31, -25],
                    [-9, -19],
                    [-21, 23],
                    [-27, -11],
                    [12, 34],
                    [-25, -25],
                    [34, 37],
                    [43, 23],
                    [-39, 11]
                  ],
                  snagtall: [
                    [35, -14, "t3"],
                    [39, 0, "t2"],
                    [-35, 5, "t1"],
                    [22, -2, "t1"]
                  ],
                  lure: [[-27, -11]],
                  spiral: [[34, 9]]
                }
              }
            };
          }
        },
        eA = r(),
        sA = {
          buildMenu() {
            this.buildTopUI(), y.show(cA.sys.statsUI);
          },
          buildTopUI() {
            const A = eA.getString("actionPause"),
              t = y.createIconButton(cA.sys.topLeft, "pause", 1, A);
            y.clickEvent(t, function () {
              z.sys.inputToggle();
            });
            const e = eA.getString("gameSettings");
            (cA.sys.buttonSettings = y.createIconButton(cA.sys.topRight, "settings", 1, e)),
              (L.button = cA.sys.buttonSettings),
              y.clickEvent(cA.sys.buttonSettings, function () {
                O.sys.toggleFlyout();
              });
          }
        },
        nA = r(),
        iA = {
          buildMenu() {
            this.buildTopUI(),
              this.buildHeaderUI(),
              this.buildActionUI(),
              this.buildMenuActionUI(),
              y.show(cA.sys.statsUI);
          },
          buildTopUI() {
            const A = nA.getString("actionPlay"),
              t = y.createIconButton(cA.sys.topLeft, "play", 1, A);
            y.clickEvent(
              t,
              function () {
                z.sys.inputToggle();
              },
              !0
            );
            const e = nA.getString("gameSettings");
            (cA.sys.buttonSettings = y.createIconButton(cA.sys.topRight, "settings", 1, e)),
              (L.button = cA.sys.buttonSettings),
              y.clickEvent(cA.sys.buttonSettings, function () {
                O.sys.toggleFlyout();
              });
          },
          buildHeaderUI() {
            y.create("h1", cA.sys.headerUI, "ui-title").textContent = nA.getString("menuPauseTitle");
          },
          buildActionUI() {
            const A = nA.getString("menuPauseButton"),
              t = cA.sys.buildActionButtonUI(cA.sys.actionUI, "playCircle", 2, A);
            y.clickEvent(
              t,
              function () {
                z.sys.inputToggle();
              },
              !0
            ),
              y.focusButton(t);
          },
          buildMenuActionUI() {
            const A = nA.getString("actionBack"),
              t = y.createTextButton(cA.sys.actionUI, A, "btn-share", 3);
            y.clickEvent(
              t,
              function () {
                z.sys.resetGame();
              },
              !0
            );
          }
        },
        rA = r(),
        aA = {
          buildMenu() {
            this.buildTopUI(),
              this.buildHeaderUI(),
              setTimeout(function () {
                aA.buildShareUI();
              }, 100);
          },
          buildTopUI() {
            const A = rA.getString("actionBack"),
              t = y.createIconButton(cA.sys.topLeft, "back", 1, A);
            y.clickEvent(
              t,
              function () {
                z.sys.resetGame();
              },
              !0
            );
            const e = rA.getString("gameShare");
            (cA.sys.buttonShare = y.createIconButton(cA.sys.topRight, "share", 1, e)),
              (M.button = cA.sys.buttonShare),
              y.clickEvent(cA.sys.buttonShare, function () {
                O.sys.toggleFlyout(M);
              });
            const s = rA.getString("gameSettings");
            (cA.sys.buttonSettings = y.createIconButton(cA.sys.topRight, "settings", 1, s)),
              (L.button = cA.sys.buttonSettings),
              y.clickEvent(cA.sys.buttonSettings, function () {
                O.sys.toggleFlyout();
              });
          },
          buildHeaderUI() {
            const A = y.create("h1", cA.sys.headerUI, "ui-title");
            let t = "menuOverTitle";
            gA.sys.game.highScore
              ? (t = "menuOverTitleHighScore")
              : j.active.almostHighScore() && (t = "menuOverTitleAlt"),
              (A.textContent = rA.getString(t)),
              this.buildScoreMeter(cA.sys.headerUI),
              this.animateScoreMeter();
          },
          buildShareUI() {
            (this.shareAction = y.create("div", cA.sys.actionUI, "share-content")),
              this.buildActionButton(this.shareAction),
              this.buildShareRow(this.shareAction);
          },
          buildActionButton(A) {
            const t = rA.getString("menuOverButton"),
              e = cA.sys.buildActionButtonUI(A, "playCircle", 2, t);
            y.classAdd(e, "btn-full"),
              y.clickEvent(
                e,
                function () {
                  z.sys.inputToggle();
                },
                !0
              ),
              y.focusButton(e);
          },
          buildScoreMeter(A) {
            (this.statsScore = y.create("div", A, void 0, "stats-score")),
              (this.scoreIcon = y.create("span", this.statsScore, void 0, "score-icon")),
              y.createIconSVG(this.scoreIcon, "star"),
              y.hide(this.scoreIcon);
            const t = y.create("span", this.statsScore, void 0, "score-meter");
            (this.scoreText = y.create("span", t, void 0, "score-text")),
              (this.scoreFill = y.create("span", t, void 0, "score-fill"));
          },
          animateScoreMeter() {
            const A = j.active.getScoreFormatted();
            (this.scoreText.textContent = A),
              (this.scoreFill.style.transition = "width 0.6s 0.2s"),
              setTimeout(function () {
                const A = j.active.scoreMeter();
                aA.scoreFill.style.width = 100 * A + "%";
              }, 100),
              gA.sys.game.highScore && (y.show(aA.scoreIcon), y.classAdd(aA.statsScore, "highscore"));
          },
          buildShareRow(A) {
            const t = rA.getString("share"),
              e = y.createTextButton(A, t, "btn-share", 3);
            y.clickEvent(e, function () {
              O.sys.toggleFlyout(M);
            });
          }
        },
        oA = r();
      class cA {
        constructor() {
          if (cA.sys) return cA.sys;
          (cA.sys = this),
            (this.Main = q),
            (this.Player = $),
            (this.Theme = tA),
            (this.Play = sA),
            (this.Pause = iA),
            (this.Over = aA);
        }
        setup() {
          (this.active = cA.sys.Main),
            this.buildContainers(),
            this.buildCanvas(),
            (this.list = [this.Player, this.Theme]),
            this.list
              .filter((A) => A.menuCluster)
              .forEach((A) => {
                A.loadClusters(), n(A.library, G.sys.library);
              });
        }
        isMenu(A) {
          return this.active === A;
        }
        changeMenu(A) {
          switch (((this.active = A), A)) {
            case cA.sys.Main:
              T.sys.refreshMenuModeCluster();
              break;
            case cA.sys.Theme:
              T.sys.refreshMenuThemeCluster();
              break;
            case cA.sys.Player:
              T.sys.reset();
          }
          this.clearContainers(),
            y.hide(this.statsUI),
            y.hide(this.notifyUI),
            y.unfocusButton(),
            this.active.buildMenu(),
            O.sys.closeAllFlyouts(),
            this.tintScreen();
        }
        buildCanvas() {
          const A = y.create("canvas", document.body, "game-canvas");
          y.create("div", document.body, "game-color"), J.sys.createGameCanvas(A);
        }
        buildContainers() {
          (this.ui = y.create("div", document.body, "game-ui")),
            (this.tint = y.create("div", document.body, "game-tint")),
            (this.topLeft = y.create("nav", this.ui, "top-left", "top-container")),
            (this.topRight = y.create("nav", this.ui, "top-right", "top-container")),
            this.topRight.setAttribute("aria-label", oA.getString("gameSettings")),
            (this.statsUI = y.create("div", this.ui, "ui-stats")),
            (this.headerUI = y.create("div", this.ui, "ui-header")),
            (this.primaryUI = y.create("div", this.ui, "ui-main")),
            (this.secondaryUI = y.create("div", this.ui, "ui-alt")),
            (this.actionUI = y.create("div", this.ui, "ui-action")),
            this.clearContainers(),
            (this.notifyUI = y.create("div", this.ui, "ui-notify")),
            y.hide(this.notifyUI),
            (this.notify = y.create("span", this.notifyUI, "notify-content")),
            this.buildStatsUI();
        }
        clearContainers() {
          y.clear(this.topLeft),
            y.clear(this.topRight),
            y.clear(this.headerUI),
            y.clear(this.primaryUI),
            y.clear(this.secondaryUI),
            y.clear(this.actionUI),
            y.show(this.primaryUI),
            y.show(this.secondaryUI),
            (this.buttonShare = void 0),
            (this.buttonSettings = void 0);
        }
        buildStatsUI() {
          this.statsLives = y.create("div", this.statsUI, void 0, "stats-icons");
          const A = y.create("div", this.statsUI, void 0, "stats-score");
          (this.scoreIcon = y.create("span", A, void 0, "score-icon")),
            y.createIconSVG(this.scoreIcon, "star"),
            y.hide(this.scoreIcon);
          const t = y.create("span", A, void 0, "score-meter");
          (this.scoreText = y.create("span", t, void 0, "score-text")),
            (this.scoreFill = y.create("span", t, void 0, "score-fill")),
            (this.statsBoosts = y.create("div", this.statsUI, void 0, "stats-icons"));
        }
        buildActionButtonUI(A, t, e, s) {
          const n = y.createIconButton(A, t, e, s);
          return (n.id = "action-button"), (y.create("span", n).textContent = s), n;
        }
        buildIcons() {
          y.clear(this.statsLives), y.clear(this.statsBoosts);
          const A = "url(" + P.sys.objectsImg.src + ")";
          for (let t = 0; t < gA.sys.game.lives.max; t++) y.create("span", this.statsLives).style.backgroundImage = A;
          for (let t = 0; t < gA.sys.game.boosts.max; t++) y.create("span", this.statsBoosts).style.backgroundImage = A;
          this.updateIcons();
        }
        refreshStatsUI() {
          this.updateIcons(), this.updateScore(), this.checkHighScore();
        }
        tintScreen() {
          gA.sys.isState(lA.Play) ? y.hide(this.tint) : y.show(this.tint);
        }
        sendNotification(A, t = 3e3) {
          let e;
          switch (A) {
            case "score":
              e = oA.getString("newHighScore");
              break;
            case "cheatcode":
            case "cheat":
              e = oA.getString("codeScoring");
              break;
            case "code":
              e = oA.getString("code");
              break;
            default:
              e = "";
          }
          (this.notify.textContent = e),
            clearTimeout(this.timer),
            (this.timer = setTimeout(function () {
              y.hide(cA.sys.notifyUI);
            }, t)),
            y.show(this.notifyUI);
        }
        checkHighScore() {
          gA.sys.game.highScore || gA.sys.isState(lA.Menu)
            ? (y.show(this.scoreIcon), y.classAdd(this.statsUI, "highscore"))
            : (y.hide(this.scoreIcon), y.classDel(this.statsUI, "highscore"));
        }
        updateScore() {
          let A = 100;
          gA.sys.isState(lA.Menu)
            ? (this.scoreText.textContent = j.active.getHighScoreFormatted())
            : ((this.scoreText.textContent = j.active.getScoreFormatted()),
              gA.sys.game.highScore || (A = 100 * j.active.scoreMeter())),
            (this.scoreFill.style.width = A + "%");
        }
        updateIcons() {
          let A = [];
          if (gA.sys.game.cheat.lives || gA.sys.game.cheat.safety)
            A = ["empty", gA.sys.game.cheat.safety ? "shield" : "life-full", "infinite"];
          else
            for (let t = 0; t < gA.sys.game.lives.max; t++)
              t < gA.sys.game.shields.current
                ? (A[t] = "shield")
                : t < gA.sys.game.lives.current
                  ? (A[t] = "life-full")
                  : (A[t] = "life-empty");
          let t = [];
          if (gA.sys.game.cheat.boosts) t = ["boost-full", "infinite", "empty"];
          else
            for (let A = 0; A < gA.sys.game.boosts.max; A++) {
              const e = A < gA.sys.game.boosts.current ? "boost-full" : "boost-empty";
              t[A] = e;
            }
          const e = this.statsLives.querySelectorAll("span"),
            s = this.statsBoosts.querySelectorAll("span");
          for (let t = 0; t < e.length; t++) e[t].removeAttribute("class"), y.classAdd(e[t], A[t]);
          for (let A = 0; A < s.length; A++) s[A].removeAttribute("class"), y.classAdd(s[A], t[A]);
        }
      }
      var lA;
      (cA.sys = null),
        (function (A) {
          (A.Menu = "menu"), (A.Play = "play"), (A.Pause = "pause"), (A.Over = "over");
        })(lA || (lA = {}));
      class gA {
        constructor() {
          if (((this.game = void 0), gA.sys)) return gA.sys;
          (gA.sys = this),
            (this.settings = {}),
            (this.highScore = {}),
            (this.session = { state: lA.Menu, contrast: !1, w: 0, h: 0, x: 0, y: 0 });
        }
        setup() {
          this.loadSessionSettings(), this.reset();
        }
        loadSessionSettings() {
          n(d.data.settings, this.settings), n(d.data.highScore, this.highScore);
        }
        saveSessionSettings() {
          n(this.settings, d.data.settings), n(this.highScore, d.data.highScore), d.setData();
        }
        reset() {
          this.game = {
            time: { loop: 0, elapsed: 0, scale: 0 },
            dist: { unit: 0, x: 0, y: 0 },
            lives: { current: 3, max: 3 },
            boosts: { current: 0, max: 3 },
            shields: { current: 0, max: 3 },
            gates: 0,
            coins: 0,
            finish: !1,
            friend: !1,
            caught: !1,
            highScore: !1,
            cheat: { used: !1, lives: !1, boosts: !1, safety: !1 }
          };
        }
        update(A) {
          (this.game.time.loop = A / 1e3),
            (this.game.time.elapsed += this.game.time.loop),
            (this.game.time.scale = 60 * this.game.time.loop * this.settings.gameSpeed);
        }
        updateDistances(A) {
          (this.game.dist.x += A.x), (this.game.dist.y += A.y), (this.game.dist.unit += A.y / 10);
        }
        toggleHitbox() {
          this.settings.hitbox = !this.settings.hitbox;
        }
        checkHitbox() {
          return this.settings.hitbox;
        }
        toggleSpeed() {
          const A = this.settings.gameSpeed;
          this.settings.gameSpeed = 1 === A ? 0.5 : 1;
        }
        checkSpeed() {
          return 0.5 === this.settings.gameSpeed;
        }
        toggleMotion() {
          this.settings.reducedMotion = !this.settings.reducedMotion;
        }
        checkMotion() {
          return this.settings.reducedMotion;
        }
        triggerHighScore() {
          this.game.highScore ||
            ((this.game.highScore = !0),
            this.saveSessionSettings(),
            cA.sys.refreshStatsUI(),
            cA.sys.sendNotification("score"));
        }
        addItem(A, t = 1) {
          (A.current = Math.min(A.current + t, A.max)), cA.sys.updateIcons();
        }
        delItem(A, t = 1) {
          (A.current = Math.max(A.current - t, 0)), cA.sys.updateIcons();
        }
        getState() {
          return this.session.state;
        }
        setState(A) {
          (this.session.state = A), this.saveSessionSettings();
        }
        isState(A) {
          return this.session.state === A;
        }
      }
      gA.sys = void 0;
      class dA {
        constructor() {
          if (dA.sys) return dA.sys;
          (dA.sys = this), new gA(), new z(), new P(), new cA(), new O(), new C(), new T(), new J();
        }
        setup() {
          return (
            (A = this),
            (t = void 0),
            (s = function* () {
              yield d.setup(),
                gA.sys.setup(),
                j.setup(),
                z.sys.setup(),
                P.sys.setup(),
                cA.sys.setup(),
                O.sys.setup(),
                P.sys.updateTheme(),
                this.reflowCanvas(),
                new V(),
                this.changeState(lA.Menu);
            }),
            new ((e = void 0) || (e = Promise))(function (n, i) {
              function r(A) {
                try {
                  o(s.next(A));
                } catch (A) {
                  i(A);
                }
              }
              function a(A) {
                try {
                  o(s.throw(A));
                } catch (A) {
                  i(A);
                }
              }
              function o(A) {
                var t;
                A.done
                  ? n(A.value)
                  : ((t = A.value),
                    t instanceof e
                      ? t
                      : new e(function (A) {
                          A(t);
                        })).then(r, a);
              }
              o((s = s.apply(A, t || [])).next());
            })
          );
          var A, t, e, s;
        }
        gameLoop(A) {
          if ((z.sys.update(), !gA.sys.isState(lA.Pause)))
            switch ((gA.sys.update(A), gA.sys.getState())) {
              case lA.Play:
                this.updatePlay();
                break;
              case lA.Menu:
                this.updateMenu();
                break;
              case lA.Over:
                this.updateOver();
            }
        }
        changeState(A) {
          const t = gA.sys.getState();
          switch ((gA.sys.setState(A), A)) {
            case lA.Pause:
              this.triggerPause();
              break;
            case lA.Play:
              this.triggerPlay(t);
              break;
            case lA.Menu:
              this.triggerMenu();
              break;
            case lA.Over:
              this.triggerOver();
          }
          cA.sys.refreshStatsUI(), P.sys.checkForcedColors();
        }
        triggerMenu() {
          j.active.saveScore(),
            gA.sys.reset(),
            J.sys.defineCanvas(),
            J.sys.clearCanvas(),
            cA.sys.changeMenu(cA.sys.Main),
            z.sys.reset(),
            j.reset(),
            J.sys.createPlayerSprite();
        }
        triggerPlay(A) {
          A === lA.Menu && this.triggerStart(), cA.sys.changeMenu(cA.sys.Play);
        }
        triggerStart() {
          c(
            "recordTheme",
            (function (A) {
              switch (A) {
                case "horizon":
                  return Q.Surf;
                case "surf":
                  return Q.Classic;
                case "ski":
                  return Q.Ski;
              }
              return -1;
            })(gA.sys.settings.theme)
          ),
            c(
              "recordGameMode",
              (function (A) {
                switch (A) {
                  case "endless":
                    return k.Classic;
                  case "timetrial":
                    return k.Speed;
                  case "zigzag":
                    return k.Buoy;
                  case "collector":
                    return k.Collector;
                }
                return -1;
              })(j.active.id)
            ),
            (gA.sys.game.time.elapsed = 0),
            V.entity.unlockForNewGame(),
            T.sys.start(),
            z.sys.feedback("big");
        }
        triggerPause() {
          cA.sys.changeMenu(cA.sys.Pause);
        }
        triggerOver() {
          j.active.saveScore(),
            T.sys.all.forEach((A) => {
              "ending" === A.anim && (A.sleep = !0);
            }),
            cA.sys.changeMenu(cA.sys.Over),
            z.sys.feedback("big");
        }
        updateMenu() {
          T.sys.all.forEach((A) => {
            A.update();
          }),
            this.render();
        }
        updatePlay() {
          R.update(),
            T.sys.update(),
            T.sys.all.forEach((A) => {
              A.update();
            }),
            T.sys.all.forEach((A) => {
              A.move(V.entity.speed);
            }),
            cA.sys.updateScore(),
            gA.sys.updateDistances(V.entity.speed),
            J.sys.updateBackground(0, 0, V.entity.speed),
            this.render();
        }
        updateOver() {
          const A = T.sys.endingFoe;
          A && A.hit && "paused" !== A.anim && (A.update(), this.render());
        }
        reflowCanvas() {
          gA.sys.isState(lA.Play) && this.changeState(lA.Pause);
          const A = gA.sys.session.x,
            t = gA.sys.session.y;
          J.sys.defineCanvas();
          const e = gA.sys.session.x - A,
            s = gA.sys.session.y - t;
          T.sys.calcClusterSlots(),
            T.sys.all.forEach((A) => {
              A.shift(e, s);
            }),
            J.sys.updateBackground(e, s, { x: 0, y: 0 }),
            this.render();
        }
        render() {
          J.sys.clearCanvas(), J.sys.drawBackground();
          const A = T.sys.all.filter(function (A) {
            return A.x > -A.w && A.x < gA.sys.session.w + A.w && A.y < gA.sys.session.h + A.h;
          });
          A.forEach((A) => {
            A.draw();
          }),
            gA.sys.settings.hitbox &&
              A.forEach((A) => {
                J.sys.drawHitbox(A.type, A.hitbox);
              }),
            gA.sys.isState(lA.Menu) || j.isMode(j.Endless) || J.sys.drawBoundaries();
        }
      }
      dA.sys = null;
      var hA = A(379),
        bA = A.n(hA),
        CA = A(37),
        uA = A.n(CA),
        BA = A(569),
        pA = A.n(BA),
        wA = A(565),
        yA = A.n(wA),
        mA = A(216),
        fA = A.n(mA),
        xA = A(402),
        vA = {};
      (vA.setAttributes = yA()),
        (vA.insert = pA().bind(null, "head")),
        (vA.domAPI = uA()),
        (vA.insertStyleElement = fA()),
        bA()(xA.Z, vA),
        xA.Z && xA.Z.locals && xA.Z.locals,
        window.addEventListener("DOMContentLoaded", () => {
          !(function () {
            var A, t, e, s;
            (A = this),
              (t = void 0),
              (s = function* () {
                yield new Promise((A) => {
                  window.addEventListener("message", (t) => {
                    "init" === t.data.type && ((g = { data_: t.data.data }), A());
                  }),
                    window.parent.postMessage({ type: "requestData" }, "*");
                }),
                  new dA(),
                  yield dA.sys.setup();
                let A = window.performance.now();
                const t = () => {
                  requestAnimationFrame(t);
                  const e = window.performance.now() - A;
                  dA.sys.gameLoop(e), (A = window.performance.now());
                };
                requestAnimationFrame(t),
                  (function (A, t) {
                    let e;
                    window.addEventListener("resize", function () {
                      void 0 !== e && (clearTimeout(e), (e = void 0)),
                        (e = setTimeout(function () {
                          (e = void 0), A();
                        }, t));
                    });
                  })(function () {
                    dA.sys.reflowCanvas();
                  }, 10),
                  document.addEventListener("visibilitychange", function () {
                    dA.sys.reflowCanvas();
                  });
              }),
              new ((e = void 0) || (e = Promise))(function (n, i) {
                function r(A) {
                  try {
                    o(s.next(A));
                  } catch (A) {
                    i(A);
                  }
                }
                function a(A) {
                  try {
                    o(s.throw(A));
                  } catch (A) {
                    i(A);
                  }
                }
                function o(A) {
                  var t;
                  A.done
                    ? n(A.value)
                    : ((t = A.value),
                      t instanceof e
                        ? t
                        : new e(function (A) {
                            A(t);
                          })).then(r, a);
                }
                o((s = s.apply(A, t || [])).next());
              });
          })();
        });
    })();
})();
