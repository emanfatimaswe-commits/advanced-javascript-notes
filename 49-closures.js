// =============================================================================
// FILE: 49-closures.js
// TOPIC: Lexical Scope and Closures
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 49)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT IS LEXICAL SCOPE? (Simple Explanation)
// =============================================================================

/*
  LEXICAL = "related to where it is written in the code"
  SCOPE   = "which variables are accessible"
  
  LEXICAL SCOPE means: a function can access variables from the place
  where it was DEFINED (written), NOT from where it is CALLED (invoked).
  
  THE FAMILY ANALOGY:
  
  Think of scopes as nested houses in a family compound:
  
  🏘️  GRANDPARENT's house  (Global Scope)
      → has: country = "Pakistan"
  
      🏠  PARENT's house  (Outer Function Scope)
          → has: city = "Karachi"
          → can also see: country (from grandparent)
  
          🏡  CHILD's house  (Inner Function Scope)
              → has: street = "Main Road"
              → can also see: city (from parent)
              → can also see: country (from grandparent)
  
  A child can walk OUT to see the parent's and grandparent's things.
  A parent CANNOT walk IN to see the child's things.
  
  In code: inner functions can access outer variables.
           outer functions CANNOT access inner variables.
  
  And crucially — this access is determined by WHERE the function
  is WRITTEN in the source code, NOT where it runs.
*/

// --- Example 1.1: Basic lexical scope ---

const country = "Pakistan";          // Global scope

function outerFunction() {
    const city = "Karachi";          // outerFunction's scope

    function innerFunction() {
        const street = "Main Road";  // innerFunction's scope

        // Inner can see: street (own) + city (parent) + country (grandparent)
        console.log(`${street}, ${city}, ${country}`);
    }

    innerFunction();
    // console.log(street); // ❌ ReferenceError — outer cannot see inner's street
}

outerFunction();
// Expected Output:
// Main Road, Karachi, Pakistan

/*
  DIAGRAM: Scope Nesting
  
  ┌─────────────────────────────────────────────┐
  │  GLOBAL SCOPE                               │
  │  country = "Pakistan"                       │
  │                                             │
  │  ┌───────────────────────────────────────┐  │
  │  │  outerFunction SCOPE                  │  │
  │  │  city = "Karachi"                     │  │
  │  │                                       │  │
  │  │  ┌─────────────────────────────────┐  │  │
  │  │  │  innerFunction SCOPE            │  │  │
  │  │  │  street = "Main Road"           │  │  │
  │  │  │                                 │  │  │
  │  │  │  Can access:                    │  │  │
  │  │  │  ✅ street  (own)               │  │  │
  │  │  │  ✅ city    (parent)            │  │  │
  │  │  │  ✅ country (grandparent)       │  │  │
  │  │  └─────────────────────────────────┘  │  │
  │  └───────────────────────────────────────┘  │
  └─────────────────────────────────────────────┘
  
  Access goes OUTWARD only. Never inward.
*/


// =============================================================================
// SECTION 2: WHAT IS A CLOSURE?
// =============================================================================

/*
  A CLOSURE is a function that REMEMBERS the variables from its outer scope
  even AFTER that outer scope has finished executing (returned).
  
  The inner function "closes over" its outer variables — it captures and
  holds a reference to them, keeping them alive in memory.
  
  ┌──────────────────────────────────────────────────────────────────┐
  │  CLOSURE = Function + The Environment (variables) it remembers   │
  └──────────────────────────────────────────────────────────────────┘
  
  This is the key insight: normally when a function finishes, its local
  variables are garbage-collected (deleted from memory).
  
  But if an INNER function that uses those variables is still reachable,
  JavaScript keeps the outer variables ALIVE in a hidden "closure scope".
*/

// --- Example 2.1: The simplest closure ---

function outerCounter() {
    let count = 0;   // This variable "belongs to" outerCounter

    function increment() {
        // increment is an inner function that uses `count` from outer scope
        count++;                  // closes over `count`
        console.log(count);
    }

    return increment;             // return the inner function — NOT its result
}

// outerCounter() has finished executing. Normally `count` would be gone.
// But increment() still references `count` — so it stays alive in memory.
const myCounter = outerCounter(); // myCounter = the increment function

myCounter();   // 1  ← count is still accessible!
myCounter();   // 2  ← the same count, incrementing
myCounter();   // 3  ← count persists between calls

// Expected Output:
// 1
// 2
// 3

/*
  DIAGRAM: Closure Memory Model
  
  After outerCounter() returns:
  
  ┌─────────────────────────────────────────────┐
  │  CLOSURE SCOPE (kept alive in memory)        │
  │  count = 3  ← NOT garbage collected         │
  │  because myCounter still references it      │
  └──────────────────────┬──────────────────────┘
                         │ closed over by
                    ┌────▼─────────────────┐
                    │  myCounter           │
                    │  (the increment fn)  │
                    └──────────────────────┘
  
  count persists as long as myCounter exists.
  When myCounter goes out of scope, count is THEN garbage collected.
*/


// =============================================================================
// SECTION 3: CLOSURES REMEMBER — NOT COPY
// =============================================================================

/*
  A closure does NOT take a snapshot (copy) of outer variables.
  It holds a LIVE REFERENCE to them.
  
  This means if the outer variable changes, the closure sees the change.
  
  This is the source of a famous bug in loops (see Section 7).
*/

// --- Example 3.1: Live reference, not a copy ---

function makeMultiplier(multiplier) {
    // multiplier is remembered by the returned function
    return function(number) {
        return multiplier * number;   // `multiplier` is closed over
    };
}

const double = makeMultiplier(2);    // multiplier = 2, locked in closure
const triple = makeMultiplier(3);    // multiplier = 3, locked in its own closure
const tenX   = makeMultiplier(10);   // multiplier = 10, its own closure

console.log(double(5));   // 10  ← 2 * 5
console.log(triple(4));   // 12  ← 3 * 4
console.log(tenX(7));     // 70  ← 10 * 7

// Each call to makeMultiplier creates a SEPARATE closure environment.
// double, triple, tenX each have their OWN multiplier — they don't share it.

// Expected Output:
// 10
// 12
// 70


// =============================================================================
// SECTION 4: PRACTICAL USE — DATA PRIVACY WITH CLOSURES
// =============================================================================

/*
  Closures are the original way to create PRIVATE data in JavaScript —
  before class fields with # existed.
  
  By closing over a variable, you can expose controlled access functions
  without ever exposing the variable itself.
*/

// --- Example 4.1: Private counter using closure ---

function createCounter(label) {
    let _count = 0;               // private — only accessible via the returned methods

    return {
        increment() {
            _count++;
            console.log(`${label}: ${_count}`);
        },
        decrement() {
            if (_count > 0) _count--;
            console.log(`${label}: ${_count}`);
        },
        reset() {
            _count = 0;
            console.log(`${label} reset to 0`);
        },
        get value() {
            return _count;         // read-only access
        }
    };
    // _count is NEVER exposed directly — only through these methods
}

const likes    = createCounter("Likes");
const comments = createCounter("Comments");   // its own separate _count

likes.increment();    // Likes: 1
likes.increment();    // Likes: 2
likes.increment();    // Likes: 3
likes.decrement();    // Likes: 2
likes.reset();        // Likes reset to 0

comments.increment(); // Comments: 1
comments.increment(); // Comments: 2

console.log(likes.value);    // 0  ← read-only getter
console.log(comments.value); // 2

// Expected Output:
// Likes: 1
// Likes: 2
// Likes: 3
// Likes: 2
// Likes reset to 0
// Comments: 1
// Comments: 2
// 0
// 2


// =============================================================================
// SECTION 5: COLOR BUTTON EXAMPLE — CLOSURES WITH EVENT LISTENERS
// =============================================================================

/*
  This is the classic real-world closure example from Hitesh sir's lectures.
  
  Imagine you have three buttons. Each button, when clicked, should change
  the page background to its own unique color.
  
  The WRONG way (using var in a loop) fails due to the closure-captures-
  reference problem (see Section 7).
  
  The RIGHT way uses closures — each button closes over its own color.
  
  We simulate this below without a DOM.
*/

// --- Example 5.1: Simulated color button example ---

function makeColorHandler(color) {
    // Each call creates a new closure with its own `color`
    return function() {
        // In a browser: document.body.style.background = color;
        console.log(`Background changed to: ${color}`);
    };
}

// Simulate 3 buttons with individual color handlers
const clickRed   = makeColorHandler("red");
const clickGreen = makeColorHandler("green");
const clickBlue  = makeColorHandler("blue");

// Simulate button clicks:
clickRed();    // Background changed to: red
clickGreen();  // Background changed to: green
clickBlue();   // Background changed to: blue

// Expected Output:
// Background changed to: red
// Background changed to: green
// Background changed to: blue

/*
  DIAGRAM: Each button's closure has its own `color`
  
  makeColorHandler("red")     → closure { color: "red"   } → clickRed
  makeColorHandler("green")   → closure { color: "green" } → clickGreen
  makeColorHandler("blue")    → closure { color: "blue"  } → clickBlue
  
  In a real browser you'd write:
  
  const colors = ["red", "green", "blue"];
  colors.forEach(color => {
      const btn = document.createElement("button");
      btn.style.background = color;
      btn.addEventListener("click", makeColorHandler(color));
      // OR: btn.addEventListener("click", () => { document.body.style.background = color; });
      // Arrow function inside forEach creates a closure over the `color` variable
      document.body.appendChild(btn);
  });
*/


// =============================================================================
// SECTION 6: CLOSURES IN NESTED FUNCTIONS
// =============================================================================

// --- Example 6.1: Multi-level closure ---

function bank(bankName) {
    let totalDeposits = 0;                     // bank-level private data

    function branch(branchCity) {
        let branchDeposits = 0;                // branch-level private data

        function account(accountHolder) {
            let balance = 0;                   // account-level private data

            return {
                deposit(amount) {
                    balance         += amount; // own data
                    branchDeposits  += amount; // parent closure
                    totalDeposits   += amount; // grandparent closure
                    console.log(
                        `[${bankName} – ${branchCity}] ${accountHolder}` +
                        ` deposited Rs.${amount}. Account: Rs.${balance}`
                    );
                },
                getBalance() { return balance; }
            };
        }

        return {
            openAccount: account,
            getBranchTotal() { return branchDeposits; }
        };
    }

    return {
        openBranch: branch,
        getBankTotal() { return totalDeposits; }
    };
}

const hbl       = bank("HBL");
const karachi   = hbl.openBranch("Karachi");
const lahore    = hbl.openBranch("Lahore");

const acc1 = karachi.openAccount("Eman");
const acc2 = karachi.openAccount("Ali");
const acc3 = lahore.openAccount("Sara");

acc1.deposit(5000);   // [HBL – Karachi] Eman deposited Rs.5000. Account: Rs.5000
acc2.deposit(3000);   // [HBL – Karachi] Ali deposited Rs.3000. Account: Rs.3000
acc3.deposit(7000);   // [HBL – Lahore] Sara deposited Rs.7000. Account: Rs.7000

console.log("Karachi branch total:", karachi.getBranchTotal()); // 8000
console.log("Lahore branch total:",  lahore.getBranchTotal());  // 7000
console.log("HBL bank total:",       hbl.getBankTotal());       // 15000

// Expected Output:
// [HBL – Karachi] Eman deposited Rs.5000. Account: Rs.5000
// [HBL – Karachi] Ali deposited Rs.3000. Account: Rs.3000
// [HBL – Lahore] Sara deposited Rs.7000. Account: Rs.7000
// Karachi branch total: 8000
// Lahore branch total: 7000
// HBL bank total: 15000


// =============================================================================
// SECTION 7: THE CLASSIC CLOSURE BUG — var IN LOOPS
// =============================================================================

/*
  This is one of the most famous JavaScript interview questions.
  
  THE PROBLEM: Using `var` in a for loop with callbacks.
  `var` is function-scoped, NOT block-scoped. All iterations share ONE `i`.
  By the time the callbacks run, the loop has finished and `i` is at its
  final value (usually loop length).
*/

// --- Example 7.1: The var loop bug ---

console.log("--- var bug ---");
for (var i = 0; i < 3; i++) {
    setTimeout(function() {
        console.log(i);   // prints 3, 3, 3 — NOT 0, 1, 2 ❌
    }, 0);
}
// Expected Output (after loop): 3  3  3  ← all same!

/*
  WHY: There is only ONE `i` (var is function-scoped).
  All three setTimeout callbacks close over the SAME `i`.
  By the time they run, the loop has finished and `i === 3`.
*/

// --- Example 7.2: Fix with let (block-scoped) ---

console.log("--- let fix ---");
for (let j = 0; j < 3; j++) {
    setTimeout(function() {
        console.log(j);   // 0, 1, 2 ✅ — each iteration has its own `j`
    }, 0);
}
// Expected Output (after loop): 0  1  2

// --- Example 7.3: Fix with closure (IIFE — for older code) ---

console.log("--- IIFE fix ---");
for (var k = 0; k < 3; k++) {
    (function(capturedK) {
        // IIFE immediately captures the current value of k
        // Each iteration creates a new scope with its own capturedK
        setTimeout(function() {
            console.log(capturedK);  // 0, 1, 2 ✅
        }, 0);
    })(k);
}
// Expected Output (after loop): 0  1  2


// =============================================================================
// SECTION 8: MEMORY IMPLICATIONS OF CLOSURES
// =============================================================================

/*
  Closures keep outer variables ALIVE in memory for as long as the inner
  function exists and is reachable.
  
  This is POWERFUL but can cause MEMORY LEAKS if not managed carefully.
  
  ✅ GOOD:  Closure is short-lived or the held data is small.
  ⚠️ WATCH: Closures over large datasets or DOM elements that are later removed.
  
  The solution: when you no longer need a closure, set its reference to null
  so the garbage collector can free the memory.
*/

function createHeavyOperation() {
    const largeData = new Array(1000000).fill("data"); // 1M items

    return function processData() {
        // closes over largeData — largeData stays in memory as long as
        // processData is reachable
        return largeData.length;
    };
}

let processor = createHeavyOperation();
console.log(processor()); // 1000000

// When done, release the reference so GC can clean up:
processor = null;         // largeData is now eligible for garbage collection
// Expected Output: 1000000


// =============================================================================
// SECTION 9: QUICK REVISION NOTES
// =============================================================================

/*
  ┌──────────────────────────┬───────────────────────────────────────────────┐
  │ Concept                  │ Key Point                                     │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │ Lexical scope            │ Access determined by where code is WRITTEN    │
  │ Scope lookup direction   │ Inner → Outer only. Never outer → inner       │
  │ Closure                  │ Function + its remembered outer variables      │
  │ When closure forms       │ When inner function is returned / stored      │
  │ Closure holds reference  │ Live reference, NOT a snapshot/copy           │
  │ Data privacy             │ Closed-over vars are not directly accessible  │
  │ var loop bug             │ All iterations share ONE var → same value     │
  │ let loop fix             │ Each iteration gets its own block-scoped var  │
  │ IIFE fix                 │ Wraps each iteration in a new function scope  │
  │ Memory implication       │ Closure keeps outer vars alive; null when done│
  │ Color button pattern     │ Each handler closes over its own color value  │
  └──────────────────────────┴───────────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 10: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Using `var` in loops with async callbacks (the classic bug)
*/
// for (var i = 0; i < 5; i++) { setTimeout(() => console.log(i), 0); }
// ← Prints 5 five times. Use `let` instead.

/*
  ❌ MISTAKE 2: Thinking the closure captures a copy of the variable
*/
// function outer() {
//     let x = 1;
//     const fn = () => console.log(x);
//     x = 99;               // changed AFTER fn was created
//     return fn;
// }
// outer()(); // 99 — NOT 1. Closure holds a REFERENCE, sees the latest value.

/*
  ❌ MISTAKE 3: Memory leak — holding large data in closures indefinitely
*/
// let bigFn = createHeavyOperation();   // 1M array kept alive
// // ... many operations later, bigFn is "forgotten" but still referenced
// // Fix: bigFn = null; when no longer needed

/*
  ❌ MISTAKE 4: Expecting closures to share state when they shouldn't
*/
// const c1 = createCounter("A");
// const c2 = createCounter("B");
// c1.increment(); // A: 1
// c2.increment(); // B: 1 ← separate closures, separate _count
// Each call to the factory creates an INDEPENDENT closure environment.

/*
  ❌ MISTAKE 5: Confusing lexical scope with dynamic scope
*/
// JavaScript uses LEXICAL scope — where you WRITE the function matters.
// NOT where you CALL it. The place of definition determines variable access.


// =============================================================================
// SECTION 11: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is lexical scope?
  A:  Lexical scope means a function's access to variables is determined by
      where it is WRITTEN in the source code, not where it is called. Inner
      functions can access outer variables; outer functions cannot access
      inner variables.

  Q2. What is a closure?
  A:  A closure is the combination of a function and the lexical environment
      (the outer variables) it was defined in. The function "remembers" and
      can access those outer variables even after the outer function has returned.

  Q3. When is a closure created?
  A:  A closure is created every time a function is defined inside another
      function and that inner function accesses variables from the outer scope.
      It becomes observable when the inner function outlives the outer function
      (is returned, stored, or passed as a callback).

  Q4. Does a closure capture variables by value or by reference?
  A:  By REFERENCE. The closure holds a live reference to the outer variable.
      If the outer variable changes after the closure is created, the closure
      will see the updated value — not the value at the time of creation.

  Q5. What is the var loop closure bug? How do you fix it?
  A:  Using var in a for loop with async callbacks (setTimeout, event listeners)
      causes all callbacks to share the same var variable. By the time they run,
      the loop has finished and all see the final value. Fix: use `let` (block-
      scoped) or an IIFE to capture each iteration's value in its own scope.

  Q6. How do closures enable data privacy?
  A:  By closing over a variable inside a function, you make it accessible only
      through the inner functions (methods) returned by the outer function. The
      variable itself is never exposed directly. This is the module pattern.

  Q7. Can closures cause memory leaks?
  A:  Yes. If a closure references a large object or DOM element, those stay in
      memory as long as the closure is reachable. Set the closure reference to
      null when no longer needed to allow garbage collection.

  Q8. What is the difference between closure and scope?
  A:  Scope is the set of rules that determine which variables are accessible
      where. A closure is a specific artefact — a function that captures and
      retains access to its outer scope's variables even after execution ends.

  Q9. Explain the color button closure pattern.
  A:  Each button's click handler is created inside a factory function that
      receives the button's color as a parameter. The handler closes over that
      color value. When clicked, it uses the captured color — each handler
      has its own independent closure with its own color.

  Q10. What is an IIFE and how does it relate to closures?
  A:   An IIFE (Immediately Invoked Function Expression) is a function defined
       and called at the same time: (function(){ ... })(). It creates a new
       scope immediately. In the context of closures and loops, an IIFE wraps
       each iteration to capture the current variable value in a new scope,
       solving the var loop bug before `let` existed.
*/


// =============================================================================
// SECTION 12: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Basic):
  Write a function `makeGreeter(greeting)` that returns a new function.
  The returned function accepts a name and logs: "greeting, name!"
  Create greetings for "Hello", "Hi", and "Assalam" and test each.

  ✏️ EXERCISE 2 (Data Privacy):
  Create a `createWallet(initialBalance)` function that returns an object with:
    - deposit(amount)
    - withdraw(amount) — rejects if amount > balance
    - getBalance()     — read-only
  The balance variable must NOT be accessible directly from outside.
  Test it and verify that wallet._balance is undefined (truly private).

  ✏️ EXERCISE 3 (Loop Bug):
  Predict the output of this code, then fix it with BOTH let and IIFE:
    for (var i = 1; i <= 5; i++) {
        setTimeout(() => console.log(i), i * 100);
    }

  ✏️ EXERCISE 4 (Memoization):
  Write a `memoize(fn)` function that:
    - Takes a function as input
    - Returns a new function that caches results
    - On subsequent calls with the same argument, returns the cached result
      without calling fn again (log "cache hit" when using cache)
  Test with an expensive square root calculation.

  ✏️ EXERCISE 5 (Challenge):
  Build a `createLogger(prefix)` factory that returns a logger object with:
    - log(message)   → stores and prints `[prefix] message`
    - warn(message)  → stores and prints `[prefix][WARN] message`
    - error(message) → stores and prints `[prefix][ERROR] message`
    - history()      → returns all stored log entries
    - clear()        → clears the log history
  Create two separate loggers and confirm they maintain independent histories.
*/

// =============================================================================
// END OF FILE: 49-closures.js
// Next File Suggestion: 50-iife.js — Immediately Invoked Function Expressions
// =============================================================================
