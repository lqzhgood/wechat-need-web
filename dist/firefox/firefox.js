'use strict';
const url = new URL(window.location);
if (url.searchParams.get('target') !== 't') {
    url.searchParams.set('target', 't');
    window.location.href = url.href;
}
