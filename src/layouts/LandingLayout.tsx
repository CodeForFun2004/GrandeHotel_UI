
import {Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import type { JSX } from '@emotion/react/jsx-dev-runtime';

export const LandingLayout = (): JSX.Element => {
  return (
    <>
      <Header/>
  {/* BookingBar removed: keep landing page as originally designed with its own BookingForm */}
      <Outlet/>
      <Footer/>
    </>
  );
};

export default LandingLayout;