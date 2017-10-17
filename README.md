# Fast Static

Fast static server with Redis caching.

Source folder contains sites. Each site contains layouts, which are full html pages.

Files are parsed and stored in Redis, as is the site state.

When a request is made, it determines if the site is still enabled, and then proceeds to render it to the user.

Multiple domains can be used per site.

## Site.json

Each site has a site.json, which stores site wide configuration such as domain and any keys needed.

This file can have patches. Patches allow for environments to differ.

The patches work by referencing process.env.TYPE - of which as standard dev|pro|demo are used.

The patches are json based diff files which are then applied by npm = jsondiffpatch.

## Settings.json

Each site has a number of layouts in a named folder. Each layout uses information found in settings.json, which provides the template location and the path that the layout serves.
