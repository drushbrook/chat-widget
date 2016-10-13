/**
* (C) Copyright IBM Corp. 2016. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

//https://en.wikipedia.org/wiki/Payment_card_number

var state = {
	acceptedCards: [],
	cardNumber: '',
	cardType: ''
};

var messages = {
	required: 'This field is required.',
	acceptedCard: function() {
		var text = 'We accept ';
		for (i = 0; i < state.acceptedCards.length; i++) {
			if (i > 0)
				text += ', ';
			if (i === (state.acceptedCards.length - 1))
				text += ' and ';
			text += cardData[state.acceptedCards[i]].human;
		}
		text += '. Please use a valid card.';
		return text;
	},
	invalid: 'Your credit card number is invalid.',
	invalidExpiration: 'Your credit card expiration date is invalid.',
	invalidCvv: 'Your CVV is invalid.'
};

var cardData = {
	"visa": {
		human: "Visa",
		prefixes: [4],
		lengths: [13, 16, 19]
	},
	"mastercard": {
		human: "MasterCard",
		prefixes: [51, 52, 53, 54, 55],
		lengths: [16]
	},
	"amex": {
		human: "American Express",
		prefixes: [34, 37],
		lengths: [15]
	},
	"discover": {
		human: "Discover",
		prefixes: [6011, 65],
		lengths: [16, 19]
	}
};

var i;
//MasterCard adding these numbers in 2017
for (i = 2221; i <= 2720; i++)
	cardData.mastercard.prefixes.push(i);

for (i = 622126; i <= 622925; i++)
	cardData.discover.prefixes.push(i);

for (i = 644; i <= 649; i++)
	cardData.discover.prefixes.push(i);

function _detectCard() {
	for (var i = 0; i < state.acceptedCards.length; i++) {
		var data = cardData[state.acceptedCards[i]];
		for (var j = 0; j < data.prefixes.length; j++) {
			var x = data.prefixes[j].toString();
			if (state.cardNumber.substring(0, x.length) === x) {
				state.cardType = state.acceptedCards[i];
				return true;
			}
		}
	}
	return false;
}

function _checkKuhn() {
	var checksum = 0; // running checksum total
	var j = 1; // takes value of 1 or 2

	// Process each digit one by one starting at the right
	var calc;
	for (var i = state.cardNumber.length - 1; i >= 0; i--) {
		// Extract the next digit and multiply by 1 or 2 on alternative digits.
		calc = Number(state.cardNumber.charAt(i)) * j;

		// If the result is in two digits add 1 to the checksum total
		if (calc > 9) {
			checksum = checksum + 1;
			calc = calc - 10;
		}

		// Add the units element to the checksum total
		checksum = checksum + calc;

		// Switch the value of j
		j = (j == 1) ? 2 : 1;
	}

	// All done - if checksum is divisible by 10, it is a valid modulus 10.
	// If not, report an error.
	return (checksum % 10 != 0) ? false : true;
}

function validateCard(acceptedCards, cardNumber) {
	state.acceptedCards = acceptedCards;
	state.cardNumber = cardNumber.replace(/\D/g,''); //strip extra characters
	if (cardNumber.length === 0) {
		return {
			"message": messages.required,
			"valid": false
		};
	}
	if (state.cardNumber.length === 0) {
		return {
			"message": messages.required,
			"valid": false
		};
	}
	if (_detectCard()) {
		if (state.acceptedCards.indexOf(state.cardType) === -1) {
			return {
				"message": messages.acceptedCard(),
				"valid": false
			};
		}
		if (cardData[state.cardType].lengths.indexOf(state.cardNumber.length) === -1) {
			return {
				"message": messages.invalid,
				"valid": false
			};
		}
		if (_checkKuhn() === false) {
			return {
				"message": messages.invalid,
				"valid": false
			};
		}
	} else {
		return {
			"message": messages.invalid,
			"valid": false
		};
	}

	return {
		"valid": true
	};
}

function validateExp(userM, userY) {
	var d = new Date();
	var month = d.getMonth();
	var year = d.getFullYear();

	if (userM.length === 0 || userY.length === 0 || userM.replace(/\D/g,'').length === 0 || userY.replace(/\D/g,'').length === 0) {
		return {
			"message": messages.required,
			"valid": false
		};
	}

	userM = parseInt(userM, 10);
	userY = parseInt(userY, 10);

	if (userM > 12 || userM < 1 || (userY > year + 20) || (userY < year || (userY === year && userM < month))) {
		return {
			"message": messages.invalidExpiration,
			"valid": false
		};
	}
	return {
		"valid": true
	};
}

function validateCVV(CVV) {
	if (CVV.length === 0) {
		return {
			"message": messages.required,
			"valid": false
		};
	}
	if (!isNaN(CVV) && (CVV > 9999 || CVV < 100)) {
		return {
			"message": messages.invalidCvv,
			"valid": false
		};
	}
	return {
		"valid": true
	};
}

module.exports = {
	validateCard: validateCard,
	validateExp: validateExp,
	validateCVV: validateCVV,
	cardData: cardData
};
