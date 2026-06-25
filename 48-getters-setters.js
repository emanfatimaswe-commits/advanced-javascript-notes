// =============================================================================
// FILE: 48-getters-setters.js
// TOPIC: Getters and Setters — Encapsulation and Controlled Access
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 48)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT ARE GETTERS AND SETTERS? (Simple Explanation)
// =============================================================================

/*
  Imagine a BANK TELLER at a counter.
  
  You (the outside world) never directly reach into the vault (private data).
  Instead:
    → To READ your balance  : you ask the teller → they GIVE you the value
    → To CHANGE your balance: you ask the teller → they VALIDATE then update
  
  In JavaScript, a GETTER is the teller that handles reading.
  A SETTER is the teller that handles writing.
  
  They look like properties from the outside (no parentheses needed),
  but they actually RUN a function behind the scenes.
  
  GETTER:
    - Defined with the `get` keyword
    - Called automatically when you READ the property
    - Must RETURN a value
    - Takes NO parameters
  
  SETTER:
    - Defined with the `set` keyword
    - Called automatically when you WRITE (assign) to the property
    - Receives the assigned value as a parameter
    - Can validate / transform before storing
  
  WHY USE THEM?
    ✅ Encapsulation — hide internal data, expose controlled access
    ✅ Validation    — check before allowing a value to be stored
    ✅ Computed      — return a derived value without storing it separately
    ✅ Side effects  — run code automatically on read or write
*/

// =============================================================================
// SECTION 2: GETTER — READING COMPUTED VALUES
// =============================================================================

// --- Example 2.1: Getter in an object literal ---

const circle = {
    radius: 7,      // actual stored data

    // `area` looks like a property but runs a function when accessed
    get area() {
        // `this` = circle object
        return +(Math.PI * this.radius ** 2).toFixed(2);
    },

    get circumference() {
        return +(2 * Math.PI * this.radius).toFixed(2);
    }
};

// Accessed like a property — NO parentheses needed
console.log(circle.area);          // 153.94
console.log(circle.circumference); // 43.98
console.log(circle.radius);        // 7  ← regular property

// If radius changes, the getter re-computes automatically
circle.radius = 10;
console.log(circle.area);          // 314.16 ← updated without calling any method

// Expected Output:
// 153.94
// 43.98
// 7
// 314.16


// --- Example 2.2: Getter for a computed "full name" ---

const person = {
    firstName: "Eman",
    lastName:  "Khan",

    get fullName() {
        // Combines two stored values into one virtual property
        return `${this.firstName} ${this.lastName}`;
    }
};

console.log(person.fullName);       // Eman Khan ← no () needed
console.log(person.firstName);      // Eman
// fullName is NOT stored separately — it is computed every time you read it

// Expected Output:
// Eman Khan
// Eman


// =============================================================================
// SECTION 3: SETTER — CONTROLLED WRITING WITH VALIDATION
// =============================================================================

// --- Example 3.1: Basic setter ---

const temperature = {
    _celsius: 25,   // _ prefix = convention for "internal/private" property

    get celsius() {
        return this._celsius;
    },

    set celsius(value) {
        // Validate before storing — absolute zero is -273.15°C
        if (value < -273.15) {
            console.log("Error: Temperature below absolute zero is impossible.");
            return; // reject the value — _celsius is unchanged
        }
        this._celsius = value;  // store only if valid
    },

    // Computed getter — derived from _celsius, no separate storage needed
    get fahrenheit() {
        return +(this._celsius * 9/5 + 32).toFixed(2);
    }
};

console.log(temperature.celsius);    // 25
console.log(temperature.fahrenheit); // 77

temperature.celsius = 100;           // triggers setter → validates → stores
console.log(temperature.celsius);    // 100
console.log(temperature.fahrenheit); // 212

temperature.celsius = -300;          // triggers setter → validation fails
console.log(temperature.celsius);    // still 100 ← rejected value

// Expected Output:
// 25
// 77
// 100
// 212
// Error: Temperature below absolute zero is impossible.
// 100


// =============================================================================
// SECTION 4: THE _ NAMING CONVENTION (Private by Convention)
// =============================================================================

/*
  JavaScript does not enforce true private properties with get/set
  (that's what # does in modern JS — covered separately).
  
  The CONVENTION is: prefix internal storage properties with underscore (_).
  
  _property means:
    "This is an internal implementation detail.
     Please use the getter/setter to interact with it.
     Don't touch _property directly from outside."
  
  It is NOT enforced by the language — it is a TEAM AGREEMENT.
  The getter/setter provide the controlled public interface.
  
  ┌────────────────────────────────────────────────────────┐
  │  Public interface  →  person.name  (getter/setter)     │
  │  Internal storage  →  person._name  (by convention)   │
  └────────────────────────────────────────────────────────┘
*/

// --- Example 4.1: _ convention with setter validation ---

const user = {
    _username: "eman_codes",
    _email:    "eman@example.com",

    get username() {
        return this._username;
    },

    set username(value) {
        // Validate: must be at least 3 characters, no spaces
        if (typeof value !== "string" || value.length < 3) {
            console.log("Username must be at least 3 characters.");
            return;
        }
        if (value.includes(" ")) {
            console.log("Username cannot contain spaces.");
            return;
        }
        this._username = value.toLowerCase(); // normalize to lowercase
    },

    get email() {
        return this._email;
    },

    set email(value) {
        if (!value.includes("@")) {
            console.log("Invalid email address.");
            return;
        }
        this._email = value.toLowerCase();
    }
};

console.log(user.username);          // eman_codes
user.username = "EmanKhan";          // ✅ valid → stored as emankhan
console.log(user.username);          // emankhan
user.username = "ab";                // ❌ too short
user.username = "eman khan";         // ❌ has space
console.log(user.username);          // emankhan — unchanged

user.email = "EMAN@GMAIL.COM";       // ✅ stored as eman@gmail.com
console.log(user.email);             // eman@gmail.com
user.email = "notanemail";           // ❌ no @ sign

// Expected Output:
// eman_codes
// emankhan
// Username must be at least 3 characters.
// Username cannot contain spaces.
// emankhan
// eman@gmail.com
// Invalid email address.


// =============================================================================
// SECTION 5: THE RECURSION PROBLEM — Maximum Call Stack Exceeded
// =============================================================================

/*
  ⚠️ THE MOST COMMON GETTER/SETTER BUG ⚠️
  
  If your getter or setter uses the SAME NAME as the property (without _),
  you create INFINITE RECURSION. The getter calls itself forever.
  
  WRONG — causes "Maximum call stack size exceeded":
  
  const obj = {
      get name() {
          return this.name;   // ❌ reading `this.name` triggers the getter again
      },                      //    which reads `this.name`... forever → CRASH
      set name(val) {
          this.name = val;    // ❌ assigning `this.name` triggers the setter again
      }                       //    which assigns `this.name`... forever → CRASH
  };
  
  THE FIX: Use a different internal storage name (the _ convention):
  
  const obj = {
      _name: "",              // ✅ internal storage has a DIFFERENT name
      get name() {
          return this._name;  // ✅ reads _name (plain property, no recursion)
      },
      set name(val) {
          this._name = val;   // ✅ assigns to _name (plain property, no recursion)
      }
  };
  
  DIAGRAM: What goes wrong without _
  
  obj.name = "Eman"
      ↓  triggers set name(val)
      this.name = "Eman"
          ↓  triggers set name(val) again
          this.name = "Eman"
              ↓  triggers set name(val) again ...
              ... RangeError: Maximum call stack size exceeded 💥
*/

// ✅ Correct pattern — always use _ for internal storage

const product = {
    _price: 0,

    get price() {
        return `Rs. ${this._price.toLocaleString()}`;  // formatted output
    },

    set price(value) {
        if (typeof value !== "number" || value < 0) {
            console.log("Price must be a non-negative number.");
            return;
        }
        this._price = value;  // ✅ writes to _price, NOT price
    }
};

product.price = 85000;
console.log(product.price);    // Rs. 85,000

product.price = -500;          // rejected
console.log(product.price);    // Rs. 85,000 — unchanged

// Expected Output:
// Rs. 85,000
// Price must be a non-negative number.
// Rs. 85,000


// =============================================================================
// SECTION 6: GETTERS AND SETTERS IN CLASSES
// =============================================================================

/*
  The `get` and `set` keywords work exactly the same inside class bodies.
  This is the modern, recommended pattern.
  Methods using get/set go on the PROTOTYPE, just like regular class methods.
*/

// --- Example 6.1: Class with getters, setters, and validation ---

class BankAccount {
    constructor(owner, initialBalance) {
        this._owner   = owner;
        this._balance = 0;            // always start at 0
        this.deposit(initialBalance); // use deposit method for initial validation
        this._transactions = [];
    }

    // Getter — read-only, computed display
    get owner() {
        return this._owner;
    }

    get balance() {
        return this._balance;
    }

    // No setter for balance — you can't set balance directly
    // Must go through deposit() or withdraw() — enforced encapsulation

    get transactionCount() {
        return this._transactions.length;
    }

    deposit(amount) {
        if (typeof amount !== "number" || amount <= 0) {
            console.log("Deposit amount must be a positive number.");
            return;
        }
        this._balance += amount;
        this._transactions.push({ type: "deposit", amount });
        console.log(`Deposited Rs.${amount}. Balance: Rs.${this._balance}`);
    }

    withdraw(amount) {
        if (amount > this._balance) {
            console.log("Insufficient funds.");
            return;
        }
        this._balance -= amount;
        this._transactions.push({ type: "withdrawal", amount });
        console.log(`Withdrew Rs.${amount}. Balance: Rs.${this._balance}`);
    }
}

const account = new BankAccount("Eman", 10000);
console.log(account.owner);             // Eman
console.log(account.balance);           // 10000

account.deposit(5000);                  // Deposited Rs.5000. Balance: Rs.15000
account.withdraw(3000);                 // Withdrew Rs.3000. Balance: Rs.12000
account.withdraw(99999);                // Insufficient funds.

console.log(account.balance);           // 12000
console.log(account.transactionCount);  // 3

// Direct balance assignment is blocked — there is no setter for balance:
account._balance = 999999;  // possible (no true private), but violates convention
// In real code, use # (private fields) to prevent this

// Expected Output:
// Deposited Rs.10000. Balance: Rs.10000
// Eman
// 10000
// Deposited Rs.5000. Balance: Rs.15000
// Withdrew Rs.3000. Balance: Rs.12000
// Insufficient funds.
// 12000
// 3


// =============================================================================
// SECTION 7: Object.defineProperty() APPROACH FOR GETTERS/SETTERS
// =============================================================================

/*
  Before ES5 `get`/`set` syntax, and still useful for adding getters/setters
  to EXISTING objects or prototypes dynamically.
  
  SYNTAX:
    Object.defineProperty(obj, "propName", {
        get() { return ...; },
        set(value) { ... }
    })
  
  Note: you CANNOT have both `value` and `get`/`set` in the same descriptor.
*/

// --- Example 7.1: defineProperty with getter/setter ---

const rectangle = { _width: 0, _height: 0 };

Object.defineProperty(rectangle, "area", {
    get() {
        return this._width * this._height;
    },
    enumerable:   true,
    configurable: true
    // No `set` — area is read-only (computed from width and height)
});

Object.defineProperty(rectangle, "width", {
    get() { return this._width; },
    set(v) { if (v > 0) this._width = v; },
    enumerable: true, configurable: true
});

Object.defineProperty(rectangle, "height", {
    get() { return this._height; },
    set(v) { if (v > 0) this._height = v; },
    enumerable: true, configurable: true
});

rectangle.width  = 8;
rectangle.height = 5;
console.log(rectangle.area);    // 40

rectangle.width  = 10;
console.log(rectangle.area);    // 50 ← auto-updated

// Expected Output:
// 40
// 50


// =============================================================================
// SECTION 8: QUICK REVISION NOTES
// =============================================================================

/*
  ┌──────────────────────────┬───────────────────────────────────────────────┐
  │ Concept                  │ Key Point                                     │
  ├──────────────────────────┼───────────────────────────────────────────────┤
  │ getter (get)             │ Runs on READ; must return a value; no params  │
  │ setter (set)             │ Runs on WRITE; receives new value as param    │
  │ Encapsulation            │ Hide internal data; expose controlled access  │
  │ _ convention             │ _prop = internal storage; prop = public face  │
  │ Recursion bug            │ Using same name in getter/setter → infinite   │
  │                          │ recursion → RangeError: call stack exceeded   │
  │ Fix for recursion        │ Use _prop for storage inside get/set prop     │
  │ Computed getter          │ Returns derived value; no separate storage    │
  │ Class get/set            │ Same syntax; goes on prototype                │
  │ defineProperty get/set   │ Dynamic; cannot mix with `value` in same desc │
  │ No setter = read-only    │ Assigning to a getter-only property fails     │
  └──────────────────────────┴───────────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 9: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Same name in getter/setter → infinite recursion
*/
// get name() { return this.name; }  // ← calls itself forever → CRASH
// ✅ Fix: return this._name

/*
  ❌ MISTAKE 2: Calling getters with parentheses
*/
// console.log(circle.area());  // ❌ TypeError: circle.area is not a function
// console.log(circle.area);    // ✅ no parentheses — it's a property, not a method

/*
  ❌ MISTAKE 3: Returning nothing from a getter
*/
// get price() { this._price * 1.1; }  // ← forgot `return` → undefined every time
// ✅ get price() { return this._price * 1.1; }

/*
  ❌ MISTAKE 4: Forgetting that getter-only properties silently reject writes
*/
// const obj = { get id() { return 1; } };
// obj.id = 99;   // silently fails (strict: TypeError: Cannot set property id)
// ✅ Add a setter if you need the property to be writable.

/*
  ❌ MISTAKE 5: Mixing `value` and `get` in Object.defineProperty
*/
// Object.defineProperty(obj, "x", { value: 5, get() { return 10; } });
// ← TypeError: Invalid property descriptor — cannot have both value and get


// =============================================================================
// SECTION 10: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is a getter in JavaScript?
  A:  A getter is a function defined with the `get` keyword that is automatically
      called when a property is READ. It looks like a property access from outside
      but runs code internally. It must return a value and takes no parameters.

  Q2. What is a setter in JavaScript?
  A:  A setter is a function defined with the `set` keyword that is automatically
      called when a property is WRITTEN to. It receives the new value as a parameter
      and can validate or transform it before storing.

  Q3. Why do we use the _ prefix with getters and setters?
  A:  To separate the internal storage property (_name) from the public getter/setter
      property (name). Using the same name causes infinite recursion since the
      getter/setter would call itself endlessly.

  Q4. What error does the recursion bug cause?
  A:  RangeError: Maximum call stack size exceeded. This happens when a getter
      reads the same property name it is defined for (or a setter writes to it),
      creating an infinite loop of self-calls.

  Q5. What is encapsulation and how do getters/setters achieve it?
  A:  Encapsulation is hiding internal data and exposing only a controlled
      interface. Getters/setters achieve it by storing data in _property
      (internal) while exposing property as the public face with validation
      and formatting logic built in.

  Q6. Can you have a getter without a setter?
  A:  Yes. A getter-only property is effectively read-only. Assigning to it
      silently fails in non-strict mode or throws a TypeError in strict mode.

  Q7. What is the difference between a computed getter and a stored property?
  A:  A stored property saves a value in memory. A computed getter calculates
      and returns a value on every access without storing it separately.
      Example: fullName computed from firstName + lastName.

  Q8. How do you add a getter/setter to an existing object?
  A:  Use Object.defineProperty with a get and/or set function in the descriptor.
      You cannot combine value with get/set in the same descriptor.

  Q9. Do class getters and setters go on the prototype?
  A:  Yes. Like regular class methods, get/set defined in a class body are
      placed on ClassName.prototype, not on each instance.

  Q10. What is the modern alternative to _ for true privacy?
  A:   Private class fields using the # prefix (e.g., #balance). Unlike _,
       these are enforced by the JavaScript engine and truly inaccessible
       from outside the class.
*/


// =============================================================================
// SECTION 11: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Basic):
  Create an object `rectangle` with _width and _height as internal properties.
  Add getters for width, height, area, and perimeter.
  Add setters for width and height that reject negative values.
  Test by setting dimensions and reading all four computed getters.

  ✏️ EXERCISE 2 (Validation):
  Create a class `Student` with:
    - _name (string, min 2 chars)
    - _grade (number, 0–100)
    - getter name, setter name (validate type and length)
    - getter grade, setter grade (validate range)
    - getter letterGrade (computed: A/B/C/D/F based on _grade)
  Test all validations with both valid and invalid inputs.

  ✏️ EXERCISE 3 (Recursion Debug):
  Find and fix the recursion bug:
    const person = {
        get name() { return this.name; },
        set name(v) { this.name = v; }
    };
    person.name = "Eman";
  What error does this cause? Write the correct version.

  ✏️ EXERCISE 4 (Object.defineProperty):
  Create an object `circle` with _radius stored internally.
  Use Object.defineProperty to add:
    - radius: getter + setter (reject non-positive values)
    - area: getter only (computed, non-writable)
    - diameter: getter + setter (setting diameter updates _radius)
  Test all three.

  ✏️ EXERCISE 5 (Challenge):
  Create a class `EventLogger` that:
    - Stores _logs as a private array
    - Has a setter log(message) that appends { message, timestamp: new Date() }
    - Has a getter logs that returns a copy of _logs (not the original array)
    - Has a getter lastLog that returns the most recent entry
    - Has a getter count
  Why should logs return a copy instead of the original array?
*/

// =============================================================================
// END OF FILE: 48-getters-setters.js
// Next File Suggestion: 49-closures.js — lexical scope and closures
// =============================================================================
