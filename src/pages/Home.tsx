
import { useModal } from '../components/context/useModal';
import VerfifyEmail from '../components/common/VerfifyEmail';

const Home = () => {

    const {openModal}  = useModal();

  return (
    <div>
      <button onClick={() => openModal({title: 'Xác thực email', content: <VerfifyEmail />})}>
        Mở modal xác thực email
      </button>
    </div>
  )
}

export default Home
