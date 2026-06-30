/* MyCloud runtime enhancements. Keep UI workflow and rendered DOM behavior unchanged. */

// Shared immutable SVG path registry for sidebar and action icons.
var MYCLOUD_ICON_PATHS = Object.freeze({
    'server':'<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/> <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/> <line x1="6" x2="6.01" y1="6" y2="6"/> <line x1="6" x2="6.01" y1="18" y2="18"/>',
    'server-cog':'<path d="m10.852 14.772-.383.923"/> <path d="M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923"/> <path d="m13.148 9.228.383-.923"/> <path d="m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544"/> <path d="m14.772 10.852.923-.383"/> <path d="m14.772 13.148.923.383"/> <path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5"/> <path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5"/> <path d="M6 18h.01"/> <path d="M6 6h.01"/> <path d="m9.228 10.852-.923-.383"/> <path d="m9.228 13.148-.923.383"/>',
    'image':'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/> <circle cx="9" cy="9" r="2"/> <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'key-round':'<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/> <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
    'boxes':'<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/> <path d="m7 16.5-4.74-2.85"/> <path d="m7 16.5 5-3"/> <path d="M7 16.5v5.17"/> <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/> <path d="m17 16.5-5-3"/> <path d="m17 16.5 4.74-2.85"/> <path d="M17 16.5v5.17"/> <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/> <path d="M12 8 7.26 5.15"/> <path d="m12 8 4.74-2.85"/> <path d="M12 13.5V8"/>',
    'layers':'<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    'library-big':'<rect width="8" height="18" x="3" y="3" rx="1"/> <path d="M7 3v18"/> <path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"/>',
    'tags':'<path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"/> <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"/> <circle cx="10.5" cy="6.5" r=".5" fill="currentColor"/>',
    'code-xml':'<path d="m18 16 4-4-4-4"/> <path d="m6 8-4 4 4 4"/> <path d="m14.5 4-5 16"/>',
    'database':'<ellipse cx="12" cy="5" rx="9" ry="3"/> <path d="M3 5V19A9 3 0 0 0 21 19V5"/> <path d="M3 12A9 3 0 0 0 21 12"/>',
    'tag':'<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/> <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    'camera':'<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/> <circle cx="12" cy="13" r="3"/>',
    'archive':'<rect width="20" height="5" x="2" y="3" rx="1"/> <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/> <path d="M10 12h4"/>',
    'waypoints':'<path d="m10.586 5.414-5.172 5.172"/> <path d="m18.586 13.414-5.172 5.172"/> <path d="M6 12h12"/> <circle cx="12" cy="20" r="2"/> <circle cx="12" cy="4" r="2"/> <circle cx="20" cy="12" r="2"/> <circle cx="4" cy="12" r="2"/>',
    'scale':'<path d="M12 3v18"/> <path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/> <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/> <path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/> <path d="M7 21h10"/>',
    'network':'<rect x="16" y="16" width="6" height="6" rx="1"/> <rect x="2" y="16" width="6" height="6" rx="1"/> <rect x="9" y="2" width="6" height="6" rx="1"/> <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/> <path d="M12 12V8"/>',
    'router':'<rect width="20" height="8" x="2" y="14" rx="2"/> <path d="M6.01 18H6"/> <path d="M10.01 18H10"/> <path d="M15 10v4"/> <path d="M17.84 7.17a4 4 0 0 0-5.66 0"/> <path d="M20.66 4.34a8 8 0 0 0-11.31 0"/>',
    'shield':'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'shield-check':'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/> <path d="m9 12 2 2 4-4"/>',
    'fingerprint':'<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/> <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/> <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/> <path d="M2 12a10 10 0 0 1 18-6"/> <path d="M2 16h.01"/> <path d="M21.8 16c.2-2 .131-5.354 0-6"/> <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/> <path d="M8.65 22c.21-.66.45-1.32.57-2"/> <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
    'globe':'<circle cx="12" cy="12" r="10"/> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/> <path d="M2 12h20"/>',
    'building-2':'<path d="M10 12h4"/> <path d="M10 8h4"/> <path d="M14 21v-3a2 2 0 0 0-4 0v3"/> <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/> <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
    'cable':'<path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"/> <path d="M17 21v-2"/> <path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"/> <path d="M21 21v-2"/> <path d="M3 5V3"/> <path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"/> <path d="M7 5V3"/>',
    'gauge':'<path d="m12 14 4-4"/> <path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    'forward':'<path d="m15 17 5-5-5-5"/> <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>',
    'git-compare':'<circle cx="18" cy="18" r="3"/> <circle cx="6" cy="6" r="3"/> <path d="M13 6h3a2 2 0 0 1 2 2v7"/> <path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
    'package':'<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/> <path d="M12 22V12"/> <polyline points="3.29 7 12 12 20.71 7"/> <path d="m7.5 4.27 9 5.15"/>',
    'cpu':'<path d="M12 20v2"/> <path d="M12 2v2"/> <path d="M17 20v2"/> <path d="M17 2v2"/> <path d="M2 12h2"/> <path d="M2 17h2"/> <path d="M2 7h2"/> <path d="M20 12h2"/> <path d="M20 17h2"/> <path d="M20 7h2"/> <path d="M7 20v2"/> <path d="M7 2v2"/> <rect x="4" y="4" width="16" height="16" rx="2"/> <rect x="8" y="8" width="8" height="8" rx="1"/>',
    'sliders-horizontal':'<path d="M10 5H3"/> <path d="M12 19H3"/> <path d="M14 3v4"/> <path d="M16 17v4"/> <path d="M21 12h-9"/> <path d="M21 19h-5"/> <path d="M21 5h-7"/> <path d="M8 10v4"/> <path d="M8 12H3"/>',
    'folder':'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    'user':'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/> <circle cx="12" cy="7" r="4"/>',
    'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/> <path d="M16 3.128a4 4 0 0 1 0 7.744"/> <path d="M22 21v-2a4 4 0 0 0-3-3.87"/> <circle cx="9" cy="7" r="4"/>',
    'award':'<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/> <circle cx="12" cy="8" r="6"/>',
    'id-card':'<path d="M16 10h2"/> <path d="M16 14h2"/> <path d="M6.17 15a3 3 0 0 1 5.66 0"/> <circle cx="9" cy="11" r="2"/> <rect x="2" y="5" width="20" height="14" rx="2"/>',
    'dash':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
    'dot':'<circle cx="12" cy="12" r="3.4"/>'
});

// MyCloud: replace Font Awesome sidebar icons with inline stroke SVG
// (matches horizon_redesign_interactive.html — all-SVG icon system).
(function () {
  var ICN = MYCLOUD_ICON_PATHS;
  var MAP = [
    ['/instances/','server'],['/hypervisors/','server-cog'],['/images/','image'],
    ['/key_pairs/','key-round'],['/server_groups/','boxes'],['/aggregates/','layers'],
    ['/volume_groups/','library-big'],['/group_types/','tags'],['/api_access/','code-xml'],
    ['/volumes/','database'],['/volume_types/','tag'],['/snapshots/','camera'],
    ['/backups/','archive'],['/vg_snapshots/','camera'],['/network_topology/','waypoints'],
    ['/load_balancer/','scale'],['/networks/','network'],['/routers/','router'],
    ['/security_groups/','shield'],['/rbac_policies/','shield-check'],['/identity_providers/','fingerprint'],
    ['/floating_ips/','globe'],['/domains/','building-2'],['/trunks/','cable'],
    ['/network_qos/','gauge'],['/floating_ip_portforwardings/','forward'],['/mappings/','git-compare'],
    ['/containers/','package'],['/flavors/','cpu'],['/defaults/','sliders-horizontal'],
    ['/metadata_defs/','tags'],['/info/','info'],['/projects/','folder'],
    ['/identity/','folder'],['/users/','user'],['/groups/','users'],
    ['/roles/','award'],['/application_credentials/','key-round'],['/credentials/','id-card'],
    ['/overview/','dash'],['/project/','dash'],['/admin/','dash']
  ];
  function svg(p, cls, size) {
    return '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto">' + p + '</svg>';
  }
  function keyFor(href) {
    for (var i = 0; i < MAP.length; i++) {
      var s = MAP[i][0];
      if (href.slice(-s.length) === s) return MAP[i][1];
    }
    return 'dot';
  }
  function labelText(node) {
    return (node && node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function isDashboard(dashboard, name) {
    return labelText(dashboard.querySelector(':scope > a')) === name;
  }
  function hideAdminOverview(dashboard) {
    if (!isDashboard(dashboard, 'admin')) return;
    var links = dashboard.querySelectorAll('a.openstack-panel');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (labelText(links[i]) === 'overview' && /\/admin\/?$/.test(href)) {
        links[i].classList.add('mc-nav-hidden');
        links[i].classList.remove('active');
        links[i].setAttribute('aria-hidden', 'true');
      }
    }
    var groups = dashboard.querySelectorAll(':scope > .panel-collapse > .list-group, :scope > .panel-collapse .list-group');
    for (var g = 0; g < groups.length; g++) {
      var visibleLinks = groups[g].querySelectorAll('a.openstack-panel:not(.mc-nav-hidden)');
      var childPanelGroups = groups[g].querySelectorAll('.openstack-panel-group');
      if (!visibleLinks.length && !childPanelGroups.length) {
        groups[g].classList.add('mc-nav-hidden');
      }
    }
  }
  function run() {
    var dashboards = document.querySelectorAll('#sidebar .openstack-dashboard');
    // Admin user? The Admin dashboard only renders when the user has the admin
    // role; we use its presence to keep Identity open for admins only.
    var hasAdmin = false;
    for (var k = 0; k < dashboards.length; k++) {
      var al = dashboards[k].querySelector(':scope > a');
      if (al && labelText(al) === 'admin') { hasAdmin = true; break; }
    }
    for (var d = 0; d < dashboards.length; d++) {
      var label = dashboards[d].querySelector(':scope > a');
      if (!label) continue;
      var title = labelText(label);
      if (title === 'project') dashboards[d].classList.add('mc-dashboard-project');
      if (title === 'admin') dashboards[d].classList.add('mc-dashboard-admin');
      if (title === 'identity') {
        dashboards[d].classList.add('mc-dashboard-identity');
        var identityGroups = dashboards[d].querySelectorAll('.openstack-panel-group');
        for (var ig = 0; ig < identityGroups.length; ig++) {
          var groupLabel = identityGroups[ig].querySelector(':scope > a');
          var groupTarget = groupLabel && groupLabel.getAttribute('data-target') || '';
          if (/-federation$/.test(groupTarget) || labelText(groupLabel) === 'federation') {
            identityGroups[ig].classList.add('mc-panel-group-federation');
          }
        }
      }
      hideAdminOverview(dashboards[d]);
      // Project & Admin always stay open. Identity stays open only for admins;
      // regular (non-admin) users can still collapse it.
      var isStatic = title.indexOf('project') !== -1 || title.indexOf('admin') !== -1
                     || (hasAdmin && title.indexOf('identity') !== -1);
      if (!isStatic) continue;
      dashboards[d].classList.add('mc-dashboard-static');
      label.removeAttribute('data-toggle');
      label.removeAttribute('data-target');
      label.removeAttribute('href');
      label.setAttribute('aria-expanded', 'true');
      var body = dashboards[d].querySelector(':scope > .panel-collapse');
      if (body) {
        body.classList.add('in');
        body.style.height = 'auto';
      }
    }

    var links = document.querySelectorAll('#sidebar a.openstack-panel');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.querySelector('.mc-nav-ic')) continue;
      var href = a.getAttribute('href') || '';
      a.insertAdjacentHTML('afterbegin', svg(ICN[keyFor(href)] || ICN.dot, 'mc-nav-ic', 16));
    }
    var tg = document.querySelectorAll('#sidebar .openstack-toggle');
    for (var j = 0; j < tg.length; j++) {
      if (tg[j].querySelector('.mc-cv')) continue;
      tg[j].innerHTML = svg('<path d="M6 9l6 6 6-6"/>', 'mc-cv', 16);
    }
  }
  // This script is rendered immediately after the sidebar markup. Run now so
  // SVG nav icons are in place before the browser paints the next page; waiting
  // for DOMContentLoaded makes the whole sidebar icon set visibly blink.
  run();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  }
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

// MyCloud: route marker for optional Octavia/Load Balancer styling. The
// Octavia dashboard is an Angular plugin, so this lets CSS target it without
// touching other Angular resource tables.
(function () {
  function run() {
    var path = window.location.pathname || '';
    var hash = window.location.hash || '';
    var url = path + hash;
    var isLb = /\/project\/load_balancer\/?/.test(path) ||
               /project\/load_balancer\/?/.test(hash);
    document.body.classList.toggle('mc-lbaas-page', isLb);
    document.body.classList.toggle(
      'mc-project-instances-page',
      /\/project\/instances(?:\/|$)/.test(path));
    // Angular routed-detail pages we card-ify (ngdetails/<TYPE>). Set from the
    // URL on first paint so the header styling applies before Angular renders
    // the breadcrumb — no raw "Back" flash on refresh. Decode in case :: is
    // %3A-encoded in the path.
    var u = url; try { u = decodeURIComponent(url); } catch (e) {}
    var isNg = /\/ngdetails\/(OS::Glance::Image|OS::Nova::Keypair|OS::Nova::ServerGroup|OS::Keystone::User|OS::Neutron::QoSPolicy|OS::Neutron::Trunk|OS::Keystone::Domain)\b/.test(u);
    document.body.classList.toggle('mc-ngdetail', isNg);
  }
  run();
  window.addEventListener('hashchange', run);
  window.addEventListener('popstate', run);
  // Angular routes with pushState; mirror it so the marker tracks client-nav.
  ['pushState', 'replaceState'].forEach(function (m) {
    var orig = history[m];
    if (typeof orig !== 'function') return;
    history[m] = function () {
      var r = orig.apply(this, arguments);
      try { run(); } catch (e) {}
      return r;
    };
  });
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
    if (!window.MutationObserver) return;
    var p = false;
    var obs = new MutationObserver(function () {
      if (p) return; p = true;
      setTimeout(function () { p = false; run(); }, 150);
    });
    obs.observe(document.getElementById('content_body') || document.body, { childList: true, subtree: true });
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
      if (url) { location.href = url; } else { history.back(); }
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 150);
    });
    var host = document.getElementById('content_body') || document.body;
    obs.observe(host, { childList: true, subtree: true });
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(function () {
        pending = false;
        run();
      });
    });
    var host = document.getElementById('content_body') || document.body;
    obs.observe(host, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: colour the Status / Power State cells as pills (like the mockup).
// Per-value classes can't be set in CSS, so map the cell text to a colour
// here. Re-runs on Horizon's AJAX row refreshes and text updates.
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[ch];
    });
  }
  function classify(t) {
    t = (t || '').toLowerCase();
    if (/^available$/.test(t)) return 'ok';
    if (/^in[- ]use$/.test(t)) return 'info';
    if (/active|running|online|enabled|^up$/.test(t)) return 'ok';
    if (/offline|error|crash|fail|deleted|^down$/.test(t)) return 'err';
    if (/degraded|pending|paus|suspend|block/.test(t)) return 'warn';
    if (/build|reboot|rebuild|migrat|resiz|spawn|schedul|rescue|password|block device|networking|prepar|powering|image|verify/.test(t)) return 'info';
    return 'muted'; // shutoff, stopped, shut down/off, no state, shelved, none
  }
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
        dw.innerHTML = '<span class="mc-stat-badge ' + classify(txt) + '">' + esc(txt) + '</span>';
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

    if (!window.MutationObserver) return;
    var obs = new MutationObserver(schedule);
    var host = document.getElementById('content_body') || document.body;
    obs.observe(host, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: badge the Status row inside the image detail dl-horizontal.
// The badgeTable() above only handles <table> rows; this handles the
// hz-resource-property-list rendered as a dl-horizontal inside the detail page.
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }
  function classify(t) {
    t = (t || '').toLowerCase();
    if (/^available$/.test(t)) return 'ok';
    if (/^in[- ]use$/.test(t)) return 'info';
    if (/active|running|online|enabled|^up$/.test(t)) return 'ok';
    if (/offline|error|crash|fail|deleted|^down$/.test(t)) return 'err';
    if (/degraded|pending|paus|suspend|block/.test(t)) return 'warn';
    if (/build|reboot|rebuild|migrat|resiz|spawn|schedul|rescue|password|block device|networking|prepar|powering|image|verify/.test(t)) return 'info';
    return 'muted';
  }
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
      dd.innerHTML = '<span class="mc-stat-badge ' + classify(txt) + '">' + esc(txt) + '</span>';
    }
  }
  function init() {
    run();
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 200);
    });
    var host = document.getElementById('content_body') || document.body;
    obs.observe(host, { childList: true, subtree: true, characterData: true });
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; fix(); }, 150);
    });
    var host = document.getElementById('content_body') || document.body;
    obs.observe(host, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// MyCloud: Admin Hypervisors page layout. Keep Horizon's real tables/actions,
// but combine capacity columns into the compact meter cells used by the mockup.
(function () {
  if (location.pathname.indexOf('/admin/hypervisors') === -1) return;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c];
    });
  }
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
      '<div class="mc-meter"><i class="' + meterClass(value) + '" style="width:' + value + '%"></i></div>' +
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
        cells[hostname].innerHTML = '<span class="mc-hv-host"><span class="mc-hv-dot"></span><span>' + cells[hostname].innerHTML + '</span></span>';
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
            '<div class="mc-meter"><i class="' + meterClass(value) + '" style="width:' + value + '%"></i></div>' +
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 150);
    });
    var host = document.querySelector('#content_body .mc-hv-tabs-shell');
    if (host) obs.observe(host, { childList: true, subtree: true });
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 50);
    });
    obs.observe(document.body, { childList: true, subtree: true });
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
  var IC = MYCLOUD_ICON_PATHS;
  // First regex (on lowercased label) that matches wins. Keys point at the
  // SAME Lucide glyph the resource uses in the sidebar, so a Create button
  // always matches its sidebar icon. Specific before generic. Bare 'group'
  // resolved by path: identity Groups -> users, volume groups -> library-big.
  var RULES = [
    [/instance/, 'server'],
    [/key pair/, 'key-round'], [/server group/, 'boxes'], [/security group/, 'shield'],
    [/group type/, 'tags'], [/volume type/, 'tag'], [/host aggregate/, 'layers'],
    [/flavor/, 'cpu'], [/rbac/, 'shield-check'], [/namespace/, 'tags'],
    [/qos/, 'gauge'], [/trunk/, 'cable'], [/router/, 'router'],
    [/rule|forwarding/, 'forward'], [/floating ip|allocate ip|\bip\b/, 'globe'],
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
    return '<svg class="mc-act-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC[key] + '</svg>';
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
    if (!window.MutationObserver) return;
    var pending = false;
    var obs = new MutationObserver(function () {
      syncSpinnerScrim();
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; run(); }, 200);
    });
    var host = document.getElementById('content_body');
    if (host) obs.observe(host, { childList: true, subtree: true });
    // Also watch <body> for modals/wizards (rendered outside #content_body) so
    // their finish button gets the resource icon too.
    obs.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
