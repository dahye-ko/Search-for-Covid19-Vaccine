const $numOfResult = document.querySelector('#numOfResult')
const $resultBox = document.querySelector('#resultBox')
const $form = document.querySelector('#searchForm')
const $searchField = document.querySelector('#searchField')

const $kakaoMap = document.getElementById('map'), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(37.59173340840982, 127.02123781146186), // 지도의 중심좌표
    level: 3, // 지도의 확대 레벨
  }

// 지도를 생성합니다
const map = new kakao.maps.Map($kakaoMap, mapOption)

// 주소-좌표 변환 객체를 생성합니다
const geocoder = new kakao.maps.services.Geocoder()

// 공공데이터 포털에서 발급받은 서비스 키
const SERVICE_KEY = '발급받은 일반 인증키를 입력하세요'

// HTTP 요청 전송: (1) XMLHttpRequest 객체 생성 => (2) HTTP 요청 초기화 => (3) HTTP 요청 전송
// (1) 새로운 XMLHttpRequest 객체 생성
const request = new XMLHttpRequest()
// (2) HTTP 요청 초기화
// open(HTTP 요청 메서드, 요청 url)
request.open('GET', `https://api.odcloud.kr/api/15077586/v1/centers?page=1&perPage=268&serviceKey=${SERVICE_KEY}`)
// (3) HTTP 요청 전송
request.send()

function getData() {
  if (request.status === 200) {
    // (2) response 프로퍼티에 요청에 대한 응답 내용이 담겨 있음
    // 서버에서 클라이언트로 보내는 JSON 데이터는 문자열이고,
    // 이를 클라이언트에서 사용하려면 객체화(직렬화(serializing): 문자열 => 객체)해야 함
    // 객체화를 위해 사용하는 메서드가 JSON.parse
    const res = JSON.parse(request.response)
    const rawData = res.data

    // 검색 키워드
    const keyword = $searchField.value

    const matchedData = keyword ? rawData.filter((center) => center.address.match(keyword)) : rawData

    // 진료소 수
    const count = matchedData.length

    if (!count) {
      $numOfResult.innerHTML = '검색결과가 없습니다'
      $resultBox.innerHTML = ''
      $searchField.value = ''
      $kakaoMap.style.display = 'none'
      setTimeout(getData, 2000)
    } else {
      $resultBox.innerHTML = ''
      $numOfResult.innerHTML = `총 ${count}개의 검색결과가 있습니다`
      $kakaoMap.style.display = 'block'
      matchedData.forEach((center) => {
        // 진료소 주소
        const address = center.address
        // 진료소 시설 이름
        const facilityName = center.facilityName

        // 진료소 전화번호
        const phoneNumber = center.phoneNumber ? center.phoneNumber : '전화번호가 없습니다'
        // 진료소 타입
        const centerType = center.centerType

        const node = document.createElement('div')
        node.setAttribute('class', 'resultItem')

        node.innerHTML = `
                    <div class="centerHead">
                        <span class="centerName">${facilityName}</span>
                        <span class="centerTag">${centerType}</span>
                    </div>
                    <div class="centerAddress">${address}</div>
                    <div class="centerPhoneNumber">
                        <span class="material-icons">
                            phone_in_talk
                        </span>
                        <span>${phoneNumber}</span>
                    </div>
                `
        $resultBox.appendChild(node)

        node.addEventListener('click', function () {
          // 주소로 좌표를 검색합니다
          geocoder.addressSearch(address, function (result, status) {
            // 정상적으로 검색이 완료됐으면
            if (status === kakao.maps.services.Status.OK) {
              const coords = new kakao.maps.LatLng(result[0].y, result[0].x)

              // 결과값으로 받은 위치를 마커로 표시합니다
              const marker = new kakao.maps.Marker({
                map: map,
                position: coords,
              })

              // 인포윈도우로 장소에 대한 설명을 표시합니다
              const infowindow = new kakao.maps.InfoWindow({
                content: `<div id='infoWindow'>${facilityName}</div>`,
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

// HTTP 응답 처리
// (1) onload 메서드는 요청이 성공적으로 완료된 경우에만 발생
request.addEventListener('load', getData)
$form.addEventListener('submit', getData)
