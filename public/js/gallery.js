// Gallery and image viewer functionality

//=============================================
// Swiper gallery functions
function swipeGallery01() {
    var imglen = $("#swipelistid > .swiper-slide").length;
    if (imglen > 1) {
        const imgList = document.querySelectorAll(`#swipelistid [data-order] img`)
        new Swiper(".mySwiper", {
            loop: true,
            autoHeight: true,
            speed: 300,
            pagination: {
                el: ".mySwiper .swiper-pagination",
                dynamicBullets: true,
            },
            navigation: {
                nextEl: ".mySwiper .swiper-button-next",
                prevEl: ".mySwiper .swiper-button-prev",
            },
            on: {
                slideChange: function () {
                    imgList.forEach((item, index) => {
                        const p = item.parentElement
                        if (
                            p.classList.contains('swiper-slide-prev') ||
                            p.classList.contains('swiper-slide-next') ||
                            p.classList.contains('swiper-slide-active')
                        ) {
                            item.style.display = ''
                        } else {
                            item.style.display = 'none'
                        }
                    })

                    var numb = this.activeIndex;
                    var s = $("#swipelistid .swiper-slide").eq(numb).find("img.imgblk.rs").attr('src');
                    if (typeof s == "undefined" || s == null || s == "") {
                        return;
                    } // 이미 변환된 이미지
                    var bs = s.replace(/\/([^/]+)-[^.]+\.(jpg|png|jpeg|webp|JPG)/, "/$1-resize.$2");
                    bs = bs.replaceAll('-crop', '')

                    $("#swipelistid .swiper-slide:nth-child(" + (numb + 1) + ") img.imgblk").removeClass("rs");
                    if (bs == s) {
                        return;
                    } // 같은 이미지
                    $("#swipelistid .swiper-slide:nth-child(" + (numb + 1) + ") img.imgblk").attr('src', bs);
                }
            }
        });

    } else if (imglen == 1) {
        $(".gallHeightAdj").css("height", "75px");
        $(".swiper-opts").detach();
    } else if (imglen == 0) {
        $(".pic_0_del").detach();
        $(".swiper-opts").detach();
        $(".layer01 .title2").css("padding-top", "0px");
    }
}

function swipeGallery02() {
    var imglen = $("#thumblistid > .swiper-slide").length;

    if (imglen > 1) {
        var swiper = new Swiper(".mySwiper", {
            loop: true,
            autoHeight: true,
            speed: 300,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                renderBullet: function (index, className) {
                    index = index + 1;
                    var src = $("#thumblistid .ss:nth-child(" + (index) + ") > .vs").attr("src");
                    const cropUrl = $("#thumblistid .ss:nth-child(" + (index) + ") > .vs").attr("data-cropData");
                    if (cropUrl) {
                        src = cropUrl
                    }

                    return '<span class="item ' + className + '" style="background-image: url(' + src.replace('1280', '300') + ') !important;"></span>';
                },
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            on: {
                slideChange: function () {
                    var numb = this.activeIndex;
                    var s = $("#thumblistid .swiper-slide").eq(numb).find("img.imgblk.rs").attr('src');
                    if (typeof s == "undefined" || s == null || s == "") {
                        return;
                    } // 이미 변환된 이미지
                    var bs = s.replace(/\/([^/]+)-[^.]+\.(jpg|png|jpeg|webp|JPG)/, "/$1-resize.$2");
                    bs = bs.replaceAll('-crop', '')

                    $("#thumblistid .swiper-slide:nth-child(" + (numb + 1) + ") img.imgblk").removeClass("rs");
                    if (bs == s) {
                        return;
                    } // 같은 이미지
                    $("#thumblistid .swiper-slide:nth-child(" + (numb + 1) + ") img.imgblk").attr('src', bs);
                },
                slideChangeTransitionStart: function () {
                    this.update()
                }
            }
        });

    } else if (imglen == 1) {
        $(".swiper-opts").detach();
    } else if (imglen == 0) {
        $(".pic_0_del").detach();
        $(".swiper-opts").detach();
        $(".layer01 .title2").css("padding-top", "0px");
    }
}

//=============================================
// Gallery modal functionality
function openGalleryModal(imgUrl) {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    if (modal && modalImg) {
        modalImg.src = imgUrl;
        modal.style.display = 'block';
        
        // 이미지 목록에서 현재 이미지 인덱스 찾기
        const allImages = Array.from(document.querySelectorAll('.gallGridWrapper .item')).map(item => {
            return item.getAttribute('data-url') || item.style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
        }).filter(url => url);
        
        const currentIndex = allImages.indexOf(imgUrl);
        if (currentIndex !== -1) {
            window.currentGalleryIndex = currentIndex;
            window.galleryImages = allImages;
            
            // initGalleryModal의 currentImageIndex와 동기화
            if (window.galleryModalInstance && window.galleryModalInstance.setCurrentIndex) {
                window.galleryModalInstance.setCurrentIndex(currentIndex);
            }
            
            updateGalleryCounter();
        }
    }
}

function updateGalleryCounter() {
    const currentSpan = document.getElementById('gallery-current');
    const totalSpan = document.getElementById('gallery-total');
    if (currentSpan && totalSpan && window.galleryImages) {
        currentSpan.textContent = (window.currentGalleryIndex + 1);
        totalSpan.textContent = window.galleryImages.length;
    }
}

// Gallery modal initialization
function initGalleryModal() {
    
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const closeBtn = document.querySelector('.gallery-modal-close');
    const prevBtn = document.querySelector('.gallery-modal-prev');
    const nextBtn = document.querySelector('.gallery-modal-next');
    const currentSpan = document.getElementById('gallery-current');
    const totalSpan = document.getElementById('gallery-total');
    

    
    let currentImageIndex = 0;
    let images = [];
    let savedScrollPosition = 0; // 스크롤 위치 저장용 변수 추가
    let isModalOpen = false; // 모달 상태 추적
    let scrollBackupPosition = 0; // 백업 스크롤 위치
    
    // 모든 갤러리 아이템 수집 및 lazy loading 구현
    const galleryItems = document.querySelectorAll('.gallGridWrapper .item');

    
    // 각 갤러리 아이템에 고유 인덱스 부여 및 이미지 URL 수집
    galleryItems.forEach((item, index) => {
        const imgUrl = item.getAttribute('data-url') || item.style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)?.[1];
        
        // 모든 아이템에 대해 인덱스 저장 (이미지 URL이 없어도)
        item.setAttribute('data-gallery-index', index);
        
        if (imgUrl) {
            images.push(imgUrl);

            
            // 커서 포인터 스타일 추가
            item.style.cursor = 'pointer';
            
            // lazy loading 구현
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = new Image();
                        img.onload = () => {
                            entry.target.style.backgroundImage = `url('${imgUrl}')`;
                        };
                        img.src = imgUrl;
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            // 처음에는 placeholder 이미지로 설정
            if (!item.style.backgroundImage.includes(imgUrl)) {
                observer.observe(item);
            }
        }
    });
    
    if (totalSpan) totalSpan.textContent = images.length;
    
    let scrollY = 0; // 스크롤 위치 저장
    
    function openModal(index) {

        
        currentImageIndex = index;
        updateModal();
        
        // 모달 상태 추적
        isModalOpen = true;
        
        // 스크롤 위치 확인 및 복구
        const currentPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        
        if (savedScrollPosition === 0 || savedScrollPosition === undefined) {
            // 저장된 위치가 없으면 현재 위치 저장
            savedScrollPosition = currentPos;
            scrollBackupPosition = currentPos;
            localStorage.setItem('galleryScrollPosition', currentPos.toString());

        } else {

        }
        
        // localStorage에서 백업 위치 확인
        const storedPos = localStorage.getItem('galleryScrollPosition');
        if (storedPos && parseInt(storedPos) > 0) {
            scrollBackupPosition = parseInt(storedPos);

        }
        
        // 추가 체크: 스크롤 위치가 유효한지 확인
        if (savedScrollPosition < 0) savedScrollPosition = 0;
        if (scrollBackupPosition < 0) scrollBackupPosition = 0;
        
        // 모달 표시 및 스크롤 방지
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollPosition}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        

    }
    
    function closeModal() {


        
        // 모달 상태 업데이트
        isModalOpen = false;
        
        // 저장된 스크롤 위치 확인 및 복구 시도
        let targetScrollPosition = savedScrollPosition;
        
        // 메인 위치가 0이면 백업 위치 사용
        if (targetScrollPosition === 0 || targetScrollPosition === undefined) {
            targetScrollPosition = scrollBackupPosition;

        }
        
        // 백업도 0이면 localStorage에서 복구 시도
        if (targetScrollPosition === 0) {
            const storedPos = localStorage.getItem('galleryScrollPosition');
            if (storedPos && parseInt(storedPos) > 0) {
                targetScrollPosition = parseInt(storedPos);

            }
        }
        

        
        modal.style.display = 'none';
        
        // body 스타일 완전 제거 (더 안전한 방법)
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        
        // 강력한 스크롤 위치 복원 (다단계 방법)

        
        // 1단계: 즉시 복원
        if (window.scrollTo && targetScrollPosition > 0) {
            try {
                window.scrollTo({
                    top: targetScrollPosition,
                    left: 0,
                    behavior: 'instant'
                });

            } catch (e) {

                window.scrollTo(0, targetScrollPosition);
            }
        } else {

        }
        
        // 2단계: 여러 방법으로 재시도 (10ms 후)
        setTimeout(() => {
            if (!isModalOpen && targetScrollPosition > 0) { // 모달이 닫혔을 때만 실행
                const currentPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (Math.abs(currentPos - targetScrollPosition) > 5) { // 5px 이상 차이나면 재시도

                    
                    // 여러 방법으로 시도
                    window.scrollTo(0, targetScrollPosition);
                    document.documentElement.scrollTop = targetScrollPosition;
                    document.body.scrollTop = targetScrollPosition;
                    
                    // requestAnimationFrame을 사용한 최종 시도
                    requestAnimationFrame(() => {
                        window.scrollTo(0, targetScrollPosition);
                    });
                }
            }
        }, 10);
        
        // 3단계: 최종 확인 (100ms 후)
        setTimeout(() => {
            if (!isModalOpen && targetScrollPosition > 0) {
                const finalPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

                if (Math.abs(finalPos - targetScrollPosition) > 5) {

                    window.scrollTo(0, targetScrollPosition);
                }
            }
        }, 100);
        
        // 4단계: 10번째 이미지 특별 처리 (200ms 후)
        setTimeout(() => {
            if (!isModalOpen && targetScrollPosition > 0) {
                const veryFinalPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (Math.abs(veryFinalPos - targetScrollPosition) > 10) {

                    
                    // 모든 가능한 방법으로 스크롤 복원
                    try {
                        window.scrollTo({ top: targetScrollPosition, behavior: 'auto' });
                    } catch (e) {
                        window.scrollTo(0, targetScrollPosition);
                    }
                    
                    // 강제 스크롤 설정
                    document.documentElement.scrollTop = targetScrollPosition;
                    document.body.scrollTop = targetScrollPosition;
                    
                    // 최종 강제 시도
                    requestAnimationFrame(() => {
                        window.scrollTo(0, targetScrollPosition);
                        document.documentElement.scrollTop = targetScrollPosition;
                    });
                }
            }
        }, 200);
        
        // 5단계: 최종 안전장치 (500ms 후)
        setTimeout(() => {
            if (!isModalOpen) {
                const ultimatePos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (ultimatePos === 0 && targetScrollPosition > 0) {

                    window.scrollTo(0, targetScrollPosition);
                    
                    // localStorage 정리
                    localStorage.removeItem('galleryScrollPosition');
                }
            }
        }, 500);
        

    }
    
    function updateModal() {
        if (images.length > 0) {
            modalImg.src = images[currentImageIndex];
            currentSpan.textContent = currentImageIndex + 1;
        }
    }
    
    // 외부에서 currentImageIndex를 설정할 수 있도록 함수 제공
    function setCurrentIndex(index) {
        if (index >= 0 && index < images.length) {
            currentImageIndex = index;
            updateModal();
        }
    }
    
    function showPrevious() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateModal();
    }
    
    function showNext() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateModal();
    }
    
    // 이벤트 리스너들
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {

            e.preventDefault(); // 기본 동작 방지
            e.stopPropagation(); // 이벤트 버블링 방지
            e.stopImmediatePropagation(); // 다른 이벤트 리스너 실행 방지
            
            // 잠시 대기 후 모달 닫기 (다른 이벤트 처리 완료 후)
            setTimeout(() => {
                closeModal();
            }, 10);
        });
    }
    if (prevBtn) prevBtn.addEventListener('click', showPrevious);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    
    // 갤러리 아이템 클릭 이벤트 등록 (PC와 모바일 모두 지원)
    galleryItems.forEach((item, index) => {
        // data-url 또는 background-image에서 이미지 URL 추출 (더 강력한 방법)
        let imgUrl = item.getAttribute('data-url');
        if (!imgUrl) {
            const bgImage = window.getComputedStyle(item).backgroundImage;
            const match = bgImage.match(/url\(["']?([^"']*)["']?\)/);
            if (match) {
                imgUrl = match[1];
                // data-url 속성이 없으면 추가
                item.setAttribute('data-url', imgUrl);
            }
        }
        

        
        if (!imgUrl) {
            return; // 이미지 URL이 없으면 이벤트 등록하지 않음
        }
        
        // 커서 스타일 추가
        item.style.cursor = 'pointer';
        item.style.pointerEvents = 'auto';
        item.style.userSelect = 'none'; // 텍스트 선택 방지
        
        // 시각적 피드백 추가
        item.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'all 0.2s ease';
        });
        item.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        // 메인 클릭 이벤트 (가장 중요!)
        const clickHandler = function(e) {
            
            // 현재 스크롤 위치를 여러 방법으로 저장 (더 안전함)
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            
            // 메인과 백업 위치 모두 저장
            savedScrollPosition = currentScroll;
            scrollBackupPosition = currentScroll;
            
            // 추가 안전장치: localStorage에도 저장
            localStorage.setItem('galleryScrollPosition', currentScroll.toString());
            

            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const imageIndex = images.indexOf(imgUrl);
            if (imageIndex !== -1) {

                openModal(imageIndex);
            } else {
                console.error('❌ 이미지를 images 배열에서 찾을 수 없습니다:', imgUrl);


                
                // 강화된 긴급 처치: 스크롤 위치 저장하고 모달 열기

                if (modal && modalImg) {
                    // 스크롤 위치 저장
                    savedScrollPosition = currentScroll;
                    
                    // 모달 열기
                    modal.style.display = 'block';
                    modalImg.src = imgUrl;
                    currentImageIndex = parseInt(item.getAttribute('data-gallery-index')) || 0;
                    
                    // 배경 스크롤 방지
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${savedScrollPosition}px`;
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    document.body.style.width = '100%';
                    

                }
            }
        };
        
        // PC 클릭 이벤트만 등록 (터치 디바이스 제외)
        if (!('ontouchstart' in window)) {
            // 데스크톱 환경에서만 클릭 이벤트 등록
            item.addEventListener('click', clickHandler, { capture: true, passive: false });
            item.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // 좌클릭만
                    setTimeout(() => clickHandler(e), 10);
                }
            });
        } else {
        }
        
        // 터치 이벤트 (모바일) - 스크롤과 클릭 구분
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isTouching = false;
        let hasMoved = false;
        
        item.addEventListener('touchstart', function(e) {

            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isTouching = true;
            hasMoved = false;
        }, { passive: true });
        
        item.addEventListener('touchmove', function(e) {
            if (!isTouching) return;
            
            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            const deltaX = Math.abs(touchCurrentX - touchStartX);
            const deltaY = Math.abs(touchCurrentY - touchStartY);
            
            // 10px 이상 움직이면 스크롤로 간주
            if (deltaX > 10 || deltaY > 10) {
                hasMoved = true;

            }
        }, { passive: true });
        
        item.addEventListener('touchend', function(e) {
            
            if (!isTouching) return;
            
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // 터치 조건 체크
            const isValidClick = !hasMoved && // 움직이지 않았고
                                touchDuration > 50 && // 50ms 이상 터치하고 
                                touchDuration < 800; // 800ms 미만 터치

            if (isValidClick) {
                e.preventDefault();
                clickHandler(e);
            } else {
            }
            
            // 터치 상태 초기화
            isTouching = false;
            hasMoved = false;
        });
        
        // 키보드 접근성
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler(e);
            }
        });
        

    });
    
    // 모달 배경 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {

                e.preventDefault();
                e.stopPropagation();
                
                setTimeout(() => {
                    closeModal();
                }, 10);
            }
        });
    }
    
    // 전역에서 접근할 수 있도록 인스턴스 저장
    window.galleryModalInstance = {
        setCurrentIndex: setCurrentIndex
    };
    
    // 키보드 이벤트
    document.addEventListener('keydown', (e) => {
        if (modal && modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':

                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                    break;
                case 'ArrowLeft':
                    showPrevious();
                    break;
                case 'ArrowRight':
                    showNext();
                    break;
            }
        }
    });
    
    // 모달 내 터치 스와이프 지원 (갤러리 이미지 전환)
    let modalTouchStartX = 0;
    let modalTouchEndX = 0;
    let modalTouchStartY = 0;
    let modalTouchEndY = 0;
    let modalTouchStartTime = 0;
    
    if (modal) {
        modal.addEventListener('touchstart', (e) => {
            modalTouchStartX = e.changedTouches[0].screenX;
            modalTouchStartY = e.changedTouches[0].screenY;
            modalTouchStartTime = Date.now();
        }, { passive: true });
        
        modal.addEventListener('touchend', (e) => {
            modalTouchEndX = e.changedTouches[0].screenX;
            modalTouchEndY = e.changedTouches[0].screenY;
            const touchTime = Date.now() - modalTouchStartTime;
            
            // 빠른 스와이프만 인식 (500ms 미만)
            if (touchTime < 500) {
                handleModalSwipe();
            }
        }, { passive: true });
    }
    
    function handleModalSwipe() {
        const swipeThreshold = 50;
        const diffX = modalTouchStartX - modalTouchEndX;
        const diffY = Math.abs(modalTouchStartY - modalTouchEndY);
        
        // 가로 스와이프가 세로 스와이프보다 2배 이상 클 때만 인식
        if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > diffY * 2) {
            if (diffX > 0) {

                showNext();
            } else {

                showPrevious();
            }
        }
    }
}

//=============================================
// Popup image functionality
$(".popImg .x_button").click(function () {
    $(".pageCover").removeClass("blur6");
    $(".popImg").removeClass("visible");
});

function openMapImg() {
    $(".pageCover").addClass("blur6");
    $(".popImg").addClass("visible");
}

// 전역 함수로 명시적 노출
window.openMapImg = openMapImg;

$(".popNoticeImg .x_button").click(function () {
    $(".pageCover").removeClass("blur6");
    $(".popNoticeImg").removeClass("visible");
});



//=============================================
// Swiper initialization for various containers
if (document.getElementById('roughMapContainer')) {
    var mySwiper = new Swiper('#roughMapContainer', {
        direction: '',
        loop: false,
        zoom: {
            maxRatio: 3,
            minRatio: 1
        },
    });
}

if (document.getElementById('popNoticeImgWrap')) {
    var popNoticeSwiper = new Swiper('#popNoticeImgWrap', {
        direction: '',
        loop: false,
        zoom: {
            maxRatio: 3,
            minRatio: 1
        },
    });
}

//=============================================
// Gallery 자동 초기화 - DOM이 로드되면 실행
$(document).ready(function() {
    
    // DOM 로드 완료 후 잠시 대기하여 모든 요소가 준비되도록 함
    setTimeout(() => {
        
        // 갤러리 아이템이 있는지 확인
        const galleryItems = document.querySelectorAll('.gallGridWrapper .item');
        
        if (typeof initGalleryModal === 'function') {
            initGalleryModal();
        }
    }, 500); // 시간을 500ms로 늘림
});