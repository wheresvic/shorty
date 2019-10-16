import React from "react";
import nextCookie from "next-cookies";

import Layout from "../components/Layout";
import Navbar from "../components/Navbar";

const Home = ({token}) => {

  return (
    <Layout>
      <Navbar token={token} />
      <h1>Cookie-based authentication example</h1>

      <p>Steps to test the functionality:</p>

      <ol>
        <li>Click login and enter your GitHub username.</li>
        <li>
          Click home and click profile again, notice how your session is being used through a token stored in a cookie.
        </li>
        <li>Click logout and try to go to profile again. You'll get redirected to the `/login` route.</li>
      </ol>
    </Layout>
  );
};

Home.getInitialProps = async ctx => {
  const { token } = nextCookie(ctx);
  return { token };
};

export default Home;
