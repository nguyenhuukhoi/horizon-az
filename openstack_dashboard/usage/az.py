# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

"""Aggregate the current project's resource usage per availability zone.

OpenStack quotas/limits are project-scoped, not AZ-scoped, so the per-AZ
"used" values cannot be obtained from the limits API.  Instead we aggregate
the project's actual resources (servers, volumes, snapshots) grouped by their
availability zone, and reuse the project quota as the (shared) denominator for
every AZ so the charts match the existing "Used X of Y" donuts.

Security note: every API call here is scoped to the requesting user's project
token.  We never pass ``all_tenants`` (which is admin-only); doing so would
leak other tenants' resources.
"""

import collections
import logging

from django.contrib.humanize.templatetags import humanize as humanize_filters
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy

from openstack_dashboard import api
from openstack_dashboard.dashboards.project.instances import utils as \
    instance_utils
from openstack_dashboard.usage import views as usage_views

LOG = logging.getLogger(__name__)

# Availability zone reported by Nova/Cinder when a resource has no AZ set.
DEFAULT_AZ = 'nova'

# Only Compute and Volume resources are meaningful per AZ.  Network resources
# (floating IPs, security groups, ...) are not AZ-scoped, so we filter them out
# by quota key (locale-independent, unlike comparing section titles).
AZ_QUOTA_KEYS = ('instances', 'cores', 'ram',
                 'volumes', 'snapshots', 'gigabytes')


def _new_bucket():
    return {'instances': 0, 'cores': 0, 'ram': 0,
            'volumes': 0, 'snapshots': 0, 'gigabytes': 0}


def _collect_compute(request, az):
    # Tenant isolation: server_list() does NOT pass all_tenants, so Nova
    # forces project_id to the current token's tenant.
    flavors = {f.id: f for f in api.nova.flavor_list(request)}
    servers, _more = api.nova.server_list(request)
    for server in servers:
        zone = getattr(server, 'OS-EXT-AZ:availability_zone', None) or \
            DEFAULT_AZ
        # resolve_flavor handles every Nova microversion and falls back to a
        # zero-valued flavor if the flavor was deleted.
        flavor = instance_utils.resolve_flavor(request, server, flavors)
        bucket = az[zone]
        bucket['instances'] += 1
        bucket['cores'] += getattr(flavor, 'vcpus', 0) or 0
        bucket['ram'] += getattr(flavor, 'ram', 0) or 0


def _collect_volume(request, az):
    # Tenant isolation: volume_list()/volume_snapshot_list() default to the
    # requesting tenant only.
    volume_zone = {}
    for volume in api.cinder.volume_list(request):
        zone = getattr(volume, 'availability_zone', None) or DEFAULT_AZ
        volume_zone[volume.id] = zone
        bucket = az[zone]
        bucket['volumes'] += 1
        bucket['gigabytes'] += getattr(volume, 'size', 0) or 0
    # Snapshots carry no AZ of their own; inherit it from the source volume.
    for snapshot in api.cinder.volume_snapshot_list(request):
        zone = volume_zone.get(getattr(snapshot, 'volume_id', None),
                               DEFAULT_AZ)
        az[zone]['snapshots'] += 1


def get_az_usage(request):
    """Return ``{az_name: {instances, cores, ram, volumes, snapshots,
    gigabytes}}`` for the current project.

    Compute and volume collection are isolated so that one service being
    unavailable (or not deployed) does not blank out the other.
    """
    az = collections.defaultdict(_new_bucket)

    try:
        _collect_compute(request, az)
    except Exception:
        LOG.exception("Unable to collect per-AZ compute usage")

    if api.cinder.is_volume_service_enabled(request):
        try:
            _collect_volume(request, az)
        except Exception:
            LOG.exception("Unable to collect per-AZ volume usage")

    return dict(az)


def build_az_charts(request, limits):
    """Build a per-AZ chart structure mirroring
    ``ProjectUsageView._get_charts_data`` so it can be rendered by the same
    donut markup.

    ``limits`` is ``usage.limits`` (``{key: {'used', 'quota'}}``).  The per-AZ
    "used" value comes from the aggregation above, while ``quota`` stays the
    project quota (shared denominator across AZs).
    """
    usage_by_az = get_az_usage(request)
    az_charts = []
    for zone in sorted(usage_by_az):
        used_map = usage_by_az[zone]
        sections = []
        for section in usage_views.CHART_DEFS:
            charts = []
            for chart_def in section['charts']:
                key = chart_def.quota_key
                if key not in AZ_QUOTA_KEYS:
                    continue
                if key not in limits or key not in used_map:
                    continue
                used = used_map[key]
                quota = limits[key]['quota']
                filters = chart_def.filters
                if filters is None:
                    filters = (humanize_filters.intcomma,)
                quota_display = quota
                if quota != float('inf'):
                    quota_display = usage_views._apply_filters(quota, filters)
                charts.append({
                    'type': key,
                    'name': chart_def.label,
                    'used': used,
                    'quota': quota,
                    'used_display': usage_views._apply_filters(used, filters),
                    'quota_display': quota_display,
                    'text': chart_def.used_phrase or pgettext_lazy(
                        'Label in the limit summary', 'Used'),
                })
            if charts:
                sections.append({'title': section['title'], 'charts': charts})
        az_charts.append({'zone': zone, 'charts': sections})
    return az_charts
