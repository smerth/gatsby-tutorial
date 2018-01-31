# Publish a Gatsby site

## Publish to surge.sh

Install surge

```bash
npm install --global surge
```
Create an account

```bash
surge
```

Build the site

```bash
gatsby build
```

Deploy to surge

```bash
surge public/ -d satisfying-nerve.surge.sh
```

The `-d` specifies the domain to publish to if the site has already been published...

## Publish to GitHub Pages

### Deploying a project page

You can deploy sites on GitHub Pages with or without a custom domain. If you choose to use the default setup (without a custom domain), or if you create a project site, you will need to setup your site with [path prefixing](https://www.gatsbyjs.org/docs/path-prefix/).

On Github, you get one site per GitHub account and organization, and unlimited project sites. So it is most likely you will be creating a project site. If you do not have an existing repository on Github that you plan to use, take the time now to create a new repository on Github.

### Use the NPM package `gh-pages` for deploying

First add **gh-pages** as a `devDependency` of your site and create an npm script to **deploy** your project by running `npm install gh-pages --save-dev` or `yarn add gh-pages --dev` (if you have yarn installed).

Then add a `deploy` script in your `package.json` file.

```
"scripts": {
  "deploy": "gatsby build --prefix-paths && gh-pages -d public",
}
```

In the `gatsby-config.js`, set the `pathPrefix` to be added to your site’s link paths. The `pathPrefix` should be the project name in your repository. (ex.`https://github.com/username/project-name` - your `pathPrefix` should be`/project-name`). See [the docs page on path prefixing for more](https://www.gatsbyjs.org/docs/path-prefix/).

```
module.exports = {
  pathPrefix: `/project-name`,
}
```

If you have not yet initialized a git repository in your working gatsby site repo, set up git in your project with `git init`. Then tell Gatsby where to deploy your site by adding the git remote address with https or ssh. Here is how to do it with https: `git remote add origin git@github.com:username/project-name.git`.

Now run `yarn deploy` or `npm run deploy`. Preview changes in your GitHub page `https://username.github.io/project-name/`. You can also find the link to your site on GitHub under `Settings` > `GitHub Pages`.

### Deploying a user/organization site

Unlike project pages, user/organization sites on GitHub live in a special repository dedicated to files for the site. The sites must be published from the`master` branch of the repository which means the site source files should be kept in a branch named `source` or something similar. We also don’t need to prefix links like we do with project sites.

```
"scripts": {
  "deploy": "gatsby build && gh-pages -b master -d public",
}
```

The repository for these sites requires a special name. See<https://help.github.com/articles/user-organization-and-project-pages/> for documentation on naming your site’s repository.

If you wish to link your custom domain with your `user.github.io` repo, you will need a `CNAME` file inside the `static` folder at the root directory level with the your custom domain url inside, like so:

```
your-custom-domain.com
```

