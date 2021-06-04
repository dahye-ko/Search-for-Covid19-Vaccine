const $form = document.querySelector("#searchForm");
const $searchField = document.querySelector("#searchKeyword");
const $numOfResult = document.querySelector('#numOfResult')
const $resultBox = document.querySelector("#resultBox");
const $kakaoMap = document.querySelector('#map')

// 공공데이터포털에서 발급받은 오픈 API의 일반 인증키
const SERVICE_KEY = '일반 인증키'

// 카카오 지도
const mapContainer = document.getElementById('map'), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(37.5915, 127.0213), // 지도의 중심좌표
    level: 3, // 지도의 확대 레벨
  }

// 지도 생성
const map = new kakao.maps.Map(mapContainer, mapOption);

// 주소-좌표 변환 객체 생성
const geocoder = new kakao.maps.services.Geocoder();


// XMLHttpRequest 객체 생성
const request = new XMLHttpRequest()
// HTTP 요청 초기화
request.open('GET', `https://api.odcloud.kr/api/15077586/v1/centers?page=1&perPage=263&serviceKey=${SERVICE_KEY}`)

// HTTP 요청 헤더 설정
// 서버가 응답할 데이터의 MIME 타입 지정: json
request.setRequestHeader('accept', 'application/json')
// 권한 설정
request.setRequestHeader('Authorization', `${SERVICE_KEY}`)

// HTTP 요청 전송
request.send()

function getData() {
  // status 프로퍼티 값이 200인 경우,
  // 즉 정상적으로 응답된 상태라면,
  // response 프로퍼티에 서버의 응답 결과가 담겨 있다
  if (request.status === 200) {
    // 응답 데이터
    const res = JSON.parse(request.response)
    // 백신 예방 접종 센터 원 데이터
    const rawData = res.data
    // 검색창에 입력한 키워드
    const keyword = $searchField.value
    // 검색결과는 
    // 키워드가 있는 경우, 키워드와 매칭된 데이터를 선별하여 사용
    // 키워드가 없는 경우, 원 데이터를 그대로 사용
    const matchedInfo = keyword ? rawData.filter((clinic) => clinic.address.match(keyword)) : rawData
    
    // 검색결과 수
    const count = matchedInfo.length

    if (!count) {
      $numOfResult.innerHTML = '검색결과가 없습니다'
      $resultBox.innerHTML = ''
      $kakaoMap.style.display = 'none'
      $searchField.value = ''
      // 2초 후 전체 데이터가 보여지도록 타이머 함수 설정
      setTimeout(getData, 2000)
    } else {
      $resultBox.innerHTML = ''
      $kakaoMap.style.display = 'block'
      $numOfResult.innerHTML = ''
      $numOfResult.innerHTML = `총 ${count}개의 검색결과가 있습니다`

      matchedInfo.forEach((clinic) => {
        // 진료소 주소
        const address = clinic.address
        // 진료소 이름
        const facilityName = clinic.facilityName
        // 진료소 번호
        const phoneNumber = clinic.phoneNumber
        // 진료소 타입
        const centerType = clinic.centerType

        const node = document.createElement('div')
        // node에 적용할 속성 지정
        node.setAttribute('class', 'resultItem')

        node.innerHTML = `
          <div class="facilityHead">
            <span class="facilityName">${facilityName}</span>
            <span class="facilityTag">${centerType}</span>
          </div>
          <div class="facilityAddress">${address}</div>
          <div class="facilityPhoneNumber">
            <span class="material-icons">
              phone_in_talk
            </span>
            <span>${phoneNumber}</span>
          </div>`

        // resultBox에 전체 검색 결과를 보여준다
        $resultBox.appendChild(node)

        // 특정 노드 클릭시 지도에 마커로 표시
        node.addEventListener('click', function () {
          // 주소로 좌표를 검색
          geocoder.addressSearch(address, function (result, status) {
            // 정상적으로 검색이 완료됐으면
            if (status === kakao.maps.services.Status.OK) {
              const coords = new kakao.maps.LatLng(result[0].y, result[0].x)

              // 결과값으로 받은 위치를 마커로 표시
              const marker = new kakao.maps.Marker({
                map: map,
                position: coords,
              })

              // 인포윈도우로 장소에 대한 설명을 표시
              const infowindow = new kakao.maps.InfoWindow({
                content: `<div id="info">${facilityName}</div>`,
              })
              infowindow.open(map, marker)

              // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
              map.setCenter(coords)
            }
          })
        })
      })
    }

  } else {
    console.error('Error', request.status, request.statusText)
  }
}

// HTTP 요청이 성공적으로 완료된 경우 load 이벤트 발생
request.addEventListener("load", getData)

// 검색창 "submit" 이벤트 발생시,
$form.addEventListener("submit", getData);
