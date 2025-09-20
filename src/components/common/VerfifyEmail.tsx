import { Form, Button, Row, Col } from "react-bootstrap";

export default function VerifyEmail() {
  return (
    <div>
      
       
        <Form>
          <Form.Group as={Row} className="mb-3" controlId="formEmail">
            <Form.Label column sm="4">
              Email
            </Form.Label>
            <Col sm="8">
              <Form.Control type="email" placeholder="Nhập email" />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formCode">
            <Form.Label column sm="4">
              Mã xác thực
            </Form.Label>
            <Col sm="8">
              <Form.Control type="text" placeholder="Nhập mã" />
            </Col>
          </Form.Group>

          <div className="d-grid">
            <Button variant="primary" type="submit">
              Xác thực
            </Button>
          </div>
        </Form>
      
    </div>
  );
}
