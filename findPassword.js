// HELPERS  -----------------------------------------------------------------------------

function verifyInput(query, property) {
	if (typeof property === 'string' && property.includes(query)) {
		return true;
	} else {
		return false;
	}
}

// AUTOFILL  ----------------------------------------------------------------------------

function autofill(query, input) {
	const type = input.type;
	const id = input.id;

	if (verifyInput(type, query) || verifyInput(id, query)) {
		chrome.storage.sync.get(query, (data) => {
			if (data[query]) {
				input.style.backgroundColor = '#FF6933';
				input.value = data[query];
			}
		})
	}
}

// PAGE SEARCHING -----------------------------------------------------------------------

var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach((input) => {
	// Try autofill fields
	try {
		autofill('username', input);
		autofill('password', input);
	} catch {
		console.log('No inputs found');
	}
});



