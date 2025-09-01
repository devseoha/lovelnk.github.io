// Map and navigation functionality

//=============================================
// Naver Map variables
var NAVER_MAP;
var marker;

//=============================================
// Naver Map initialization
function naverMapXY() {
    if (!$("#map").is(":visible")) {
        return;
    }

    var point = new naver.maps.LatLng(37.5350565, 127.1339205);

    NAVER_MAP = new naver.maps.Map("map", {
        center: point,
        zoom: 15,
        mapTypeControl: true
    });

    var infoWindow = new naver.maps.InfoWindow({anchorSkew: true});
    marker = new naver.maps.Marker({
        position: point,
        map: NAVER_MAP
    });
}

//=============================================
// Map initialization on document ready
$(document).ready(function () {
    try {
        naver.maps.onJSContentLoaded = naverMapXY;
        naver.maps.Event.once(NAVER_MAP, 'init_stylemap', naverMapXY);
    } catch (err) {
        // 지도 로드 실패 시
        console.log('Map loading failed:', err);
    }
});