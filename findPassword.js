// Page Searching -----------------------------------------------------------------------

var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach(function(input) {
	console.log(input.type, input.id)

	const type = input.type;
	const id = input.id;
	let username = false;
	let password = false;

	if (typeof type === 'string' && type.includes('password')) {
		password = true;
	}
	if (typeof id === 'string' && id.includes('username')) {
		username = true;
	}

	if (username) {
		chrome.storage.sync.get('username', function(data) {
			if (data.username) {
				input.style.backgroundColor = '#FF6933';
				input.value = data.username;
				var div = document.createElement('div');
				div.textContent = "LocalPass Username Used!";
				input.parentElement.appendChild(div);
			}
		})
	}
	if (password) {
		chrome.storage.sync.get('password', function(data) {
			if (data.password) {
				input.style.backgroundColor = '#FF6933';
				input.value = data.password;
				var div = document.createElement('div');
				div.textContent = "LocalPass Password Used!";
				input.parentElement.appendChild(div);
			}
		})
	}
});



