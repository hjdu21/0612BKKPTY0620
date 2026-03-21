// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('여행 계획 페이지 로드됨!');
    
    // 페이지 로드 애니메이션
    animateOnScroll();
    
    // 현재까지 남은 일수 계산
    calculateDaysUntilTrip();
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
