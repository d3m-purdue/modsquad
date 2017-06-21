// Construct an HTML element from an HTML string.
//
// See https://stackoverflow.com/a/35385518/1886928.
export default function stringToElement (s) {
  const t = document.createElement('template');
  t.innerHTML = s;
  return t.content.firstChild;
};
