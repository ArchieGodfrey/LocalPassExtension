// AUTOFILL  ----------------------------------------------------------------------------

function autofill(query, input) {
	const type = input.type;
	const id = input.id;
	let found = false;

	if (typeof type === 'string' && type.includes(query)) {
		found = true;
	}
	if (typeof id === 'string' && id.includes(query)) {
		found = true;
	}

	if (found) {
		chrome.storage.sync.get(query, (data) => {
			if (data[query]) {
				input.style.backgroundColor = '#FF6933';
				input.value = data[query];
				var div = document.createElement('div');
				div.textContent = "LocalPass Used!";
				input.parentElement.appendChild(div);
			}
		})
	}
}

// PAGE SEARCHING -----------------------------------------------------------------------

var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach((input) => {
	console.log(input.type, input.id)
	// Try autofill fields
	try {
		autofill('username', input);
		autofill('password', input);
	} catch {
		console.log('No inputs found');
	}
});



