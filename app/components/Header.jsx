"use strict"

import React from 'react'
import { PropTypes } from 'react'
import { Link } from 'react-router'

let Header = React.createClass({
	render: function() {
		return (
			<header>
				<nav id="navbar" className="navbar navbar-default navbar-fixed-top">
				  <div className="container-fluid">

				    <div className="navbar-header">
				      <Link className="navbar-brand" to="/">
				        NOVA
				      </Link>
				    </div>

				    <div className="collapse navbar-collapse">
				      <ul className="nav navbar-nav">
				        <li><Link to="/result">Resultat</Link></li>
				      </ul>
				    </div>

				  </div>
				</nav>
			</header>
		);
	}
})
	
export default Header