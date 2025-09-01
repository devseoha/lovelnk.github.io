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
    
    // 모든 갤러리 아이템 수집 및 lazy loading 구현
    const galleryItems = document.querySelectorAll('.gallGridWrapper .item');
    galleryItems.forEach((item, index) => {
        const imgUrl = item.getAttribute('data-url') || item.style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)?.[1];
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
    
    function openModal(index) {
        currentImageIndex = index;
        updateModal();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 배경 스크롤 복원
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
        // window.currentGalleryIndex와 동기화
        window.currentGalleryIndex = currentImageIndex;
        updateModal();
        updateGalleryCounter();
    }
    
    function showNext() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        // window.currentGalleryIndex와 동기화
        window.currentGalleryIndex = currentImageIndex;
        updateModal();
        updateGalleryCounter();
    }
    
    // 이벤트 리스너들
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (prevBtn) prevBtn.addEventListener('click', showPrevious);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    
    // 모달 배경 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
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
// Gallery grid click handler
$(".gallGridWrapper .item").click(function () {
    // 디테일 모달에는 data-url의 큰 이미지 사용
    const detailImgUrl = $(this).attr('data-url');
    if (detailImgUrl) {
        console.log('디테일 모달 열기:', detailImgUrl);
        openGalleryModal(detailImgUrl);
    }
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