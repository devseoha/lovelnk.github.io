// Main JavaScript functionality

//=============================================
// Global variables
const mp_hname = '강동웨딩 KDW';
const mp_x = 127.1339205;
const mp_y = 37.5350565;

// Disable right click on images
$('.imgblk').bind("contextmenu", function (e) {
    return false;
});

//=============================================
// Loading functionality
function loading(go) {
    if (go) {
        $("#loadBox2020").css("display", "block");
    } else {
        $("#loadBox2020").css("display", "none");
    }
}

//=============================================
// Alert functionality
function openAlert(txt) {
    $(".popAlert .title").text(txt);
    $(".popAlert").css("display", "block");
}

$(".popAlert .background, .popAlert button").click(function () {
    $(".popAlert").css("display", "none");
    if (isAcctBox) {
        document.querySelector(`#acctBox`).style.display = 'block'
    }
});

//=============================================
// Calendar initialization
function initCalander() {
    var lastDate = moment('2025-12-01').locale('ko');
    var lastDay = parseInt(lastDate.endOf('month').format('D'));

    var week = new Array(0, 1, 2, 3, 4, 5, 6);
    var marriedDate = new moment('2025-12-01').locale('ko').day();
    var todayLabel = week[marriedDate];

    var dday = '6';

    var c = '';
    var j = 0;
    var r = 1;
    var end = (lastDay + todayLabel);
    for (var i = 1; i <= end; i++) {
        if (j == 0 || j % 7 == 0) {
            if (j == 0) {
                c += '<tr>';
            } else {
                c += '</tr><tr>';
            }
        }
        if (todayLabel > 0) {
            todayLabel--;
            c += '<td></td>';
        } else {
            if (dday == r) {
                c += '<td><span class="dday">' + r + '</span></td>';
            } else {
                c += '<td class="cal_tr_td_' + r + '">' + r + '</td>';
            }
            r++;
        }
        j++;
    }
    c += '</tr>';

    $("#calander tbody").html(c);
}

$(document).ready(function () {
    if ($("#calander").is(":visible")) {
        initCalander();
        $(".cal_tr_td_25").css("color", "var(--main-sun-day-color)");
    }
});

//=============================================
// Copy to clipboard functionality
function copy_to_clipboard2(elementId) {
    const textarea = document.getElementById(elementId);
    if (textarea) {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 모바일 대응
        
        try {
            document.execCommand('copy');
            alert('클립보드에 복사되었습니다.');
        } catch (err) {
            // 현대적인 방법 시도
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    alert('클립보드에 복사되었습니다.');
                }).catch(err => {
                    alert('복사에 실패했습니다. 직접 선택해서 복사해주세요.');
                });
            }
        }
    }
}

//=============================================
// Accordion toggle functionality
function toggleAccordion(element) {
    const packWrap = element.closest('.pack_wrap');
    const accordionList = packWrap.querySelector('.accordion-list');
    const icon = element.querySelector('.chevron-icon');
    
    // 아코디언이 열려있는지 확인
    const isOpen = accordionList.style.display !== 'none' && accordionList.style.display !== '';
    
    if (isOpen) {
        // 닫기 - 원래 아래 화살표로 회전
        accordionList.style.display = 'none';
        element.classList.remove('open');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // 열기 - 위 화살표로 회전
        accordionList.style.display = 'block';
        element.classList.add('open');
        icon.style.transform = 'rotate(180deg)';
    }
}

//=============================================
// Video controls functionality
function toggleMute() {
    const video = document.getElementById('main-video');
    const muteIcon = document.getElementById('mute-icon');
    
    if (video.muted) {
        // 음소거 해제
        video.muted = false;
        muteIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    } else {
        // 음소거
        video.muted = true;
        muteIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    }
}

function togglePlayPause() {
    const video = document.getElementById('main-video');
    const playPauseIcon = document.getElementById('play-pause-icon');
    
    if (video.paused) {
        // 재생
        video.play();
        playPauseIcon.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>'; // 정지 아이콘
    } else {
        // 정지
        video.pause();
        playPauseIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; // 재생 아이콘
    }
}

function toggleFullscreen() {
    const video = document.getElementById('main-video');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        // 전체화면 진입
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            // iOS Safari용
            video.webkitEnterFullscreen();
        }
    } else {
        // 전체화면 종료
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (video.webkitExitFullscreen) {
            video.webkitExitFullscreen();
        }
    }
}

// 전체화면 상태 변화 감지
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('msfullscreenchange', updateFullscreenIcon);

// iOS Safari 전용 이벤트
const video = document.getElementById('main-video');
if (video) {
    video.addEventListener('webkitbeginfullscreen', updateFullscreenIcon);
    video.addEventListener('webkitendfullscreen', updateFullscreenIcon);
}

function updateFullscreenIcon() {
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    const video = document.getElementById('main-video');
    
    // 다양한 브라우저의 전체화면 상태 확인
    const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.msFullscreenElement ||
                       (video && video.webkitDisplayingFullscreen);
    
    if (isFullscreen) {
        fullscreenIcon.innerHTML = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'; // 전체화면 종료 아이콘
    } else {
        fullscreenIcon.innerHTML = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'; // 전체화면 아이콘
    }
}

//=============================================
// Main video initialization
function initMainVideo() {
    const video = document.getElementById('main-video');
    const image = document.getElementById('main-image');
    
    if (video && image) {
        // 동영상 로드 성공 시
        video.addEventListener('loadeddata', () => {
            video.style.opacity = '1';
            image.style.opacity = '0';
            setTimeout(() => {
                image.style.display = 'none';
            }, 600);
        });
        
        video.addEventListener('canplay', () => {
        });
        
        // 동영상 로드 실패 시
        video.addEventListener('error', (e) => {
            video.style.display = 'none';
            image.style.display = 'block';
        });
        
        // 소스 에러
        video.querySelectorAll('source').forEach(source => {
            source.addEventListener('error', (e) => {
            });
        });
        
        // 2초 후 readyState 체크하여 동영상 표시
        setTimeout(() => {
            if (video.readyState >= 3) { // HAVE_FUTURE_DATA 이상이면 재생 가능
                video.style.opacity = '1';
                video.style.zIndex = '10';
                video.style.position = 'absolute';
                image.style.opacity = '0';
                setTimeout(() => { image.style.display = 'none'; }, 600);
                
                // 강제로 동영상 재생 시도
                video.play().catch(() => {
                    video.style.opacity = '0';
                    image.style.display = 'block';
                    image.style.opacity = '1';
                });
            }
        }, 2000);
    }
}

//=============================================
// Image optimization
function optimizeImages() {
    // 중요한 이미지만 미리 로드 (메인 이미지, 첫 번째 갤러리 이미지)
    const criticalImages = [
        './public/images/55.png', // 메인 썸네일
        './public/images/1.jpg',  // 첫 번째 갤러리 이미지
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

//=============================================
// Page initialization and effects
$(document).ready(function () {
    console.log('%c🎊 축하합니다! 개발자의 눈을 발견했습니다! 🎊',
        'background: linear-gradient(90deg, #ff69b4, #ff6b9d, #ffd93d, #6c5ce7, #a29bfe, #fd79a8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 16px; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');

    console.log('%c💝 제 모청을 봐주셔서 감사합니당 💝',
        'color: #ff69b4; font-size: 14px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);');

    console.log('%c🌸 36살 조금은 늦은 나이에 어찌저찌 결혼이라는 것을 하네요.😆',
        'color: #ffd93d; font-size: 12px; font-weight: bold;');

    console.log('%c🎭 이왕 결혼 하는거 오랜시간 평화롭게 인생이라는 게임의 수많은 퀘스트를 잘 깨보겠습니다. ⭐️',
        'color: #6c5ce7; font-size: 12px; font-weight: bold;');

    console.log('%c🫶 아니 근데 왜 개발자모드를 키신거죠? "리얼 개발 미친자" 시군요? 😂',
        'color: #a29bfe; font-size: 12px; font-weight: bold;');

    console.log('%c🔥 카톡 주시면 소정의 미친자 소리를 선물해드리겠습니다. 🤣',
        'color: #fd79a8; font-size: 12px; font-weight: bold;');

    console.log('%c🙇🏻‍♀️ 모청 봐주셔서 감사합니다! - 서하쓰 드림 💌',
        'color: #ff6b9d; font-size: 14px; font-weight: bold; text-decoration: underline;');

    $('.anibox').addClass("hd").viewportChecker({
        classToAdd: 'visible animated fadeInUp',
        offset: 100
    });

    $('.anibox_bn').viewportChecker({
        classToAdd: 'animate',
        offset: 100
    });
    
    // Initialize components
    optimizeImages();
    initMainVideo();
    
    // Gallery는 별도 JS 파일에서 초기화됨
});

// Global variable for splash activation
try {
    activateSplash('v1', false, false);
} catch (e) {
    // If activateSplash is not defined, just continue
}