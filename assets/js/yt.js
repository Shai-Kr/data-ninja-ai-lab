// Click-to-load YouTube players: the page only loads a thumbnail until someone presses play.
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a.yt-lite');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  var f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-yt') + '?autoplay=1&rel=0';
  f.title = a.getAttribute('aria-label') || 'YouTube video';
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  f.allowFullscreen = true;
  a.parentNode.replaceChild(f, a);
});

// Latest videos row: arrows page through the cards; each arrow hides at its end.
(function () {
  var carousels = document.querySelectorAll('.yt-carousel');
  Array.prototype.forEach.call(carousels, function (c) {
    var rail = c.querySelector('.yt-rail');
    var prev = c.querySelector('.yt-arrow--prev');
    var next = c.querySelector('.yt-arrow--next');
    if (!rail || !prev || !next) return;
    function metrics() {
      var card = rail.querySelector('.yt-card');
      var cs = getComputedStyle(rail);
      var gap = parseFloat(cs.columnGap) || 0;
      var inner = rail.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var w = card ? card.offsetWidth : inner;
      return { step: w + gap, visible: Math.max(1, Math.floor((inner + gap) / (w + gap) + 0.01)) };
    }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      c.classList.toggle('at-start', rail.scrollLeft <= 4);
      c.classList.toggle('at-end', rail.scrollLeft >= max - 4);
      var thumb = rail.querySelector('.yt-thumb');
      if (thumb) c.style.setProperty('--yt-arrow-top', (parseFloat(getComputedStyle(rail).paddingTop) + thumb.offsetHeight / 2) + 'px');
    }
    function page(dir) {
      var m = metrics();
      rail.scrollBy({ left: dir * m.visible * m.step, behavior: 'smooth' });
    }
    prev.addEventListener('click', function () { page(-1); });
    next.addEventListener('click', function () { page(1); });
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    setTimeout(update, 400);
  });
})();
