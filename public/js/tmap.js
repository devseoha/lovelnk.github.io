var TMAP = {};

window.TMAP = window.TMAP || TMAP;

var userAgent = navigator.userAgent.toLocaleLowerCase();
if (userAgent.search("android") > -1) {
    TMAP.os = "android";
} else if (userAgent.search("iphone") > -1 || userAgent.search("ipod") > -1 || userAgent.search("ipad") > -1) {
    TMAP.os = "ios";
} else {
    TMAP.os = "etc";
}

var app = {
    baseUrl : {
        ios : "tmap://",
        android : "tmap://A1",
        etc : "tmap://"
    },
    searchUrl : {
        ios : "tmap://?search=",
        android : "tmap://search?name=",
        etc : "tmap://"
    },
    store : {
        android : "https://play.google.com/store/apps/details?id=com.skt.tmap.ku&hl=ko",
        ios : "https://itunes.apple.com/app/id431589174",
        etc : "http://www.tmap.co.kr"
    }
};

TMAP.send = function (dest, lng, lat) {
    var appKey = "mmbpb5nZO75NUbaaDDnOb9tzyLXT1Y8DEeABBpmh";
    window.location.href = "https://apis.openapi.sk.com/tmap/app/routes?appKey="+ appKey +"&name=" + dest +"&lon="+ lng +"&lat="+ lat;
};


