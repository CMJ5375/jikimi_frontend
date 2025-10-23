import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Myfooter = () => {
  return (
    <>
    <footer className="bg-dark text-light pt-4 pb-3 mt-5">
      <div className="container">

        {/* ===== PC / 태블릿 이상 ===== */}
        <div className="d-none d-md-block">
          {/* 상단: 고객센터 + 우측 로고 */}
          <div className="row align-items-center border-bottom pb-3 mb-3">
            <div className="col-md-8">
              <h6 className="fw-bold mb-1">
                고객센터 <span className="text-secondary fw-normal fs-6">(평일 09:00~18:00)</span>
              </h6>
              <h4 className="fw-bold mb-0">+82 031-742-1234</h4>
            </div>
          </div>

          {/* 상세정보 (라벨/값 좌우) */}
          <div className="row mb-4">
            <div className="col-12 col-md-3 text-secondary fw-semibold">
              <div className="py-1">대표 이메일</div>
              <div className="py-1">대표 이사</div>
              <div className="py-1">임원</div>
              <div className="py-1">주소</div>
            </div>
            <div className="col-12 col-md-9">
              <div className="py-1">
                <a href="mailto:Jikimi@isitopen.co.kr" className="link-light text-decoration-underline">
                  Jikimi@isitopen.co.kr
                </a>
              </div>
              <div className="py-1">최민준</div>
              <div className="py-1">류종혁&nbsp;&nbsp;이유진&nbsp;&nbsp;임도윤</div>
              <div className="py-1">
                광명로 4, 성남동 3219번지 아트팰리스 4층,5층, Jungwon-gu, Seongnam-si, Gyeonggi-do
              </div>
            </div>
          </div>

          {/* 로고 모음(PC만) */}
          <div className="d-flex justify-content-center align-items-center flex-wrap mb-3">
            <img src="/image/mj.png" alt="민준복지부" height="35" className="mx-3" />
            <img src="/image/dy.png" alt="도윤관리청" height="35" className="mx-3" />
            <img src="/image/yj.png" alt="유진국립의료원" height="35" className="mx-3" />
            <img src="/image/jh.png" alt="종혁청" height="35" className="mx-3" />
          </div>

          <p className="text-center text-secondary small mb-0">
            Copyright 2025 © ALL RIGHTS RESERVED BY <span className="text-light fw-bold">열려있나요?</span>
          </p>
        </div>

        {/* ===== 모바일 전용 ===== */}
        <div className="row d-md-none">
          {/* 상단: 고객센터/전화번호 */}
          <div className="col">
            <h6 className="fw-bold mb-1">
              고객센터 <span className="text-secondary fw-normal">(평일 09:00~18:00)</span>
            </h6>
            <h2 className="fw-bold mb-3">+82 031-742-1234</h2>
          </div>
          <div className="col">
            <div className="col-md-4 text-end">
                  <img src="/image/mj.png" alt="민준복지부" height="35" className="mx-4" />
            </div>
          </div>
          <hr className="border-secondary border-opacity-25" />

          {/* 라벨/값 2칸 행 */}
          <div className="row g-2">
            <div className="col-4 text-secondary fw-semibold">대표 이메일</div>
            <div className="col-8">
              <a href="mailto:Jikimi@isitopen.co.kr" className="link-light text-decoration-underline">
                Jikimi@isitopen.co.kr
              </a>
            </div>

            <div className="col-4 text-secondary fw-semibold">대표 이사</div>
            <div className="col-8">최민준</div>

            <div className="col-4 text-secondary fw-semibold">임원</div>
            <div className="col-8">류종혁&nbsp;&nbsp;이유진&nbsp;&nbsp;임도윤</div>

            <div className="col-4 text-secondary fw-semibold">주소</div>
            <div className="col-8">
              광명로 4, 성남동 3219번지 아트팰리스 4층,5층,<br />
              Jungwon-gu, Seongnam-si, Gyeonggi-do
            </div>
          </div>

          {/* 모바일에선 로고 숨김 */}
          {/* (필요하면 여기에 d-none d-md-flex 로고 영역을 둬도 됩니다) */}

          <p className="text-center text-secondary small mt-4 mb-0">
            Copyright 2025 © ALL RIGHTS RESERVED BY <span className="text-light fw-bold">열려있나요?</span>
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}

export default Myfooter