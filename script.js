"use strict";

///////////////Selecting elements
//The El is here to mark it as a DOM Element
const displayEl = document.querySelector(`.display`);

//The buttons, grouped by their colour class
const digitBtns = document.querySelectorAll(`.btn--digit`); //0 to 9 and the decimal comma
const operatorBtns = document.querySelectorAll(`.btn--operator`); //÷ × − + and =
const functionBtns = document.querySelectorAll(`.btn--function`); //AC, ±, % and the logo
const clearBtn = document.querySelector(`.btn--function`); //querySelector returns the FIRST match, which is the AC button

//The modal window elements
const modal = document.querySelector(`.modal`);
const overlay = document.querySelector(`.overlay`);
const btnCloseModal = document.querySelector(`.modal__close`);
const btnOpenModal = document.querySelector(`.btn--about`);

///////////////Modal window
const openModal = function () {
  modal.classList.remove(`hidden`);
  overlay.classList.remove(`hidden`);
};

const closeModal = function () {
  modal.classList.add(`hidden`);
  overlay.classList.add(`hidden`);
};

btnOpenModal.addEventListener(`click`, openModal);
btnCloseModal.addEventListener(`click`, closeModal);
overlay.addEventListener(`click`, closeModal);

///////////////Starting conditions (the state of the calculator)
let currentInput; //The text on the display, as typed (`12.5`) or as calculated, or `Error`
let storedValue; //The first number of the operation, waiting for the second one
let pendingOperator; //The operator waiting for its second number: `+`, `−`, `×`, `÷` or null
let startNewNumber; //true when the next digit must replace the display instead of being added to it
let operatorPressed; //true right after an operator, so a second operator just replaces the first one
let lastOperator; //Remembered after = so that pressing = again repeats the operation
let lastOperand; //The second number of that operation

///////////////Helper functions

//Counts the digits of a text, without the decimal point and the minus sign
const countDigits = function (text) {
  let count = 0;
  for (const char of text) {
    if (char !== `.` && char !== `-`) count++;
  }
  return count;
};

//French number format for the display: `1234567.5` becomes `1 234 567,5`
//(inside the code, numbers keep the . because Number() only understands `1234567.5`)
const addSeparators = function (text) {
  let sign = ``;
  if (text[0] === `-`) {
    sign = `-`;
    text = text.slice(1);
  }

  //Split the text in two at the decimal point (if there is one)
  const dotIndex = text.indexOf(`.`);
  const integerPart = dotIndex === -1 ? text : text.slice(0, dotIndex);
  const decimalPart = dotIndex === -1 ? `` : `,${text.slice(dotIndex + 1)}`; //the . becomes a ,

  //Read the integer part backwards and put a space every 3 digits
  let withSpaces = ``;
  let count = 0;
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3) {
      withSpaces = ` ${withSpaces}`;
      count = 0;
    }
    withSpaces = integerPart[i] + withSpaces;
    count++;
  }

  return `${sign}${withSpaces}${decimalPart}`;
};

//Rounds a calculated result so it fits in 9 digits, like the iPhone
//(this also hides the floating-point noise: 0.30000000000000004 becomes 0.3)
const formatNumber = function (number) {
  if (number === 0) return `0`;

  const sign = number < 0 ? `-` : ``;
  let abs = number < 0 ? -number : number;

  //1. Normal notation: keep as many decimals as the 9 digits allow
  if (abs < 1000000000) {
    const integerDigits = `${Math.trunc(abs)}`.length;
    let factor = 1;
    for (let i = 0; i < 9 - integerDigits; i++) factor = factor * 10;

    //Math.trunc(x + 0.5) rounds x to the nearest whole number
    const rounded = Math.trunc(abs * factor + 0.5) / factor;

    //Only if the rounding didn't make the number too big or too small to show
    if (rounded < 1000000000 && rounded !== 0) {
      return sign + addSeparators(`${rounded}`);
    }
  }

  //2. Scientific notation (1,23457e15): bring the number between 1 and 10, counting the moves
  let exponent = 0;
  for (let i = 0; abs >= 10; i++) {
    abs = abs / 10;
    exponent++;
  }
  for (let i = 0; abs < 1; i++) {
    abs = abs * 10;
    exponent--;
  }

  let mantissa = Math.trunc(abs * 100000 + 0.5) / 100000; //5 decimals
  if (mantissa >= 10) {
    //9.999999 rounds up to 10, so it becomes 1 with one more move
    mantissa = 1;
    exponent++;
  }
  return `${sign}${addSeparators(`${mantissa}`)}e${exponent}`;
};

//Chooses how to show the current input
const formatDisplay = function (text) {
  if (text === `Error`) return text;

  //What the user types (9 digits max) is shown as typed, to keep `0,` or `2,50` while typing
  if (text.indexOf(`e`) === -1 && countDigits(text) <= 9)
    return addSeparators(text);

  //Long calculated results get rounded
  return formatNumber(Number(text));
};

//AC becomes C once a number is being typed
const isTypingEntry = function () {
  return !startNewNumber && currentInput !== `0`;
};

//Updates everything the user sees from the state variables (called after every key)
const updateDisplay = function () {
  const text = formatDisplay(currentInput);
  displayEl.textContent = text;

  //The font shrinks for long numbers so they stay on one line
  displayEl.style.fontSize =
    text.length > 7 ? `${56 / text.length}rem` : `8rem`;

  clearBtn.textContent = isTypingEntry() ? `C` : `AC`;

  //Highlight the pending operator, only until the next digit is typed
  for (const btn of operatorBtns) {
    if (operatorPressed && btn.textContent.trim() === pendingOperator) {
      btn.classList.add(`btn--active`);
    } else {
      btn.classList.remove(`btn--active`);
    }
  }
};

//Does the maths. Returns null when dividing by zero
const operate = function (a, operator, b) {
  switch (operator) {
    case `+`:
      return a + b;
    case `−`:
      return a - b;
    case `×`:
      return a * b;
    case `÷`:
      return b === 0 ? null : a / b;
  }
};

//Initialization function
const init = function () {
  currentInput = `0`;
  storedValue = null;
  pendingOperator = null;
  startNewNumber = true;
  operatorPressed = false;
  lastOperator = null;
  lastOperand = null;
  updateDisplay();
};

const showError = function () {
  init();
  currentInput = `Error`;
  updateDisplay();
};

///////////////Calculator functionalities

//Digits and the decimal point (always received as `.`, even when the button shows `,`)
const inputDigit = function (digit) {
  //After an error, the next digit starts a new calculation
  if (currentInput === `Error`) init();

  if (startNewNumber) {
    currentInput = digit === `.` ? `0.` : digit;
    startNewNumber = false;
  } else if (digit === `.`) {
    //Only one decimal point per number
    if (currentInput.indexOf(`.`) === -1) currentInput += `.`;
  } else if (countDigits(currentInput) < 9) {
    //9 digits max, and no leading zeros
    if (currentInput === `0`) currentInput = digit;
    else if (currentInput === `-0`) currentInput = `-${digit}`;
    else currentInput += digit;
  }

  operatorPressed = false;
  updateDisplay();
};

//+ − × ÷
const chooseOperator = function (operator) {
  if (currentInput === `Error`) return;

  //Chained operations: 2 + 3 × calculates 2 + 3 first (left to right, like the iPhone in portrait)
  if (pendingOperator && !operatorPressed) {
    const result = operate(storedValue, pendingOperator, Number(currentInput));
    if (result === null) return showError();
    currentInput = `${result}`;
  }

  //If an operator was pressed just before, this simply replaces it
  storedValue = Number(currentInput);
  pendingOperator = operator;
  operatorPressed = true;
  startNewNumber = true;
  updateDisplay();
};

//=
const calculate = function () {
  if (currentInput === `Error`) return;

  let result;
  if (pendingOperator) {
    //Normal case: 2 + 3 =   (and 5 + = uses the displayed number twice: 10)
    const operand = Number(currentInput);
    result = operate(storedValue, pendingOperator, operand);
    lastOperator = pendingOperator;
    lastOperand = operand;
    pendingOperator = null;
  } else if (lastOperator) {
    //Repeated =: 2 + 3 = = gives 8
    result = operate(Number(currentInput), lastOperator, lastOperand);
  } else {
    //Nothing to calculate
    return;
  }

  if (result === null) return showError();
  currentInput = `${result}`;
  startNewNumber = true;
  operatorPressed = false;
  updateDisplay();
};

//AC clears everything, C clears only the number being typed
const clear = function () {
  if (isTypingEntry()) {
    currentInput = `0`;
    startNewNumber = true;
    //Like the iPhone, the pending operator lights up again
    if (pendingOperator) operatorPressed = true;
    updateDisplay();
  } else {
    init();
  }
};

//±
const toggleSign = function () {
  if (currentInput === `Error`) return;

  if (operatorPressed) {
    //5 + ± starts the second number as -0
    currentInput = `-0`;
    startNewNumber = false;
    operatorPressed = false;
  } else {
    currentInput =
      currentInput[0] === `-` ? currentInput.slice(1) : `-${currentInput}`;
  }
  updateDisplay();
};

//%
const percent = function () {
  if (currentInput === `Error`) return;

  const value = Number(currentInput);
  //After + or −, % takes a percentage of the first number: 50 + 10 % shows 5
  //Otherwise it simply divides by 100
  currentInput =
    pendingOperator === `+` || pendingOperator === `−`
      ? `${(storedValue * value) / 100}`
      : `${value / 100}`;

  startNewNumber = true;
  operatorPressed = false;
  updateDisplay();
};

//Keyboard only: deletes the last digit typed
const backspace = function () {
  if (currentInput === `Error` || startNewNumber) return;

  currentInput = currentInput.slice(0, -1);
  if (currentInput === `` || currentInput === `-`) currentInput = `0`;
  updateDisplay();
};

//Initialize everything
init();

///////////////Buttons functionalities
//The text of each button tells us what it does (.trim() removes the spaces and line breaks around the text in the HTML)

for (const btn of digitBtns) {
  btn.addEventListener(`click`, function () {
    const digit = btn.textContent.trim();
    //The , button sends a . so that Number() can read the result later
    inputDigit(digit === `,` ? `.` : digit);
  });
}

for (const btn of operatorBtns) {
  btn.addEventListener(`click`, function () {
    const operator = btn.textContent.trim();
    if (operator === `=`) calculate();
    else chooseOperator(operator);
  });
}

for (const btn of functionBtns) {
  btn.addEventListener(`click`, function () {
    switch (btn.textContent.trim()) {
      case `AC`:
      case `C`:
        clear();
        break;
      case `±`:
        toggleSign();
        break;
      case `%`:
        percent();
        break;
      //The logo button has no text: it opens the modal (see the Modal window section)
    }
  });
}

///////////////Keyboard support
//Keyboard keys for the operators, and the symbol shown on the matching button
const operatorKeys = new Map([
  [`+`, `+`],
  [`-`, `−`],
  [`*`, `×`],
  [`/`, `÷`],
]);

//e stands for event
document.addEventListener(`keydown`, function (e) {
  //While the modal is open, only Escape works (it closes the modal)
  if (!modal.classList.contains(`hidden`)) {
    if (e.key === `Escape`) closeModal();
    return;
  }

  if (`0123456789`.indexOf(e.key) !== -1) {
    inputDigit(e.key);
  } else if (e.key === `,` || e.key === `.`) {
    //Both keys work for the decimal comma (keyboards and numeric keypads differ)
    inputDigit(`.`);
  } else if (operatorKeys.has(e.key)) {
    chooseOperator(operatorKeys.get(e.key));
  } else if (e.key === `Enter` || e.key === `=`) {
    //Stops Enter from also "clicking" the last button clicked with the mouse (see the note in the chat)
    e.preventDefault();
    calculate();
  } else if (e.key === `Backspace`) {
    backspace();
  } else if (e.key === `Escape`) {
    clear();
  } else if (e.key === `%`) {
    percent();
  }
});
