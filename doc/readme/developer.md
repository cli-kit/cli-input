## Developer

### Test

Run all tests with code coverage:

```
npm test
```

Execute an individual test with:

```
npm run pretest && NODE_ENV=test ./node_modules/.bin/mocha --reporter list ./test/spec/confirm.js
```

### Readme

To build the readme file from the partial definitions (requires [mdp][]):

```
npm run readme
```
