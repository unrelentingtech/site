+++
date = 2018-12-02T11:21:03+00:00
path = "/kb/WebInspectorScrapingSnippets"
title = "WebInspectorScrapingSnippets"

+++

Get YouTube links:

```js
console.log(Array.from(new Set(Array.prototype.map.call(document.querySelectorAll("a[href^='https://www.youtube.com/watch']"), x => x.href))).map(x => `"${x}"`).join(' '))
```