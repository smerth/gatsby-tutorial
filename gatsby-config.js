module.exports = {
  pathPrefix: 'gatsby-tutorial',
  siteMetadata: {
    title: `Smerth's Amazing Panda Blog`
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/src/`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/src/data/yaml`,
      },
    },
    {
      resolve: 'gatsby-plugin-copy-files',
      options: {
          source: `${__dirname}/src/pages/pdfs`,
          destination: '/assets/pdf'
      }
    },
    `gatsby-transformer-remark`,
    `gatsby-plugin-glamor`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`
      }
    },
    `gatsby-transformer-yaml`, 
  ]
};
