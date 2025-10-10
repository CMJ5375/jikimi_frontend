import 'bootstrap/dist/css/bootstrap.min.css';
import { Container,Button,Form,Row,Col,Tab,Tabs,Card } from 'react-bootstrap';



function Main() {
  
  return (
    <>
    
  
    <Container
      fluid
      className="py-5"
      style={{
        backgroundColor: "#EAF4FF",
        maxWidth: "1024px",
      }}
    >
      <Row className="align-items-center">
        <Col>
          <div className="d-flex align-items-center mb-3" style={{ fontSize: "20px", color: "#6c757d" }}>
            <GeoAltFill size={18} className="me-2" />
            경기도 성남시 중원구
          </div>

          <h3 style={{ fontWeight: "700", fontSize: "30px", marginBottom: "0" }}>
            지금 나에게
          </h3>
          <h3 style={{ fontWeight: "700", fontSize: "30px" }}>
            딱 맞는{" "}
            <span style={{ color: "#3341F3" }}>
              병원
            </span>{" "}
            을 찾아보세요
          </h3>
        </Col>
        <Col>
          <img
            src="./image/abc.png"
            alt="병원 지도 아이콘"
            style={{ width: "180px", height: "auto" }}
          />
        </Col>
      </Row>
    </Container>

    <Container className="mt-5">
    <Row className="justify-content-center">
      <Col>
        <Tabs variant="pills" justify defaultActiveKey="hospital" className="my-tabs">
          <Tab eventKey="hospital" title="병원">
            <Card border="primary">
              <Card.Body>
                <Form className="p-4 bg-white">
                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center">
                      <div style={{ width: "120px", fontSize: "20px", fontWeight: "500" }}>
                        진료 과목 :
                      </div>
                      <Form.Select style={{ fontSize: "20px"}}>
                        <option>전체</option>
                        <option>내과</option>
                        <option>외과</option>
                      </Form.Select>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center">
                      <div style={{ width: "120px", fontSize: "20px", fontWeight: "500" }}>
                        의료 기관 :
                      </div>
                      <Form.Select style={{ fontSize: "20px"}}>
                        <option>전체</option>
                        <option>???</option>
                        <option>???</option>
                      </Form.Select>
                    </div>
                  </Form.Group>
                 
                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center">
                      <div style={{ width: "120px", fontSize: "20px", fontWeight: "500" }}>
                        병원 명 :
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="병원 이름을 입력하세요"
                        style={{ fontSize: "20px"}}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Row>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="MRI"
                          style={{ fontSize: "20px" }}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="CT"
                          style={{ fontSize: "20px" }}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="checkbox"
                          label="초음파"
                          style={{ fontSize: "20px" }}
                        />
                      </Col>
                    </Row>
                  </Form.Group>


                 
                  <Button variant="light" className="w-100"
                    style={{
                      fontSize: "20px",
                      fontWeight: "500",
                      border: "none",
                      backgroundColor: "#F3F3F3",
                    }}
                  >
                    내 주변 병원 검색
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="pharmacy" title="약국">
            <Card border="primary">
              <Card.Body className="bg-white p-4">
                ????
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Col>
    </Row>
    
    </Container>

  </>
  );
}

export default Main;
