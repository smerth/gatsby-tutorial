import React from "react";
import g from "glamorous";
import { css } from "glamor";
import Link from "gatsby-link";

import { rhythm } from "../utils/typography";

import * as styles from './../css/menu.css';

// const linkStyle = css({ 
//   marginRight: '1em' 
// });

export default ({ children, data }) => (
  <g.Div
    margin={`0 auto`}
    maxWidth={960}
    padding={rhythm(2)}
    paddingTop={rhythm(1.5)}
  >
    <Link to={`/`}>
      <g.H3
        marginBottom={rhythm(1)}
        display={`inline-block`}
        fontStyle={`normal`}
      >
      {data.site.siteMetadata.title}
      </g.H3>
    </Link>
    <nav id="primary_nav_wrap">
      <ul>
        <li> 
          <Link to={`/`}>
            Blog
          </Link>
        </li>
        <li>
          <Link to={`#`}>
            Demo Pages
          </Link>
          <ul>
            <li>
              <Link to={`/demo/counter/`}>
                Counter
              </Link>
            </li>
            <li>
              <Link to={`/demo/site-files/`}>
                Site Files
              </Link>
            </li>
            <li>
              <Link to={`/lists/pdfs/`}>
                Read PDFs
              </Link>
          </li>
          </ul>
        </li>
        <li>
          <Link to={`/about/about/`}>
            About
          </Link>
        </li>
        <li>
          <Link to={`/about/contact/`}>
            Contact
          </Link>
        </li>
      </ul>
    </nav>
    {children()}
  </g.Div>
);

export const query = graphql`
  query LayoutQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`