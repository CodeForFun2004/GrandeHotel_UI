import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

type RoomCardProps = {
  title: string;
  price: number;
  image: string;
  size: string;
  view: string;
  max: number;
  bed: number;
  id?: number;
};

const RoomCard: React.FC<RoomCardProps> = ({
  title,
  price,
  image,
  size,
  view,
  max,
  bed,
  id,
}) => {
  return (
    <div className="col-sm col-md-6 col-lg-4 ftco-animate">
      <div className="room">
        <Link
          to={`/rooms/${id ?? 1}`}
          className="img d-flex justify-content-center align-items-center"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="icon d-flex justify-content-center align-items-center">
            <FontAwesomeIcon icon={faSearch} />
          </div>
        </Link>
        <div className="text p-3 text-center">
          <h3 className="mb-3">
            <Link to={`/rooms/${id ?? 1}`}>{title}</Link>
          </h3>
          <p>
            <span className="price mr-2">${price.toFixed(2)}</span>{" "}
            <span className="per">per night</span>
          </p>
          <ul className="list">
            <li>
              <span>Max:</span> {max} Persons
            </li>
            <li>
              <span>Size:</span> {size}
            </li>
            <li>
              <span>View:</span> {view}
            </li>
            <li>
              <span>Bed:</span> {bed}
            </li>
          </ul>
          <hr />
          <p className="pt-1">
            <Link to={`/rooms/${id ?? 1}`} className="btn-custom">
              Detail <FontAwesomeIcon icon={faArrowRightLong} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;