// =============================================================================
// FILE: 46-bind-method.js
// TOPIC: JavaScript bind() Method — Permanently Locking `this`
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 46)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: THE CONTEXT PROBLEM (Recap + New Angle)
// =============================================================================

/*
  We know from 44-call-method.js that `this` is determined at CALL TIME.
  
  call() solved one problem: "I need to run this function NOW with a specific this."
  
  But what about when you DON'T want to run the function immediately?
  What if you need to:
    → Pass a method as a callback (setTimeout, addEventListener, forEach)
    → Store a function reference to call later
    → Pass a class method into another function
  
  In all these cases, by the time the function actually runs,
  the `this` context has already been LOST.
  
  That is exactly the problem bind() was built to solve.
  
  ┌──────────────────────────────────────────────────────────────────┐
  │  bind() does NOT call the function.                              │
  │  It RETURNS A NEW FUNCTION with `this` permanently locked in.   │
  │  You can call that new function whenever you want — `this`       │
  │  will always be what you bound it to.                            │
  └──────────────────────────────────────────────────────────────────┘
  
  SYNTAX:
    const boundFn = originalFn.bind(thisArg, arg1, arg2, ...);
  
  - thisArg  → the object you want permanently set as `this`
  - arg1...  → optional: pre-fill (partially apply) arguments
  - Returns  → a new function (does NOT invoke the original)
*/

// =============================================================================
// SECTION 2: WHY `this` GETS LOST — THE EXACT MOMENT IT BREAKS
// =============================================================================

/*
  The moment a method is DETACHED from its object — passed as a reference,
  stored in a variable, or handed to a callback — the object-to-the-left-
  of-the-dot rule no longer applies. `this` loses its anchor.
*/

// --- Example 2.1: Method reference loses context ---

const student = {
    name: "Eman",
    study: function() {
        // `this` should be student... but only if called as student.study()
        console.log(`${this.name} is studying.`);
    }
};

student.study();              // ✅ this = student → "Eman is studying."

const studyFn = student.study; // detached — just a reference to the raw function
studyFn();                    // ❌ this = global/undefined → "undefined is studying."

// Expected Output:
// Eman is studying.
// undefined is studying.   ← (or TypeError in strict mode)


// --- Example 2.2: Context lost inside setTimeout ---

const timer = {
    label: "Countdown",
    seconds: 5,

    start: function() {
        // `this` = timer here ✅ — we're inside a method call
        console.log(`${this.label} started.`);

        setTimeout(function() {
            // ❌ By the time this callback runs, `this` is global/undefined
            // The callback was handed to setTimeout as a plain function reference
            console.log(`${this.label} ended.`); // undefined ended.
        }, 0);
    }
};

timer.start();
// Expected Output:
// Countdown started.
// undefined ended.   ← context was lost when passed to setTimeout

/*
  DIAGRAM: The moment context breaks
  
  timer.start()                    setTimeout(callback, 0)
  ┌──────────────┐                 ┌──────────────────────────┐
  │ this = timer │  ─── hands ──▶  │ callback()               │
  │              │   plain fn ref  │ this = ??? (global/undef) │
  └──────────────┘                 └──────────────────────────┘
  
  The object link is dropped the moment the function is passed around.
*/


// =============================================================================
// SECTION 3: bind() — THE SOLUTION
// =============================================================================

// --- Example 3.1: Basic bind() usage ---

const user = {
    name: "Eman",
    city: "Karachi"
};

function introduce(greeting, punctuation) {
    // `this` will be whatever bind() has locked in
    console.log(`${greeting}, I'm ${this.name} from ${this.city}${punctuation}`);
}

// bind() returns a NEW function with `this` permanently set to `user`
const boundIntroduce = introduce.bind(user);

// Call it whenever you want — `this` is always `user`
boundIntroduce("Hello", "!");   // Hello, I'm Eman from Karachi!
boundIntroduce("Hi", ".");      // Hi, I'm Eman from Karachi.

// The original function is NOT affected
// introduce() still has its own dynamic `this`

// Expected Output:
// Hello, I'm Eman from Karachi!
// Hi, I'm Eman from Karachi.


// --- Example 3.2: Fixing the setTimeout problem with bind() ---

const timerFixed = {
    label: "Countdown",
    seconds: 5,

    start: function() {
        console.log(`${this.label} started.`);

        // bind(this) locks the current `this` (timerFixed) into the callback
        // by the time setTimeout fires, `this` is still timerFixed ✅
        setTimeout(function() {
            console.log(`${this.label} ended.`);
        }.bind(this), 0);           // ← .bind(this) right here is the fix
    }
};

timerFixed.start();
// Expected Output:
// Countdown started.
// Countdown ended.   ← fixed! this.label is now "Countdown"


// =============================================================================
// SECTION 4: bind(this) INSIDE CLASSES
// =============================================================================

/*
  In a class, methods defined in the body live on the PROTOTYPE.
  When you pass a class method as a callback or reference, it gets detached
  from the instance — `this` is lost.
  
  The classic fix (pre-arrow-function era): bind(this) in the constructor.
  This is also the pattern you'll see in OLD React class component code.
*/

// --- Example 4.1: Context loss inside a class ---

class Counter {
    constructor(label) {
        this.label = label;
        this.count = 0;
    }

    increment() {
        this.count++;
        console.log(`${this.label}: ${this.count}`);
    }
}

const c = new Counter("Clicks");

c.increment();                  // ✅ Clicks: 1

const inc = c.increment;        // detached method reference
// inc();                       // ❌ TypeError: Cannot read properties of undefined


// --- Example 4.2: Fixing with bind(this) in the constructor ---

class CounterFixed {
    constructor(label) {
        this.label = label;
        this.count = 0;

        // bind(this) in the constructor creates a bound version of increment
        // and replaces the prototype method with it ON THIS INSTANCE
        // Now whenever increment is called — from anywhere — `this` = this instance
        this.increment = this.increment.bind(this);
    }

    increment() {
        this.count++;
        console.log(`${this.label}: ${this.count}`);
    }
}

const cf = new CounterFixed("Votes");

cf.increment();                      // ✅ Votes: 1

const detachedInc = cf.increment;    // detached, but already bound
detachedInc();                       // ✅ Votes: 2 ← still works!
detachedInc();                       // ✅ Votes: 3

// Expected Output:
// Votes: 1
// Votes: 2
// Votes: 3

/*
  DIAGRAM: What bind(this) in the constructor does
  
  WITHOUT bind in constructor:
  ┌─────────────────┐          ┌───────────────────────────┐
  │ cf (instance)   │          │ CounterFixed.prototype    │
  │ label: "Votes"  │──proto──▶│ increment: function       │
  │ count: 0        │          │ (this = whoever calls it) │
  └─────────────────┘          └───────────────────────────┘
  
  WITH bind(this) in constructor:
  ┌────────────────────────────────┐   ┌──────────────────────────┐
  │ cf (instance)                  │   │ CounterFixed.prototype   │
  │ label: "Votes"                 │   │ increment: function      │
  │ count: 0                       │   │ (original, untouched)    │
  │ increment: BOUND function ✅   │   └──────────────────────────┘
  │  (this always = cf)            │
  └────────────────────────────────┘
  
  The bound function sits ON the instance itself (own property),
  shadowing the prototype method. `this` is always cf, no matter what.
*/


// =============================================================================
// SECTION 5: BIND WITH EVENT LISTENERS
// =============================================================================

/*
  In a browser, when a DOM event fires, the callback's `this` is set to
  the DOM element that triggered the event — NOT your class instance.
  
  bind() fixes this by locking `this` to the instance before the event fires.
  
  NOTE: We simulate the browser event listener pattern below using plain
  function calls, since we're running in Node.js. The concept is identical.
*/

// --- Example 5.1: Simulated event listener context problem ---

class Button {
    constructor(label) {
        this.label   = label;
        this.clicked = 0;

        // ✅ bind(this) locks `this` to the Button instance
        // Without this line, when the "event" fires, `this` would be
        // the DOM element (in a browser) or undefined (in strict Node)
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.clicked++;
        console.log(`Button "${this.label}" clicked ${this.clicked} time(s).`);
    }
}

const btn = new Button("Submit");

// Simulate addEventListener handing off the function as a plain reference:
const simulatedEventFire = btn.handleClick; // in browser: element calls this
simulatedEventFire();   // ✅ Button "Submit" clicked 1 time(s).
simulatedEventFire();   // ✅ Button "Submit" clicked 2 time(s).

// Expected Output:
// Button "Submit" clicked 1 time(s).
// Button "Submit" clicked 2 time(s).

// In a real browser this would look like:
// document.getElementById("btn").addEventListener("click", btn.handleClick);
// Without bind, `this` inside handleClick would be the <button> element, not `btn`.


// =============================================================================
// SECTION 6: REACT HISTORICAL CONTEXT — WHY bind() MATTERED SO MUCH
// =============================================================================

/*
  Before React Hooks (introduced in React 16.8, 2019), React used CLASS
  COMPONENTS. This made `this` management a daily struggle for every developer.
  
  CLASSIC React class component pattern (you'll still see this in older codebases):
  
  ┌──────────────────────────────────────────────────────────────────┐
  │  class MyComponent extends React.Component {                     │
  │      constructor(props) {                                        │
  │          super(props);              // ← calls React.Component() │
  │          this.state = { count: 0 };                              │
  │                                                                  │
  │          // WITHOUT this line, handleClick loses `this`          │
  │          // when React calls it from a JSX onClick event         │
  │          this.handleClick = this.handleClick.bind(this); // ✅   │
  │      }                                                           │
  │                                                                  │
  │      handleClick() {                                             │
  │          this.setState({ count: this.state.count + 1 });         │
  │      }                                                           │
  │                                                                  │
  │      render() {                                                  │
  │          return <button onClick={this.handleClick}>Click</button>│
  │      }   // if not bound above ↑, this.setState would throw ❌   │
  │  }                                                               │
  └──────────────────────────────────────────────────────────────────┘
  
  WHY it happened:
    JSX compiles onClick={this.handleClick} to a plain function reference.
    React calls it as a callback — not as a method on the component.
    So `this` inside handleClick becomes undefined in strict mode.
  
  The bind(this) in the constructor was THE standard fix.
  
  MODERN React (Hooks era) solved this completely:
    function MyComponent() {
        const [count, setCount] = useState(0);
        const handleClick = () => setCount(count + 1);  // arrow fn, no `this` issue
        return <button onClick={handleClick}>Click</button>;
    }
  
  But understanding WHY bind was needed is a core JavaScript interview topic —
  even for modern React developers — because it reveals deep understanding of
  how `this` and execution context work.
*/


// =============================================================================
// SECTION 7: PARTIAL APPLICATION WITH bind()
// =============================================================================

/*
  bind() can also PRE-FILL arguments, not just `this`.
  This is called PARTIAL APPLICATION — you fix some arguments in advance
  and get back a function that only needs the remaining arguments.
  
  SYNTAX:
    const partialFn = fn.bind(thisArg, preFilledArg1, preFilledArg2);
    partialFn(remainingArg);
*/

// --- Example 7.1: Partial application ---

function multiply(multiplier, number) {
    return multiplier * number;
}

// Pre-fill `multiplier` as 2 — get a "double" function
// null as thisArg because `this` is not used inside multiply
const double = multiply.bind(null, 2);

// Pre-fill `multiplier` as 3 — get a "triple" function
const triple = multiply.bind(null, 3);

console.log(double(5));   // 10  ← multiply(2, 5)
console.log(double(9));   // 18  ← multiply(2, 9)
console.log(triple(4));   // 12  ← multiply(3, 4)
console.log(triple(7));   // 21  ← multiply(3, 7)

// Expected Output:
// 10
// 18
// 12
// 21


// =============================================================================
// SECTION 8: call() vs apply() vs bind() — THE COMPLETE PICTURE
// =============================================================================

/*
  All three let you control what `this` is. The difference is WHEN and HOW.
  
  ┌───────────┬────────────────────────┬──────────────────────┬──────────────┐
  │ Method    │ Calls function?        │ Arguments            │ Returns      │
  ├───────────┼────────────────────────┼──────────────────────┼──────────────┤
  │ call()    │ YES — immediately      │ comma-separated      │ result       │
  │ apply()   │ YES — immediately      │ as an array          │ result       │
  │ bind()    │ NO — returns new fn    │ comma-sep (optional) │ new function │
  └───────────┴────────────────────────┴──────────────────────┴──────────────┘
  
  Memory aid:
    call()  → C for Comma (args one by one) and Call now
    apply() → A for Array (args as array) and Act now
    bind()  → B for Bundle and come Back later
*/

function sayHello(greeting) {
    return `${greeting}, ${this.name}!`;
}

const person = { name: "Eman" };

console.log(sayHello.call(person, "Hello"));        // Hello, Eman!  — runs now
console.log(sayHello.apply(person, ["Salaam"]));    // Salaam, Eman! — runs now
const greetEman = sayHello.bind(person, "Hey");
console.log(greetEman());                           // Hey, Eman!    — runs later

// Expected Output:
// Hello, Eman!
// Salaam, Eman!
// Hey, Eman!


// =============================================================================
// SECTION 9: QUICK REVISION NOTES
// =============================================================================

/*
  ┌──────────────────────────┬──────────────────────────────────────────────┐
  │ Concept                  │ Key Point                                    │
  ├──────────────────────────┼──────────────────────────────────────────────┤
  │ bind()                   │ Returns new fn with `this` locked in         │
  │ bind(this) in constructor│ Fixes context before any callback fires      │
  │ Partial application      │ Pre-fill args with bind(null, arg1)          │
  │ Event listener issue     │ DOM sets `this` to element; bind overrides   │
  │ React class components   │ bind(this) in constructor was THE standard   │
  │ call() vs bind()         │ call = run now; bind = bundle for later      │
  │ Arrow functions          │ Modern alternative; inherit outer `this`     │
  │ bind() result            │ A regular callable function, not a method    │
  └──────────────────────────┴──────────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 10: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Calling bind() but forgetting to use the returned function
*/
// introduce.bind(user);       // ← bind() does NOTHING useful here
// const bound = introduce.bind(user); // ✅ save and use the returned function

/*
  ❌ MISTAKE 2: Using bind() when you meant call() (or vice versa)
*/
// fn.bind(obj)();   // works but pointless — just use fn.call(obj)
// Use bind() only when you need the function later, not immediately.

/*
  ❌ MISTAKE 3: Double-binding — trying to rebind an already bound function
*/
const first  = introduce.bind({ name: "Eman" });
const second = first.bind({ name: "Ali" });    // ← has NO effect
second("Hi", "!");   // still uses { name: "Eman" } — the first bind wins
// A bound function's `this` cannot be overridden by another bind().

/*
  ❌ MISTAKE 4: Binding arrow functions (it does nothing)
*/
const arrowFn = () => console.log(this);
const boundArrow = arrowFn.bind({ name: "test" });
boundArrow(); // `this` is still the outer lexical scope — bind has no effect on arrows
// Arrow functions capture `this` at DEFINITION time. bind() cannot change it.

/*
  ❌ MISTAKE 5: Forgetting to call super(props) when using bind in React
*/
// constructor(props) {
//     this.handleClick = this.handleClick.bind(this); // ❌ `this` not ready yet
//     super(props);
// }
// ✅ Always call super(props) FIRST, then do bind calls.


// =============================================================================
// SECTION 11: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What does bind() do?
  A:  bind() returns a NEW function with `this` permanently set to the provided
      object. It does NOT call the function immediately. The bound function can
      be called later and will always use the locked-in `this`.

  Q2. What is the difference between call() and bind()?
  A:  call() invokes the function immediately and returns the result.
      bind() does NOT invoke; it returns a new function with `this` locked in,
      to be called at a later time.

  Q3. Why is bind() needed in class methods used as callbacks?
  A:  Class methods live on the prototype. When passed as a callback, they
      are detached from the instance — `this` becomes undefined in strict mode.
      bind(this) in the constructor creates a bound version that always refers
      to the correct instance, no matter how it is called.

  Q4. Why did React class components need bind(this) in the constructor?
  A:  JSX compiles event handlers to plain function references. React calls
      them as callbacks — not as methods on the component instance — so `this`
      is lost. bind(this) in the constructor pre-locks `this` to the component
      instance before React ever calls the handler.

  Q5. What is partial application with bind()?
  A:  You can pre-fill one or more arguments using bind(thisArg, arg1, arg2).
      The returned function only needs the remaining arguments when called.
      Example: const double = multiply.bind(null, 2);

  Q6. Can you rebind an already bound function?
  A:  No. Once a function is bound, its `this` is permanently fixed. Calling
      bind() on an already-bound function has no effect on `this`.

  Q7. Does bind() work on arrow functions?
  A:  No. Arrow functions capture `this` lexically at definition time.
      bind() cannot override the `this` of an arrow function.

  Q8. What is the modern alternative to bind(this) in constructors?
  A:  Class fields with arrow functions:
        handleClick = () => { this.count++; }
      Arrow functions inherit `this` from their enclosing scope (the class
      instance), so no explicit binding is needed.

  Q9. What does bind() return?
  A:  A new ordinary function object (not a method). It has the same body as
      the original but with `this` and optionally some arguments pre-set.

  Q10. When would you use bind() over an arrow function?
  A:   When working with older codebases, when extending existing prototype
       methods, or when you need partial application of arguments. Arrow
       functions are generally preferred in modern code for simpler contexts.
*/


// =============================================================================
// SECTION 12: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Basic):
  Create an object `car` with properties make and model.
  Create a standalone function `describe(prefix)` that logs:
  "prefix → make model"
  Use bind() to create a boundDescribe function tied to car.
  Call boundDescribe twice with different prefixes.

  ✏️ EXERCISE 2 (Class + bind):
  Create a class `Scoreboard` with:
    - constructor(sport) → this.sport, this.score = 0
    - addPoint() → increments score and logs "sport: score"
  In the constructor, bind addPoint to the instance.
  Detach addPoint into a variable and call it 3 times — verify it still works.

  ✏️ EXERCISE 3 (Partial Application):
  Write a function `power(base, exponent)` that returns base ** exponent.
  Use bind() to create:
    - square  → power with base pre-filled as 2
    - cube    → power with base pre-filled as 3
  Call square(4) and cube(3) and log the results.

  ✏️ EXERCISE 4 (Debug):
  Find and fix the bug:

    class Notification {
        constructor(message) {
            this.message = message;
        }
        show() {
            console.log(`Notification: ${this.message}`);
        }
    }
    const n = new Notification("New message!");
    const showFn = n.show;
    showFn();  // ← throws TypeError. Fix it using bind() without changing
               //   the class definition or the last two lines above.

  ✏️ EXERCISE 5 (Challenge):
  Create a class `EventEmitter` with:
    - constructor()  → this.handlers = {}
    - on(event, fn)  → stores fn for that event name
    - emit(event)    → calls the stored fn for that event
  Create a class `App` with a method handleData() that logs this.name.
  Register App's handleData as an event handler using on().
  Emit the event and verify this.name is correct — use bind() to fix context.
*/

// =============================================================================
// END OF FILE: 46-bind-method.js
// Next File Suggestion: 47-getters-setters.js — get/set in objects and classes
// =============================================================================
