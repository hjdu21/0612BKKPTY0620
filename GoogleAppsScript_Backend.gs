// ════════════════════════════════════
// 🌴 방콕&파타야 여행 경비 Google Apps Script
// POST 요청 처리 (Add / Delete)
// ════════════════════════════════════

function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    try {
        const data = JSON.parse(e.postData.contents);
        
        console.log('📤 POST 요청 받음:', data);
        
        // DELETE 요청 처리
        if (data.action === 'delete') {
            return handleDelete(sheet, data);
        }
        
        // APPEND 요청 처리 (기본)
        else {
            return handleAppend(sheet, data);
        }
        
    } catch (error) {
        console.error('❌ 에러:', error.toString());
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// GET 요청 처리 (모든 데이터 조회)
function doGet(e) {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp.getActiveSheet();
    
    if (action === 'getAll') {
        return handleGetAll(sheet);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════
// 📝 데이터 추가 (APPEND)
// ════════════════════════════════════
function handleAppend(sheet, data) {
    // ✅ FIX: 프론트엔드에서 보낸 timestamp 사용 (새로 생성하지 않음)
    const newRow = [
        data.timestamp || new Date().toLocaleString('ko-KR'),  // 기본값만 사용
        data.description || '',
        data.baht || '',
        data.won || '',
        data.person || '',
        data.date || ''
    ];
    
    sheet.appendRow(newRow);
    
    console.log('✅ 데이터 추가됨:', newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '데이터 추가됨',
        row: newRow
    })).setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════
// 🗑️ 데이터 삭제 (DELETE)
// ════════════════════════════════════
function handleDelete(sheet, data) {
    const rows = sheet.getDataRange().getValues();
    
    console.log(`🔍 삭제 검색: timestamp="${data.timestamp}", description="${data.description}", date="${data.date}"`);
    console.log(`📊 총 ${rows.length}개 행 존재`);
    
    // ✅ FIX: i=1부터 시작 (헤더 무시, getAll과 일치)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowTimestamp = row[0]?.toString().trim() || '';
        const rowDescription = row[1]?.toString().trim() || '';
        const rowDate = row[5]?.toString().trim() || '';
        
        console.log(`  행${i}: ts="${rowTimestamp}" | desc="${rowDescription}" | date="${rowDate}"`);
        
        // 데이터 비교 (timestamp, description, date 기준)
        if (rowTimestamp === data.timestamp &&
            rowDescription === data.description &&
            rowDate === data.date) {
            
            console.log(`✅ 매칭됨! 행 ${i + 1} 삭제 시작...`);
            
            // 해당 행 삭제
            sheet.deleteRow(i + 1);
            
            console.log(`✅ 행 ${i + 1} 삭제 완료`);
            
            return ContentService.createTextOutput(JSON.stringify({
                status: 'success',
                message: `행 ${i + 1} 삭제됨`,
                deletedRow: row
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    
    console.error('❌ 매칭되는 데이터 없음!');
    
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '삭제할 데이터를 찾을 수 없음'
    })).setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════
// 📊 모든 데이터 조회 (GET)
// ════════════════════════════════════
function handleGetAll(sheet) {
    const rows = sheet.getDataRange().getValues();
    const result = [];
    
    // ✅ 첫 행(헤더) 제외, i=1부터 시작
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // 빈 행 무시
        if (!row[0] && !row[1] && !row[2]) continue;
        
        result.push({
            timestamp: row[0]?.toString() || '',
            description: row[1]?.toString() || '',
            baht: row[2] || '',
            won: row[3] || '',
            person: row[4]?.toString() || '',
            date: row[5]?.toString() || ''
        });
    }
    
    console.log(`📊 조회 결과: ${result.length}개 항목`);
    
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}
