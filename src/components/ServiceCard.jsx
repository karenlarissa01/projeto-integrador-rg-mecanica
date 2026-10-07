import { Link } from "react-router-dom";

function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <img
        className="service-card__image"
        src={service.image}
        alt={service.name}
      />

      <div className="service-card__content">
        <h3>{service.name}</h3>
        <p>{service.description}</p>

        <Link to="/login" className="service-card__button">
          <span>Agendar serviço</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default ServiceCard;