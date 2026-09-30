/* ==========================================================
   서울역회의실센터 : kakao-map.js
   카카오맵 퍼가기 코드는 index.html에 공식 코드 그대로 들어 있습니다.
   이 파일은 지도가 뜨지 않을 때 주소 + 길찾기 링크(fallback)를 보여주는 역할만 합니다.

   지도가 안 뜨는 대표 원인
   1. file:// 로 열었을 때  → http(s)로 서빙해서 확인
   2. 컨테이너 높이(px)가 없을 때 → style.css의 .wrap_map 높이 유지
   ========================================================== */

(() => {
  const container = document.getElementById('daumRoughmapContainer1789228193385');
  const fallback = document.querySelector('[data-map-fallback]');
  if (!container || !fallback) return;

  const showFallback = () => { fallback.hidden = false; };
  const isRendered = () => container.querySelector('.wrap_map') !== null;

  if (location.protocol === 'file:' || !window.daum) {
    showFallback();
    return;
  }

  setTimeout(() => {
    if (!isRendered()) showFallback();
  }, 5000);
})();
