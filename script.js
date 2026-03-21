// Google Apps Script 배포 URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyVgkGi2qW2v_d9d2-99ufqE6PfeD5Csg7b8q0xSU6OlK7T89Ra8XzJe-Kb7CeUREoB/exec';
const DEFAULT_EXCHANGE_RATE = 46; // 기본값: 1 바트 = 46원

// 경비 데이터
let expenses = [];
let editingId = null; // 현재 수정 중인 항목 ID
let EXCHANGE_RATE = DEFAULT_EXCHANGE_RATE; // 동적 환율

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('여행 계획 페이지 로드됨!');
    
    // 페이지 로드 애니메이션
    animateOnScroll();
    
    // 현재까지 남은 일수 계산
    calculateDaysUntilTrip();
    
    // 저장된 경비 로드
    loadExpenses();
    
    // 실시간 환율 가져오기
    fetchExchangeRate();
    
    // 날짜 입력란 기본값을 오늘로 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    
    // 엔터키로 경비 추가
    document.getElementById('expenseAmount')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addExpense();
    });
});

// 스크롤 감지하여 요소 나타내기
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 모든 카드 요소 선택
    document.querySelectorAll('.info-card, .activity-card, .timeline-item, .note-box').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 여행까지 남은 일수 계산
function calculateDaysUntilTrip() {
    const tripDate = new Date('2026-06-12');
    const today = new Date();
    
    // 시간 초기화 (날짜만 비교)
    today.setHours(0, 0, 0, 0);
    tripDate.setHours(0, 0, 0, 0);
    
    const timeDiff = tripDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff > 0) {
        console.log(`여행까지 ${daysDiff}일 남았습니다! ✈️`);
    } else if (daysDiff === 0) {
        console.log('오늘이 출발일입니다! 즐거운 여행 되세요! 🌴');
    } else {
        console.log('여행이 진행 중입니다! 즐거운 시간 되세요! 🎉');
    }
}

// 부드러운 스크롤 링크 처리 (필요시)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 프린트 친화적 스타일
window.addEventListener('beforeprint', function() {
    document.body.style.background = 'white';
});

window.addEventListener('afterprint', function() {
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
});

// 활동 카드에 클릭 이벤트 추가
document.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', function() {
        this.style.transform = 'scale(1.05)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
    });
});

// 현재 페이지 로드 시간 출력
console.log('🌴 방콕 & 파타야 여행 계획 페이지');
console.log('📅 2026년 6월 12일 ~ 20일');
console.log('🎉 즐거운 여행 되세요!');

// ════════════════════════════════════
// 💰 경비 기록 함수
// ════════════════════════════════════

// 경비 추가 또는 수정 함수 (Google Sheet + 로컬 저장)
function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currencyType = document.getElementById('currencyType').value;
    const person = document.getElementById('expensePerson').value;

    if (!date || !name || !amount || amount <= 0) {
        alert('날짜, 항목명, 금액을 모두 입력해주세요.');
        return;
    }

    // 통화에 따라 바트와 원화 계산
    let baht, won;
    console.log(`DEBUG: currencyType=${currencyType}, amount=${amount}, EXCHANGE_RATE=${EXCHANGE_RATE}`);
    if (currencyType === 'baht') {
        // 바트 입력
        baht = amount;
        won = Math.round(amount * EXCHANGE_RATE);
        console.log(`DEBUG: 바트 입력 → baht=${baht}, won=${won}`);
    } else {
        // 원화 입력
        won = amount;
        baht = Math.round(amount / EXCHANGE_RATE);
        console.log(`DEBUG: 원화 입력 → baht=${baht}, won=${won}`);
    }

    if (editingId !== null) {
        // 수정 모드: 기존 항목 업데이트
        const index = expenses.findIndex(e => e.id === editingId);
        if (index !== -1) {
            expenses[index].date = date;
            expenses[index].description = name;
            expenses[index].baht = baht;
            expenses[index].won = won;
            expenses[index].person = person;
            console.log('✏️ 경비 수정됨:', expenses[index]);
        }
        editingId = null;
    } else {
        // 추가 모드: 새 항목 생성
        const expense = {
            id: Date.now(),
            date: date,
            description: name,
            baht: baht,
            won: won,
            person: person,
            timestamp: new Date().toLocaleString('ko-KR')
        };
        expenses.push(expense);
        console.log('✅ 경비 추가됨:', expense);
        sendToGoogleSheet(expense);
    }

    // 1. 로컬 저장
    saveExpenses();

    // 2. UI 업데이트
    updateExpenseTable();
    updateSummary();

    // 3. 입력창 초기화 및 버튼 복원
    resetForm();
}

// Google Apps Script로 데이터 전송
function sendToGoogleSheet(expense) {
    const payload = {
        description: expense.description,
        baht: expense.baht,
        won: expense.won,
        person: expense.person,
        date: expense.date
    };

    fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log('📊 Google Sheet에 저장됨:', payload);
    })
    .catch(error => {
        console.error('❌ Google Sheet 전송 실패:', error);
    });
}

// 경비 삭제 함수
function deleteExpense(id) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        updateExpenseTable();
        updateSummary();
        cancelEdit(); // 수정 중인데 삭제하면 폼 초기화
        console.log('🗑️ 경비 삭제됨:', id);
    }
}

// 경비 테이블 업데이트 (일별 그룹화)
function updateExpenseTable() {
    const tbody = document.getElementById('expenseTableBody');
    tbody.innerHTML = '';

    // 날짜별로 그룹화
    const grouped = {};
    expenses.forEach(expense => {
        if (!grouped[expense.date]) {
            grouped[expense.date] = [];
        }
        grouped[expense.date].push(expense);
    });

    // 날짜 순으로 정렬
    const sortedDates = Object.keys(grouped).sort();

    // 각 날짜별로 행 생성
    sortedDates.forEach(date => {
        const items = grouped[date];
        let dailyBaht = 0;
        let dailyKRW = 0;

        // 날짜 헤더 행
        const dateRow = tbody.insertRow();
        dateRow.style.backgroundColor = '#f3f4f6';
        dateRow.style.fontWeight = 'bold';
        const dateCell = dateRow.insertCell(0);
        dateCell.colSpan = 6;
        
        // 날짜를 읽기 좋게 포맷
        const dateObj = new Date(date + 'T00:00:00');
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[dateObj.getDay()];
        dateCell.textContent = `📅 ${date} (${dayName})`;

        // 해당 날짜의 항목들
        items.forEach(expense => {
            dailyBaht += expense.baht;
            dailyKRW += expense.won;
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>฿ ${expense.baht.toLocaleString()}</td>
                <td>₩ ${expense.won.toLocaleString()}</td>
                <td>${expense.person}</td>
                <td><button onclick="editExpense(${expense.id})" class="edit-btn">수정</button></td>
                <td><button onclick="deleteExpense(${expense.id})" class="delete-btn">삭제</button></td>
            `;
            if (editingId === expense.id) {
                row.style.backgroundColor = '#fff3cd';
            }
        });

        // 일계 행
        const subtotalRow = tbody.insertRow();
        subtotalRow.style.backgroundColor = '#e0e7ff';
        subtotalRow.style.fontWeight = 'bold';
        const subtotalCell = subtotalRow.insertCell(0);
        subtotalCell.colSpan = 6;
        subtotalCell.textContent = `▶ 일계: ฿ ${dailyBaht.toLocaleString()} (₩ ${dailyKRW.toLocaleString()})`;
    });

    // 데이터가 없을 경우
    if (sortedDates.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6;
        cell.textContent = '등록된 경비가 없습니다.';
        cell.style.textAlign = 'center';
        cell.style.color = '#999';
    }
}

// 경비 요약 업데이트
function updateSummary() {
    const totalBaht = expenses.reduce((sum, e) => sum + e.baht, 0);
    const totalKRW = expenses.reduce((sum, e) => sum + e.won, 0);

    document.getElementById('totalBaht').textContent = totalBaht.toLocaleString();
    document.getElementById('totalKRW').textContent = totalKRW.toLocaleString();

    console.log(`💰 총 지출: ${totalKRW.toLocaleString()}원`);
}

// localStorage에 저장
function saveExpenses() {
    localStorage.setItem('travelExpenses', JSON.stringify(expenses));
}

// localStorage에서 로드
function loadExpenses() {
    const saved = localStorage.getItem('travelExpenses');
    if (saved) {
        expenses = JSON.parse(saved);
        updateExpenseTable();
        updateSummary();
        console.log('📂 저장된 경비 로드됨:', expenses.length + '개');
    }
}

// ════════════════════════════════════
// 💱 실시간 환율 함수
// ════════════════════════════════════

// 실시간 환율 가져오기 (Open Exchange Rates API 사용)
function fetchExchangeRate() {
    // exchangerate-api.com 사용 (무료, 가입 불필요, CORS 지원)
    const apiUrl = 'https://api.exchangerate-api.com/v6/latest/THB';
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // KRW 환율 추출
            const rate = data.rates.KRW;
            EXCHANGE_RATE = Math.round(rate * 100) / 100; // 소수점 2자리로 반올림
            
            // UI 업데이트
            document.getElementById('exchangeRateValue').textContent = EXCHANGE_RATE.toFixed(2);
            
            // 마지막 업데이트 시간 표시
            const now = new Date();
            const timeStr = now.toLocaleString('ko-KR', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
            });
            document.getElementById('exchangeRateTime').textContent = `(${timeStr} 업데이트)`;
            
            // localStorage에 환율 저장
            localStorage.setItem('exchangeRate', EXCHANGE_RATE);
            localStorage.setItem('exchangeRateTime', now.toISOString());
            
            // 이미 입력된 금액 재계산
            updateExpenseTable();
            updateSummary();
            
            console.log(`💱 환율 업데이트: 1 THB = ${EXCHANGE_RATE} KRW`);
        })
        .catch(error => {
            console.error('❌ 환율 가져오기 실패:', error);
            
            // 실패 시 localStorage에서 저장된 환율 사용
            const savedRate = localStorage.getItem('exchangeRate');
            if (savedRate) {
                EXCHANGE_RATE = parseFloat(savedRate);
                document.getElementById('exchangeRateValue').textContent = EXCHANGE_RATE.toFixed(2);
                const savedTime = localStorage.getItem('exchangeRateTime');
                if (savedTime) {
                    const time = new Date(savedTime);
                    const timeStr = time.toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit'
                    });
                    document.getElementById('exchangeRateTime').textContent = `(${timeStr} 저장됨)`;
                }
                console.log(`💾 저장된 환율 사용: 1 THB = ${EXCHANGE_RATE} KRW`);
            } else {
                // 저장된 환율도 없으면 기본값 사용
                EXCHANGE_RATE = DEFAULT_EXCHANGE_RATE;
                document.getElementById('exchangeRateValue').textContent = EXCHANGE_RATE.toFixed(2);
                document.getElementById('exchangeRateTime').textContent = '(기본값)';
                console.log(`🔧 기본값 사용: 1 THB = ${EXCHANGE_RATE} KRW`);
            }
        });
}

// 환율 새로고침 함수 (버튼 클릭 시)
function refreshExchangeRate() {
    const btn = document.querySelector('.refresh-btn');
    btn.disabled = true;
    btn.textContent = '⏳ 업데이트 중...';
    
    fetchExchangeRate();
    
    // 2초 후 버튼 복원
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🔄 환율 새로고침';
    }, 2000);
}

// 수정 모드 시작
function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // 폼에 데이터 채우기
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseName').value = expense.description;
    document.getElementById('expenseAmount').value = expense.baht;
    document.getElementById('expensePerson').value = expense.person;

    // 수정 모드 표시
    editingId = id;
    document.getElementById('submitBtn').textContent = '수정하기';
    document.getElementById('submitBtn').style.backgroundColor = '#ec4899';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    // 테이블 업데이트 (수정 행 하이라이트)
    updateExpenseTable();

    // 폼 위치로 스크롤
    document.getElementById('expenseDate').focus();

    console.log('✏️ 수정 모드:', expense);
}

// 수정 취소
function cancelEdit() {
    editingId = null;
    resetForm();
}

// 폼 초기화 및 버튼 복원
function resetForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('currencyType').value = 'won';
    document.getElementById('expensePerson').value = '상우';
    document.getElementById('submitBtn').textContent = '추가하기';
    document.getElementById('submitBtn').style.backgroundColor = '';
    document.getElementById('cancelBtn').style.display = 'none';
    editingId = null;
    updateExpenseTable();
    document.getElementById('expenseName').focus();
}
