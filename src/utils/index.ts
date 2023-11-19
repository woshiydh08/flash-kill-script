export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Assert function (you may need to implement this according to your requirements)
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

// Mocking the utils.now function
export const utils = {
  now: () => {
    // Implement your logic for getting current time in a similar way in Node.js
    return Date.now()
  },
  nowTs: () => {
    // Implement your logic for getting current time in a similar way in Node.js
    return Date.now()
  },

  inputStr: (prompt) => {
    return new Promise((resolve) => {
      // rl.question(prompt, (answer) => {
        resolve(prompt)
      // })
    })
  },
}

// export function assert(condition, message) {
//   if (!condition) {
//     throw new Error(message || "Assertion failed");
//   }
// }
