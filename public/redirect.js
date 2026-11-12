// XPAM: send old addresses to the console (an external file: the console's Content-Security-Policy allows no inline
// script)
    window.onload = function () {
        if (location.pathname === '/') {
            location.pathname = '/web/'
        }
        const pathname = window.location.pathname
        if (pathname.startsWith('/core')) {
            return
        }
        if (pathname.indexOf('/web') === -1) {
            window.location.href = window.location.origin + '/web/#' + pathname
        }
        if (pathname.startsWith('/web/#/chat')) {
            window.location.href = window.location.origin + pathname
        }
    }
