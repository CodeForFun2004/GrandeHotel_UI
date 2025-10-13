import {Outlet } from 'react-router-dom';
import type { JSX } from '@emotion/react/jsx-dev-runtime';

export const AuthLayout = (): JSX.Element => {
  return (
    <>
      <Outlet/>
    </>
  );
};

export default AuthLayout;