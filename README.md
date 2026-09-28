# ios-style-calculator

🧮 A recreation of the iOS calculator interface built with HTML, CSS, and JavaScript

**Live demo:** _coming soon_

Built as a mini project during  my internship at MBOA DIGITAL, to show the JavaScript concepts I learned in my courses. It is entirely written in just HTML, CSS and JavaScript.

Inspired by the iPhone calculator. This is not a copy, and it is not affiliated with Apple.

## Features

- The four basic operations (`+ − × ÷`) and functions (`=`, `%`, `±` and `AC`/`C`)
- Chained operations, calculated left to right like the iPhone in portrait mode (`2 + 3 × 4 =` gives 20)
- Repeated `=` repeats the last operation (`2 + 3 = =` gives 8)
- The pending operator stays highlighted until you type the next number
- Long numbers fit the display: 9 digits maximum, French number format (`1 234 567,5`), a smaller font, and scientific notation for very large results
- Division by zero shows `Error`, and `0,1 + 0,2` shows `0,3`
- The logo button opens an "About" window with the credits

## How to use

Click the buttons, or use your keyboard:

| Key | Action |
|-----|--------|
| `0`–`9` | Digits |
| `,` or `.` | Decimal comma |
| `+` `-` `*` `/` | Operators |
| `Enter` or `=` | Equals |
| `%` | Percent |
| `Backspace` | Delete the last digit |
| `Escape` | Clear |

## Course concepts used

- **HTML & CSS:** page structure, classes, CSS Grid, Flexbox, the box model, `rem` units
- **DOM & events:** selecting elements, click and keyboard events, adding and removing classes, a modal window
- **Logic:** state variables and an `init()` function, functions, `if/else`, the ternary operator and `switch`, `for` and `for-of` loops, a `Map`
- **Numbers & strings:** type conversion with `Number()`, rounding with `Math.trunc`, string methods (`indexOf`, `slice`, `trim`) to format the display

## Credits

<a href="https://www.flaticon.com/free-icons/calculate" title="calculate icons">Calculate icons created by Pixel perfect - Flaticon</a>
