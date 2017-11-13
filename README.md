
liquicode_dreamscrape
============================================================================

seealso: https://blog.phantombuster.com/were-making-web-scraping-so-easy-that-you-re-going-to-love-it-d3efe3a3fad4


liquicode_dreamscrape is an R&D tool to assist in developing web scraping projects.


This project uses [PhantomJS](http://phantomjs.org/)
and [CasperJS](http://casperjs.org/).

If you already have NPM, you can do the following.
Otherwise, consult the above links to view specific installation instructions
from each project's website.

```
npm install phantomjs --global
npm install casperjs --global
```

## Dreamscrape Commands

DreamScrape is controlled by a set of commands (steps) that navigate and manipulate web pages.


### Navigation

- Url
- WaitFor

### Manipulation

- SendText
- SendKey
- Click

### Scraping

- ScrapeText
- ScrapeValue
- ScrapeArray
- ScrapeTable

### Other

- Debug
- Snapshot


