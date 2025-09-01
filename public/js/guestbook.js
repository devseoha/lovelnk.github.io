// Guestbook functionality

//=============================================
// Navigation app functionality
function openNavigationApp(appType) {
    // 강동웨딩 KDW 정보
    const name = '강동웨딩 KDW';
    const address = '서울 강동구 천호대로 1073';
    const lat = 37.5350565;  // 위도
    const lng = 127.1339205; // 경도
    
    let url = "";
    
    switch(appType) {
        case 'naverMap':
            // 네이버지도 URL 스킴
            url = `nmap://search?query=${encodeURIComponent(address)}&appname=com.example.myapp`;
            // 웹 백업 URL
            const naverWebUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
            break;
            
        case 'tmap':
            // 티맵 URL 스킴
            url = `tmap://search?name=${encodeURIComponent(name)}&lon=${lng}&lat=${lat}`;
            // 웹 백업 URL
            const tmapWebUrl = `https://apis.openapi.sk.com/tmap/app/routes/navigation?startName=현재위치&goalName=${encodeURIComponent(name)}&goalX=${lng}&goalY=${lat}`;
            break;
            
        case 'kakaoNavi':
            // 카카오내비 URL 스킴
            url = `kakaonavi://navigate?coord_type=wgs84&ep=${lng},${lat}&destination=${encodeURIComponent(name)}`;
            // 웹 백업 URL  
            const kakaoWebUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
            break;
    }
    
    // URL 스킴으로 앱 실행 시도
    if (url) {
        window.location.href = url;
        
        // 앱이 설치되지 않은 경우 웹 버전으로 리다이렉트
        setTimeout(() => {
            switch(appType) {
                case 'naverMap':
                    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(address)}`, '_blank');
                    break;
                case 'tmap':
                    window.open(`https://www.tmap.co.kr`, '_blank');
                    break;
                case 'kakaoNavi':
                    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`, '_blank');
                    break;
            }
        }, 1500);
    }
}

//=============================================
// Guestbook functionality

// Initialize guestbook animations and data
$(document).ready(function () {
    $('.anibox_books').addClass("hd").viewportChecker({
        classToAdd: 'visible animated faster fadeInUp',
        offset: 100
    });
    
    // Firebase가 로드될 때까지 잠시 대기 후 초기화
    setTimeout(() => {
        // 방명록 미리보기 렌더링
        renderGuestbookPreview();
        
        // 방명록 전체보기가 있다면 렌더링
        if (document.querySelector("#guestbook-grid")) {
            renderGuestbook();
        }
    }, 1000);
});

// Global variables
let gubook_write_sctop = 0;

// Firebase 사용 여부 확인
function isFirebaseAvailable() {
    return window.firebaseDB && window.firebaseDB.database;
}

// 방명록 데이터 가져오기 (Firebase 또는 로컬스토리지)
function getGuestbookData(callback) {
    if (isFirebaseAvailable()) {
        // Firebase에서 데이터 가져오기
        const { database, ref, onValue } = window.firebaseDB;
        const guestbookRef = ref(database, 'guestbook');
        
        onValue(guestbookRef, (snapshot) => {
            const data = snapshot.val();
            const guestbookArray = data ? Object.keys(data).map(key => ({
                firebaseKey: key,
                ...data[key]
            })) : [];
            callback(guestbookArray);
        }, {
            onlyOnce: true
        });
    } else {
        // 로컬스토리지에서 데이터 가져오기 (백업)
        console.warn('Firebase 사용 불가, 로컬스토리지 사용');
        const data = localStorage.getItem("guestbook");
        callback(data ? JSON.parse(data) : []);
    }
}

// 방명록 데이터 저장 (Firebase 또는 로컬스토리지)
function saveGuestbookEntry(name, password, note, callback) {
    const newEntry = {
        id: Date.now(),
        name,
        password,
        note,
        date: new Date().toLocaleString()
    };

    if (isFirebaseAvailable()) {
        // Firebase에 저장
        const { database, ref, push } = window.firebaseDB;
        const guestbookRef = ref(database, 'guestbook');
        
        push(guestbookRef, newEntry)
            .then((result) => {
                newEntry.firebaseKey = result.key;
                callback(newEntry);
            })
            .catch((error) => {
                console.error('Firebase 저장 실패:', error);
                // 로컬스토리지에 백업 저장
                saveToLocalStorage(newEntry);
                callback(newEntry);
            });
    } else {
        // 로컬스토리지에 저장 (백업)
        console.warn('Firebase 사용 불가, 로컬스토리지 사용');
        saveToLocalStorage(newEntry);
        callback(newEntry);
    }
}

// 로컬스토리지 백업 저장
function saveToLocalStorage(newEntry) {
    const data = JSON.parse(localStorage.getItem("guestbook") || "[]");
    data.push(newEntry);
    localStorage.setItem("guestbook", JSON.stringify(data));
}

// 방명록 작성
function addGuestbookEntry(name, password, note) {
    saveGuestbookEntry(name, password, note, (newEntry) => {
        renderGuestbookPreview(); // 미리보기 업데이트
        renderGuestbook();
    });
}

// 수정 모드를 위한 전역 변수
let editMode = {
    isEditing: false,
    entryId: null,
    password: null,
    firebaseKey: null
};

function startEditGuestbookEntry(id, password) {
    getGuestbookData((data) => {
        const entry = data.find(item => item.id == id);
        if (entry && entry.password === password) {
            // 수정 모드 활성화
            editMode.isEditing = true;
            editMode.entryId = id;
            editMode.password = password;
            editMode.firebaseKey = entry.firebaseKey; // Firebase 키도 저장
            
            // 방명록 작성 팝업 열기
            const popup = document.getElementById("gustbk_op");
            if (popup) {
                popup.style.display = "block";
                
                // 기존 내용으로 채우기
                const nameInput = popup.querySelector("input[name='name']");
                const passwordInput = popup.querySelector("input[name='password']");
                const noteTextarea = popup.querySelector("textarea[name='note']");
                
                if (nameInput) nameInput.value = entry.name;
                if (passwordInput) passwordInput.value = entry.password;
                if (noteTextarea) noteTextarea.value = entry.note;
                
                // 제목 변경
                const title = popup.querySelector(".pop_tit");
                if (title) title.textContent = "축하글 수정";
            }
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    });
}

function editGuestbookEntry(id, password, newName, newNote) {
    if (isFirebaseAvailable() && editMode.firebaseKey) {
        // Firebase에서 수정
        const { database, ref, update } = window.firebaseDB;
        const entryRef = ref(database, `guestbook/${editMode.firebaseKey}`);
        
        const updates = {
            name: newName,
            note: newNote,
            date: new Date().toLocaleString()
        };
        
        update(entryRef, updates)
            .then(() => {
                renderGuestbook();
                renderGuestbookPreview(); // 미리보기도 업데이트
            })
            .catch((error) => {
                console.error('Firebase 수정 실패:', error);
                alert('수정에 실패했습니다.');
            });
    } else {
        // 로컬스토리지에서 수정 (백업)
        const data = JSON.parse(localStorage.getItem("guestbook") || "[]");
        const entryIndex = data.findIndex(item => item.id == id);
        
        if (entryIndex !== -1 && data[entryIndex].password === password) {
            data[entryIndex].name = newName;
            data[entryIndex].note = newNote;
            data[entryIndex].date = new Date().toLocaleString();
            localStorage.setItem("guestbook", JSON.stringify(data));
            renderGuestbook();
            renderGuestbookPreview();
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    }
}

// 방명록 삭제
function deleteGuestbookEntry(id, password) {
    getGuestbookData((data) => {
        const entry = data.find(item => item.id == id);
        if (entry && entry.password === password) {
            if (isFirebaseAvailable() && entry.firebaseKey) {
                // Firebase에서 삭제
                const { database, ref, remove } = window.firebaseDB;
                const entryRef = ref(database, `guestbook/${entry.firebaseKey}`);
                
                remove(entryRef)
                    .then(() => {
                        renderGuestbook();
                        renderGuestbookPreview(); // 미리보기도 업데이트
                    })
                    .catch((error) => {
                        console.error('Firebase 삭제 실패:', error);
                        alert('삭제에 실패했습니다.');
                    });
            } else {
                // 로컬스토리지에서 삭제
                const localData = JSON.parse(localStorage.getItem("guestbook") || "[]");
                const filteredData = localData.filter(item => item.id != id);
                localStorage.setItem("guestbook", JSON.stringify(filteredData));
                
                renderGuestbook();
                renderGuestbookPreview(); // 미리보기도 업데이트
            }
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    });
}

// 방명록 미리보기 렌더링 (최대 2개)
function renderGuestbookPreview() {
    getGuestbookData((data) => {
        const sortedData = data.sort((a, b) => b.id - a.id); // 최신순 정렬 (DESC)
        const previewGrid = document.querySelector("#guestbook-preview-grid");
        if (!previewGrid) return;
        
        previewGrid.innerHTML = "";
        
        if (sortedData.length === 0) {
            // 방명록이 없으면 "없습니다" 메시지 표시
            previewGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #6c757d; font-size: 14px;">작성된 축하글이 없습니다.<br>첫 번째 축하글을 남겨보세요! 💝</div>';
            const previewContainer = document.getElementById('guestbook-preview-container');
            previewContainer.style.display = 'block';
            return;
        }
        
        // 최대 2개만 표시
        const previewData = sortedData.slice(0, 2);
        previewData.forEach(item => {
            const card = document.createElement("div");
            card.innerHTML = createGuestbookCardHTML(item);
            previewGrid.appendChild(card);
        });
        
        // 미리보기 컨테이너 표시
        const previewContainer = document.getElementById('guestbook-preview-container');
        previewContainer.style.display = 'block';
    });
}

// 텍스트 자르기 함수 (기본: 미리보기용)
function truncateText(text, maxLength = 75) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 전체보기용 텍스트 자르기 함수
function truncateTextForFullview(text, maxLength = 130) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 방명록 카드 HTML 생성
function createGuestbookCardHTML(item) {
    return `
        <div class="guest-card" data-id="${item.id}" style="
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-weight: 600; color: #333; font-size: 16px;">${item.name}</div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editGuestbook(${item.id})" style="
                        background: none; border: none; color: #999; font-size: 12px; 
                        cursor: pointer; padding: 4px 8px; border-radius: 4px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor=''">수정</button>
                    <button onclick="deleteGuestbook(${item.id})" style="
                        background: none; border: none; color: #999; font-size: 12px; 
                        cursor: pointer; padding: 4px 8px; border-radius: 4px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.backgroundColor='#ffebee'; this.style.color='#f44336'" onmouseout="this.style.backgroundColor=''; this.style.color='#999'">삭제</button>
                </div>
            </div>
            <div style="color: #555; line-height: 1.6; font-size: 14px; margin-bottom: 12px; white-space: pre-wrap;">${truncateText(item.note)}</div>
            <div style="color: #999; font-size: 12px; text-align: right;">${item.date}</div>
        </div>
    `;
}

// 방명록 렌더링
function renderGuestbook() {
    getGuestbookData((data) => {
        const sortedData = data.sort((a, b) => b.id - a.id); // 최신순 정렬 (DESC)
        const grid = document.querySelector("#guestbook-grid");
        if (!grid) return; // 그리드 요소가 없으면 종료
        
        grid.innerHTML = "";

        if (sortedData.length === 0) {
            // 방명록이 없을 때 카드 형태로 표시
            const emptyCard = document.createElement("div");
            emptyCard.style.gridColumn = "1 / -1"; // 전체 열 차지
            emptyCard.innerHTML = `
                <div style="background: #f8f8f8; text-align: center; padding: 40px 20px; border-radius: 10px;">
                    <span style="color: #999; font-size: 14px;">방명록이 없습니다.</span>
                </div>
            `;
            grid.appendChild(emptyCard);
        } else {
            sortedData.forEach(item => {
                const card = document.createElement("div");
                card.innerHTML = createGuestbookCardHTML(item);
                grid.appendChild(card);
            });
        }
    });
}

// 방명록 편집 및 삭제를 위한 헬퍼 함수들
function editGuestbook(id) {
    const password = prompt("수정할 비밀번호를 입력하세요:");
    if (password) {
        startEditGuestbookEntry(id, password);
    }
}

function deleteGuestbook(id) {
    const password = prompt("삭제할 비밀번호를 입력하세요:");
    if (password) {
        if (confirm("정말 삭제하시겠습니까?")) {
            deleteGuestbookEntry(id, password);
        }
    }
}

// Make functions globally available
window.openNavigationApp = openNavigationApp;
window.addGuestbookEntry = addGuestbookEntry;
window.deleteGuestbookEntry = deleteGuestbookEntry;
window.startEditGuestbookEntry = startEditGuestbookEntry;
window.renderGuestbookPreview = renderGuestbookPreview;
window.renderGuestbook = renderGuestbook;
window.createGuestbookCardHTML = createGuestbookCardHTML;
window.editGuestbook = editGuestbook;
window.deleteGuestbook = deleteGuestbook;