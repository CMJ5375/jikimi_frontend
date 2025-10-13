import React from 'react'
import { Container, Row, Col, Card, Button, Form, Dropdown, Table } from "react-bootstrap";

const detail = () => {
  return (
    <>
      <div className="bg-white">
        <Container className="py-4">
          {/* 경로 */}
          <Row>
            <Col>
              <div className="d-flex align-items-center gap-2 text-secondary mb-3 small">
                <span>HOME</span>
                <span>{'>'}</span>
                <span>병원,약국찾기</span>
                <span>{'>'}</span>
                <span>병원찾기</span>
              </div>
            </Col>
          </Row>

          {/* 안내 문구 */}
          <Row>
            <Col>
              <div
                className="border border-0 p-3 text-center text-primary mb-4"
                style={{ background: "#DBEFFF", fontSize: "0.9rem" }}
              >
                진료시간이 변동될 수 있으므로 기관에 전화 확인 후 방문해 주시길 바랍니다.
                (접수 마감 시간 확인 등)
              </div>
            </Col>
          </Row>

          {/* 병원명 + 상태 */}
          <Row className="align-items-center mb-3">
            <Col>
              <h3 className="fw-bold mb-2">
                성신한방병원 <span className="text-warning">★</span>
              </h3>
              <div className="d-flex gap-3">
                <span className="text-danger fw-semibold">응급실 운영</span>
                <span className="text-success fw-semibold">진료 가능</span>
              </div>
            </Col>
          </Row>

          {/* 지도 + 정보 테이블 */}
          <Row className="mb-4">
            <Col md={6}>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  height: "280px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888",
                }}
              >
                지도 영역 (예: 카카오맵)
              </div>
            </Col>
            <Col md={6}>
              <Table bordered className="mt-3 mt-md-0 small">
                <tbody>
                  <tr>
                    <th className="bg-light w-25">주소</th>
                    <td>경기 성남시 수정구 성남대로 1170 7-8층 (우)13326</td>
                  </tr>
                  <tr>
                    <th className="bg-light">대표전화</th>
                    <td>031-722-1175</td>
                  </tr>
                  <tr>
                    <th className="bg-light">기관구분</th>
                    <td>응급의료기관 외의 의료기관(응급의료시설) &gt; 병원</td>
                  </tr>
                  <tr>
                    <th className="bg-light">소개</th>
                    <td>버스정류장: 모란경찰서 옆</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* 진료시간 */}
          <Row className="mb-4">
            <Col>
              <h5 className="fw-bold mb-3">진료시간</h5>
              <Table bordered className="small">
                <tbody>
                  <tr>
                    <td>월요일</td>
                    <td>09:00~21:00</td>
                    <td>화요일</td>
                    <td>09:00~21:00</td>
                  </tr>
                  <tr>
                    <td>수요일</td>
                    <td>09:00~21:00</td>
                    <td>목요일</td>
                    <td>09:00~21:00</td>
                  </tr>
                  <tr>
                    <td>금요일</td>
                    <td>09:00~21:00</td>
                    <td>토요일</td>
                    <td>09:00~21:00</td>
                  </tr>
                  <tr>
                    <td>일요일</td>
                    <td className="text-primary fw-semibold">정기휴무</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </Table>
              <div className="bg-light p-3 small border">
                <p className="mb-1">
                  <strong>비고:</strong> 점심 12:30~13:30 (접수는 12:10 마감) / 24시간 응급실 진료
                </p>
                <p className="mb-0">
                  <strong>법정공휴일:</strong> 신정, 설, 삼일절, 어린이날, 석가탄신일,
                  현충일, 광복절, 추석, 개천절, 한글날, 크리스마스
                </p>
              </div>
            </Col>
          </Row>

          {/* 진료과목 */}
          <Row className="mb-4">
            <Col>
              <h5 className="fw-bold mb-3">진료과목</h5>
              <div className="border p-3 small">
                <div>가정의학과, 내과, 마취통증의학과, 병리과</div>
                <div>신경과, 신경외과, 영상의학과, 응급의학과</div>
                <div>재활의학과, 정형외과, 피부과</div>
              </div>
            </Col>
          </Row>

          {/* 의료자원 */}
          <Row className="mb-4">
            <Col>
              <h5 className="fw-bold mb-3">의료자원</h5>
              <div className="border p-3 small">
                <div>CT, MRI, X-RAY, 심전도, 근전도</div>
              </div>
            </Col>
          </Row>

          {/* 실시간 병상정보 */}
          <Row className="mb-5">
            <Col>
              <h5 className="fw-bold mb-3">실시간 병상정보</h5>
              <div className="border p-3 small text-primary">
                응급의료기관 외 기관으로 실시간 병상정보 제공 대상이 아닙니다.
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default detail