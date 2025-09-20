import { Carousel, Container } from "react-bootstrap";
import "./HeroSlider.css";
import BookingForm from "./BookingForm";

type Slide = {
  image: string;
  title: string;
  subtitle: string;
};

const slides: Slide[] = [
  {
    image: "/src/assets/images/bg_1.jpg",
    title: "Welcome To Deluxe",
    subtitle: "Hotels & Resorts",
  },
  {
    image: "/src/assets/images/bg_2.jpg",
    title: "Enjoy A Luxury Experience",
    subtitle: "Join With Us",
  },
];

export default function HeroSlider() {
  return (
    <section className="hero-slider">
      <Carousel controls={false} indicators={false} fade interval={3000}>
        {slides.map((s, i) => (
          <Carousel.Item key={i}>
            <div
              className="hero-slide"
              style={{ backgroundImage: `url(${s.image})` }}
              role="img"
              aria-label={s.title}
            >
              <div className="overlay" />
              <Container>
                <div className="hero-center">
                  <div className="hero-text">
                    <h1 className="hero-title">{s.title}</h1>
                    <h2 className="hero-subtitle">{s.subtitle}</h2>
                  </div>
                </div>
              </Container>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
      <div className="hero-booking-holder">
        <BookingForm />
      </div>
    </section>
  );
}
