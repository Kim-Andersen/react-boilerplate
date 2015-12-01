"use strict"

import React from 'react'
import { PropTypes } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'

let App = React.createClass({
	render: function() {
		return (
			<div>
				<Header />

				<div className="container-fluid">
					{this.props.children}
				</div>

				<Footer />
			</div>
		);
	}
})
	
export default App