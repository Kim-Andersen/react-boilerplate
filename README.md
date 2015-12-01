## Nova Web Client

### Install

* Clone the repo
* Run `npm install`

### Development
* Run `NODE_ENV=development gulp`
* Go to `localhost:8889` to display the app
* Go to `localhost:8889/testrunner.html` to see your tests
* Any changes to `app` or `styles` folder will automatically rebuild to `build` folder
* Both tests and application changes will refresh automatically in the browser
* Run `gulp test` to run all tests with phantomJS and produce XML reports

### Minify the code, ready for production
* Run `NODE_ENV=production gulp deploy`

### Directory
* **build/**: Where the app automatically builds to. This is where you launch your app in development
* **dist/**: Where the deployed code exists, ready for production
* **sass/**: Where you put your scss files
* **specs/**: Where you put your test files
* **gulpfile**: Gulp configuration
