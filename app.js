/* nugget v1 — fridge-moment meal balancer (Approach A: curated combos)
   Vanilla JS, no dependencies. Reads window.NUGGET_DATA from data.js. */
(function () {
  "use strict";

  var DATA = window.NUGGET_DATA;
  if (!DATA) { console.error("nugget: data.js failed to load"); return; }

  var CUSTOM_KEY = "nugget.customFoods.v1";

  var state = {
    ageBandId: "1-3y",       // default age band
    qty: new Map(),          // food id -> number of servings (>0 means selected)
    search: "",
    custom: loadCustom(),    // parent-entered foods (from a package label), device-only
    shared: []               // community foods from the shared library (Supabase)
  };

  // Supabase client for the shared packaged-food library. Optional: if it can't
  // init (offline / not configured), the app still works fully device-local.
  var SB = null;
  try {
    var cfg = window.NUGGET_CONFIG;
    if (cfg && cfg.supabaseUrl && window.supabase && window.supabase.createClient) {
      SB = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    }
  } catch (e) { SB = null; }

  function mapSharedRow(r) {
    return {
      id: "shared-" + r.id, dbId: r.id, name: r.name, emoji: "📦",
      group: "community", serving: r.serving_label || "1 serving",
      allergens: [], shared: true, source: r.source, n: r.nutrients || {}
    };
  }
  function loadShared() {
    if (!SB) return;
    SB.from("shared_foods").select("*").order("created_at", { ascending: false }).limit(1000)
      .then(function (res) {
        if (res.error || !res.data) return;
        state.shared = res.data
          .filter(function (r) { return r.status !== "flagged"; })
          .map(mapSharedRow);
        renderFoodPicker();
      });
  }

  // ---- data helpers -----------------------------------------------------
  function allFoods() { return DATA.foods.concat(state.shared, state.custom); }
  function foodById(id) { return allFoods().filter(function (f) { return f.id === id; })[0]; }
  function qtyOf(id) { return state.qty.get(id) || 0; }
  function isSel(id) { return qtyOf(id) > 0; }
  // returns [{ food, qty }] for everything with qty > 0
  function selected() {
    var out = [];
    state.qty.forEach(function (q, id) {
      var f = foodById(id);
      if (f && q > 0) out.push({ food: f, qty: q });
    });
    return out;
  }
  function band() {
    return DATA.ageBands.filter(function (b) { return b.id === state.ageBandId; })[0] || DATA.ageBands[0];
  }
  function statusOf(pct) { return pct >= 0.9 ? "good" : pct >= 0.5 ? "ok" : "low"; }

  // ---- custom foods (localStorage) --------------------------------------
  function loadCustom() {
    try {
      var raw = window.localStorage.getItem(CUSTOM_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveCustom() {
    try { window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.custom)); } catch (e) {}
  }

  // ---- core math --------------------------------------------------------
  function totals() {
    var t = {};
    selected().forEach(function (s) {
      Object.keys(s.food.n).forEach(function (k) {
        t[k] = (t[k] || 0) + (s.food.n[k] || 0) * s.qty;
      });
    });
    return t;
  }

  function renderMacros(t, daily) {
    var carbG = t.carbs || 0, fatG = t.fat || 0, proG = t.protein || 0;
    var cE = carbG * 4, pE = proG * 4, fE = fatG * 9, totE = cE + pE + fE;
    function share(x) { return totE > 0 ? Math.round(x / totE * 100) : 0; }

    var h = '<div class="macros"><h3>Energy &amp; macros</h3>';
    var cr = daily.calories;
    h += '<div class="macro-row"><span class="ml">Calories</span><span class="mv">' +
         Math.round(t.calories || 0) + ' kcal so far <span class="dim">&middot; full-day aim ' + cr.min + '&ndash;' + cr.max + '</span></span></div>';
    h += macroLine("Carbs", carbG, daily.carbs, share(cE), totE);
    h += macroLine("Fat", fatG, daily.fat, share(fE), totE);
    h += '<p class="macro-note">Percentages are today&rsquo;s mix of energy from each macro. A single meal is only part of the day.</p>';
    return h + '</div>';
  }

  function macroLine(label, grams, target, sharePct, totE) {
    var right = round1(grams) + "g";
    if (target && target.g != null) right += ' <span class="dim">&middot; aim ~' + target.g + 'g/day</span>';
    if (target && target.pctEnergy && totE > 0) {
      var lo = target.pctEnergy[0], hi = target.pctEnergy[1];
      var inRange = sharePct >= lo && sharePct <= hi;
      right += ' &middot; <span class="' + (inRange ? "in" : "out") + '">' + sharePct + '% of energy</span> <span class="dim">(aim ' + lo + '&ndash;' + hi + '%)</span>';
    }
    return '<div class="macro-row"><span class="ml">' + label + '</span><span class="mv">' + right + '</span></div>';
  }

  // Simple balance read: which broad food groups are present.
  function balanceMessage() {
    var foods = selected().map(function (s) { return s.food; });
    var has = function (groups) { return foods.some(function (f) { return groups.indexOf(f.group) > -1; }); };
    var hasProtein = has(["protein", "legume", "dairy", "milkfeeds"]);
    var hasProduce = has(["veg", "fruit"]);
    var hasFat     = has(["fat", "dairy", "protein", "milkfeeds"]);

    var missing = [];
    if (!hasProtein) missing.push("a protein (beans, egg, chicken, yogurt)");
    if (!hasProduce) missing.push("a veggie or fruit");
    if (!hasFat)     missing.push("a healthy fat (avocado, olive oil)");

    if (missing.length === 0) {
      return { icon: "✅", text: "Nicely balanced. You&rsquo;ve got protein, produce, and fat covered." };
    }
    if (foods.length >= 3 && missing.length >= 2) {
      return { icon: "🍞", text: "This is a bit one-sided. To round it out, add " + missing.join(" and ") + "." };
    }
    return { icon: "🥄", text: "Good start. To round it out, add " + missing.join(" and ") + "." };
  }

  // Suggest up to 2 curated foods (not already chosen) that best fill the biggest gap.
  function suggestions(t) {
    var b = band().daily;
    var fillable = ["iron", "protein", "calcium", "zinc", "vitaminC"];
    var lowest = null;
    fillable.forEach(function (key) {
      var target = b[key];
      if (!target) return;
      var pct = (t[key] || 0) / target;
      if (lowest === null || pct < lowest.pct) lowest = { key: key, pct: pct };
    });
    if (!lowest || lowest.pct >= 0.9) return null;

    var key = lowest.key;
    var skipGroups = ["milkfeeds", "packaged", "custom"]; // don't suggest milk/packaged/custom
    var picks = DATA.foods
      .filter(function (f) { return !isSel(f.id) && skipGroups.indexOf(f.group) < 0 && (f.n[key] || 0) > 0; })
      .sort(function (a, c) { return (c.n[key] || 0) - (a.n[key] || 0); })
      .slice(0, 2);
    if (!picks.length) return null;

    var nutLabel = DATA.nutrients.filter(function (n) { return n.key === key; })[0].label;
    var tip = null;
    if (key === "iron") {
      tip = "Tip: iron from plants absorbs better with a vitamin C food alongside it (like strawberries or broccoli).";
    }
    return { nutrient: nutLabel, key: key, picks: picks, tip: tip };
  }

  function allergensIn(foods) {
    var set = {};
    foods.forEach(function (f) { (f.allergens || []).forEach(function (a) { set[a] = true; }); });
    return Object.keys(set);
  }

  // ---- rendering: age bands ---------------------------------------------
  function renderAgeBands() {
    var wrap = document.getElementById("age-band");
    wrap.innerHTML = "";
    DATA.ageBands.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(b.id === state.ageBandId));
      btn.textContent = b.label;
      btn.addEventListener("click", function () {
        state.ageBandId = b.id;
        renderAgeBands();
        renderResults();
      });
      wrap.appendChild(btn);
    });
  }

  // ---- rendering: food picker -------------------------------------------
  function renderFoodPicker() {
    var wrap = document.getElementById("food-picker");
    wrap.innerHTML = "";
    var q = state.search.trim().toLowerCase();
    var any = false;

    DATA.groups.forEach(function (g) {
      var foods = allFoods().filter(function (f) {
        return f.group === g.id && (q === "" || f.name.toLowerCase().indexOf(q) > -1);
      });
      if (!foods.length) return;
      any = true;

      var groupEl = document.createElement("div");
      groupEl.className = "group";
      var title = document.createElement("div");
      title.className = "group-title";
      title.textContent = g.label;
      groupEl.appendChild(title);

      var chips = document.createElement("div");
      chips.className = "chips";
      foods.forEach(function (f) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.dataset.id = f.id;
        chip.setAttribute("aria-pressed", String(isSel(f.id)));
        var cau = (DATA.cautions && DATA.cautions[f.id]);
        var unv = (f.group === "community") ? ' <span class="chip-unverified" title="Community-added from a barcode, not physician-verified">community</span>' : '';
        chip.innerHTML = '<span class="emoji">' + f.emoji + '</span>' + escapeHtml(f.name) + unv +
          (cau ? ' <span class="chip-warn" title="' + escapeHtml(cau) + '" aria-label="prep caution">⚠️</span>' : '');
        chip.addEventListener("click", function () {
          if (isSel(f.id)) state.qty.delete(f.id);
          else state.qty.set(f.id, 1);
          chip.setAttribute("aria-pressed", String(isSel(f.id)));
          renderResults();
        });
        chips.appendChild(chip);
      });
      groupEl.appendChild(chips);
      wrap.appendChild(groupEl);
    });

    if (!any) {
      var none = document.createElement("p");
      none.className = "no-match";
      none.textContent = 'No foods match "' + state.search + '".';
      wrap.appendChild(none);
    }

    // Add packaged food: scan a barcode, or enter it from the label by hand.
    var addWrap = document.createElement("div");
    addWrap.className = "add-row";
    var scanBtn = document.createElement("button");
    scanBtn.type = "button";
    scanBtn.className = "add-custom scan";
    scanBtn.textContent = "📷 Scan a barcode";
    scanBtn.addEventListener("click", function () { openBarcodeModal(); });
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-custom";
    addBtn.textContent = "＋ Add by hand";
    addBtn.addEventListener("click", function () { openCustomForm(); });
    addWrap.appendChild(scanBtn);
    addWrap.appendChild(addBtn);
    wrap.appendChild(addWrap);
  }

  // ---- rendering: results (with editable "plate") -----------------------
  function renderResults() {
    var el = document.getElementById("results");
    var sel = selected();

    if (!sel.length) {
      el.hidden = false;
      el.className = "panel results empty";
      el.innerHTML = "Tap what your little one has eaten and nugget will show how the day is shaping up. 🥕";
      return;
    }

    el.className = "panel results";
    var t = totals();
    var b = band().daily;
    var bal = balanceMessage();

    var html = "";

    // Editable plate: each food with a serving stepper.
    html += '<div class="plate"><h3>Today&rsquo;s plate</h3><ul>';
    sel.forEach(function (s) {
      html += '<li data-id="' + s.food.id + '">' +
        '<span class="pf"><span class="emoji">' + s.food.emoji + '</span>' + escapeHtml(s.food.name) + '</span>' +
        '<span class="stepper">' +
          '<button type="button" class="qbtn" data-act="dec" data-id="' + s.food.id + '" aria-label="less">&minus;</button>' +
          '<input type="number" class="qv" data-id="' + s.food.id + '" value="' + s.qty + '" min="0" step="0.25" inputmode="decimal" aria-label="amount, in servings">' +
          '<button type="button" class="qbtn" data-act="inc" data-id="' + s.food.id + '" aria-label="more">＋</button>' +
        '</span>' +
        '<span class="pserv">&times; ' + escapeHtml(s.food.serving) +
          (s.food.shared ? ' <button type="button" class="report-btn" data-db="' + s.food.dbId + '" title="Report a problem with this community food">⚑</button>' : '') +
        '</span>' +
        '</li>';
    });
    html += '</ul></div>';

    html += '<div class="summary"><span class="icon">' + bal.icon + '</span><p>' + bal.text + '</p></div>';
    html += '<p class="eaten-line">Tallying against a full day&rsquo;s targets for ' + band().label +
            '. A single meal covers part of the day.</p>';

    html += '<div class="bars">';
    DATA.nutrients.forEach(function (n) {
      var target = b[n.key];
      if (!target) return;
      var val = t[n.key] || 0;
      var pct = val / target;
      var width = Math.max(2, Math.min(100, Math.round(pct * 100)));
      var st = statusOf(pct);
      html += '<div class="bar-row">';
      html += '  <div class="bar-head"><span class="bar-name">' + n.label +
              (n.hero ? ' <span class="hero-tag">key</span>' : '') + '</span>' +
              '<span class="bar-val">' + round1(val) + " / " + target + " " + n.unit +
              "  (" + Math.round(pct * 100) + "%)</span></div>";
      html += '  <div class="bar-track"><div class="bar-fill ' + st + '" style="width:' + width + '%"></div></div>';
      html += '</div>';
    });
    html += '</div>';

    if (b.vitaminD && ((t.vitaminD || 0) / b.vitaminD) < 0.5) {
      html += '<p class="tip" style="margin-top:14px">Vitamin D is hard to get from food alone. Most babies and toddlers need a daily vitamin D supplement &mdash; check with your pediatrician.</p>';
    }

    html += renderMacros(t, b);

    var sug = suggestions(t);
    if (sug) {
      html += '<div class="suggest"><h3>Close the gap &middot; lowest right now: ' + sug.nutrient + '</h3><ul>';
      sug.picks.forEach(function (f) {
        html += '<li><span class="emoji">' + f.emoji + '</span><span>' + escapeHtml(f.name) +
                '</span><span class="why">+' + round1(f.n[sug.key]) + " " +
                unitFor(sug.key) + " " + sug.nutrient.toLowerCase() + " &middot; " + escapeHtml(f.serving) + "</span></li>";
      });
      html += "</ul>";
      if (sug.tip) html += '<p class="tip">' + sug.tip + "</p>";
      html += "</div>";
    }

    var cauFoods = sel.map(function (s) { return s.food; }).filter(function (f) { return DATA.cautions && DATA.cautions[f.id]; });
    if (cauFoods.length) {
      html += '<div class="cautions"><h3>⚠️ Prep safely</h3><ul>';
      cauFoods.forEach(function (f) {
        html += '<li><span class="emoji">' + f.emoji + '</span> <strong>' + escapeHtml(f.name) +
                ':</strong> ' + escapeHtml(DATA.cautions[f.id]) + '</li>';
      });
      html += '</ul></div>';
    }

    var alg = allergensIn(sel.map(function (s) { return s.food; }));
    if (alg.length) {
      html += '<p class="allergen-note">Contains common allergens: ' + alg.join(", ") +
              ". Introduce new allergens one at a time and watch for reactions.</p>";
    }

    el.innerHTML = html;
    el.hidden = false;

    // wire up steppers (+/- adjust by 1, preserving any decimal)
    Array.prototype.forEach.call(el.querySelectorAll(".qbtn"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.id;
        var next = roundQty((qtyOf(id)) + (btn.dataset.act === "inc" ? 1 : -1));
        if (next <= 0) state.qty.delete(id); else state.qty.set(id, next);
        renderFoodPicker();  // reflect deselect on chips
        renderResults();
      });
    });
    // wire up direct amount entry (decimals allowed, e.g. 4.5 oz of formula)
    Array.prototype.forEach.call(el.querySelectorAll("input.qv"), function (inp) {
      inp.addEventListener("change", function () {
        var id = inp.dataset.id;
        var v = roundQty(parseFloat(inp.value));
        if (!v || v <= 0) state.qty.delete(id); else state.qty.set(id, v);
        renderFoodPicker();
        renderResults();
      });
    });
    // wire up report buttons on community foods
    Array.prototype.forEach.call(el.querySelectorAll(".report-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var dbId = btn.dataset.db;
        if (SB && dbId) { SB.rpc("report_food", { food_id: dbId }); }
        btn.textContent = "✓ reported";
        btn.disabled = true;
      });
    });
  }

  // ---- barcode scan + Open Food Facts lookup ----------------------------
  // Convert Open Food Facts nutriment units to nugget units.
  // OFF stores minerals/vitamins in grams; nugget uses mg (iron/calcium/zinc/vitC)
  // and IU (vitamin D). These are best-effort; the confirm-on-save step is the guard.
  function mgFromG(x) { return x == null ? null : Math.round(x * 1000 * 100) / 100; }
  function iuFromGvitD(x) { return x == null ? null : Math.round(x * 1e6 * 40); } // g->ug (x1e6) ->IU (x40)

  function offLookup(barcode, cb) {
    var url = "https://world.openfoodfacts.org/api/v2/product/" +
      encodeURIComponent(barcode) +
      ".json?fields=product_name,brands,nutriments,serving_size";
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || data.status === 0 || !data.product) { cb(null); return; }
      var p = data.product, nut = p.nutriments || {};
      function per(k) {
        var s = nut[k + "_serving"];
        if (s != null && !isNaN(s)) return Number(s);
        var h = nut[k + "_100g"];               // fallback: per 100g
        return (h != null && !isNaN(h)) ? Number(h) : null;
      }
      cb({
        barcode: barcode,
        name: [p.brands, p.product_name].filter(Boolean).join(" — ") || p.product_name || "",
        serving: p.serving_size || "1 serving",
        fromBarcode: true,
        n: {
          calories: per("energy-kcal"),
          protein: per("proteins"),
          carbs: per("carbohydrates"),
          fat: per("fat"),
          fiber: per("fiber"),
          iron: mgFromG(per("iron")),
          calcium: mgFromG(per("calcium")),
          zinc: mgFromG(per("zinc")),
          vitaminC: mgFromG(per("vitamin-c")),
          vitaminD: iuFromGvitD(per("vitamin-d"))
        }
      });
    }).catch(function () { cb(null); });
  }

  function openBarcodeModal() {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    // Camera scanning needs getUserMedia + a decoder. We prefer the native
    // BarcodeDetector (Android) and fall back to the ZXing library (iPhone/others).
    var hasNative = ("BarcodeDetector" in window);
    var hasZxing = !!(window.ZXing && window.ZXing.BrowserMultiFormatReader);
    var hasCam = navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (hasNative || hasZxing);

    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-label="Scan a barcode">' +
        '<h2>Scan a barcode</h2>' +
        (hasCam
          ? '<video id="bc-video" playsinline muted autoplay class="bc-video"></video>' +
            '<p class="cf-hint" id="bc-status">Point your camera at the barcode on the package. Hold steady.</p>'
          : '<p class="cf-hint">Camera scanning isn&rsquo;t available here. Type the barcode number instead (the long number under the bars).</p>') +
        '<label class="cf-txt">Barcode number<input type="text" id="bc-manual" inputmode="numeric" placeholder="e.g. 850004520109"></label>' +
        '<div class="cf-actions">' +
          '<button type="button" class="act ghost" id="bc-cancel">Cancel</button>' +
          '<button type="button" class="act primary" id="bc-go">Look up</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var stopCam = null, handled = false;
    function close() { if (stopCam) { try { stopCam(); } catch (e) {} } if (overlay.parentNode) document.body.removeChild(overlay); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("#bc-cancel").addEventListener("click", close);

    function handleCode(code) {
      if (handled) return; handled = true;
      var status = overlay.querySelector("#bc-status");
      if (status) status.textContent = "Looking up " + code + "…";
      offLookup(code, function (prefill) {
        close();
        if (prefill) openCustomForm(prefill);
        else openCustomForm({ barcode: code, fromBarcode: true, notFound: true }); // fill from label
      });
    }

    overlay.querySelector("#bc-go").addEventListener("click", function () {
      var code = overlay.querySelector("#bc-manual").value.trim();
      if (code) handleCode(code);
    });

    if (!hasCam) return;
    var video = overlay.querySelector("#bc-video");
    var camFail = function () {
      var s = overlay.querySelector("#bc-status");
      if (s) s.textContent = "Couldn't open the camera (check the camera permission). Type the barcode number below.";
    };

    if (hasNative) {
      try {
        var detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
          video.srcObject = stream; video.play();
          var done = false;
          stopCam = function () { done = true; stream.getTracks().forEach(function (t) { t.stop(); }); };
          (function loop() {
            if (done) return;
            detector.detect(video).then(function (codes) {
              if (codes && codes.length) { var c = codes[0].rawValue; stopCam(); handleCode(c); }
              else requestAnimationFrame(loop);
            }).catch(function () { if (!done) requestAnimationFrame(loop); });
          })();
        }).catch(camFail);
      } catch (e) { startZxing(); }
    } else {
      startZxing();
    }

    // ZXing path — works on iPhone (Safari/Chrome) and Android.
    function startZxing() {
      if (!hasZxing) { camFail(); return; }
      try {
        var reader = new window.ZXing.BrowserMultiFormatReader();
        var stopped = false;
        stopCam = function () { stopped = true; try { reader.reset(); } catch (e) {} };
        var cb = function (result) {
          if (stopped || !result) return;
          var text = result.getText ? result.getText() : result.text;
          stopCam(); handleCode(text);
        };
        var constraints = { video: { facingMode: "environment" } };
        if (reader.decodeFromConstraints) {
          reader.decodeFromConstraints(constraints, video, cb).catch(camFail);
        } else {
          reader.decodeFromVideoDevice(null, video, cb);
        }
      } catch (e) { camFail(); }
    }
  }

  // ---- custom food form (modal) — also the confirm-on-save card ----------
  function openCustomForm(prefill) {
    prefill = prefill || {};
    var pn = prefill.n || {};
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    var macroKeys = DATA.nutrients.concat([
      { key: "carbs", label: "Carbs", unit: "g" },
      { key: "fat", label: "Fat", unit: "g" },
      { key: "calories", label: "Calories", unit: "kcal" }
    ]);
    var fields = macroKeys.map(function (n) {
      var v = pn[n.key];
      return '<label class="cf-num">' + n.label + ' <span class="dim">(' + n.unit + ')</span>' +
        '<input type="number" step="any" min="0" data-key="' + n.key + '" value="' + (v == null ? "" : v) + '" placeholder="0"></label>';
    }).join("");

    var fromBc = !!prefill.fromBarcode;
    var title = fromBc ? "Confirm this food" : "Add a custom food";
    var hint = fromBc
      ? (prefill.notFound
          ? "We couldn&rsquo;t find that barcode. Type the numbers off the package&rsquo;s Nutrition Facts for <strong>one serving</strong>."
          : "Pulled from a public barcode database. <strong>Check these against the label</strong> before saving, especially the serving size.")
      : "Copy the numbers straight off the package&rsquo;s Nutrition Facts for <strong>one serving</strong>.";

    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-label="' + title + '">' +
        '<h2>' + title + '</h2>' +
        '<p class="cf-hint">' + hint + ' Saved on this device' + (fromBc ? '' : ', marked as your own') + ' (not physician-reviewed).</p>' +
        '<label class="cf-txt">Food name<input type="text" id="cf-name" value="' + escapeHtml(prefill.name || "") + '" placeholder="e.g. Cerebelly pouch — carrot"></label>' +
        '<label class="cf-txt cf-serving-wrap">Serving <span class="cf-serving-flag">check this matches the label</span>' +
          '<input type="text" id="cf-serving" value="' + escapeHtml(prefill.serving || "") + '" placeholder="e.g. 1 pouch"></label>' +
        '<div class="cf-grid">' + fields + '</div>' +
        '<div class="cf-actions">' +
          '<button type="button" class="act ghost" id="cf-cancel">Cancel</button>' +
          '<button type="button" class="act primary" id="cf-save">Save food</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#cf-name").focus();

    function close() { document.body.removeChild(overlay); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("#cf-cancel").addEventListener("click", close);
    overlay.querySelector("#cf-save").addEventListener("click", function () {
      var name = overlay.querySelector("#cf-name").value.trim();
      if (!name) { overlay.querySelector("#cf-name").focus(); return; }
      var serving = overlay.querySelector("#cf-serving").value.trim() || "1 serving";
      var n = {};
      Array.prototype.forEach.call(overlay.querySelectorAll(".cf-grid input"), function (inp) {
        var v = parseFloat(inp.value);
        n[inp.dataset.key] = isNaN(v) ? 0 : v;
      });
      // Trusted source (barcode found in the open database) → shared library so
      // every parent gets it. Manual / not-found entries stay device-only.
      var isShared = fromBc && !prefill.notFound && prefill.barcode && SB;
      if (isShared) {
        close();
        pushSharedAndSelect({ barcode: prefill.barcode, name: name, serving: serving, n: n });
        return;
      }
      var food = {
        id: "custom-" + Date.now(),
        name: name, emoji: "📦", group: "custom", serving: serving, allergens: [],
        custom: true, source: fromBc ? "barcode-off" : "manual", barcode: prefill.barcode || null, n: n
      };
      state.custom.push(food);
      saveCustom();
      state.qty.set(food.id, 1); // auto-select the food they just added
      close();
      renderFoodPicker();
      renderResults();
    });
  }

  // Push a barcode food to the shared library, then select it. Falls back to a
  // device-only food if the write fails, so the parent never loses their entry.
  function pushSharedAndSelect(food) {
    function fallbackLocal() {
      var f = { id: "custom-" + Date.now(), name: food.name, emoji: "📦", group: "custom",
        serving: food.serving, allergens: [], custom: true, source: "barcode-off",
        barcode: food.barcode, n: food.n };
      state.custom.push(f); saveCustom(); state.qty.set(f.id, 1);
      renderFoodPicker(); renderResults();
    }
    if (!SB) { fallbackLocal(); return; }
    SB.from("shared_foods").upsert({
      barcode: food.barcode, name: food.name, serving_label: food.serving,
      nutrients: food.n, source: "barcode-off"
    }, { onConflict: "barcode" }).select().then(function (res) {
      if (res.error || !res.data || !res.data[0]) { fallbackLocal(); return; }
      var mapped = mapSharedRow(res.data[0]);
      state.shared = state.shared.filter(function (f) { return f.dbId !== mapped.dbId; });
      state.shared.unshift(mapped);
      state.qty.set(mapped.id, 1);
      renderFoodPicker();
      renderResults();
    }).catch(function () { fallbackLocal(); });
  }

  // ---- small utils ------------------------------------------------------
  function round1(x) { return Math.round(x * 10) / 10; }
  function roundQty(x) { return isNaN(x) ? 0 : Math.round(x * 100) / 100; }
  function unitFor(key) { var n = DATA.nutrients.filter(function (m) { return m.key === key; })[0]; return n ? n.unit : ""; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---- wire up ----------------------------------------------------------
  function init() {
    renderAgeBands();
    renderFoodPicker();
    renderResults();
    loadShared(); // pull the community library (async; re-renders picker when ready)
    var search = document.getElementById("food-search");
    search.addEventListener("input", function () {
      state.search = search.value;
      renderFoodPicker();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
