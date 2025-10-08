
import {Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import type { JSX } from '@emotion/react/jsx-dev-runtime';

export const LandingLayout = (): JSX.Element => {
  return (
    <>
      <Header/>
      <Outlet/>
      <Footer/>
    </>
  );
};

export default LandingLayout;