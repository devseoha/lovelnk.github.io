// Kakao sharing functionality

//=============================================
// Kakao initialization
try {
    Kakao.init('00');
} catch (error) {
    console.log('Kakao initialization failed:', error);
}

//=============================================
// Kakao invitation sending
if ($("#kakao-link-btn").is(":visible")) {
    try {
        function sendLink() {
            var t = $("input[name=kt_01]").val();
            var d = $("input[name=kt_02]").val();

            Kakao.Share.sendCustom({
                templateId: 52792, 
                templateArgs: {
                    idx: "notice",
                    img: "https://devseoha.github.io/lovelnk.github.io/public/images/temp_1/wedding_1588.jpg",
                    title: t,
                    description: d
                },
            })
        }
        
        // Make sendLink function globally available
        window.sendLink = sendLink;
    } catch (error) {
        console.log('Kakao link setup failed:', error);
    }
}