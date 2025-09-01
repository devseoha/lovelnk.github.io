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
    console.log('🎯 Gallery.js - initGalleryModal 함수 시작');
    
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const closeBtn = document.querySelector('.gallery-modal-close');
    const prevBtn = document.querySelector('.gallery-modal-prev');
    const nextBtn = document.querySelector('.gallery-modal-next');
    const currentSpan = document.getElementById('gallery-current');
    const totalSpan = document.getElementById('gallery-total');
    
    console.log('🔍 모달 요소들:', { modal, modalImg, closeBtn, prevBtn, nextBtn });
    
    let currentImageIndex = 0;
    let images = [];
    let savedScrollPosition = 0; // 스크롤 위치 저장용 변수 추가
    let isModalOpen = false; // 모달 상태 추적
    let scrollBackupPosition = 0; // 백업 스크롤 위치
    
    // 모든 갤러리 아이템 수집 및 lazy loading 구현
    const galleryItems = document.querySelectorAll('.gallGridWrapper .item');
    console.log('📸 갤러리 아이템 개수:', galleryItems.length);
    
    // 각 갤러리 아이템에 고유 인덱스 부여 및 이미지 URL 수집
    galleryItems.forEach((item, index) => {
        const imgUrl = item.getAttribute('data-url') || item.style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)?.[1];
        
        // 모든 아이템에 대해 인덱스 저장 (이미지 URL이 없어도)
        item.setAttribute('data-gallery-index', index);
        
        if (imgUrl) {
            images.push(imgUrl);
            console.log(`📷 이미지 ${index + 1} 수집됨:`, imgUrl);
            
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
        
        // 스크롤 위치가 이미 저장되어 있지 않으면 여기서 저장
        if (savedScrollPosition === 0) {
            savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            console.log('🔖 openModal에서 스크롤 위치 저장:', savedScrollPosition, 'px');
        } else {
            console.log('🔖 이미 저장된 스크롤 위치 사용:', savedScrollPosition, 'px');
        }
        
        // 추가 체크: 스크롤 위치가 유효한지 확인
        if (savedScrollPosition < 0) savedScrollPosition = 0;
        
        // 모달 표시 및 스크롤 방지
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollPosition}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        
        console.log('모달 열림, 현재 이미지:', currentImageIndex + 1, '/', images.length);
    }
    
    function closeModal() {
        console.log('🚪 모달 닫기 시작, 복원할 스크롤 위치:', savedScrollPosition);
        
        modal.style.display = 'none';
        
        // body 스타일 완전 제거 (더 안전한 방법)
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        
        // 강력한 스크롤 위치 복원 (다단계 방법)
        console.log('🔄 스크롤 복원 시작, 목표 위치:', savedScrollPosition, 'px');
        
        // 1단계: 즉시 복원
        if (window.scrollTo) {
            try {
                window.scrollTo({
                    top: savedScrollPosition,
                    left: 0,
                    behavior: 'instant'
                });
                console.log('✅ 1단계 스크롤 복원 완료');
            } catch (e) {
                console.log('⚠️ 1단계 실패, 백업 방법 사용');
                window.scrollTo(0, savedScrollPosition);
            }
        }
        
        // 2단계: 여러 방법으로 재시도 (10ms 후)
        setTimeout(() => {
            const currentPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (Math.abs(currentPos - savedScrollPosition) > 5) { // 5px 이상 차이나면 재시도
                console.log('📍 2단계 백업 스크롤 복원 실행, 현재:', currentPos, '목표:', savedScrollPosition);
                
                // 여러 방법으로 시도
                window.scrollTo(0, savedScrollPosition);
                document.documentElement.scrollTop = savedScrollPosition;
                document.body.scrollTop = savedScrollPosition;
                
                // requestAnimationFrame을 사용한 최종 시도
                requestAnimationFrame(() => {
                    window.scrollTo(0, savedScrollPosition);
                });
            }
        }, 10);
        
        // 3단계: 최종 확인 (100ms 후)
        setTimeout(() => {
            const finalPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            console.log('🎯 최종 스크롤 위치:', finalPos, 'px (목표:', savedScrollPosition, 'px)');
            if (Math.abs(finalPos - savedScrollPosition) > 5) {
                console.log('⚠️ 최종 강제 스크롤 복원');
                window.scrollTo(0, savedScrollPosition);
            }
        }, 100);
        
        // 4단계: X 버튼 클릭의 경우 추가 복원 (200ms 후)
        setTimeout(() => {
            const veryFinalPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (Math.abs(veryFinalPos - savedScrollPosition) > 10) {
                console.log('🔧 X 버튼용 추가 스크롤 복원:', veryFinalPos, '->', savedScrollPosition);
                
                // 모든 가능한 방법으로 스크롤 복원
                try {
                    window.scrollTo({ top: savedScrollPosition, behavior: 'auto' });
                } catch (e) {
                    window.scrollTo(0, savedScrollPosition);
                }
                
                // 강제 스크롤 설정
                document.documentElement.scrollTop = savedScrollPosition;
                document.body.scrollTop = savedScrollPosition;
                
                // 최종 강제 시도
                requestAnimationFrame(() => {
                    window.scrollTo(0, savedScrollPosition);
                    document.documentElement.scrollTop = savedScrollPosition;
                });
            }
        }, 200);
        
        console.log('✅ 모달 닫힘, 스크롤 위치 복원 완료');
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
            console.log('❌ X 버튼 클릭됨, 현재 저장된 스크롤 위치:', savedScrollPosition);
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
        
        console.log(`🖼️ 갤러리 아이템 ${index + 1}: ${imgUrl}`);
        
        if (!imgUrl) {
            console.error(`❌ 아이템 ${index + 1}에 이미지 URL이 없습니다:`, item);
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
            console.log('🖱️ 클릭 이벤트 발생! 아이템:', index + 1);
            console.log('📷 클릭된 이미지 URL:', imgUrl);
            
            // 현재 스크롤 위치를 클릭 시점에 미리 저장 (더 안전함)
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            console.log('🔖 클릭 시점 스크롤 위치 저장:', currentScroll, 'px');
            savedScrollPosition = currentScroll;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const imageIndex = images.indexOf(imgUrl);
            if (imageIndex !== -1) {
                console.log('✅ 모달 열기, 인덱스:', imageIndex, '/ 저장된 스크롤:', savedScrollPosition);
                openModal(imageIndex);
            } else {
                console.error('❌ 이미지를 images 배열에서 찾을 수 없습니다:', imgUrl);
                console.log('🔍 전체 이미지 목록:', images);
                console.log('🔍 클릭된 아이템의 갤러리 인덱스:', item.getAttribute('data-gallery-index'));
                
                // 강화된 긴급 처치: 스크롤 위치 저장하고 모달 열기
                console.log('🚑 긴급 처치: 스크롤 위치 저장 후 직접 모달 열기');
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
                    
                    console.log('🚑 긴급 처치 완료, 저장된 스크롤:', savedScrollPosition);
                }
            }
        };
        
        // 다양한 방법으로 클릭 이벤트 등록 (브라우저 호환성)
        item.addEventListener('click', clickHandler, { capture: true, passive: false });
        item.addEventListener('mousedown', function(e) {
            if (e.button === 0) { // 좌클릭만
                setTimeout(() => clickHandler(e), 10);
            }
        });
        
        // 터치 이벤트 (모바일)
        item.addEventListener('touchstart', function(e) {
            console.log('👆 터치 시작!');
        });
        item.addEventListener('touchend', function(e) {
            console.log('👆 터치 끝!');
            e.preventDefault();
            clickHandler(e);
        });
        
        // 키보드 접근성
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler(e);
            }
        });
        
        console.log(`✅ 아이템 ${index + 1} 모든 이벤트 등록 완료`);
    });
    
    // 모달 배경 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('🎯 배경 클릭됨, 현재 저장된 스크롤 위치:', savedScrollPosition);
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
                    console.log('⌨️ ESC 키 눌림, 현재 저장된 스크롤 위치:', savedScrollPosition);
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
    
    // 터치 스와이프 지원
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (modal) {
        modal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        modal.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                showNext(); // 오른쪽 스와이프 -> 다음 이미지
            } else {
                showPrevious(); // 왼쪽 스와이프 -> 이전 이미지
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
    console.log('📱 Gallery.js - DOM ready 이벤트 발생');
    console.log('🔍 Gallery.js - initGalleryModal 함수 존재 여부:', typeof initGalleryModal);
    
    // DOM 로드 완료 후 잠시 대기하여 모든 요소가 준비되도록 함
    setTimeout(() => {
        console.log('⏰ Gallery.js - 지연 후 initGalleryModal 호출');
        if (typeof initGalleryModal === 'function') {
            initGalleryModal();
        } else {
            console.error('❌ initGalleryModal 함수를 찾을 수 없습니다');
        }
    }, 100);
});