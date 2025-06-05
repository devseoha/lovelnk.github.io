/*
    G-蹂���
*/
let G_ANI_LTT_OBJ = null;

// �ㅽ봽�앹븷�덈찓�댁뀡 �숈옉
function activateSplash(splashType, isBgm, isGarland) {

    offScroll()
    if(splashType=="v1")
    {
        splash_v1(isBgm, isGarland);
    }
    else if(splashType=="v2")
    {
        var newImage0 = $(".ltt_wrapper .opening_v2_bg .img_01").attr("src");
        var newImage1 = $(".ltt_wrapper .opening_v2_bg .img_02").attr("src");
        var imagesLoaded = 0; // 濡쒕뱶�� �대�吏� 媛쒖닔

        // �대�吏� 濡쒕뱶 �뺤씤 �⑥닔
        function checkImagesLoaded() {
            imagesLoaded++;
            if (imagesLoaded === 2) { // 紐⑤뱺 �대�吏�媛� 濡쒕뱶�섎㈃
                splash_v2(isBgm, isGarland); // �좊땲硫붿씠�� �쒖옉
            }
        }

        // 泥� 踰덉㎏ �대�吏� 濡쒕뱶 �뺤씤
        var img0 = new Image();
        img0.src = newImage0;
        img0.onload = checkImagesLoaded;

        // �� 踰덉㎏ �대�吏� 濡쒕뱶 �뺤씤
        var img1 = new Image();
        img1.src = newImage1;
        img1.onload = checkImagesLoaded;

    }
    else if(splashType=="v3")
    {
        splash_v3(isBgm, isGarland); // �좊땲硫붿씠�� �쒖옉
    }
}

//-----------------------------------------------------------------------------------------

// �ㅽ봽�� �숈옉 以묐떒(V1,V2,V3 �대떦) - �몄쭛�댁뿉�쒕쭔 �ъ슜
function offSplash() {

    if(G_ANI_LTT_OBJ!=null) {
        G_ANI_LTT_OBJ.stop();
        G_ANI_LTT_OBJ.destroy();
        G_ANI_LTT_OBJ = null;
    }

    // V1 �숈옉 硫덉땄
    const v1 = document.querySelector(".splash");
    if(v1) { v1.style.display = 'none'; }

    // V2~3 �숈옉 硫덉땄
    const v2_3 = document.querySelector(".ltt_wrapper");
    if(v2_3) { v2_3.style.display = 'none'; }
}

// �ㅽ봽�� �숈옉 �� �ㅽ겕濡� �� �� �덈룄濡� 泥섎━
function onScroll() {

    const viewer = document.querySelector(`#card_viewer`) // �몄쭛�섏씠吏� �뺤씤
    if(viewer) {
        viewer.style.overflowY = ''
    } else {
        document.body.style.overflowY = ''
        document.body.style.height = ''
        document.body.style.width = ''
        document.body.style.position = ''
    }
}

// �ㅽ봽�� �숈옉 以� �ㅽ겕濡� 湲덉�
function offScroll() {
    const viewer = document.querySelector(`#card_viewer`) // �몄쭛�섏씠吏� �뺤씤
    if(viewer) {
        viewer.style.overflowY = 'hidden'
    } else {
        document.body.style.overflowY = 'hidden'
        document.body.style.height = '100%'
        document.body.style.width = '100%'
        document.body.style.position = 'fixed'
    }
}

// �ㅽ봽�� V1 (�댁쟾 �⑥닔�대쫫 : splashAniFunc)
function splash_v1(isBgm, isGarland) {

    //$(".splash").css("display", "block");
    $(".pageCover").addClass("blur");

    var typingBool = false;
    var typingIdx=0;
    var typingTxt = $(".typing-txt").text(); // ���댄븨�� �띿뒪�몃� 媛��몄삩��
    typingTxt = [...typingTxt]; // �쒓��먯뵫 �먮Ⅸ��.

    // �대え吏� 愿��⑦빐�� �댁긽�� 怨듬갚 �앷만寃쎌슦 諛곗뿴�먯꽌 �놁븷二쇨린
    $(typingTxt).each(function(idx, val){
        if(val=='') {typingTxt.splice(idx, 1);}
    });

    if(typingBool==false){ // ���댄븨�� 吏꾪뻾�섏� �딆븯�ㅻ㈃
        typingBool=true;
        var tyInt = setInterval(typing, 90); // 諛섎났�숈옉
    }

    function typing(){
        if(typingIdx<typingTxt.length){ // ���댄븨�� �띿뒪�� 湲몄씠留뚰겮 諛섎났
            $(".typing").append(typingTxt[typingIdx]); // �쒓��먯뵫 �댁뼱以���.
            typingIdx++;
        } else{
            clearInterval(tyInt); //�앸굹硫� 諛섎났醫낅즺
        }
    }
    // return;
    // TODO. 딜레이 2초
    setTimeout(function(){
        $(".pageCover").removeClass("blur");
        if($("#pop_rsvp").hasClass("needShow")) {
            $("#pop_rsvp").css("display", "block");
        }
        $(".splash").addClass("animate__animated animate__fadeOut");
        setTimeout(function(){

            if(isBgm) { bgmAniFunc(); bgmStreaming(); }

            $(".splash").detach();

            if(isGarland) { floatGarland(); };
            onScroll()

            //========================================
            //========================================
            //========================================
            /*$(".floatingBox").addClass("h animated animate__fadeInUp");
            setTimeout(function(){
                $(".floatingBox").toggleClass("hi");
            }, 2000);*/
            //========================================
            //========================================
            //========================================

        }, 1000);
    }, 0);
}

// �ㅽ봽�� V2
function splash_v2(isBgm, isGarland) {

    offSplash();
    const v2 = document.querySelector(".ltt_wrapper.v2");
    if(v2) {
        v2.style.display = 'block';
    }

    const splashElement = document.querySelector('#splash_v2_id');
    splashElement.style.background = "transparent";
    splashElement.classList.remove('keys');
    void splashElement.offsetWidth; // 媛뺤젣 由ы뵆濡쒖슦 諛쒖깮

    G_ANI_LTT_OBJ = lottie.loadAnimation({
        container: document.getElementById('opening-v2-text'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: "/src/bodymovin/v2.json"
    });

    // DOMLoaded �대깽�� 由ъ뒪�덈� 蹂꾨룄濡� �뺤쓽
    function onDOMLoaded() {
        G_ANI_LTT_OBJ.goToAndStop(0, true);
        G_ANI_LTT_OBJ.play();
        splashElement.classList.add("keys");
    }

    // complete �대깽�� 由ъ뒪�덈� 蹂꾨룄濡� �뺤쓽
    function onAnimationComplete() {

        // �� animationend �대깽�� 由ъ뒪�� 異붽�
        function onAnimationEnd() {

            splashElement.style.display = "none";
            splashElement.removeEventListener('animationend', onAnimationEnd);  //console.log("�쒓굅");

            if (isBgm) {
                bgmAniFunc();
                bgmStreaming();
            }
            if (isGarland) {
                floatGarland();
            }
            if($("#pop_rsvp").hasClass("needShow")) {
                $("#pop_rsvp").css("display", "block");
            }
            onScroll()
        }
        // �댁쟾 animationend �대깽�� 由ъ뒪�� �쒓굅
        splashElement.removeEventListener('animationend', onAnimationEnd);  //console.log("�쒓굅");
        splashElement.addEventListener('animationend', onAnimationEnd);  //console.log("�깅줉");
    }

    // �대깽�� 由ъ뒪�� �깅줉
    G_ANI_LTT_OBJ.addEventListener('DOMLoaded', onDOMLoaded);
    G_ANI_LTT_OBJ.addEventListener('complete', onAnimationComplete);

}

// �ㅽ봽�� V3
function splash_v3(isBgm, isGarland) {

    offSplash();
    const v3 = document.querySelector(".ltt_wrapper.v3");
    if(v3) {
        v3.style.display = 'block';
    }

    const splashElement = document.querySelector('#splash_v3_id');
    splashElement.classList.remove('keys');
    void splashElement.offsetWidth; // 媛뺤젣 由ы뵆濡쒖슦 諛쒖깮

    // �좊땲硫붿씠�� JSON �뚯씪�� 癒쇱� 濡쒕뱶
    fetch('/src/bodymovin/v3.json')
        .then(response => response.json())
        .then(animationData => {

            // 紐⑤뱺 �덉씠�댁쓽 �ㅽ듃濡쒗겕 �됱긽�� �섏��됱쑝濡� 蹂�寃�
            animationData.layers.forEach(layer => {
                if (layer.shapes) {
                    layer.shapes.forEach(shape => {
                        // shape�� 媛� ��ぉ�먯꽌 stroke('st') �띿꽦�� 李얠쓬
                        findAndChangeStrokeColor(shape);
                    });
                }
            });

            // �섏젙�� JSON �곗씠�곕� �ъ슜�섏뿬 �좊땲硫붿씠�� 濡쒕뱶
            G_ANI_LTT_OBJ = lottie.loadAnimation({
                container: document.getElementById('opening_v3'), // �좊땲硫붿씠�섏씠 �ㅼ뼱媛� div
                renderer: 'svg',
                loop: false,
                autoplay: false, // �먮룞 �ъ깮 �쒖꽦��
                animationData: animationData // �섏젙�� JSON �곗씠�곕� �ъ슜
            });

            // DOMLoaded �대깽�� 由ъ뒪�덈� 蹂꾨룄濡� �뺤쓽
            function onDOMLoaded() {
                G_ANI_LTT_OBJ.goToAndStop(0, true);
                G_ANI_LTT_OBJ.play();
                splashElement.classList.add("keys");
            }

            // complete �대깽�� 由ъ뒪�� �뺤쓽 諛� �깅줉
            function onAnimationComplete() {

                function onAnimationEnd() {

                    splashElement.style.display = "none";
                    splashElement.removeEventListener('animationend', onAnimationEnd); //console.log("�쒓굅");

                    if (isBgm) {
                        bgmAniFunc();
                        bgmStreaming();
                    }
                    if (isGarland) {
                        floatGarland();
                    }
                }
                splashElement.removeEventListener('animationend', onAnimationEnd); //console.log("�쒓굅");
                splashElement.addEventListener('animationend', onAnimationEnd); //console.log("�깅줉");
            }

            // �대깽�� 由ъ뒪�� �깅줉
            G_ANI_LTT_OBJ.addEventListener('DOMLoaded', onDOMLoaded);
            G_ANI_LTT_OBJ.addEventListener('complete', onAnimationComplete);

        })
        .catch(error => console.error('Error loading the animation:', error));

    // �ш��곸쑝濡� 紐⑤뱺 媛앹껜 �댁쓽 'st' �띿꽦�� 李얠븘 �됱긽 蹂�寃�
    function findAndChangeStrokeColor(shape) {
        if (shape.ty === 'st') { // 'st'�� stroke瑜� �섎�
            shape.c.k = [1, 1, 1, 1]; // RGB [1, 1, 1] = �섏���
        } else if (shape.it) {
            shape.it.forEach(subShape => {
                findAndChangeStrokeColor(subShape); // �섏쐞 媛앹껜�먯꽌 �ш��곸쑝濡� �먯깋
            });
        }
    }
}




