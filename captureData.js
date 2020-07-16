// HELPERS  -----------------------------------------------------------------------------

function verifyInput(query, property) {
	if (typeof property === 'string' && property.includes(query)) {
		return true;
	} else {
		return false;
	}
}

// DATA CAPTURE  ------------------------------------------------------------------------

function capture(query, name, input) {
	const type = input.type;
	const id = input.id;

	if (verifyInput(type, query) || verifyInput(id, query)) {
		input.onchange = () => {
			const temp = {};
			temp[name] = input.value
			chrome.storage.sync.set(temp);
		}
	}
}

// PAGE SEARCHING -----------------------------------------------------------------------

var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach((input) => {
    console.log('capturing')

	// Try remember whats added
	try {
		capture('username', 'savedUsername', input);
		capture('password', 'savedPassword', input);
	} catch {
		console.log('No inputs found');
	}
});



