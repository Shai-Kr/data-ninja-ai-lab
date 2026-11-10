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
