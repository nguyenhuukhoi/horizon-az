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

import os
import unittest


class StaticAssetTests(unittest.TestCase):
    def _dashboard_path(self, *parts):
        return os.path.abspath(os.path.join(
            os.path.dirname(__file__), '..', '..', *parts))

    def test_fa_spin_animation_is_defined(self):
        icons_scss = self._dashboard_path(
            'static',
            'dashboard',
            'scss',
            'components',
            '_icons.scss')

        with open(icons_scss, encoding='utf-8') as scss:
            content = scss.read()

        self.assertIn('.fa-spin {', content)
        self.assertIn('animation: fa-spin 2s infinite linear;', content)
        self.assertIn('@keyframes fa-spin', content)

    def test_mycloud_runtime_assets_are_externalized(self):
        sidebar = self._dashboard_path(
            'themes', 'mycloud', 'templates', 'horizon', 'common',
            '_sidebar.html')
        base = self._dashboard_path('templates', 'base.html')
        runtime_asset_hook = self._dashboard_path(
            'templates', 'horizon', '_theme_runtime_assets.html')
        runtime_assets = self._dashboard_path(
            'themes', 'mycloud', 'templates', 'horizon',
            '_theme_runtime_assets.html')
        runtime_css = self._dashboard_path(
            'themes', 'mycloud', 'static', 'css',
            'mycloud-runtime.css')
        runtime_js = self._dashboard_path(
            'themes', 'mycloud', 'static', 'js', 'mycloud.js')

        with open(sidebar, encoding='utf-8') as template:
            sidebar_content = template.read()
        with open(base, encoding='utf-8') as template:
            base_content = template.read()
        with open(runtime_asset_hook, encoding='utf-8') as template:
            runtime_asset_hook_content = template.read()
        with open(runtime_assets, encoding='utf-8') as template:
            runtime_asset_content = template.read()

        self.assertNotIn('<style', sidebar_content)
        self.assertNotIn('<script>', sidebar_content)
        self.assertEqual(1, sidebar_content.count('<script src='))
        self.assertNotIn('{% verbatim %}', sidebar_content)
        self.assertIn('horizon/_theme_runtime_assets.html', base_content)
        self.assertLess(
            base_content.index('{% include "_stylesheets.html" %}'),
            base_content.index('horizon/_theme_runtime_assets.html'))
        self.assertIn('mycloud-runtime.css', runtime_asset_content)
        self.assertNotIn('mycloud-runtime.css', runtime_asset_hook_content)
        self.assertIn(
            'compress css file mycloud_runtime_css', runtime_asset_content)
        self.assertIn('themes/mycloud/js/mycloud.js', sidebar_content)
        self.assertIn('compress js file mycloud_runtime_js', sidebar_content)

        for asset in (runtime_css, runtime_js):
            self.assertTrue(os.path.isfile(asset))
            self.assertGreater(os.path.getsize(asset), 0)
            with open(asset, encoding='utf-8') as source:
                content = source.read()
            self.assertNotIn('{{', content)
            self.assertNotIn('{%', content)

    def test_mycloud_uses_one_shared_icon_registry(self):
        runtime_js = self._dashboard_path(
            'themes', 'mycloud', 'static', 'js', 'mycloud.js')

        with open(runtime_js, encoding='utf-8') as source:
            content = source.read()

        self.assertEqual(1, content.count("'server':"))
        self.assertIn('var MYCLOUD_ICON_PATHS = Object.freeze({', content)
        self.assertIn('var ICN = MYCLOUD_ICON_PATHS;', content)
        self.assertIn('var IC = MYCLOUD_ICON_PATHS;', content)
        for unsafe_api in ('eval(', 'new Function(', 'document.write('):
            self.assertNotIn(unsafe_api, content)
