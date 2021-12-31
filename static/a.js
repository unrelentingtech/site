;(function () {
	document.body.classList.add('with-mp')

	const sc = document.createElement('script')
	sc.async = true
	sc.src = '/micro-panel-all.js'
	document.body.appendChild(sc)

	const mpe = document.createElement('micro-panel-editor')
	mpe.hidden = true
	mpe.setAttribute('micropub', '/.sellout/pub')
	mpe.setAttribute('media', '/.sellout/media')
	mpe.setAttribute('defaultctype', 'markdown')
	document.body.appendChild(mpe)

	const mpt = document.createElement('micro-panel-toolbar')
	document.body.appendChild(mpt)
})()
