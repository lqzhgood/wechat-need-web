const url = new URL(window.location.href);

if (url.searchParams.get('target') !== 't') {
	url.searchParams.set('target', 't')
    window.location.href = url.toString();
}
