import { Container, Row, Col } from "react-bootstrap";
import "./WelcomeSection.css";

type Props = {
  image?: string;      // cho phép truyền ảnh khác nếu cần
  videoUrl?: string;   // link vimeo/youtube
};

export default function WelcomeSection({
  image = "/src/assets/images/bg_2.jpg",
  videoUrl = "https://vimeo.com/45830194",
}: Props) {
  return (
    <section className="welcome-section">
      <Container>
        <Row className="align-items-center g-5">
          <Col md={5}>
            <div
              className="welcome-media"
              style={{ backgroundImage: `url(${image})` }}
            >
              <a
                href={videoUrl}
                className="play-btn"
                target="_blank"
                rel="noreferrer"
                aria-label="Play video"
              >
                <span className="triangle" />
              </a>
            </div>
          </Col>

          <Col md={7}>
            <div className="heading pt-md-5 ps-md-5 mb-4">
              <span className="subheading">Welcome to Deluxe Hotel</span>
              <h2 className="title">Welcome To Our Hotel</h2>
            </div>

            <div className="content ps-md-5">
              <p>
                On her way she met a copy. The copy warned the Little Blind
                Text, that where it came from it would have been rewritten a
                thousand times and everything that was left from its origin
                would be the word "and" and the Little Blind Text should turn
                around and return to its own, safe country. But nothing the copy
                said could convince her and so it didn’t take long until a few
                insidious Copy Writers ambushed her...
              </p>
              <p>
                When she reached the first hills of the Italic Mountains, she
                had a last view back on the skyline of her hometown
                Bookmarksgrove, the headline of Alphabet Village and the subline
                of her own road, the Line Lane. Pityful a rethoric question ran
                over her cheek, then she continued her way.
              </p>

              <ul className="social d-flex gap-3 mt-3">
                <li><a href="#" aria-label="Twitter"><i className="bi bi-twitter"></i></a></li>
                <li><a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a></li>
                <li><a href="#" aria-label="Google"><i className="bi bi-google"></i></a></li>
                <li><a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a></li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
