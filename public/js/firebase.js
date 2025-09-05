// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getDatabase, ref, push, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBhnySmBEAC6aHvs8mYQgUWuVB1rYaM3_k",
    authDomain: "summers-loveink.firebaseapp.com",
    databaseURL: "https://summers-loveink-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "summers-loveink",
    storageBucket: "summers-loveink.firebasestorage.app",
    messagingSenderId: "432612614223",
    appId: "1:432612614223:web:bfb0a5b10d4ba4c593ca3a"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 전역으로 Firebase 함수들 노출
window.firebaseDB = {
    database,
    ref,
    push,
    onValue,
    remove,
    update
};

// Firebase 참석 데이터 저장 함수
window.saveAttendanceToFirebase = function(attendanceData) {
    try {
        const attendanceRef = ref(database, 'attendance');
        const newAttendance = {
            ...attendanceData,
            timestamp_utc: new Date().toISOString(),
            timestamp_kst: new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString(),
            created_at: Date.now()
        };
        
        push(attendanceRef, newAttendance)
            .then((result) => {
                alert('참석 의사가 전달되었습니다.\n감사합니다! 💝');
            })
            .catch((error) => {
                alert('참석 정보 저장에 실패했습니다. 다시 시도해주세요.');
            });
    } catch (error) {
        alert('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
    }
};

// Firebase 방문자 데이터 저장 함수
window.saveVisitorToFirebase = function(visitorData) {
    try {
        const visitorRef = ref(database, 'visitors');
        const newVisitor = {
            ...visitorData,
            timestamp_utc: new Date().toISOString(),
            timestamp_kst: new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString(),
            created_at: Date.now()
        };
        
        push(visitorRef, newVisitor)
            .then(() => {
                // 성공적으로 저장됨
            })
            .catch(() => {
                // 저장 실패
            });
    } catch (error) {
        // 오류 발생
    }
};

// 관리자용 데이터 조회 함수들 (콘솔에서 사용 가능)
window.getAttendanceData = function() {
    const attendanceRef = ref(database, 'attendance');
    onValue(attendanceRef, (snapshot) => {
        const data = snapshot.val();
        console.log('📊 참석 정보 데이터:', data);
        if (data) {
            const entries = Object.entries(data).map(([key, value]) => ({
                id: key,
                ...value
            }));
            console.table(entries);
        } else {
            console.log('참석 정보가 없습니다.');
        }
    });
};

window.getVisitorData = function() {
    const visitorRef = ref(database, 'visitors');
    onValue(visitorRef, (snapshot) => {
        const data = snapshot.val();
        console.log('👥 방문자 데이터:', data);
        if (data) {
            const entries = Object.entries(data).map(([key, value]) => ({
                id: key,
                ...value
            }));
            console.table(entries);
        } else {
            console.log('방문자 데이터가 없습니다.');
        }
    });
};

// 페이지 로드 완료 후 관리자 함수 안내
window.addEventListener('load', () => {
    console.log('🔧 관리자 명령어:');
    console.log('- getAttendanceData(): 참석 정보 조회');
    console.log('- getVisitorData(): 방문자 데이터 조회');
});