# atom-snapshot

A tool to snapshot articles found in an atom feed.

## Installation

```
npm install -g atom-snapshot
```

## Usage

```
 $ atom-snapshot http://domain.com/atom.xml [options]

   Options:

    --format              Either png, jpeg, gif, pdf. Defaults to png
    --outputDir           Choose where to output your screenshots. Defaults to ./snapshots
    --width               Snapshot width as a number. Defaults to 768
    --height              Snapshot height as a number. Defaults to 1024
    --quality             Snapshot image quality as a number between 0 and 100. Defaults to 100
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
