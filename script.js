let map, infoWindow, service, geocoder;
let userLocation = null; // 사용자 위치를 저장할 전역 변수
let username = null;
let userData = null;
let idx = 0;
let resultLen;
let totalSeconds;
let originalSec;
let timerInterval = null;
let getScore = false;
let totalPoints = 0;
let userKeyword = null;
let minDistance = 0.2;
let searchRadius = 1000;

function calculateWalkTime(Km) {
    const avg = 83; // 평균 도보 속도: 분당 83m
    const meters = Km * 1000; // km를 m로 변환
    const estimatedTime = meters / avg;
    // 결과를 반올림하여 반환
    return Math.round(estimatedTime*1.5);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    let R = 6371; // 지구의 평균 반경 (킬로미터)
    let dLat = toRadians(lat2 - lat1);
    let dLon = toRadians(lon2 - lon1);
    let a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // 거리 (킬로미터)
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}


function initMap() {

    
    userData = JSON.parse(localStorage.getItem(username));
    let mode = userData.selectedMode || 'auto'
    let selectedPlaces = userData.selectedPlaces || ['park'];
    searchRadius = userData.searchRadius || 1000;
    minDistance = userData.minDistance || 0.2;
    
    if (mode == 'manual') {

        minDistance = 0.2;
        searchRadius = 50000;

        if (userKeyword === null) {
            userKeyword = prompt("검색 키워드를 입력해주세요.");
        }

        if (userKeyword === null) {
            alert("검색이 취소되었습니다.");
            return showMainMenu();
        }
    }

    clearInterval(timerInterval);
    timerInterval = null;
    $limitTime = document.getElementById('limitTime');
    $limitTime.innerHTML = ``;
    
    
    // 이제 이 값들을 실제 로직에 적용
    console.log("모드 :", mode);
    console.log("장소 타입 :", selectedPlaces);
    console.log("검색 반경 :", searchRadius, "m");
    console.log("최소 거리 :", minDistance, "km");

    map = new google.maps.Map(document.getElementById('map'), {zoom: 15});
    infoWindow = new google.maps.InfoWindow;
    service = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();

    
    if (!userLocation) { // 캐시된 위치가 없는 경우
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    proceedWithLocation(userLocation, searchRadius, selectedPlaces, idx, mode);
                }, 
                function() {
                    handleError(true, infoWindow, map.getCenter());
                }
            );
        } else {
            handleError(false, infoWindow, map.getCenter());
        }
    } else {
        proceedWithLocation(userLocation, searchRadius, selectedPlaces, idx, mode); // 캐시된 위치 사용
    }
}

function proceedWithLocation(location, searchRadius, selectedPlaces, idx, mode) {
    map.setCenter(location);
    infoWindow.setPosition(location);
    infoWindow.setContent('Your location');
    infoWindow.open(map);

    let combinedResults = [];
    let searchParams = {
        location: location,
        radius: searchRadius
    };

    

    for (let i = 0; i < selectedPlaces.length; i++) {
        if (mode == 'manual'){
            searchParams.keyword = userKeyword;
        } else {
            searchParams.type = selectedPlaces[i];
        }
        service.nearbySearch(searchParams, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                combinedResults = combinedResults.concat(results);
            } else {
                console.error(`${selectedPlaces[i]} : ${status}`);
                if (status == 'ZERO_RESULTS'){
                    alert('검색된 장소가 없네요. 최대 검색 반경은 50000m 입니다!');
                    return showMainMenu();
                }
            }

            // 마지막 검색이 완료되었을 때 결과 처리
            if (i === selectedPlaces.length - 1) {
                processResults(combinedResults, status, idx, location);
            }
        });
    }

}


function processResults(results, status, idx2, userLocation) {
    
    //console.log(`results : ${JSON.stringify(results)}`)
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
    }

    results.forEach(function(place) {
        place.distance = calculateDistance(
            userLocation.lat(), 
            userLocation.lng(), 
            place.geometry.location.lat(), 
            place.geometry.location.lng()
        );
    });

    results = results.filter(function(place) {
        return (place.distance >= minDistance && place.distance < 50);
    });
    results.sort(function(a, b) {
        return a.distance - b.distance;
    });

    if (results.length==0){
        alert('검색된 장소가 없네요. 검색 반경(최대 50000m) 또는 최소 거리를 수정해주세요!');
        return showMainMenu();
    }

    const $resultsDiv = document.getElementById('results');
    $resultsDiv.innerHTML = '';

    resultLen = results.length
    const firstPlace = results[idx2];
    if (firstPlace) {
        const lat = firstPlace.geometry.location.lat();
        const lng = firstPlace.geometry.location.lng();
        const name = firstPlace.name;

        let dist = calculateDistance(userLocation.lat(), userLocation.lng(), lat, lng)
        const $locName = document.getElementById('locName')
        
        const placeElement = document.createElement('div');
        placeElement.innerHTML = `<button id="button" onclick="naverMap('${name}', ${lat}, ${lng}, ${dist})">시작하기!</button><br>`;
        $resultsDiv.appendChild(placeElement);

        $locName.innerHTML = `<div>목적지는 "${name}" 입니다!</div><div>직선거리 : ${dist}km</div>`
    }

}



function naverMap(endName, elat, elng, km) {
    geocoder.geocode({'location': userLocation}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const startPlaceName = results[0].formatted_address;
            const url = createNaverDirectionsUrl(startPlaceName, endName, elng, elat);

            window.open(url, '_blank');
            
            const $limitTime = document.getElementById('limitTime')
            const totalMinutes = calculateWalkTime(km); // 예를 들어, 30분
            totalSeconds = totalMinutes * 60; // 분을 초로 변환
            originalSec = totalSeconds;
            timerInterval = setInterval(function() {
                updateTimer($limitTime, elat, elng, km, startPlaceName, endName);
            }, 1000);

            const $resultsDiv = document.getElementById('results');
            $resultsDiv.innerHTML = '';
            const placeElement = document.createElement('div');
            placeElement.innerHTML = `<button id="button" onclick="verify(${elat}, ${elng}, ${km}, '${startPlaceName}', '${endName}')">도착 확인!</button><br>`;
            $resultsDiv.appendChild(placeElement);

            getScore = false;
            

        } else {
            console.error(status);
        }
    });
}

function updateTimer($limitTime, elat, elng, km, sName, eName) {
    
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;


    $limitTime.innerHTML = `<div>제한 시간 : ${minutes} : ${seconds}</div>`;

    if (totalSeconds > 0) {
        totalSeconds--;
    } else {
        clearInterval(timerInterval);
        $limitTime.innerHTML = `<div>시간 종료!</div>`;
        verify(elat, elng, km, sName, eName);
        

      
    }
}


function createNaverDirectionsUrl(startPlaceName, endName, elat, elng) {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const startLng = userLocation.lng()
    const startLat = userLocation.lat()

    if (isMobile) {
        return `nmap://route/walk?slat=${startLat}&slng=${startLng}&sname=${startPlaceName}&dlat=${elng}&dlng=${elat}&dname=${endName}`;
    } else {
        return `https://map.naver.com/p/directions/${startLng},${startLat},${startPlaceName},PLACE_POI,PLACE_POI/${elat},${elng},${endName},PLACE_POI,PLACE_POI/-/walk?c=15.00,0,0,0,dh`;
    }
}

function handleError(status, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(status ?'Error : 정보를 불러오는데에 실패했습니다.' : 'Error : 이 브라우저는 Geolocation API를 지원하지 않습니다.');
    infoWindow.open(map);
}

function verify(elat, elng, km, sName, eName) {

    if (getScore){
        alert('이미 점수를 획득하셨습니다.');
        return;
    } 

    let additional = 0;
    let additional2 = 0;
    let points = 10;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                let newLat = position.coords.latitude;
                let newLng = position.coords.longitude;
                let dist = calculateDistance(newLat, newLng, elat, elng)
                
                if (totalSeconds > 0){
                    additional = (totalSeconds/originalSec);
                }
                
                
                if (parseInt(km / 5) > 0){
                    additional2 = parseInt(km / 5);
                }

                points = Math.ceil(points *(1+additional)) + 10*additional2;
                
                
                if (dist < 0.2) {
                    addScore(type='도착 점수', additional, additional2, points=points, totalSeconds, sName, eName);
                } else if (totalSeconds > 0) {
                    alert('아직 도착하지 않으셨네요! 목적지의 200m 반경 안으로 이동해주세요.');
                } else {
                    if ((km-dist)/km > 0.5){
                        addscore2(type='노력 점수', sName, eName);
                    }
                }
                
            }, 
            function() {
                handleError(true, infoWindow, map.getCenter());
            }
        );
    } else {
        handleError(false, infoWindow, map.getCenter());
    }


}

function addScore(type, additional, additional2, points, diff, sName, eName) {
    
    const now = new Date();
    userData = JSON.parse(localStorage.getItem(username));
    let msg = '';

    if (additional > 0){
        msg += `\n${diff}초 빨리 도착하셨네요!`;
    }

    if (additional2 > 0){
        if (msg){
            msg += `\n게다가 5km 이상의 먼 거리를 이동하셨네요!`;
        } else{
            msg += `\n5km 이상의 먼 거리를 이동하셨네요!`;
        }

        
    }
    
    if (msg){
        msg += `\n기본 점수에 10점에 가산점 ${points-10}점을 추가해드릴게요!`;
    }
    
    let newScoreRecord = {
        type: type,
        points: points,
        time: (now.getFullYear()) + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일 " + now.getHours() + "시 " + now.getMinutes() + "분",
        sName: sName,
        eName: eName
    };


    clearInterval(timerInterval);
    timerInterval = null;
    $limitTime = document.getElementById('limitTime');
    $limitTime.innerHTML = `<div>도착 완료!</div>`;

    userData.scoreHistory.push(newScoreRecord);
    localStorage.setItem(username, JSON.stringify(userData));
    alert(`${type} ${points}점을 획득하였습니다!${msg}`);

    if (userData.scoreHistory){
        totalPoints = userData.scoreHistory.reduce((sum, item) => {
            return sum + item.points;
        }, 0);
        document.getElementById('userPoints').innerText = totalPoints;
    }
    
    getScore = true;

}

function addscore2(type, sName, eName) {

    const now = new Date();

    let newScoreRecord = {
        type: type,
        points: 5,
        time: (now.getFullYear()) + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일 " + now.getHours() + "시 " + now.getMinutes() + "분",
        sName: sName,
        eName: eName
    };


    userData.scoreHistory.push(newScoreRecord);
    localStorage.setItem(username, JSON.stringify(userData));
    alert(`도착하지 못하셨군요! 하지만 절반 이상 이동하셨기 때문에 점수를 드릴게요!\n${type} ${5}점을 획득하였습니다!`);

    if (userData.scoreHistory){
        totalPoints = userData.scoreHistory.reduce((sum, item) => {
            return sum + item.points;
        }, 0);
        document.getElementById('userPoints').innerText = totalPoints;
    }
    
    getScore = true;
}

function signup() {
    const username2 = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    if (username2 && password) {
        localStorage.setItem(username2, JSON.stringify({ password: password, selectedMode: 'auto', selectedPlaces: ['park'], searchRadius: 1000, minDistance: 0.2, scoreHistory: []}));
        alert('계정이 성공적으로 생성되었습니다.');
        showLogin();
    } else {
        alert('아이디, 비밀번호를 모두 입력해주세요.');
    }
}

function login() {

    username = document.getElementById('username').value;
    userData = JSON.parse(localStorage.getItem(username));
    const password = document.getElementById('password').value;

    if (userData && userData.password === password) {
        showMainMenu()
    } else {
        alert('존재하지 않는 회원 정보입니다.');
    }
}


function showSignup() {
    document.getElementById('login').classList.add('hidden');
    document.getElementById('signup').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('signup').classList.add('hidden');
}

function showMainMenu() {
    userKeyword = null;
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('mainMenu').classList.add('grid');
    document.getElementById('login').classList.add('hidden');
    document.getElementById('settings').classList.add('hidden');
    document.getElementById('userDetails').classList.add('hidden');
    document.getElementById('scoreHistory').classList.add('hidden');
    document.getElementById('displayName').innerText = username;
    
}
function minusIndex() {
    
    if (idx == 0){
        alert("가장 가까운 장소입니다.");
    } else{
        idx -= 1
        initMap(idx);
    }
}

function plusIndex() {
    
    if (resultLen == idx+1){
        alert("가장 먼 장소입니다.");
    } else{
        idx += 1
        initMap(idx);
    }
}
function showSettings() {
    userData = JSON.parse(localStorage.getItem(username));
    if (userData.selectedMode) {
        document.getElementById(userData.selectedMode + 'Mode').checked = true;
    }
    // 선택된 장소 적용
    let selectedPlaces = userData.selectedPlaces || ['park'];
    document.getElementsByName('place').forEach(input => {
        input.checked = selectedPlaces.includes(input.value);
    });
    // 검색 반경과 최소 거리 적용
    document.getElementById('searchRadius').value = userData.searchRadius || 1000;
    document.getElementById('minDistance').value = userData.minDistance || 0.2;
    document.getElementById('mainMenu').classList.remove('grid');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('settings').classList.remove('hidden');
}
function applySetting() {
    
    userData.selectedMode = document.querySelector('input[name="mode"]:checked').value;
    userData.selectedPlaces = Array.from(document.getElementsByName('place'))
                                    .filter(input => input.checked)
                                    .map(input => input.value);

    let searchRadius = parseInt(document.getElementById('searchRadius').value);
    if (searchRadius >= 1000 && searchRadius <= 50000) {
        userData.searchRadius = searchRadius;
    } else {
        if (searchRadius > 50000){
            userData.searchRadius = 50000;
        }
        
        if (searchRadius < 1000){
            userData.searchRadius = 1000;
        }
    }

    let minDistance = parseInt(document.getElementById('minDistance').value);
    if (minDistance >= 0.2 && minDistance <= 50) {
        userData.minDistance = minDistance;
    } else {
        if (minDistance > 50){
            userData.minDistance = 50;
        }
        
        if (minDistance < 0.2){
            userData.minDistance = 0.2;
        }
    }

    localStorage.setItem(username, JSON.stringify(userData));
    alert("설정이 완료되었습니다!");
    
    
    showMainMenu();
}

function showScoreHistory() {

    fillYearAndMonthSelectors();
    createCalendar(new Date().getFullYear(), new Date().getMonth());

    document.getElementById('mainMenu').classList.remove('grid');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('scoreHistory').classList.remove('hidden');
}


function displayUserDetails() {
    idx = 0;
    userLocation = null;
    
    document.getElementById('mainMenu').classList.remove('grid');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('userDetails').classList.remove('hidden');
    document.getElementById('displayName').innerText = username;
    userData = JSON.parse(localStorage.getItem(username));
    if (userData.scoreHistory){
        totalPoints = userData.scoreHistory.reduce((sum, item) => {
            return sum + item.points;
        }, 0);
        document.getElementById('userPoints').innerText = totalPoints;
    }


    clearInterval(timerInterval);
    timerInterval = null;
    $limitTime = document.getElementById('limitTime');
    $limitTime.innerHTML = ``;

    initMap();

}

function updateScoreHistory(scoreHistory) {
    
    const $yearSelect = document.getElementById('yearSelect');
    const $monthSelect = document.getElementById('monthSelect');

    const selectedYear = parseInt($yearSelect.value);
    const selectedMonth = parseInt($monthSelect.value) + 1; 
    

    markCalendar(scoreHistory);
    const $scoreList = document.getElementById('scoreList');
    $scoreList.innerHTML = "";
    scoreHistory.forEach(record => {
        const dateTimePattern = /(\d+)년 (\d+)월/;
        const match = record.time.match(dateTimePattern);
    
        const recordYear = parseInt(match[1]);
        const recordMonth = parseInt(match[2]);

        let newTime = record.time.split("년 ")[1];
        if  (recordYear == selectedYear && recordMonth == selectedMonth) {

            let listItem = document.createElement('li');
            let summary = document.createElement('span');
            summary.textContent = `${newTime} ${record.type} +${record.points}점`;
            listItem.appendChild(summary);

            let toggleButton = document.createElement('button');
            toggleButton.textContent = '펼치기';
            toggleButton.onclick = function() {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
                this.textContent = details.style.display === 'none' ? '펼치기' : '접기';
            };
            listItem.appendChild(toggleButton);

            let details = document.createElement('div');
            details.style.display = 'none';
            details.innerHTML = `${record.sName} → ${record.eName}`;
            listItem.appendChild(details);

            $scoreList.appendChild(listItem);
        }
        
    });
}



function markCalendar(scoreHistory) {

    const selectedYear = parseInt(document.getElementById('yearSelect').value);
    const selectedMonth = parseInt(document.getElementById('monthSelect').value) + 1;

    scoreHistory.forEach(record => {
        const dateTimePattern = /(\d+)년 (\d+)월 (\d+)일/;
        const match = record.time.match(dateTimePattern);

        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);

            // 선택된 년도와 월에 해당하는 경우에만 마킹
            if (year === selectedYear && month === selectedMonth) {
                let dayElement = document.querySelector(`#calendar-day-${day}`);
                if (dayElement) {
                    dayElement.classList.add('marked');
                }
            }
        }
    });
}



function createCalendar(year, month) {

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = ''; // 요일 헤더 초기화

    days.forEach(day => {
        let dayDiv = document.createElement('div');
        dayDiv.innerText = day;
        calendarDays.appendChild(dayDiv);
    });

    const $calendar = document.getElementById('calendar');
    $calendar.innerHTML = ''; // 달력 초기화

    // 해당 월의 첫째 날과 마지막 날
    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();

    // 첫째 날이 시작하는 요일 전까지 빈 div 추가
    for (let i = 0; i < firstDay; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.classList.add('empty'); // 'empty' 클래스 추가

        $calendar.appendChild(emptyDiv);
    }

    // 실제 날짜 div 추가
    for (let i = 1; i <= lastDate; i++) {
        let dayElement = document.createElement('div');
        dayElement.innerText = i;
        dayElement.id = `calendar-day-${i}`;
        $calendar.appendChild(dayElement);
    }

    userData = JSON.parse(localStorage.getItem(username));
    console.log(userData);
    updateScoreHistory(userData.scoreHistory);
    
}

function fillYearAndMonthSelectors() {
    const $yearSelect = document.getElementById('yearSelect');
    const $monthSelect = document.getElementById('monthSelect');

    // 년도 선택 옵션 채우기
    for (let i = 2020; i <= new Date().getFullYear(); i++) {
        let option = new Option(i, i);
        $yearSelect.options.add(option);
    }

    // 월 선택 옵션 채우기
    for (let i = 0; i < 12; i++) {
        let option = new Option(i + 1, i);
        $monthSelect.options.add(option);
    }

    // 현재 년도와 월을 기본값으로 설정
    $yearSelect.value = new Date().getFullYear();
    $monthSelect.value = new Date().getMonth();

    // 이벤트 리스너 설정
    $yearSelect.addEventListener('change', () => {
        createCalendar($yearSelect.value, $monthSelect.value);
    });

    $monthSelect.addEventListener('change', () => {
        createCalendar($yearSelect.value, $monthSelect.value);
    });
}


// 초기 달력 생성 및 선택기 채우기




