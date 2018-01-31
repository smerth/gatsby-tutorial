## Building a PDF Library with Gatsby.js

Published on Sunday 26th of November, 2017

- Tagged with:
- [Node.js](http://blog.blakesimpson.co.uk/?category_id=17)
- [Javascript](http://blog.blakesimpson.co.uk/?category_id=9)

Like most developers I have large libraries of PDF books lying around in a folder somewhere. In order to organise the books and get a better overview I decided to work on a weekend project designed to investigate [Gatsby.js](https://www.gatsbyjs.org/), a React / GraphQL based static site generator. The project was to use Gatsby to build a PDF library that would allow me to put my PDF books into the project and then build a simple static website that would list the PDFs, give some information about each book, allow me to read them online, and finally download them if I wanted.

## Demo

My static Gatsby based PDF library ended up with the following features:

- List view of PDF books, read from the file system
- Metadata extraction from the PDF book (Author, Page count, etc.)
- Read a book online
- "Fullscreen" reading mode
- Download a book
- Remember your page number, for future reading
- Search for books

You can see a demo of the Library here: <https://blakesimpson.github.io/gatsby-library/>

## What is Gatsby?

![Gatsby](https://i.imgur.com/NaqsHHm.jpg)

As mentioned in the introduction, [Gatsby.js](https://www.gatsbyjs.org/) is a static site generator built with JavaScript. Gatsby uses [React](https://reactjs.org/) for building the views and a [GraphQL](http://graphql.org/) API that is queried from your views to read information about your static files.

This means you can add, for example, a bunch of Markdown files to your project and Gatsby will run through each file (what it calls a "node") to index these and put them into the GraphQL index. You can then build a list of your Markdown articles to the home page and link to each one and render it as a web page.

With this setup, Gatsby is very good for building static websites that do not rely on a database at runtime, for example, a blog.

However, Gatsby can not only read Markdown files from your system, it can read any file type such as an Excel spreadsheet, or as I discovered, a PDF.

Before going on to show how I extracted PDF information and put it into the Gatsby index you might want to try out some [Gatsby starter examples](https://www.gatsbyjs.org/docs/gatsby-starters/) such as the `gatsby-blog`.

Also, if you have never worked with Gatsby before, it is a good idea to work through the [tutorial](https://www.gatsbyjs.org/tutorial/)which helps to understand the Gatsby concepts such as configuration, the node server, and how the plugins work.

## Processing files with gatsby-node

Gatsby uses a file called `gatsby-node.js` which has a `onCreateNode` callback that is called when it encounters a static file in the project, allowing you to do processing on it. You can then add this processed information into the Gatsby data index.

There is also the `createPages` callback which allows you to extract information from the GraphQL index and build static pages from it.

For example, a `gatsby-node` file may look like:

```javascript
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, boundActionCreators }) => {
  const { createNodeField } = boundActionCreators
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}


exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators
  return new Promise((resolve, reject) => {
    graphql(`
      {
        allMarkdownRemark {
          edges {
            node {
              fields {
                slug
              }
            }
          }
        }
      }
    `
).then(result => {
    result.data.allMarkdownRemark.edges.map(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: path.resolve(`./src/templates/blog-post.js`),
        context: {
          // Data passed to context is available in page queries as GraphQL variables.
          slug: node.fields.slug,
        },
      })
    })
    resolve()
  })
}

```

This example was lifted from the Gatsby tutorial. What it does is in the `onCreateNode` function, which is called for each static file in the project, it looks if the current file (node) is a markdown file, if so then create a "slug" (unique pathname) for the article and add it to the GraphQL index.

Finally in `createPages` a GraphQL query is used to retrieve all markdown files and ask for the slug field. `createPage` is then called to build a static web page, using the `blog-post` React template, and passed the queried data to it.

This is an example of how to parse files manually. However, if you have Gatsby plugins installed, they will also use Gatsby node callbacks to watch for files and automatically add items to your GraphQL index, for example the [gatsby-transformer-remark](https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-transformer-remark/src/on-node-create.js) plugin looks for markdown file, extracts meta information from the the file, and adds this to the index.

## PDF Extract

Now that you have a better understanding of how Gatsby works, let's take a look at how to parse PDF information instead of simply Markdown information.

There is a great library [pdf.js-extract](https://www.npmjs.com/package/pdf.js-extract) which is extracted from PDFJS, which we will discuss in a moment.

`pdf.js-extract` allows us to pass the filename of a PDF file and it will extract information such as raw metadata (author, date created, etc.) as well as the actual page information, detailing the X/Y coordinates, content, font etc. of each element of the page.

I plug `pdf.js-extract` into our gatsby-node `onCreateNode` callback and analyse any PDF files that are found. I then extract the title, author, page count, and fingerprint (unique ID) and enter this into the GraphQL index.

Here is the `gatsby-node.js` file:

```javascript
const path = require('path');
const { createFilePath } = require(`gatsby-source-filesystem`);
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require('fs');

exports.onCreateNode = ({ node, getNode, boundActionCreators }) => {
  const { createNode, createParentChildLink } = boundActionCreators;

  if (node.internal.mediaType === `application/pdf`) {
    const path = createFilePath({ node, getNode, basePath: `pages` });
    const metadata = {};
    const pdfPath = node.absolutePath;

    pdfExtract.extract(
      pdfPath,
      {} /* options, currently nothing available*/,
      function(err, data) {
        if (err) {
          return console.log(err);
        }

        if (data.meta.info) {
          const downloadPath = pdfPath.match(
            /(.*)\/src\/pages\/books\/(.*)/
          )[2];
          const fallbackName = downloadPath.replace(/\.pdf$/, '');

          metadata.downloadPath = `../../pdf/${downloadPath}`;
          metadata.title = data.meta.info.Title || fallbackName;
          metadata.author = data.meta.info.Author || 'Unknown';
          metadata.pageCount = (data.pdfInfo.numPages || 0).toString();
          metadata.fingerprint = data.pdfInfo.fingerprint || Math.random().toString();
        }

        const bookNode = {
          ...metadata,
          path: path.replace(/\s|\(|\)|\[|\]\<|>/g, '-'),
          id: `${node.id} [${metadata.fingerprint}] >>> ${node.extension}`,
          children: [],
          parent: node.id,
          internal: {
            contentDigest: data.pdfInfo.fingerprint,
            type: 'book'
          }
        };

        createNode(bookNode);
        createParentChildLink({ parent: node, child: bookNode });
      }
    );
  }
};

```

This is quite complex but you can see that if the current node (static file) has the type `application/pdf`, I tell `PDFExtract` to parse the file. If the file can be read I build a `metadata`object containing the information I want stored inside GraphQL.

I then build a `bookNode` object which contains all of the information Gatsby needs to add this entry to the index, and call `createNode` and `createParentChildLink` to insert the new node into the GraphQL index.

For more information about the node APIs, [see the Gatsby documentation](https://www.gatsbyjs.org/docs/node-apis/).

After adding this, we now have PDF information in GraphQL and we can query it like so:

```graphql
query IndexQuery {
  allBook(sort: { fields: [title] }) {
    totalCount
    edges {
      node {
        id
        path
        title
        author
        pageCount
        fingerprint
        downloadPath
      }
    }
  }
}

```

Finally, we have to use the `createPages` callback to tell Gatsby which template and information to build the static HTML pages with. This looks like:

```javascript
exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators;

  return new Promise((resolve, reject) => {
    const viewBook = path.resolve('./src/templates/view-book.js');
    resolve(
      graphql(
        `
          {
            allBook(limit: 1000) {
              edges {
                node {
                  path
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
        }

        // Create blog posts pages.
        result.data.allBook.edges.forEach(edge => {
          createPage({
            path: edge.node.path,
            component: viewBook,
            context: {
              path: edge.node.path
            }
          });
        });
      })
    );
  });
};

```

For the full `gatsby-node` file, see my `gatsby-library` source code: https://github.com/BlakeSimpson/gatsby-library/blob/master/gatsby-node.js

## Using PDFJS

Now that we have information about the PDF, we can use Mozilla's [PDFJS](https://mozilla.github.io/pdf.js/) to actually render the book into a `<canvas>` element on the "view-book" page, so that you can read the book directly on the website.

PDFJS can be added to your project as a NPM module, install it with

```bash
yarn add pdfjs-dist
```

It can then be imported into your `view-book` template with

```javascript
import PDFJS from 'pdfjs-dist';
```

Once PDFJS is loaded, I use React's `componentDidMount` to initialise PDFJS and pass it the download path to the book, which is provided to our React component `props` via Gatsby, from our GraphQL query.

The instance of the PDFJS reader is then stored in `this.pdf` for later use. Finally I call `renderPage` which will render the PDF to the canvas.

```javascript
componentDidMount() {
  const loadingTask = PDFJS.getDocument(this.props.data.book.downloadPath);

  loadingTask.promise.then(
    function(pdf) {
      this.pdf = pdf;

      this.renderPage();
    }.bind(this)
  );
}

```

Since I am using React component state for tracking the current page number, when that page number is updated via the "Next" and "Previous" buttons on the page, `componentDidUpdate` is called. This method also calls `renderPage` which will tell PDFJS to redraw the PDF canvas with the new page number found in `this.state`.

```javascript
componentDidUpdate() {
  this.renderPage();
}
```

The `renderPage` method which is in charge of drawing the PDF looks like:

```javascript
renderPage() {
  this.pdf.getPage(this.state.page).then(function(page) {
    const scale = 1.5;
    const viewport = page.getViewport(scale);

    // Prepare canvas using PDF page dimensions
    const canvas  = document.getElementById('book-canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width  = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    page.render(renderContext);
  });
}

```

## Copy files to build

This all works well in development mode (running `gatsby develop`) because the PDF books are on our local file system. However, it is important to remember that when you run the production build of the static website that would be published online, Gatsby does not copy the physical source files. For example if you had a blog with markdown files as the articles, gatsby just extracts the contents of the markdown files and builds the static HTML from them. No markdown file will be in your final build.

This was a bit or a roadblock for me, since I need the actual PDF on the server so that PDFJS can read it. Initially I had the idea to Base64 encode the contents of the PDF and put this into the Gatsby index, since PDFJS can accept Base64 encoded data instead of a URL to the PDF.

As you can imagine, this was extremely inefficient to basically encode and copy the PDF (which can easily be > 10 MB) into a JSON file, so that Gatsby could read it. I even managed to make node.js run out of memory when building the project and had to [learn how to increase node's memory](https://gist.github.com/ThomasG77/3f2e52133411a4520155fca4e09e28ed).

A much simpler solution that is far less over-engineered was to use the [gatsby-plugin-copy-files](https://www.npmjs.com/package/gatsby-plugin-copy-files)plugin to simply copy the PDFs into the final distribution and upload them to the server.

## Wrapping up

There are a lot of code samples from the main parts of the Library project in this article but posting the contents of all files would have been to much. Some things such as the book list / index view have not been mentioned. If you would like to see the full source code for the `gatsby-library` example, you can find it on GitHub: https://github.com/BlakeSimpson/gatsby-library

Overall, using any static site generator to build a PDF library is not the best solution to that particular problem. Every time you add a new book, you need to copy it to the project and run a full build/deploy again, it would be simpler just running a node, ruby, or any other kind server that can read the PDFs directly at runtime.

However, it is nice being able to pre-process the PDF files though to build the index, since `pdf.js-extract` need some time to read and extract the PDF information. Doing this at runtime may be quite slow.

Overall though, this was a fun play project, I have learned a lot about Gatsby which I would recommend for simple websites such as a blog, event information, or a landing page. I have learned more about GraphQL and it's intricacies, and I have learned a lot about PDF's, and how to work with them in the JavaScript world.

## Bonus: Storing PDFs as Base64

As I mentioned previously, my original approach to handling the PDFs was to Base64 encode their contents and add this to the Gatsby index. This was done by reading the PDF file contents and calling `toString('base64')` on it.

```
const base64content = fs.readFileSync(pdfPath).toString('base64');

```

I would then use the JavaScript `atob` function which decodes Base64 data and pass the decoded data to PDFJS on the read book view.

```
  componentDidMount() {
    const pdfData = atob(this.props.data.book.content);
    const loadingTask = PDFJS.getDocument({ data: pdfData });

    ...
  }

```

This worked surprisingly well in development mode. However, as I said, it was a bad solution for the production build but I think it is worth sharing that this is technically possible.