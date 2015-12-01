import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './App';
import pages from './pages';

export default (
  <Route path="/" component={App}>
  	<IndexRoute component={pages.Home}/>
  	
  	<Route path="/result" component={pages.Result} />
  </Route>
);
