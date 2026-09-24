/* AI-CT TEACHER landing page. Optional enhancement only: the page works without JavaScript. */
(function () {
  // When the site is opened straight from a folder (file://), a link to a directory such as "app/"
  // shows a file listing instead of the page. Point those links at index.html for local previews only.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[data-app-link]').forEach(function (a) {
      var h = a.getAttribute('href');
      a.setAttribute('href', h.replace(/^app\/(#.*)?$/, function (_, hash) { return 'app/index.html' + (hash || ''); }));
    });
    var brand = document.querySelector('a.brand');
    if (brand) brand.setAttribute('href', 'index.html');
  }
})();
