"use strict"

import React from 'react'
import App from './App'
import { Router } from 'react-router'
import routes from './routes'
import { createHashHistory } from 'history';
//import jquery from 'jquery'

// Bootstrap needs jQuery.
//window.$ = window.jQuery = jquery

// Routing.
let history = createHashHistory({queryKey: false});

React.render(
	(<Router history={history}>{routes}</Router>), 
	document.getElementById('app')
	)