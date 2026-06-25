// =============================================================================
// FILE: 44-call-method.js
// TOPIC: Execution Context, the `this` Keyword, and call()
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 44)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT IS EXECUTION CONTEXT? (Simple Explanation)
// =============================================================================

/*
  Imagine JavaScript as a chef working in a kitchen.
  
  Every time the chef starts a new recipe (function), they set up a
  WORKSTATION before cooking:
    - Which ingredients are available?  -> Variables & parameters
    - Who is the head chef right now?   -> What `this` refers to
    - What recipe led to this one?      -> The outer scope
  
  This workstation is called an EXECUTION CONTEXT.
  
  JavaScript creates an Execution Context every time:
    ① The script first runs  -> Global Execution Context (GEC)
    ② A function is called   -> Function Execution Context (FEC)
  
  Each Execution Context has two phases:
    Phase 1 — CREATION:   Variables hoisted, `this` is determined
    Phase 2 — EXECUTION:  Code runs line by line
  
  DIAGRAM: The Call Stack
  
  ┌─────────────────────────────┐
  │  greet() Execution Context  │  <- currently running (top of stack)
  ├─────────────────────────────┤
  │  Global Execution Context   │  <- always at the bottom
  └─────────────────────────────┘
  
  When greet() finishes, its context is POPPED off the stack.
  JavaScript returns to the Global Execution Context.
*/

// =============================================================================
// SECTION 2: THE `this` KEYWORD — WHAT DOES IT MEAN?
// =============================================================================

/*
  `this` is NOT a variable. It is a special KEYWORD whose value is set
  automatically when a function's Execution Context is created.
  
  The golden rule:
  ┌──────────────────────────────────────────────────────────────────┐
  │  `this` = the object that is CALLING (invoking) the function     │
  └──────────────────────────────────────────────────────────────────┘
  
  The SAME function can have a DIFFERENT `this` depending on HOW it is called.
  This is the most confusing — and most interviewed — thing about JavaScript.
  
  RULE SUMMARY:
  ┌───────────────────────────┬─────────────────────────────────────┐
  │  How the function is called│  What `this` equals               │
  ├───────────────────────────┼─────────────────────────────────────┤
  │  Regular function call    │  global object (window / undefined) │
  │  Method on an object      │  the object before the dot          │
  │  Constructor with `new`   │  the newly created object           │
  │  call() / apply() / bind()│  whatever you explicitly pass       │
  └───────────────────────────┴─────────────────────────────────────┘
*/

// --- Example 2.1: `this` in a regular function (non-strict mode) ---

function showThis() {
    // In a browser: `this` is the `window` object
    // In Node.js:   `this` is the `global` object
    // In strict mode ('use strict'): `this` is undefined
    console.log(this);
}

showThis(); // window (browser) OR global (Node) OR undefined (strict)
// Expected Output (Node.js): Object [global] { ... }


// --- Example 2.2: `this` inside an object METHOD ---

const user = {
    name: "Eman",
    city: "Karachi",

    introduce: function() {
        // `this` here = user object, because user is calling introduce()
        // The dot before introduce() tells us: the object to the LEFT is `this`
        console.log(`My name is ${this.name} and I live in ${this.city}.`);
    }
};

user.introduce();
// Expected Output:
// My name is Eman and I live in Karachi.


// --- Example 2.3: `this` with constructor function ---

function Student(name, rollNo) {
    // `new` creates a fresh object and binds it to `this`
    this.name   = name;    // this = the new Student object
    this.rollNo = rollNo;
}

const s1 = new Student("Eman", 101);
console.log(s1.name);    // Eman  → `this` was the new object during construction
// Expected Output: Eman


// =============================================================================
// SECTION 3: WHY `this` GETS LOST — THE CONTEXT PROBLEM
// =============================================================================

/*
  Context is determined at CALL TIME, not at DEFINITION time.
  
  When you extract a method from an object and call it as a plain function,
  it LOSES its original `this`. The object connection is cut.
  
  This is the single most common source of bugs with `this` in JavaScript.
*/

// --- Example 3.1: Extracting a method → losing `this` ---

const teacher = {
    name: "Sir Hitesh",
    subject: "JavaScript",

    introduce: function() {
        // When called as teacher.introduce() → this = teacher 
        // When called as a standalone function → this = undefined/global 
        console.log(`I am ${this.name}, I teach ${this.subject}.`);
    }
};

teacher.introduce();         //  this = teacher
// Expected Output: I am Sir Hitesh, I teach JavaScript.

const stolenMethod = teacher.introduce;  // extracted — no longer attached to teacher
stolenMethod();              //  this = undefined (strict) OR global (non-strict)
// Expected Output (strict): TypeError: Cannot read properties of undefined (reading 'name')
// Expected Output (non-strict): I am undefined, I teach undefined.

/*
  DIAGRAM: Why context is lost
  
  ┌─────────────────────────────────────────┐
  │  teacher.introduce()                    │
  │                                         │
  │  teacher ──── dot ──── introduce()      │
  │     ↑                                   │
  │  `this` is set to `teacher`             │
  └─────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────┐
  │  stolenMethod()                         │
  │                                         │
  │  (nothing) ──── introduce()             │
  │                                         │
  │  No object before the call.             │
  │  `this` has NOTHING to bind to          │
  └─────────────────────────────────────────┘
*/


// --- Example 3.2: Context lost in a callback ---

const counter = {
    count: 0,
    label: "Votes",

    increment: function() {
        console.log(`${this.label}: ${this.count}`);
        // If you pass this as a callback → this gets lost
    }
};

counter.increment(); //  works: "Votes: 0"

// Simulate passing as callback (setTimeout, forEach etc.)
const cb = counter.increment;
cb();  //  this is now global/undefined → "undefined: undefined"

// Expected Output:
// Votes: 0
// undefined: undefined


// =============================================================================
// SECTION 4: call() — BORROWING A FUNCTION WITH A SPECIFIC `this`
// =============================================================================

/*
  call() lets you INVOKE a function immediately and EXPLICITLY set
  what `this` should be inside that function.
  
  SYNTAX:
    functionName.call(thisArg, arg1, arg2, arg3, ...)
  
  ┌─────────────────────────────────────────────────────────┐
  │  thisArg  -> the object you want to be `this`            │
  │  arg1...  -> normal arguments passed to the function     │
  └─────────────────────────────────────────────────────────┘
  
  call() SOLVES the "stolen method" problem from Section 3.
  You are essentially saying:
  "Run this function, but pretend it belongs to THIS object."
*/

// --- Example 4.1: Basic call() usage ---

function greet(greeting, punctuation) {
    // `this` will be whatever we pass as the first argument to call()
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const person1 = { name: "Eman" };
const person2 = { name: "Ali" };

greet.call(person1, "Hello", "!");   // this = person1
greet.call(person2, "Assalam", "?"); // this = person2

// Expected Output:
// Hello, Eman!
// Assalam, Ali?


// --- Example 4.2: Solving context loss with call() ---

// Reusing teacher.introduce (from Section 3) on a different object
const newTeacher = {
    name: "Sir Piyush",
    subject: "React"
};

// teacher.introduce is defined on `teacher`
// But we want to run it WITH newTeacher as `this`
teacher.introduce.call(newTeacher);

// Expected Output:
// I am Sir Piyush, I teach React.


// --- Example 4.3: Function borrowing — the killer use case ---

/*
  Function borrowing = using a method from one object on another object
  WITHOUT copying the method. This saves memory and avoids code duplication.
*/

const developer = {
    name: "Eman",
    skills: ["JavaScript", "Python", "React"],

    listSkills: function(intro, outro) {
        // Lists skills belonging to whatever object is `this`
        console.log(`${intro} ${this.name}:`);
        this.skills.forEach(skill => console.log(`  → ${skill}`));
        console.log(outro);
    }
};

const designer = {
    name: "Sara",
    skills: ["Figma", "Illustrator", "Photoshop"]
    // designer does NOT have a listSkills method
};

developer.listSkills("Skills of", "--- End ---");
// Expected Output:
// Skills of Eman:
//   → JavaScript
//   → Python
//   → React
// --- End ---

// BORROW developer.listSkills and use it for designer
developer.listSkills.call(designer, "Skills of", "--- End ---");
// Expected Output:
// Skills of Sara:
//   → Figma
//   → Illustrator
//   → Photoshop
// --- End ---


// --- Example 4.4: Borrowing Array methods for array-like objects ---

/*
  Arguments object inside functions looks like an array but is NOT one.
  It has no .map(), .filter() etc. We can BORROW Array methods using call().
*/

function sumAll() {
    // `arguments` is array-LIKE: has indexes and .length, but not array methods
    // Borrow Array.prototype.slice to convert it to a real array
    const args = Array.prototype.slice.call(arguments);
    // Now args is a proper array
    return args.reduce((total, num) => total + num, 0);
}

console.log(sumAll(1, 2, 3));         // 6
console.log(sumAll(10, 20, 30, 40));  // 100

// Expected Output:
// 6
// 100


// --- Example 4.5: Constructor chaining with call() ---

/*
  call() is used to invoke a parent constructor inside a child constructor.
  This lets the child reuse the parent's setup logic for `this`.
*/

function Vehicle(brand, year) {
    this.brand = brand;   // set on the new Vehicle/child object
    this.year  = year;
}

Vehicle.prototype.describe = function() {
    return `${this.brand} (${this.year})`;
};

function ElectricCar(brand, year, range) {
    Vehicle.call(this, brand, year);  // run Vehicle's constructor on THIS ElectricCar
    // `this` inside Vehicle.call now refers to the ElectricCar instance
    this.range = range;               // add ElectricCar's own property
}

// Set up prototype chain so ElectricCar instances can use Vehicle.prototype methods
ElectricCar.prototype = Object.create(Vehicle.prototype);
ElectricCar.prototype.constructor = ElectricCar;

ElectricCar.prototype.charge = function() {
    return `${this.brand} charging — range: ${this.range} km`;
};

const tesla = new ElectricCar("Tesla", 2024, 550);

console.log(tesla.describe()); // from Vehicle.prototype → "Tesla (2024)"
console.log(tesla.charge());   // from ElectricCar.prototype → "Tesla charging — range: 550 km"
console.log(tesla.brand);      // own property set via Vehicle.call → "Tesla"

// Expected Output:
// Tesla (2024)
// Tesla charging — range: 550 km
// Tesla


// =============================================================================
// SECTION 5: call() vs REGULAR INVOCATION — SIDE BY SIDE
// =============================================================================

/*
  DIAGRAM: What changes with call()
  
  ┌────────────────────────────────┬──────────────────────────────────┐
  │   greet()                      │   greet.call(person1, "Hi", "!") │
  │                                │                                  │
  │   this = global / undefined    │   this = person1                 │
  │   args passed normally         │   args passed after thisArg      │
  │   called immediately           │   called immediately             │
  └────────────────────────────────┴──────────────────────────────────┘
  
  call()  → invoke immediately, pass args one by one
  apply() → invoke immediately, pass args as an ARRAY  (coming next lecture)
  bind()  → does NOT invoke, RETURNS a new function with `this` locked in
*/


// =============================================================================
// SECTION 6: COMMON MISTAKES
// =============================================================================

/*
   MISTAKE 1: Forgetting that `this` in a regular callback is not the object
*/
const timer = {
    seconds: 10,
    start: function() {
        setTimeout(function() {
            //  `this` here is global, NOT timer
            // console.log(this.seconds); // undefined
        }, 1000);

        //  Fix 1: use call() / bind()
        // setTimeout(function() { console.log(this.seconds); }.bind(this), 1000);

        //  Fix 2: use arrow function (arrow functions inherit `this` from outer scope)
        setTimeout(() => {
            console.log(this.seconds); // 10 
        }, 0);
    }
};
timer.start();
// Expected Output (after ~0ms): 10


/*
   MISTAKE 2: Passing null or undefined as thisArg to call()
  In non-strict mode, null/undefined is replaced with the global object.
  In strict mode, it stays null/undefined.
*/
function whoAmI() {
    console.log(this);
}
whoAmI.call(null);    // global object (non-strict) OR null (strict)
whoAmI.call(undefined); // global object (non-strict) OR undefined (strict)


/*
   MISTAKE 3: Confusing call() and apply() argument format
  call()  -> greet.call(obj, "Hello", "!")    <- comma-separated args
  apply() -> greet.apply(obj, ["Hello", "!"]) <- array of args
  Mixing these up is the #1 source of errors when switching between them.
*/

/*
   MISTAKE 4: Using call() when you need bind()
  call() invokes the function IMMEDIATELY.
  If you need to pass a function as a callback (not run it yet), use bind().
*/


// =============================================================================
// SECTION 7: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is an execution context in JavaScript?
  A:  The environment in which JavaScript code is evaluated and executed.
      It consists of the variable environment, scope chain, and the value of
      `this`. Created for the global scope and for each function call.

  Q2. What does `this` refer to in JavaScript?
  A:  `this` refers to the object that invoked (called) the function.
      Its value depends entirely on HOW the function is called, not where
      it is defined.

  Q3. Why does `this` get lost inside a callback or extracted method?
  A:  Because `this` is determined at call time. When a method is extracted
      from its object and called as a plain function, there is no object to
      the left of the call, so `this` becomes global/undefined.

  Q4. What does call() do?
  A:  call() invokes a function immediately and allows you to explicitly set
      what `this` should be. Additional arguments are passed individually.
      Syntax: fn.call(thisArg, arg1, arg2)

  Q5. What is function borrowing?
  A:  Calling a method defined on one object but with a different object as
      `this`, using call() or apply(). Avoids duplicating methods across objects.

  Q6. What is the difference between call() and apply()?
  A:  Both invoke a function with a specific `this`.
      call()  -> arguments passed individually: fn.call(obj, a, b)
      apply() -> arguments passed as an array:  fn.apply(obj, [a, b])

  Q7. What is the difference between call() and bind()?
  A:  call()  -> invokes the function immediately, returns the result
      bind()  -> does NOT invoke; returns a new function with `this` locked in

  Q8. What happens if you pass null as thisArg to call()?
  A:  In non-strict mode, null is replaced with the global object.
      In strict mode, `this` inside the function will be null.

  Q9. How is call() used in constructor inheritance?
  A:  Parent.call(this, ...args) inside a child constructor runs the parent's
      setup logic with the child's `this`, so the child instance inherits
      the parent's own properties.

  Q10. What is the Global Execution Context?
  A:   The default execution context created when the script first runs.
       In a browser, `this` in GEC is `window`. In Node.js, it is `global`.
*/


// =============================================================================
// SECTION 8: PRACTICE EXERCISES
// =============================================================================

/*
   EXERCISE 1 (Basic):
  Create an object `laptop` with properties brand and ram.
  Create a standalone function `specs(label)` that logs:
  "label -> brand: X, ram: Xgb"
  Use call() to run specs() with laptop as `this`.

   EXERCISE 2 (Intermediate):
  Create two constructor functions: `Shape(color)` and `Circle(color, radius)`.
  Inside Circle, use call() to borrow Shape's constructor.
  Add an area() method on Circle.prototype.
  Create a Circle instance and log its color, radius, and area.

   EXERCISE 3 (Function Borrowing):
  You have:
    const arr1 = { 0: "a", 1: "b", 2: "c", length: 3 }; // array-like
  Use Array.prototype.join.call() to join arr1's values with " - ".
  Expected output: "a - b - c"

   EXERCISE 4 (Debug):
  Find and explain the bug:

    const wallet = {
      balance: 5000,
      showBalance: function() {
        console.log(`Balance: ${this.balance}`);
      }
    };
    const show = wallet.showBalance;
    show.call();  // <- what is `this` here? How do you fix it?

   EXERCISE 5 (Advanced):
  Write a function `multiGreet(greetings)` where greetings is an array of
  strings like ["Hello", "Hi", "Hey"].
  Use call() inside a loop to greet multiple person objects with each greeting.
  Each call should log: "Hello, Eman!" / "Hi, Ali!" etc.
*/

// =============================================================================
// END OF FILE: 44-call-method.js
// Next File Suggestion: 45-apply-bind.js — apply() and bind() with real-world use cases
// =============================================================================
