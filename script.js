// Google Apps Script 배포 URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxgIhFAHyLYHjiZ6YsZJlrNy1bE5PJhPEUuMKSBYNEQq9afQl7Wd_uPSFnnm1v_yAFA/exec';
const DEFAULT_EXCHANGE_RATE = 46; // 기본값: 1 바트 = 46원

// 경비 데이터
let expenses = [];
let editingId = null; // 현재 수정 중인 항목 ID
let EXCHANGE_RATE = DEFAULT_EXCHANGE_RATE; // 동적 환율

// ════════════════════════════════════
// 🔄 구글시트와 동기화 (뛰어난 기기 간 동기화)
// ════════════════════════════════════

// 구글시트의 모든 데이터 가져오기
function syncFromGoogleSheet() {
    console.log('🔄 구글시트 데이터 동기화 시작...');
    
    fetch(GOOGLE_SHEETS_URL + '?action=getAll')
        .then(response => {
            if (!response.ok) {
                console.log('⚠️ 구글시트 동기화 불가 (GET 미지원)');
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data)) {
                // 각 항목에 고유 id 부여 (timestamp+description+date) + 숫자 타입 변환 + 날짜 정규화
                expenses = data.map(item => ({
                    ...item,
                    id: item.timestamp ? `${item.timestamp}_${item.description}_${item.date}` : `${item.description}_${item.date}`,
                    baht: Number(item.baht) || 0,
                    won: Number(item.won) || 0,
                    date: normalizeDate(item.date)
                }));
                console.log(`✅ 구글시트에서 ${expenses.length}개 데이터 로드됨`);
                console.log('📊 데이터 샘플:', expenses[0]);
                updateExpenseTable();
                updateSummary();
                saveExpenses(); // 💾 동기화된 데이터를 localStorage에도 저장하여 삭제 항목이 복구되지 않도록 방지
            }
        })
        .catch(error => {
            console.log('⚠️ 구글시트 동기화 실패:', error.message);
        });
}

// ════════════════════════════════════
// 🔄 구글시트에서 데이터 완전 새로고침 (버튼 클릭)
// ════════════════════════════════════
function loadDataFromGoogleSheet() {
    console.log('🔄 구글시트 데이터 완전 새로고침 시작...');
    
    // 버튼 비활성화
    const btn = event?.target;
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.textContent = '⏳ 로딩중...';
    }
    
    fetch(GOOGLE_SHEETS_URL + '?action=getAll')
        .then(response => {
            if (!response.ok) {
                throw new Error('구글시트 조회 실패');
            }
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data)) {
                // 각 항목에 고유 id 부여 (timestamp+description+date) + 숫자 타입 변환 + 날짜 정규화
                expenses = data.map(item => ({
                    ...item,
                    id: item.timestamp ? `${item.timestamp}_${item.description}_${item.date}` : `${item.description}_${item.date}`,
                    baht: Number(item.baht) || 0,
                    won: Number(item.won) || 0,
                    date: normalizeDate(item.date)
                }));
                saveExpenses();
                
                console.log(`✅ 구글시트에서 ${expenses.length}개 데이터 로드됨`);
                console.log('📊 새로운 데이터:', expenses[0]);
                
                updateExpenseTable();
                updateSummary();
                alert(`✅ 성공! ${expenses.length}개 항목이 동기화되었습니다.`);
            } else {
                alert('⚠️ 구글시트에 데이터가 없습니다.');
            }
        })
        .catch(error => {
            console.error('❌ 동기화 오류:', error);
            alert('❌ 동기화 실패: ' + error.message);
        })
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = '🔄 데이터 동기화';
            }
        });
}

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('여행 계획 페이지 로드됨!');
    console.log(`⚙️ 초기 EXCHANGE_RATE=${EXCHANGE_RATE}`);
    
    // 💥 통화 선택 강제 설정 (기본값: 원화)
    const currencySelect = document.getElementById('currencyType');
    if (currencySelect) {
        currencySelect.value = 'won';
        console.log(`🔧 currencyType 강제 설정: won`);
    }
    
    // 페이지 로드 애니메이션
    animateOnScroll();
    
    // 현재까지 남은 일수 계산
    calculateDaysUntilTrip();
    
    // 저장된 경비 로드
    loadExpenses();
    
    // 🔄 구글시트와 동기화 시도 (다른 기기의 데이터 받기)
    // ⏱️ 4초 대기: Google Apps Script 서버의 DELETE 처리 완료 대기
    setTimeout(() => {
        syncFromGoogleSheet();
    }, 4000);
    
    // 실시간 환율 가져오기
    fetchExchangeRate();
    setTimeout(() => {
        console.log(`⏱️ 500ms 후 EXCHANGE_RATE=${EXCHANGE_RATE}`);
    }, 500);
    
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

// 날짜 정규화 함수 (ISO 형식 → YYYY-MM-DD)
function normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // 문자열인 경우
    if (typeof dateStr === 'string') {
        // ISO 형식 (2026-03-21T10:24:39.000Z) 처리
        if (dateStr.includes('T')) {
            return dateStr.substring(0, 10);
        }
        // 이미 YYYY-MM-DD 형식이면 그대로 반환
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
    }
    
    return new Date().toISOString().split('T')[0];
}

// 날짜에 요일 추가 (2026-03-21 → 2026-03-21 (토))
// Zeller's congruence로 순수 수학 계산 (타임존 문제 회피)
function formatDateWithDay(dateStr) {
    try {
        let normalized = normalizeDate(dateStr);
        let [year, month, day] = normalized.split('-').map(Number);
        
        // Zeller's congruence 알고리즘 (Date 객체 없이 순수 수학으로 요일 계산)
        let m = month;
        let y = year;
        
        // 1월, 2월은 이전 연도의 13월, 14월로 처리
        if (m < 3) {
            m += 12;
            y -= 1;
        }
        
        const q = day;
        const K = y % 100;
        const J = Math.floor(y / 100);
        
        // h: 0=Saturday, 1=Sunday, 2=Monday, ..., 6=Friday
        const h = (q + Math.floor(13 * (m + 1) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) - 2 * J) % 7;
        
        // Zeller의 0=Saturday를 우리의 0=Sunday 기준으로 변환
        const dayIndex = (h + 6) % 7;
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[dayIndex];
        
        return `${normalized} (${dayName})`;
    } catch (e) {
        console.error('날짜 포맷팅 오류:', dateStr, e);
        return normalizeDate(dateStr);
    }
}

// 경비 추가 또는 수정 함수 (Google Sheet + 로컬 저장)
function addExpense() {
    let date = document.getElementById('expenseDate').value;
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currencyTypeSelect = document.getElementById('currencyType');
    const currencyType = currencyTypeSelect ? currencyTypeSelect.value : 'won';
    const person = document.getElementById('expensePerson').value;
    
    if (!date || !name || !amount || amount <= 0) {
        alert('날짜, 항목명, 금액을 모두 입력해주세요.');
        return;
    }
    
    // 📌 date 정규화 (YYYY-MM-DD 형식 보장)
    date = normalizeDate(date);

    // 통화에 따라 바트와 원화 계산
    let baht, won;
    
    console.log(`\n========== 💰 경비 추가 시작 ==========`);
    console.log(`📝 입력: 금액 ${amount}, 통화 선택: ${currencyType}`);
    console.log(`💱 환율: 1 THB = ${EXCHANGE_RATE} KRW`);
    
    if (currencyType === 'won') {
        // 원화 입력: 원화 → 바트
        won = amount;
        baht = Math.round(amount / EXCHANGE_RATE);
        console.log(`✅ 원화 입력 → ${amount}원 = ${baht}바트`);
    } else {
        // 바트 입력: 바트 → 원화
        baht = amount;
        won = Math.round(amount * EXCHANGE_RATE);
        console.log(`✅ 바트 입력 → ${amount}바트 = ${won}원`);
    }
    
    console.log(`📊 저장될 값: baht=${baht}, won=${won}`);
    console.log(`========================================\n`);

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
        const now = new Date();
        const timestamp = now.toLocaleString('ko-KR');
        const expense = {
            id: `${timestamp}_${name}_${date}`,
            date: date,
            description: name,
            baht: baht,
            won: won,
            person: person,
            timestamp: timestamp
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
function deleteExpense(btn) {
    const id = btn.getAttribute('data-id');
    
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        const deletedExpense = expenses.find(e => e.id === id);
        
        console.log('🗑️ 삭제 대상:', deletedExpense);
        
        // 1️⃣ 로컬에서 삭제
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        updateExpenseTable();
        updateSummary();
        cancelEdit();
        
        // 2️⃣ 구글시트에서도 삭제 시도
        if (deletedExpense && deletedExpense.timestamp) {
            console.log('📤 구글시트 삭제 요청 전송:', {
                action: 'delete',
                timestamp: deletedExpense.timestamp,
                description: deletedExpense.description,
                date: deletedExpense.date
            });
            
            fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    timestamp: deletedExpense.timestamp,
                    description: deletedExpense.description,
                    date: deletedExpense.date
                })
            })
            .then(() => {
                console.log('✅ 구글시트 삭제 요청 완료');
            })
            .catch(error => {
                console.error('⚠️ 구글시트 삭제 오류:', error);
            });
        }
        
        console.log('🗑️ 로컬 삭제 완료:', id);
        alert('✅ 로컬에서 삭제되었습니다.\n(구글시트는 5초 후 반영됩니다)');
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
        
        // 날짜를 요일과 함께 표시
        const displayDate = formatDateWithDay(date);
        dateCell.textContent = `📅 ${displayDate}`;

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
                <td><button data-id="${expense.id}" onclick="editExpense(this)" class="edit-btn">수정</button></td>
                <td><button data-id="${expense.id}" onclick="deleteExpense(this)" class="delete-btn">삭제</button></td>
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

    // 항공권 포함 (772,000원 = 약 16,783 바트)
    const airfareKRW = 772000;
    const airfareBAHT = Math.round(airfareKRW / EXCHANGE_RATE);
    
    const totalWithAirfareBAHT = totalBaht + airfareBAHT;
    const totalWithAirfareKRW = totalKRW + airfareKRW;

    document.getElementById('totalBaht').textContent = totalWithAirfareBAHT.toLocaleString();
    document.getElementById('totalKRW').textContent = totalWithAirfareKRW.toLocaleString();

    console.log(`💰 경비 합계: ฿ ${totalBaht.toLocaleString()}, ₩ ${totalKRW.toLocaleString()}`);
    console.log(`✈️ 항공권(고정): ฿ ${airfareBAHT.toLocaleString()}, ₩ ${airfareKRW.toLocaleString()}`);
    console.log(`🎯 최종 총지출: ฿ ${totalWithAirfareBAHT.toLocaleString()}, ₩ ${totalWithAirfareKRW.toLocaleString()}`);
}

// localStorage에 저장
function saveExpenses() {
    localStorage.setItem('travelExpenses', JSON.stringify(expenses));
}

// localStorage에서 로드
function loadExpenses() {
    const saved = localStorage.getItem('travelExpenses');
    if (saved) {
        const parsed = JSON.parse(saved);
        // 각 항목의 date를 정규화
        expenses = parsed.map(item => ({
            ...item,
            date: normalizeDate(item.date)
        }));
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
    // exchangerate-api.com 사용 (무료, 가입 불필요)
    // CORS 우회를 위해 다른 API 사용
    const apiUrl = 'https://open.er-api.com/v6/latest/THB';
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('✅ API 환율 조회 성공:', data);
            // KRW 환율 추출
            const rate = data.rates.KRW;
            EXCHANGE_RATE = Math.round(rate * 100) / 100;
            
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
function editExpense(btn) {
    const id = btn.getAttribute('data-id');
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
