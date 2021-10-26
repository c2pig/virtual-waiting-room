module.exports = {
  pathPrefix: `/room`,
  siteMetadata: {
    title: `Waiting Room`,
    description: ``,
    author: `@kbt`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
  ],
}
