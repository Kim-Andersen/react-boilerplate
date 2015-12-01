"use strict"

import React from 'react'
import { PropTypes } from 'react'

let Footer = React.createClass({
	render: function() {
		return (
			<footer>
				<nav className="navbar navbar-default navbar-fixed-bottom">
				  <div className="container-fluid">
				    <div className="navbar-header">
				      <a className="navbar-brand" href="/">
				        footer...
				      </a>
				    </div>
				  </div>
				</nav>
			</footer>
		);
	}
})
	
export default Footer