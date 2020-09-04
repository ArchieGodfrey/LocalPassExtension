// HELPERS  -----------------------------------------------------------------------------

function verifyInput(query, property) {
	if (typeof property === 'string' && property.includes(query)) {
		return true;
	} else {
		return false;
	}
}

// AUTOFILL  ----------------------------------------------------------------------------

function autofill(query, data, input) {
	const type = input.type;
	const id = input.id;

	if (verifyInput(type, query) || verifyInput(id, query)) {
		input.style.backgroundColor = '#FF6933';
		input.value = data;
	}
}

// PAGE SEARCHING -----------------------------------------------------------------------

function getInputs({username, password}) {
	var inputs = document.getElementsByTagName("input");
	Array.prototype.slice.call(inputs).forEach((input) => {
		// Try autofill fields
		try {
			autofill('username', username, input);
			autofill('password', password, input);
		} catch {
			console.error('No inputs found');
		}
	});
}

function showLogins(logins) {
	var found = false;
	var inputs = document.getElementsByTagName("input");
	Array.prototype.slice.call(inputs).forEach((input, index) => {
		if (verifyInput(input.type, 'username') || verifyInput(input.id, 'username')) {
			found = true
			logins.forEach((login) => {
				var div = document.createElement("div");
				div.style.width = "100px";
				div.style.height = "100px";
				div.style.background = "red";
				div.style.color = "white";
				div.innerHTML = login.username;
				document.getElementsByTagName("input")[index].appendChild(div);
			})
		}
	});
}

// GET LOGINS ---------------------------------------------------------------------------

chrome.storage.local.get('logins', ({logins}) => {
	if (logins) {
		const keys = Object.keys(logins);
		// if (keys.length > 1) {
		// 	const loginArray = [];
		// 	keys.forEach((key) => {
		// 		loginArray.push(logins[key]);
		// 	});
		// 	showLogins(loginArray)
		// } else {
		// 	getInputs(logins[key]);
		// }
		getInputs(logins[keys[0]]);
	}
})



