/* ==========================================================
   서울역회의실센터 : main.js
   메뉴, 헤더 상태, 스크롤 등장, 숫자 카운트업, 히어로 배경 사진 전환, 플로팅 문의
   (스크롤 이벤트 대신 IntersectionObserver만 사용)
   ========================================================== */

/* '예약 문의' 설정을 한 곳에서 관리합니다.
   - naverUrl : 네이버 예약 업체 페이지 주소 (모바일에서는 네이버가 자동으로 모바일 화면으로 보여줌)
   - tel      : 전화 예약 번호
   '예약 문의' 버튼(data-reserve)을 누르면 두 가지 중 선택하는 창이 열립니다.
   JS가 꺼져 있으면 버튼은 그대로 전화 연결로 동작합니다. */
const RESERVE = {
  naverUrl: 'https://booking.naver.com/booking/10/bizes/954749',
  tel: '010-8242-7340',
};

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* 문의 버튼 클릭 측정 (구글 애널리틱스 이벤트)
     click_call / click_sms / click_naver_booking : 실제 문의로 이어지는 클릭
     open_reserve_menu : '예약 문의'를 눌러 선택 창을 연 경우
     link_location 에는 누른 위치(섹션 id)가 들어감 */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || typeof window.gtag !== 'function') return;
    const href = a.getAttribute('href') || '';
    const where = (a.closest('[id]') || {}).id || 'etc';
    let name = null;
    if (a.hasAttribute('data-reserve') && dialog && typeof dialog.showModal === 'function') name = 'open_reserve_menu';
    else if (href.startsWith('tel:')) name = 'click_call';
    else if (href.startsWith('sms:')) name = 'click_sms';
    else if (a.hasAttribute('data-reserve-naver') || href.includes('booking.naver.com')) name = 'click_naver_booking';
    if (name) window.gtag('event', name, { link_location: where });
  });

  /* 네이버 예약 링크는 RESERVE.naverUrl 한 곳에서 관리 (예약 창 + 맨 아래 문의 섹션) */
  document.querySelectorAll('[data-reserve-naver]').forEach((a) => { a.href = RESERVE.naverUrl; });

  /* 예약 방법 선택 창 */
  const dialog = document.getElementById('reserve-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    const telHref = 'tel:' + RESERVE.tel.replace(/\D/g, '');
    dialog.querySelector('[data-reserve-naver]').href = RESERVE.naverUrl;
    dialog.querySelector('[data-reserve-tel]').href = telHref;
    let opener = null;

    document.querySelectorAll('[data-reserve]').forEach((btn) => {
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        opener = btn;
        dialog.showModal();
      });
    });

    const close = () => dialog.close();
    dialog.querySelector('[data-reserve-close]').addEventListener('click', close);
    dialog.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    /* 바깥(어두운 영역) 클릭 시 닫기 */
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });
    dialog.addEventListener('close', () => {
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  /* 모바일 메뉴 */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const nav = document.getElementById('site-nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    document.querySelector('[data-header]').classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menuBtn.querySelector('.ti').className = open ? 'ti ti-x' : 'ti ti-menu-2';
  };
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  if (!hasIO) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }

  /* 헤더: 히어로 위에서는 투명, 조금 스크롤하면 흰 배경 */
  const header = document.querySelector('[data-header]');
  const sentinel = document.querySelector('[data-header-sentinel]');
  if (header && sentinel) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* 섹션 도달 측정 (구글 애널리틱스 이벤트 view_section, 매개변수 section)
     섹션이 화면 한가운데 선에 걸리면 '도달'로 보고 방문당 한 번 기록.
     (살짝 스쳐 보이는 건 제외되고, 화면보다 긴 섹션도 빠짐없이 잡힘) */
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (typeof window.gtag === 'function') window.gtag('event', 'view_section', { section: entry.target.id });
      sectionIO.unobserve(entry.target);
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  ['intro', 'facility', 'rooms', 'pricing', 'reviews', 'faq', 'location', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach((el) => sectionIO.observe(el));

  /* 스크롤 등장 */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealIO.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* 숫자 카운트업 */
  const countUp = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      countIO.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* 히어로 사진 전환 (화면에 보일 때만 돌아감) */
  const slides = [...document.querySelectorAll('[data-slides] .slide')];
  if (slides.length > 1 && !reduceMotion) {
    let index = 0;
    let timer = null;
    const next = () => {
      slides[index].classList.remove('is-active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('is-active');
    };
    const media = document.querySelector('[data-slides]');
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer) timer = setInterval(next, 6000);
      if (!entry.isIntersecting && timer) { clearInterval(timer); timer = null; }
    }).observe(media);
  }

  /* 맨 위로 이동 버튼 */
  const toTop = document.querySelector('[data-to-top]');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* 플로팅 문의 버튼: 히어로를 지나면 표시, 예약 문의 섹션에서는 숨김 */
  const float = document.querySelector('[data-float]');
  const hero = document.querySelector('[data-hero]');
  const contact = document.getElementById('contact');
  if (float && hero && contact) {
    let pastHero = false;
    let atContact = false;
    const update = () => float.classList.toggle('is-visible', pastHero && !atContact);
    new IntersectionObserver(([entry]) => {
      pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    }).observe(hero);
    new IntersectionObserver(([entry]) => {
      atContact = entry.isIntersecting;
      update();
    }, { threshold: 0.2 }).observe(contact);
  }

  /* 예상 요금 계산기 : 금액은 요금표(.price-list의 data-price)에서 그대로 읽어온다.
     요금이 바뀌면 이 코드는 손댈 필요 없이 요금표만 고치면 됨. */
  const calcPeople = document.querySelector('[data-calc-people]');
  const calcHours = document.querySelector('[data-calc-hours]');
  const calcTotal = document.querySelector('[data-calc-total]');
  if (calcPeople && calcHours && calcTotal) {
    const updateCalc = () => {
      const row = document.querySelector('[data-price-list] li[data-people="' + calcPeople.value + '"]');
      const rate = row ? parseInt(row.dataset.price, 10) : 0;
      const total = rate * parseInt(calcHours.value, 10);
      calcTotal.textContent = total.toLocaleString('ko-KR') + '원';
    };
    calcPeople.addEventListener('change', updateCalc);
    calcHours.addEventListener('change', updateCalc);
    updateCalc();
  }

  /* 푸터 연도 */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
