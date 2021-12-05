'use strict';(function () {
	const tl = [
		"it's over nine thousand",
		"cache invalidation and naming things",
		"it's a unix system, i know this",
		"[object Object] - [object Object]",
	]
	document.getElementById('𝖙𝖆𝖌𝖑𝖎𝖓𝖊').innerText = tl[Math.floor(Math.random() * tl.length)]

	if (navigator.userAgent.indexOf("Chrome") !== -1)
		document.querySelector('.ᵇᵈᵍ.ᶠˣ').classList.add('burgeoning')

	document.addEventListener('keyup', (evt) => {
		if (evt.ctrlKey || (isMac && evt.metaKey)) {
			if (evt.keyCode == 37)
				document.querySelector('[rel=next]').click()
			if (evt.keyCode == 39)
				document.querySelector('[rel=prev]').click()
		}
	})
	const isMac = navigator.userAgent.indexOf("Mac OS X") !== -1
	const relNextTitle = document.querySelector('[rel=next] > svg title')
	if (relNextTitle)
		relNextTitle.innerHTML += ` (${isMac ? '⌘' : 'Ctrl-'}←)`
	const relPrevTitle = document.querySelector('[rel=prev] > svg title')
	if (relPrevTitle)
		relPrevTitle.innerHTML += ` (${isMac ? '⌘' : 'Ctrl-'}→)`

	function findDeepEl (el) {
		if (el.lastElementChild) return findDeepEl(el.lastElementChild)
		return el
	}

	function timeAgo (ago) {
		// based on https://coolaj86.com/articles/time-ago-in-under-50-lines-of-javascript/
		let part = 0
		if (ago < 2) return "a moment ago"
		if (ago < 5) return "moments ago"
		if (ago < 60) return ago + " seconds ago"
		if (ago < 120) return "a minute ago"
		if (ago < 3600) {
			while (ago >= 60) { ago -= 60; part += 1 }
			return part + " minutes ago"
		}
		if (ago < 7200) return "an hour ago"
		if (ago < 86400) {
			while (ago >= 3600) { ago -= 3600; part += 1 }
			return part + " hours ago"
		}
		if (ago < 172800) return "a day ago"
		if (ago < 604800) {
			while (ago >= 172800) { ago -= 172800; part += 1 }
			return part + " days ago"
		}
		if (ago < 1209600) return "a week ago"
		if (ago < 2592000) {
			while (ago >= 604800) { ago -= 604800; part += 1 }
			return part + " weeks ago"
		}
		if (ago < 5184000) return "a month ago"
		if (ago < 31536000) {
			while (ago >= 2592000) { ago -= 2592000; part += 1 }
			return part + " months ago"
		}
		if (ago < 1419120000)
			return ""
	}

	customElements.define('hammer-time', class extends HTMLElement {
		updateTime () {
			const ago = Math.floor((Date.now() - this.parsedDate) / 1000)
			const agoText = timeAgo(ago)
			this.agoTargetEl.innerText = agoText.length > 0 ? `(${agoText})` : ''
			return ago
		}

		connectedCallback () {
			const timeEl = this.querySelector('time')
			this.parsedDate = new Date(timeEl.dateTime)
			findDeepEl(timeEl).innerText = this.parsedDate.toLocaleString('en-US',
					{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
				', ' + this.parsedDate.toLocaleString('en-US', { timeStyle: 'short' })
			this.agoTargetEl = document.createElement('span')
			this.appendChild(this.agoTargetEl)
			const ago = this.updateTime()
			if (ago < 172800)
				setInterval(this.updateTime, 60000)
			else if (ago < 5184000)
				setInterval(this.updateTime, 600000)
		}
	})
})()
