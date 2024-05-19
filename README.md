![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## Overview
html/css/javascript 를 이용해 만든 런닝 웹페이지입니다.
이 웹페이지는 백석대학교 웹프로그래밍 수업의 팀 프로젝트 과제 수행을 목적으로 개발되었으나, 코딩, 테스트, 문서화 등 모든 개발 작업은 전적으로 혼자 수행하였습니다.
개발 과정은 아래 노션 링크에 상세히 기재 되어있습니다.

This is a running webpage created using HTML, CSS, and JavaScript.
This application was developed as part of a team project, but all development work, including coding, testing, and documentation, was solely carried out by myself.
The development process is detailed in the Notion link below.

[Notion](https://tar-beast-134.notion.site/0cd7bc5fa4e54517bfa0730b6f9d823c)


## Features

### 사용자 위치 표시 (Displaying User Location)
- Google Maps API를 사용하여 사용자 위치와 지도 정보를 받아옵니다.
- Fetch user location and map data using Google Maps API.

### 주변 장소 안내 (Nearby Places Guidance)
- Google Maps API가 제공하는 Places API의 함수들을 이용해서 사용자 위치 주변의 장소들을 가까운 순으로 배열하고 안내합니다.
- Display nearby places sorted by proximity using functions provided by Google Maps API's Places API.

### 사용자 설정 (User Settings)
- 사용자는 자신이 원하는 반경, 원하는 장소 등을 사용자 설정을 통해 선택할 수 있고 설정한 옵션에 따라 자동으로 근처의 목적지를 배정받게 됩니다.
- Users can select desired radius and types of places through user settings, and receive nearby destinations based on the selected options.

### 수동 모드 (Manual Mode)
- 수동 모드를 선택하게 되면, 자신이 원하는 목적지를 직접 입력할 수 있습니다.
- Users can enter desired destinations manually in manual mode.

### 달리기 모드 (Running Mode)
- 시작 페이지로 들어가 원하는 목적지에서 버튼을 누르면 네이버 스키마 링크를 통해 도보 안내 페이지가 열리고 시간 제한이 시작됩니다.
- Enter the start page, select the desired destination, and click the start button to open the walking guidance page via Naver Schema Link and start the countdown timer.

### 도착 검증 (Arrival Verification)
- 목적지에 이동 후, 도착 버튼을 누르면 현재 사용자의 위치와 목적지 사이의 직선 거리를 계산하여 도착 여부를 검증합니다.
- After moving to the destination, click the arrival button to calculate the straight-line distance between the user's current location and the destination to verify arrival.

### 점수 부여 (Scoring)
- 사용자가 달린 거리, 남은 시간에 따라 가산점이 부여됩니다.
- Bonus points are awarded based on the distance run and the remaining time.

### 기록 페이지 (Record Page)
- 기록 페이지에서 날짜에 따라 이동한 장소들과 점수 내역 등을 확인할 수 있습니다.
- View traveled places and score history by date on the record page.
  
