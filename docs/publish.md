# Publish to surge.sh

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


