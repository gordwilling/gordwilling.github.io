export let mapsApiKey = "AIzaSyCa4GQPYShvGawnTkh_XX4_n4coT77GBuw"
if (window.location.hostname === "localhost") {
    /**
     * Loads a different key from a local file for development work.
     */
    const xhr = new XMLHttpRequest()
    xhr.overrideMimeType("application/json")
    xhr.open("GET", "../lib/geoLocationApiKey.json")
    xhr.onerror = console.log
    xhr.onload = () => {
        mapsApiKey = xhr.response.value
    }
    xhr.send()
}


