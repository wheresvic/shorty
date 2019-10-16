import React from "react";
import Head from "next/head";

const Layout = props => (
  <React.Fragment>
    <Head>
      <title>Shorty</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <link rel="stylesheet" type="text/css" href="/css/shorty.css" />
    </Head>

    {props.children}
  </React.Fragment>
);

export default Layout;
