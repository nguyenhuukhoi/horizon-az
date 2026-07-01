/* MyCloud theme behaviours.
 *
 * Moved out of _sidebar.html so the browser caches this file once instead of
 * re-downloading ~55KB of inline JS with every full page load, and so a strict
 * CSP (no 'unsafe-inline' for scripts) stays reachable. _sidebar.html keeps
 * only the paint-critical inline scripts (_mcUtil + sidebar icons + route
 * marker); everything below decorates content that exists at/after
 * DOMContentLoaded, so loading with `defer` is safe.
 *
 * ONE shared MutationObserver (rAF-batched) replaces the previous nine:
 * decorators register with _mcUtil.onMutate(fn). Every callback must stay
 * idempotent and cheap (early-exit by body class / dataset marks) because it
 * now runs for any DOM change on the page.
 */

(function () {
  var util = window._mcUtil;
  if (!util) return;
  var fns = [];
  var scheduled = false;
  function flush() {
    scheduled = false;
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](); } catch (e) {}
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function (cb) { setTimeout(cb, 16); })(flush);
  }
  util.onMutate = function (fn) { fns.push(fn); };
  function start() {
    if (!window.MutationObserver || !document.body) return;
    var obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    util._obs.push(obs);
  }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

// MyCloud: row-action dropdowns near the viewport bottom open upward so all
// Horizon actions remain visible. Do not add an internal scrollbar: the menu
// keeps its natural height and only changes placement.
(function () {
  var selector = '#content_body td.actions_column .dropdown-toggle[data-toggle="dropdown"]';

  function menuHeight(menu) {
    var display = menu.style.display;
    var visibility = menu.style.visibility;
    var pointerEvents = menu.style.pointerEvents;

    menu.style.display = 'block';
    menu.style.visibility = 'hidden';
    menu.style.pointerEvents = 'none';
    var height = menu.getBoundingClientRect().height || menu.scrollHeight;
    menu.style.display = display;
    menu.style.visibility = visibility;
    menu.style.pointerEvents = pointerEvents;
    return height;
  }

  function placeMenu(toggle) {
    var group = toggle.closest ? toggle.closest('.btn-group') : null;
    if (!group) return;
    var menu = group.querySelector('.dropdown-menu');
    if (!menu) return;

    group.classList.remove('mc-action-dropup');
    var rect = toggle.getBoundingClientRect();
    var height = menuHeight(menu);
    var below = window.innerHeight - rect.bottom - 12;
    var above = rect.top - 12;

    if (height > below && above > below) {
      group.classList.add('mc-action-dropup');
    }
  }

  // Capture runs before Bootstrap's delegated click handler, preventing one
  // frame of the menu appearing in the wrong direction.
  document.addEventListener('click', function (event) {
    var toggle = event.target.closest ? event.target.closest(selector) : null;
    if (toggle) placeMenu(toggle);
  }, true);

  // AJAX table refreshes reuse the delegated listener. Clear placement when a
  // menu closes so the next opening is measured against its current position.
  if (window.jQuery) {
    window.jQuery(document).on(
      'hidden.bs.dropdown',
      '#content_body td.actions_column .btn-group',
      function () { this.classList.remove('mc-action-dropup'); }
    );
  }
})();

// MyCloud: sidebar accordion — only ONE named panel group (Compute/Volumes/
// Network/...) open per dashboard. Opening one collapses the siblings.
// The unnamed "default" group (Overview / API Access) has no toggle, so it
// always stays visible.
(function () {
  function init() {
    var $ = window.jQuery;
    if (!$) return;
    $('#sidebar').on('show.bs.collapse',
      '.openstack-panel-group > .collapse, .openstack-dashboard > .panel-collapse',
      function (e) {
        // Only ONE section open at a time across the whole sidebar — both panel
        // groups (Compute/Volumes/…) AND collapsible dashboards (Admin/Identity).
        // Opening one collapses every other open one, except an ancestor of the
        // one being opened (so opening a group inside Admin doesn't collapse
        // Admin) and the always-open Project dashboard (mc-dashboard-static).
        var opening = e.target;
        var open = '#sidebar .openstack-panel-group > .collapse.in,' +
                   '#sidebar .openstack-dashboard:not(.mc-dashboard-static) > .panel-collapse.in';
        $(open).each(function () {
          if (this !== opening && !$.contains(this, opening)) {
            $(this).collapse('hide');
          }
        });
      });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: title the Octavia LBaaS detail card with its resource type (e.g.
// "Load Balancer"), read from hz-resource-property-list's resource-type-name.
(function () {
  function label(rt) {
    var t = (rt || '').split('::').pop();                 // "LoadBalancer"
    return t.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim(); // "Load Balancer"
  }
  function run() {
    if (!document.body.classList.contains('mc-lbaas-page')) return;
    var cards = document.querySelectorAll('#content_body .col-md-6.detail');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.dataset.mcTitled || c.querySelector('h3, h4')) continue;
      var rp = c.querySelector('hz-resource-property-list[resource-type-name]');
      var t = rp ? label(rp.getAttribute('resource-type-name')) : '';
      if (!t) continue;
      c.dataset.mcTitled = '1';
      var hh = document.createElement('h4');
      hh.textContent = t;
      c.insertBefore(hh, c.firstChild);
    }
  }
  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: turn the Django volume-family detail overview (a flat .detail with
// h4 sections) into separate cards, reusing the instance-detail card grid so it
// looks identical. Django renders the DOM server-side, so this is reliable.
(function () {
  function addBack() {
    var hdr = document.querySelector('.page-header.detail-header');
    if (!hdr) return;
    var row = hdr.querySelector('.row') || hdr;
    if (row.querySelector('.mc-back-to-list')) return;
    var a = document.createElement('a');
    a.className = 'mc-back-to-list';
    a.href = '#';
    a.textContent = 'Back to list';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // The page breadcrumb's last link is the resource list URL; go straight
      // there so Back always lands on the right list (fallback: history.back()).
      var bc = document.querySelector('.page-breadcrumb .breadcrumb, .breadcrumb');
      var links = bc ? bc.querySelectorAll('a') : [];
      var url = links.length ? links[links.length - 1].getAttribute('href') : null;
      var safe = false;
      try { var u = new URL(url, location.origin); safe = u.host === location.host; } catch (e) {}
      if (safe) { location.href = url; } else { history.back(); }
    });
    row.appendChild(a);
  }
  function resourceLabel() {
    // Heading for the leading (id/status) card = the resource type, taken from
    // the breadcrumb's last link (the list name) singularised. e.g. Volumes ->
    // Volume, Snapshots -> Snapshot, RBAC Policies -> RBAC Policy.
    var bc = document.querySelector('.page-breadcrumb .breadcrumb, .breadcrumb');
    var links = bc ? bc.querySelectorAll('a') : [];
    var t = links.length ? (links[links.length - 1].textContent || '').trim() : '';
    if (!t) return 'Details';
    if (/ies$/i.test(t)) return t.replace(/ies$/i, 'y');
    if (/s$/i.test(t)) return t.replace(/s$/i, '');
    return t;
  }
  function wrapOne(detail) {
    if (detail.dataset.mcCarded || detail.classList.contains('mc-instance-overview')) return;
    if (!detail.querySelector('dl.dl-horizontal')) return;
    detail.dataset.mcCarded = '1';
    var els = Array.prototype.slice.call(detail.children);
    var groups = [], g = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.tagName === 'H4') { g = [el]; groups.push(g); }
      else if (el.tagName === 'HR') { if (el.parentNode) el.parentNode.removeChild(el); }
      else { if (!g) { g = []; groups.unshift(g); } g.push(el); }
    }
    detail.classList.add('mc-instance-overview');
    for (var k = 0; k < groups.length; k++) {
      var grp = groups[k];
      var noH4 = !(grp[0] && grp[0].tagName === 'H4');
      var hasTable = false;
      for (var t = 0; t < grp.length; t++) {
        if (grp[t].querySelector && grp[t].querySelector('table')) hasTable = true;
      }
      var sec = document.createElement('section');
      sec.className = 'mc-instance-card' + ((noH4 || hasTable) ? ' mc-instance-card--wide' : '');
      if (noH4) {
        var hh = document.createElement('h4');
        hh.textContent = resourceLabel();
        sec.appendChild(hh);
      }
      for (var m = 0; m < grp.length; m++) sec.appendChild(grp[m]);
      detail.appendChild(sec);
    }
  }
  function run() {
    // Django detail pages render a .detail-header; Angular routed-detail does
    // not, so this only touches Django pages (Angular handled separately).
    if (!document.querySelector('.detail-header')) return;
    addBack();
    var ds = document.querySelectorAll('#content_body .detail');
    for (var d = 0; d < ds.length; d++) wrapOne(ds[d]);
  }
  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: replace Octavia's dense magic-search toolbar with the mockup shape
// while still driving the real Horizon magic-search input underneath.
(function () {
  function isLbPage() {
    return document.body.classList.contains('mc-lbaas-page');
  }
  function keyEvent(type, code) {
    var ev;
    try {
      ev = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        key: code === 13 ? 'Enter' : '',
        code: code === 13 ? 'Enter' : '',
        keyCode: code,
        which: code
      });
      try {
        Object.defineProperty(ev, 'keyCode', { get: function () { return code; } });
        Object.defineProperty(ev, 'which', { get: function () { return code; } });
      } catch (ignore) {}
    } catch (ignore) {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
      ev.keyCode = code;
      ev.which = code;
    }
    return ev;
  }
  function clickNative(el) {
    if (!el) return;
    if (window.angular) {
      try {
        window.angular.element(el).triggerHandler('click');
        return;
      } catch (ignore) {}
    }
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  function submitSearch(preamble, value) {
    var nativeInput = preamble.querySelector('.hz-magic-search-bar .search-input');
    if (!nativeInput) return;
    if (!value) {
      clickNative(preamble.querySelector('.hz-magic-search-bar .magic-search-clear'));
      return;
    }
    nativeInput.value = value;
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
    nativeInput.dispatchEvent(keyEvent('keyup', 13));
  }
  function decoratePreamble(preamble) {
    if (!isLbPage() || !preamble || preamble.querySelector('.mc-lb-filterbar')) return;
    var nativeSearch = preamble.querySelector('.hz-magic-search-bar');
    if (!nativeSearch) return;
    nativeSearch.classList.add('mc-lb-native-search');
    var bar = document.createElement('div');
    bar.className = 'mc-lb-filterbar';
    bar.innerHTML =
      '<button type="button" class="btn btn-default mc-lb-filter-field">Name = <span class="fa fa-caret-down" aria-hidden="true"></span></button>' +
      '<input type="text" class="form-control mc-lb-filter-input" aria-label="Filter load balancers">' +
      '<button type="button" class="btn btn-default mc-lb-filter-apply">Filter</button>';
    nativeSearch.parentNode.insertBefore(bar, nativeSearch);
    var input = bar.querySelector('.mc-lb-filter-input');
    var apply = bar.querySelector('.mc-lb-filter-apply');
    apply.addEventListener('click', function () {
      submitSearch(preamble, (input.value || '').trim());
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.keyCode === 13) {
        ev.preventDefault();
        apply.click();
      }
    });
  }
  function fixActionsHeader(table) {
    if (!isLbPage() || !table) return;
    var headers = table.querySelectorAll('thead tr.table_column_header th, thead tr th');
    if (!headers.length) return;
    var last = headers[headers.length - 1];
    if ((last.textContent || '').trim()) return;
    if (!table.querySelector('td.actions_column, tbody .btn')) return;
    last.textContent = 'Actions';
  }
  function run() {
    if (!isLbPage()) return;
    var preambles = document.querySelectorAll('#content_body hz-resource-table .hz-dynamic-table-preamble');
    for (var i = 0; i < preambles.length; i++) decoratePreamble(preambles[i]);
    var tables = document.querySelectorAll('#content_body hz-resource-table table.table');
    for (var t = 0; t < tables.length; t++) fixActionsHeader(tables[t]);
  }
  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: colour the Status / Power State cells as pills (like the mockup).
// Per-value classes can't be set in CSS, so map the cell text to a colour
// here. Re-runs on Horizon's AJAX row refreshes and text updates.
(function () {
  if (!window._mcUtil) return;
  var esc = window._mcUtil.esc;
  var classify = window._mcUtil.classify;
  function badgeTable(table) {
    var headers = table.querySelectorAll('thead tr.table_column_header th, thead tr th');
    var cols = [];
    for (var i = 0; i < headers.length; i++) {
      var ht = (headers[i].textContent || '').trim().toLowerCase();
      if (ht === 'status' || ht === 'power state' ||
          ht === 'operating status' || ht === 'provisioning status') cols.push(i);
    }
    if (!cols.length) return;
    var rows = table.querySelectorAll('tbody > tr');
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      for (var c = 0; c < cols.length; c++) {
        var cell = cells[cols[c]];
        if (!cell) continue;
        var dw = cell.querySelector('.table_cell_data_wrapper') || cell;
        var badge = dw.querySelector('.mc-stat-badge');
        if (badge) {
          var badgeText = (badge.textContent || '').trim();
          badge.className = 'mc-stat-badge ' + classify(badgeText);
          continue;
        }
        var txt = (dw.textContent || '').trim();
        if (!txt) continue;
        var sp = document.createElement('span');
        sp.className = 'mc-stat-badge ' + classify(txt);
        sp.textContent = txt;
        dw.textContent = '';
        dw.appendChild(sp);
      }
    }
  }
  function run() {
    var tables = document.querySelectorAll(
      '#content_body .table_wrapper table.datatable,' +
      '#content_body .hz-magic-search-context table.table');
    for (var t = 0; t < tables.length; t++) badgeTable(tables[t]);
  }
  function init() {
    run();
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      window.setTimeout(function () { pending = false; run(); }, 0);
    }

    // Horizon replaces an updating row, then emits `update` on its table.
    // Hooking that lifecycle keeps status pills in sync without polling.
    if (window.jQuery) {
      window.jQuery(document).on(
        'update.mcStatusPills',
        '#content_body table.datatable',
        schedule);
    }

    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(schedule);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: badge the Status row inside the image detail dl-horizontal.
// The badgeTable() above only handles <table> rows; this handles the
// hz-resource-property-list rendered as a dl-horizontal inside the detail page.
(function () {
  if (!window._mcUtil) return;
  var esc = window._mcUtil.esc;
  var classify = window._mcUtil.classify;
  function run() {
    var root = document.querySelector('[ng-controller^="ImageOverviewController"]');
    if (!root) return;
    var dts = root.querySelectorAll('.detail .dl-horizontal dt');
    for (var i = 0; i < dts.length; i++) {
      if ((dts[i].textContent || '').trim().toLowerCase() !== 'status') continue;
      var dd = dts[i].nextElementSibling;
      if (!dd || dd.tagName !== 'DD') continue;
      if (dd.querySelector('.mc-stat-badge')) continue;
      var txt = (dd.textContent || '').trim();
      if (!txt) continue;
      var sp = document.createElement('span');
      sp.className = 'mc-stat-badge ' + classify(txt);
      sp.textContent = txt;
      dd.textContent = '';
      dd.appendChild(sp);
    }
  }
  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: Image detail — Image + Security side by side (2 cards), then
// Custom Properties full width below, like the default theme. The CSS >
// combinator is unreliable through Angular's custom-element wrappers, so
// normalise the rows in JS.
(function () {
  function fix() {
    var ctrl = document.querySelector('[ng-controller^="ImageOverviewController"],[ng-controller^="NetworkQoSOverviewController"]');
    if (!ctrl || ctrl.dataset.mcGrid) return;
    // children gives ELEMENT nodes only — no Angular comment nodes
    var rows = [];
    for (var i = 0; i < ctrl.children.length; i++) {
      if (ctrl.children[i].classList.contains('row')) rows.push(ctrl.children[i]);
    }
    if (rows.length < 2) return; // Angular not done rendering yet
    ctrl.dataset.mcGrid = '1';
    var CARD = 'padding:0 20px 16px!important;box-sizing:border-box;margin:0!important';
    // Row 0: Image + Security side by side — 2 equal cards (stretch to same
    // height so the shorter Security card has no bare gap below it).
    var r0 = rows[0];
    r0.style.cssText = 'display:flex!important;flex-wrap:wrap;align-items:stretch;margin:0 0 16px!important;gap:16px';
    for (var j = 0; j < r0.children.length; j++) {
      r0.children[j].style.cssText = 'flex:1 1 0;min-width:0;float:none!important;width:auto!important;' + CARD;
    }
    // Remaining rows (Custom Properties): full width.
    for (var k = 1; k < rows.length; k++) {
      rows[k].style.cssText = 'display:block!important;margin:0 0 16px!important';
      for (var m = 0; m < rows[k].children.length; m++) {
        rows[k].children[m].style.cssText = 'float:none!important;width:100%!important;' + CARD;
      }
    }
  }
  function init() {
    fix();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(fix);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: Admin Hypervisors page layout. Keep Horizon's real tables/actions,
// but combine capacity columns into the compact meter cells used by the mockup.
(function () {
  if (location.pathname.indexOf('/admin/hypervisors') === -1) return;
  if (!window._mcUtil) return;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  var esc = window._mcUtil.esc;
  function headers(table) {
    return Array.prototype.slice.call(table.querySelectorAll('thead tr.table_column_header th, thead tr:last-child th'));
  }
  function findHeader(hs, exact) {
    exact = exact.toLowerCase();
    for (var i = 0; i < hs.length; i++) {
      if (text(hs[i]).toLowerCase() === exact) return i;
    }
    return -1;
  }
  function parseCap(raw) {
    var s = String(raw || '').replace(/,/g, '').trim().toLowerCase();
    var m = s.match(/-?\d+(?:\.\d+)?/);
    if (!m) return 0;
    var v = parseFloat(m[0]);
    if (/tib|tb/.test(s)) return v * 1024 * 1024;
    if (/gib|gb/.test(s)) return v * 1024;
    if (/kib|kb/.test(s)) return v / 1024;
    return v;
  }
  function pct(used, total) {
    var u = parseCap(used), t = parseCap(total);
    if (!t || t <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((u / t) * 100)));
  }
  function meterClass(value) {
    if (value >= 90) return 'is-danger';
    if (value >= 75) return 'is-warn';
    return 'is-ok';
  }
  function meterHtml(used, total, extraClass) {
    var value = pct(used, total);
    return '<div class="mc-hv-meter ' + (extraClass || '') + '">' +
      '<div class="mc-hv-meter-line"><span>' + esc(used) + ' / ' + esc(total) + '</span><span class="mc-hv-pct">' + value + '%</span></div>' +
      '<div class="mc-meter"><i class="' + meterClass(value) + '" style="transform:scaleX(' + (value / 100) + ')"></i></div>' +
      '</div>';
  }
  function tableRows(table) {
    return Array.prototype.slice.call(table.querySelectorAll('tbody > tr')).filter(function (tr) {
      return tr.children && tr.children.length;
    });
  }
  function hideColumn(table, idx) {
    if (idx < 0) return;
    var hs = headers(table);
    if (hs[idx]) hs[idx].classList.add('mc-hv-col-hide');
    var rows = tableRows(table);
    for (var r = 0; r < rows.length; r++) {
      if (rows[r].children[idx]) rows[r].children[idx].classList.add('mc-hv-col-hide');
    }
  }
  function setHeader(table, idx, label) {
    var hs = headers(table);
    if (hs[idx]) hs[idx].textContent = label;
  }
  function applyClientFilter(table, query) {
    query = (query || '').toLowerCase();
    var rows = tableRows(table);
    for (var i = 0; i < rows.length; i++) {
      if (/no items to display/i.test(text(rows[i]))) continue;
      rows[i].style.display = !query || text(rows[i]).toLowerCase().indexOf(query) !== -1 ? '' : 'none';
    }
  }
  function headerActions(table) {
    var uid = 'mc-hv-filter-' + Math.random().toString(36).slice(2);
    return '<div class="mc-hv-table-actions">' +
      '<label class="mc-hv-filter" for="' + uid + '"><input id="' + uid + '" type="search" placeholder="Filter..." data-mc-hv-filter></label>' +
      '</div>';
  }
  function bindPanelHead(wrapper, table) {
    var input = wrapper && wrapper.querySelector('[data-mc-hv-filter]');
    if (!input || input.getAttribute('data-mc-bound') === 'true') return;
    input.setAttribute('data-mc-bound', 'true');
    input.addEventListener('input', function () { applyClientFilter(table, input.value); });
  }
  function insertPanelHead(wrapper, title, countText, withActions, table) {
    if (!wrapper || wrapper.querySelector(':scope > .mc-hv-table-head')) return;
    wrapper.insertAdjacentHTML('afterbegin',
      '<div class="mc-hv-table-head"><div class="mc-hv-table-title">' + esc(title) + '</div>' +
      (countText ? '<span class="mc-hv-count">' + esc(countText) + '</span>' : '') +
      (withActions ? headerActions(table) : '') + '</div>');
    if (withActions) bindPanelHead(wrapper, table);
  }
  function rowCount(table) {
    var rows = tableRows(table);
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      if (!/no items to display/i.test(text(rows[i]))) n++;
    }
    return n;
  }
  function providerForHost(host) {
    var providers = window.MC_HV_PROV || [];
    var target = String(host || '').trim().toLowerCase();
    var shortTarget = target.split('.')[0];
    for (var i = 0; i < providers.length; i++) {
      var name = String(providers[i].n || '').trim().toLowerCase();
      if (name === target || name.split('.')[0] === shortTarget) {
        return providers[i];
      }
    }
    return null;
  }
  function ensureHypervisorVcpuColumn(table) {
    if (!table || table.getAttribute('data-mc-vcpu') === '1') return;
    var hs = headers(table);
    if (findHeader(hs, 'vCPU') >= 0) {
      table.setAttribute('data-mc-vcpu', '1');
      return;
    }
    var hostname = findHeader(hs, 'Hostname');
    var ram = findHeader(hs, 'RAM (used)');
    if (ram < 0) ram = findHeader(hs, 'RAM');
    if (hostname < 0 || ram < 0) return;

    var th = document.createElement('th');
    th.className = hs[ram].className;
    th.textContent = 'vCPU';
    hs[ram].parentNode.insertBefore(th, hs[ram]);

    var rows = tableRows(table);
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      if (!cells[hostname] || !cells[ram] || /no items to display/i.test(text(rows[r]))) continue;
      var provider = providerForHost(text(cells[hostname]));
      var td = document.createElement('td');
      td.setAttribute('data-mc-vcpu', '1');
      if (provider && +provider.vt > 0) {
        td.innerHTML = meterHtml(String(+provider.vu || 0), String(+provider.vt), '');
      } else {
        td.textContent = '-';
      }
      cells[ram].parentNode.insertBefore(td, cells[ram]);
    }
    table.setAttribute('data-mc-vcpu', '1');
  }
  function decorateHypervisors(table) {
    if (!table) return;
    ensureHypervisorVcpuColumn(table);
    if (table.classList.contains('mc-hv-enhanced')) return;
    var hs = headers(table);
    var hostname = findHeader(hs, 'Hostname');
    var type = findHeader(hs, 'Type');
    var memUsed = findHeader(hs, 'RAM (used)');
    var memTotal = findHeader(hs, 'RAM (total)');
    var diskUsed = findHeader(hs, 'Local Storage (used)');
    var diskTotal = findHeader(hs, 'Local Storage (total)');
    var instances = findHeader(hs, 'Instances');
    if (hostname < 0 || memUsed < 0 || memTotal < 0 || diskUsed < 0 || diskTotal < 0) return;

    table.classList.add('mc-hv-enhanced');
    setHeader(table, memUsed, 'RAM');
    setHeader(table, diskUsed, 'Local Storage');
    hideColumn(table, memTotal);
    hideColumn(table, diskTotal);
    insertPanelHead(table.closest('.table_wrapper'), 'Hosts', rowCount(table) + ' hosts', false, table);

    var rows = tableRows(table);
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      if (!cells[hostname] || /no items to display/i.test(text(rows[r]))) continue;
      if (!cells[hostname].querySelector('.mc-hv-host')) {
        var hvWrap = document.createElement('span'); hvWrap.className = 'mc-hv-host';
        var hvDot  = document.createElement('span'); hvDot.className  = 'mc-hv-dot';
        var hvInner = document.createElement('span');
        while (cells[hostname].firstChild) hvInner.appendChild(cells[hostname].firstChild);
        hvWrap.appendChild(hvDot); hvWrap.appendChild(hvInner);
        cells[hostname].appendChild(hvWrap);
      }
      if (cells[type] && !cells[type].querySelector('.mc-hv-tag')) {
        cells[type].innerHTML = '<span class="mc-hv-tag">' + esc(text(cells[type])) + '</span>';
      }
      if (cells[memUsed] && cells[memTotal]) {
        cells[memUsed].innerHTML = meterHtml(text(cells[memUsed]), text(cells[memTotal]), '');
      }
      if (cells[diskUsed] && cells[diskTotal]) {
        cells[diskUsed].innerHTML = meterHtml(text(cells[diskUsed]), text(cells[diskTotal]), '');
      }
      if (cells[instances]) cells[instances].classList.add('mc-hv-instances');
    }
  }
  function decorateProviders(table) {
    if (!table || table.classList.contains('mc-hv-provider-enhanced')) return;
    var hs = headers(table);
    if (findHeader(hs, 'Resource Provider Name') < 0) return;
    var groups = [
      ['vCPUs', 'VCPUs (used / total \u00b7 reserved \u00b7 ratio)', 'vcpus used', 'vcpus reserved', 'vcpus total', 'vcpus allocation ratio'],
      ['pCPUs', 'PCPUs (used / total \u00b7 reserved \u00b7 ratio)', 'pcpus used', 'pcpus reserved', 'pcpus total', 'pcpus allocation ratio'],
      ['RAM', 'RAM (used / total \u00b7 reserved \u00b7 ratio)', 'ram used', 'ram reserved', 'ram total', 'ram allocation ratio'],
      ['Storage', 'Storage (used / total \u00b7 reserved \u00b7 ratio)', 'storage used', 'storage reserved', 'storage total', 'storage allocation ratio']
    ];
    var indexes = [];
    for (var g = 0; g < groups.length; g++) {
      indexes.push({
        label: groups[g][1],
        used: findHeader(hs, groups[g][2]),
        reserved: findHeader(hs, groups[g][3]),
        total: findHeader(hs, groups[g][4]),
        ratio: findHeader(hs, groups[g][5])
      });
    }
    if (indexes.some(function (x) { return x.used < 0 || x.total < 0; })) return;

    table.classList.add('mc-hv-provider-enhanced');
    insertPanelHead(table.closest('.table_wrapper'), 'Resource Providers', '', true, table);

    for (var i = 0; i < indexes.length; i++) {
      setHeader(table, indexes[i].used, indexes[i].label);
      hideColumn(table, indexes[i].reserved);
      hideColumn(table, indexes[i].total);
      hideColumn(table, indexes[i].ratio);
    }

    var rows = tableRows(table);
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      if (/no items to display/i.test(text(rows[r]))) continue;
      for (var j = 0; j < indexes.length; j++) {
        var x = indexes[j];
        if (!cells[x.used] || !cells[x.total]) continue;
        var meta = 'reserved ' + text(cells[x.reserved]) + ' \u00b7 ratio ' + text(cells[x.ratio]);
        var value = pct(text(cells[x.used]), text(cells[x.total]));
        cells[x.used].innerHTML =
          '<div class="mc-hv-provider-meter">' +
            '<div class="mc-hv-meter-line"><span>' + esc(text(cells[x.used])) + ' / ' + esc(text(cells[x.total])) + '</span><span class="mc-hv-pct">' + value + '%</span></div>' +
            '<div class="mc-meter"><i class="' + meterClass(value) + '" style="transform:scaleX(' + (value / 100) + ')"></i></div>' +
            '<div class="mc-hv-provider-meta">' + esc(meta) + '</div>' +
          '</div>';
      }
    }
  }
  function hvStatusBadge(t) { return /disabl/i.test(t) ? 'muted' : 'info'; } // Enabled->blue, Disabled->grey
  function hvStateBadge(t) { return /down/i.test(t) ? 'err' : 'ok'; }        // Up->green, Down->red
  function updateHvCardBadge(up, down) {
    var labels = document.querySelectorAll('#content_body .mc-hv-stats .mc-stat-label');
    for (var i = 0; i < labels.length; i++) {
      if (text(labels[i]) === 'Hypervisors') {
        var card = labels[i].closest('.mc-stat');
        var trend = card && card.querySelector('.mc-trend');
        if (trend) trend.textContent = up + ' up · ' + down + ' down';
        return;
      }
    }
  }
  function decorateComputeHosts(table) {
    if (!table || table.classList.contains('mc-hv-compute-enhanced')) return;
    var hs = headers(table);
    if (findHeader(hs, 'Host') < 0 || findHeader(hs, 'Availability Zone') < 0) return;
    table.classList.add('mc-hv-compute-enhanced');
    insertPanelHead(table.closest('.table_wrapper'), 'Compute Hosts', '', true, table);

    // Colour the Status (Enabled/Disabled) and State (Up/Down) cells as pills,
    // and roll the State up/down counts into the Hypervisors stat card badge.
    var statusIdx = findHeader(hs, 'Status');
    var stateIdx = findHeader(hs, 'State');
    var up = 0, down = 0;
    var rows = tableRows(table);
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].children;
      if (/no items to display/i.test(text(rows[r]))) continue;
      if (statusIdx >= 0 && cells[statusIdx] && !cells[statusIdx].querySelector('.mc-stat-badge')) {
        var st = text(cells[statusIdx]);
        if (st) cells[statusIdx].innerHTML = '<span class="mc-stat-badge ' + hvStatusBadge(st) + '">' + esc(st) + '</span>';
      }
      if (stateIdx >= 0 && cells[stateIdx] && !cells[stateIdx].querySelector('.mc-stat-badge')) {
        var sv = text(cells[stateIdx]);
        if (sv) {
          cells[stateIdx].innerHTML = '<span class="mc-stat-badge ' + hvStateBadge(sv) + '">' + esc(sv) + '</span>';
          if (/down/i.test(sv)) down++; else up++;
        }
      }
    }
    if (up || down) updateHvCardBadge(up, down);
  }
  function run() {
    var tables = document.querySelectorAll('#content_body .mc-hv-tabs-shell table.datatable');
    for (var i = 0; i < tables.length; i++) {
      decorateHypervisors(tables[i]);
      decorateProviders(tables[i]);
      decorateComputeHosts(tables[i]);
    }
  }
  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: keep Horizon ModalForm workflows intact, but recover the form body
// if angular-schema-form renders an empty form under the theme.
(function () {
  function modalTitle(modal) {
    var node = modal.querySelector('.modal-title, .h4.modal-title');
    return node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function isSupportedModal(title) {
    return title === 'Create Key Pair' ||
           title === 'Import Public Key' ||
           title === 'Create Server Group';
  }

  function isEmptySchemaForm(form) {
    return !form.querySelector('input, select, textarea, .form-group, load-edit');
  }

  function keyPairTypeField() {
    return '' +
      '<div class="form-group hz-select mc-kp-field">' +
        '<label class="control-label" for="mc-keypair-type">' +
          '<span>Key Type</span> <span class="hz-icon-required"><svg class="mc-req-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M6 8l12 8M18 8 6 16"/></svg></span>' +
        '</label>' +
        '<select class="form-control" id="mc-keypair-type" name="key_type"' +
                ' ng-model="ctrl.model.key_type" ng-init="ctrl.model.key_type = ctrl.model.key_type || &quot;ssh&quot;"' +
                ' ng-required="true">' +
          '<option value="ssh">SSH Key</option>' +
          '<option value="x509">X509 Certificate</option>' +
        '</select>' +
      '</div>';
  }

  function keyPairFields(title) {
    var html = '' +
      '<div class="form-group hz-input mc-kp-field">' +
        '<label class="control-label" for="mc-keypair-name">' +
          '<span>Key Pair Name</span> <span class="hz-icon-required"><svg class="mc-req-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M6 8l12 8M18 8 6 16"/></svg></span>' +
        '</label>' +
        '<input class="form-control" id="mc-keypair-name" name="name" type="text"' +
               ' ng-model="ctrl.model.name" ng-required="true" ng-pattern="/^[A-Za-z0-9 _-]+$/">' +
      '</div>' +
      keyPairTypeField();

    if (title === 'Import Public Key') {
      html += '' +
        '<load-edit title="Public Key"' +
                   ' model="ctrl.model.public_key"' +
                   ' max-bytes="16384"' +
                   ' key="public-key"' +
                   ' rows="8"' +
                   ' required="true">' +
        '</load-edit>';
    }

    return html;
  }

  function serverGroupFields() {
    return '' +
      '<div class="form-group hz-input mc-modal-field">' +
        '<label class="control-label" for="mc-server-group-name">' +
          '<span>Name</span> <span class="hz-icon-required"><svg class="mc-req-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M6 8l12 8M18 8 6 16"/></svg></span>' +
        '</label>' +
        '<input class="form-control" id="mc-server-group-name" name="name" type="text"' +
               ' ng-model="ctrl.model.name" ng-required="true">' +
      '</div>' +
      '<div class="form-group hz-select mc-modal-field">' +
        '<label class="control-label" for="mc-server-group-policy">' +
          '<span>Policy</span> <span class="hz-icon-required"><svg class="mc-req-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M6 8l12 8M18 8 6 16"/></svg></span>' +
        '</label>' +
        '<select class="form-control" id="mc-server-group-policy" name="policy"' +
                ' ng-model="ctrl.model.policy"' +
                ' ng-options="item.value as item.name for item in ctrl.form[1].titleMap"' +
                ' ng-required="true">' +
        '</select>' +
      '</div>';
  }

  function fieldsFor(title) {
    if (title === 'Create Server Group') return serverGroupFields();
    return keyPairFields(title);
  }

  function patch(modal) {
    var title = modalTitle(modal);
    if (!isSupportedModal(title)) return;

    var form = modal.querySelector('.modal-body form[name="schemaForm"]');
    if (!form || form.getAttribute('data-mc-modal-form') === 'fixed') return;
    if (!isEmptySchemaForm(form)) return;
    if (!window.angular) return;

    var scope = angular.element(form).scope();
    var injector = angular.element(document.body).injector();
    if (!scope || !injector) return;

    form.setAttribute('data-mc-modal-form', 'fixed');
    form.setAttribute('novalidate', 'novalidate');
    form.innerHTML = fieldsFor(title);

    injector.invoke(['$compile', function ($compile) {
      $compile(angular.element(form).contents())(scope);
      if (scope.$applyAsync) scope.$applyAsync();
    }]);
  }

  function run() {
    var modals = document.querySelectorAll('.modal-content');
    for (var i = 0; i < modals.length; i++) patch(modals[i]);
  }

  function init() {
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: give Create/Allocate/Import/Launch controls a semantic SVG icon
// from the same icon set as the design mockup. Delete/Edit stay untouched.
// Idempotent + re-runs on AJAX refresh.
(function () {
  // Mirror the sidebar nav glyph set (ICN) so a resource's Create button shows
  // the SAME icon as its sidebar entry. Keys = sidebar glyph names; the strings
  // below are copied verbatim from ICN in the sidebar-icon script above.
  if (!window._mcUtil) return;
  var IC = window._mcUtil.ICONS;
  var RULES = [
    [/instance/, 'server'],
    [/key pair/, 'key-round'], [/server group/, 'boxes'], [/security group/, 'shield'],
    [/group type/, 'tags'], [/volume type/, 'tag'], [/host aggregate/, 'layers'],
    [/flavor/, 'cpu'], [/rbac/, 'shield-check'], [/namespace/, 'tags'],
    [/qos/, 'gauge'], [/trunk/, 'cable'], [/router/, 'router'],
    [/\brule\b/, 'shield-plus'], [/forwarding/, 'forward'], [/floating ip|allocate ip|\bip\b/, 'globe'],
    [/domain/, 'building-2'], [/project/, 'folder'], [/identity provider/, 'fingerprint'],
    [/application credential/, 'key-round'], [/credential/, 'id-card'], [/mapping/, 'git-compare'],
    [/role/, 'award'], [/load balancer/, 'scale'], [/image/, 'image'],
    [/network/, 'network'], [/container/, 'package'], [/volume group/, 'library-big'],
    [/snapshot/, 'camera'], [/volume/, 'database'], [/\buser\b/, 'user'], [/group/, null]
  ];
  function pick(label) {
    var l = label.toLowerCase();
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(l)) {
        if (RULES[i][1] === null) {
          return /identity|\/groups/.test(location.pathname) ? 'users' : 'library-big';
        }
        return RULES[i][1];
      }
    }
    return null;
  }
  function svg(key) {
    return '<svg class="mc-act-ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC[key] + '</svg>';
  }
  function isTransferAction(btn) {
    if (!btn || !btn.matches) return false;
    if (btn.matches('.membership a[href="#add_remove"], .fa-arrow-up, .fa-arrow-down')) return true;
    return !!(btn.closest && btn.closest('.transfer-table, .metadata-tree') &&
      (btn.matches('.fa-plus, .fa-minus') || btn.querySelector('.fa-plus, .fa-minus, .fa-arrow-up, .fa-arrow-down')));
  }
  function setTransferState(btn, isAdd) {
    var injected = btn.querySelectorAll('.mc-act-ic, .mc-btn-ic');
    for (var i = 0; i < injected.length; i++) injected[i].remove();
    btn.classList.remove('mc-create-btn', 'mc-transfer-add', 'mc-transfer-remove');
    btn.classList.add(isAdd ? 'mc-transfer-add' : 'mc-transfer-remove');
  }
  function decorateTransferActions() {
    var membership = document.querySelectorAll('.membership a[href="#add_remove"]');
    for (var i = 0; i < membership.length; i++) {
      var memberButton = membership[i];
      var isAvailable = !!(memberButton.closest && memberButton.closest('.available_members'));
      setTransferState(memberButton, isAvailable || (memberButton.textContent || '').trim() === '+');
    }
    var transfers = document.querySelectorAll(
      '.transfer-table .fa-arrow-up, .transfer-table .fa-arrow-down,' +
      '.transfer-table .fa-plus, .transfer-table .fa-minus,' +
      '.metadata-tree .fa-plus, .metadata-tree .fa-minus');
    for (var j = 0; j < transfers.length; j++) {
      var control = transfers[j];
      var button = control.matches('.btn, button, a') ? control : control.closest('.btn, button, a');
      if (!button) continue;
      setTransferState(button,
        control.matches('.fa-arrow-up, .fa-plus') || !!control.querySelector('.fa-arrow-up, .fa-plus'));
    }
  }
  function bindTransferActions() {
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ?
        event.target.closest('.membership a[href="#add_remove"]') : null;
      if (!target) return;
      // Horizon's delegated membership handler runs on the list before this
      // document handler. Read the new parent/text and repaint in the same
      // click instead of waiting for the debounced mutation observer.
      var isAvailable = !!(target.closest && target.closest('.available_members'));
      setTransferState(target, isAvailable || (target.textContent || '').trim() === '+');
    });
  }
  function decorate(btn) {
    if (isTransferAction(btn)) return;
    if (btn.querySelector('.mc-act-ic, .mc-btn-ic')) return; // already has our icon
    var label = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    if (!/^(create|allocate|import|register|add|launch)\b/i.test(label)) return;
    var key = pick(label);
    if (!key) return;
    var isFinish = /\bfinish\b/.test(btn.className); // wizard submit button
    var isLaunch = /^launch\b/i.test(label) || /\bbtn-launch\b/.test(btn.className);
    var fa = btn.querySelector('.fa, .glyphicon, i[class*="fa-"]');
    // The wizard finish icon span carries an Angular spinner binding; don't
    // touch it while submitting (let the spinner show), only swap the check.
    if (isFinish && fa && /fa-spin/.test(fa.className)) return;
    if (fa) fa.outerHTML = svg(key);
    else btn.insertAdjacentHTML('afterbegin', svg(key));
    if (!isFinish && !isLaunch) { btn.classList.add('mc-create-btn'); } // brand-blue, like the mockup
  }
  function modalTitle(scope) {
    var el = scope && scope.querySelector('.modal-title, .modal-header h3, .modal-header h4, .h4.modal-title');
    return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }
  var CREATE_VERB = /^(create|launch|allocate|import|register|add)\b/i;
  // Modal/wizard SUBMIT button only (NOT Next/Back): icon from the modal title,
  // or the button's own label as fallback. Create Server Group -> boxes,
  // Create Volume -> database, Create Key Pair -> key-round, etc.
  function btnKey(scope, lbl) {
    var t = modalTitle(scope);
    if (CREATE_VERB.test(t)) { var k = pick(t); if (k) return k; }
    if (CREATE_VERB.test(lbl)) { return pick(lbl); }
    return null;
  }
  function decorateModals() {
    // 1) <button>/<a> primary (NOT Next/Back) + wizard finish: swap/insert icon.
    var sbs = document.querySelectorAll(
      '.modal-footer button.btn-primary:not(.next):not(.back),' +
      '.modal-footer a.btn-primary:not(.next):not(.back),' +
      '.ng-wizard .btn.finish');
    for (var i = 0; i < sbs.length; i++) {
      var sb = sbs[i];
      if (isTransferAction(sb)) continue;
      if (sb.querySelector('.mc-act-ic, .mc-btn-ic')) continue;
      // Skip Next/Back and the transfer-table allocate/deallocate (+/-) buttons.
      if (/\b(next|back|fa-arrow-up|fa-arrow-down)\b/.test(sb.className)) continue;
      var scope = sb.closest ? sb.closest('.modal-content, .modal-dialog, .modal, .ng-wizard') : null;
      var key = btnKey(scope, (sb.textContent || '').replace(/\s+/g, ' ').trim());
      if (!key) continue;
      var fa = sb.querySelector('.fa, .glyphicon, i[class*="fa-"]');
      if (fa && /fa-spin/.test(fa.className)) continue; // submitting -> keep spinner
      if (fa) { fa.outerHTML = svg(key); }
      else { sb.insertAdjacentHTML('afterbegin', svg(key)); }
    }
    // 2) Django modals use <input type=submit class=btn-primary>, which can't
    //    hold a child icon. Replace it with an equivalent <button type=submit>
    //    (name/value preserved so the form submits natively) carrying the icon.
    var ins = document.querySelectorAll('input.btn-primary[type="submit"], input.btn.button-final[type="submit"]');
    for (var j = 0; j < ins.length; j++) {
      var inp = ins[j];
      if (inp.getAttribute('data-mc-iconed')) continue;
      var scope2 = inp.closest ? inp.closest('.modal-content, .modal-dialog, .modal') : null;
      var key2 = btnKey(scope2, (inp.value || '').replace(/\s+/g, ' ').trim());
      if (!key2) { inp.setAttribute('data-mc-iconed', '0'); continue; }
      var b = document.createElement('button');
      b.type = 'submit';
      b.className = inp.className;
      if (inp.name) { b.name = inp.name; }
      if (inp.value) { b.setAttribute('value', inp.value); }
      if (inp.disabled) { b.disabled = true; }
      b.setAttribute('data-mc-iconed', '1');
      b.innerHTML = svg(key2);
      var sp = document.createElement('span');
      sp.textContent = inp.value;
      b.appendChild(sp);
      if (inp.parentNode) { inp.parentNode.replaceChild(b, inp); }
    }
  }
  // Cancel buttons in modals/wizards: give them a consistent X icon.
  var X_ICON = '<svg class="mc-act-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  function decorateCancel() {
    var btns = document.querySelectorAll('.modal .btn, .modal-dialog .btn, .modal-content .btn, .ng-wizard .btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!/^cancel\b/i.test((b.textContent || '').replace(/\s+/g, ' ').trim())) continue;
      if (b.querySelector('.mc-act-ic')) continue;
      if (b.querySelector('.fa, .glyphicon, i[class*="fa-"]')) continue; // already has (masked X)
      b.insertAdjacentHTML('afterbegin', X_ICON);
    }
  }
  function syncSpinnerScrim() {
    var spinners = document.querySelectorAll('.modal.loading, .modal.modal-wait-spinner');
    var isOpen = false;
    for (var i = 0; i < spinners.length; i++) {
      var spinner = spinners[i];
      if (spinner.classList.contains('in') || spinner.classList.contains('show') ||
          window.getComputedStyle(spinner).display !== 'none') {
        isOpen = true;
        break;
      }
    }
    document.body.classList.toggle('mc-spinner-modal-open', isOpen);
  }
  function run() {
    syncSpinnerScrim();
    decorateTransferActions();
    var btns = document.querySelectorAll(
      '#content_body .table_actions a.btn, #content_body .table_actions button.btn,' +
      '#content_body .hz-dynamic-table-actions a.btn, #content_body .hz-dynamic-table-actions button.btn,' +
      '.ng-wizard button.btn.finish');
    for (var i = 0; i < btns.length; i++) decorate(btns[i]);
    decorateModals();
    decorateCancel();
  }
  function init() {
    bindTransferActions();
    run();
    if (window._mcUtil && window._mcUtil.onMutate) window._mcUtil.onMutate(run);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
