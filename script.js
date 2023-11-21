let map, infoWindow, service, geocoder;
let userLocation;

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {zoom: 15});
    infoWindow = new google.maps.InfoWindow;
    service = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(userLocation);
                infoWindow.setPosition(userLocation);
                infoWindow.setContent('Your location');
                infoWindow.open(map);

                service.nearbySearch({
                    location: userLocation,
                    radius: 1000, 
                    keyword: '공원'
                }, processResults);

            }, 
        function() {
            handleError(true, infoWindow, map.getCenter());
        });
        
    } else {
        handleError(false, infoWindow, map.getCenter());
    }
}



function processResults(results, status) {

    //console.log(`results : ${JSON.stringify(results)}`)
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const firstPlace = results[0];
    if (firstPlace) {
        const lat = firstPlace.geometry.location.lat();
        const lng = firstPlace.geometry.location.lng();
        const name = firstPlace.name;

        const placeElement = document.createElement('div');
        placeElement.innerHTML = `목적지 : ${name} <button id="button" onclick="naverMap('${name}', ${lat}, ${lng})">Get Directions</button> <br>`; //Location: (${lat}, ${lng}) 
        resultsDiv.appendChild(placeElement);
    }
}



function naverMap(endName, elat, elng) {
    geocoder.geocode({'location': userLocation}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const startPlaceName = results[0].formatted_address;
            const url = createNaverDirectionsUrl(startPlaceName, endName, elng, elat);

            window.open(url, '_blank');

        } else {
            console.error(status);
        }
    });
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

//지도 함수 시작
initMap();



//로그인 관련
function signup() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;

    if (username && password) {
        localStorage.setItem(username, JSON.stringify({ password: password, points: 0}));
        alert('계정이 성공적으로 생성되었습니다.');
        showLogin();

    } else {
        alert('아이디, 비밀번호를 모두 입력해주세요.');
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let userData = JSON.parse(localStorage.getItem(username));

    if (userData && userData.password === password) {
        
        displayUserDetails(username, userData);
        
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


function displayUserDetails(username, userData) {
    document.getElementById('login').classList.add('hidden');
    document.getElementById('userDetails').classList.remove('hidden');
    document.getElementById('displayName').innerText = username;
    document.getElementById('userPoints').innerText = userData.points;
}


