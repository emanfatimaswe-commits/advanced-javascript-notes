// =============================================================================
// FILE: 45-classes.js
// TOPIC: JavaScript Classes — Syntax, Inheritance, Static Methods
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 45)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT ARE CLASSES? (Simple Explanation)
// =============================================================================

/*
  Think of a CLASS like a COOKIE CUTTER.
  
  The cookie cutter (class) is NOT a cookie itself.
  It is a TEMPLATE used to STAMP OUT multiple cookies (objects) of the same shape.
  
  Each cookie (instance) created from the cutter:
    - Has the same SHAPE    → same properties and methods
    - Can have different FLAVORS → different values for those properties
  
  In JavaScript, classes were introduced in ES6 (2015).
  They give us a cleaner, more readable syntax to do what constructor
  functions and prototypes were already doing under the hood.
  
  ┌─────────────────────────────────────────────────────────┐
  │  IMPORTANT: Classes are SYNTACTIC SUGAR over prototypes  │
  │  JavaScript still uses the prototype chain internally.   │
  │  `class` just makes the code easier to read and write.  │
  └─────────────────────────────────────────────────────────┘
*/

// =============================================================================
// SECTION 2: BASIC CLASS SYNTAX
// =============================================================================

/*
  SYNTAX:
  
  class ClassName {
      constructor(param1, param2) {
          this.prop1 = param1;   // instance property
          this.prop2 = param2;   // instance property
      }
  
      methodName() {             // instance method (goes on prototype)
          // ...
      }
  }
  
  - The `constructor` is a special method called automatically when
    you create an instance with `new`.
  - There can only be ONE constructor per class.
  - Methods defined inside the class body go on the PROTOTYPE (not on each instance).
*/

// --- Example 2.1: Defining and using a basic class ---

class Person {
    // constructor runs automatically when `new Person(...)` is called
    constructor(name, age) {
        this.name = name;   // own property on every instance
        this.age  = age;    // own property on every instance
    }

    // Method defined on Person.prototype — shared by ALL instances
    greet() {
        return `Hi, I'm ${this.name} and I'm ${this.age} years old.`;
    }

    // Another prototype method
    isAdult() {
        return this.age >= 18
            ? `${this.name} is an adult.`
            : `${this.name} is a minor.`;
    }
}

// Creating instances with `new`
const eman = new Person("Eman", 21);
const ali  = new Person("Ali",  17);

console.log(eman.greet());    // Hi, I'm Eman and I'm 21 years old.
console.log(ali.greet());     // Hi, I'm Ali and I'm 17 years old.
console.log(eman.isAdult());  // Eman is an adult.
console.log(ali.isAdult());   // Ali is a minor.

// Methods live on the prototype — not copied into each instance
console.log(eman.hasOwnProperty("name"));   // true  → own property
console.log(eman.hasOwnProperty("greet"));  // false → on Person.prototype

// Expected Output:
// Hi, I'm Eman and I'm 21 years old.
// Hi, I'm Ali and I'm 17 years old.
// Eman is an adult.
// Ali is a minor.
// true
// false


// =============================================================================
// SECTION 3: CLASSES ARE SYNTACTIC SUGAR — PROOF
// =============================================================================

/*
  Under the hood, `class Person` is equivalent to:
  
  function Person(name, age) {
      this.name = name;
      this.age  = age;
  }
  Person.prototype.greet   = function() { ... };
  Person.prototype.isAdult = function() { ... };
  
  JavaScript converts the class syntax into this prototype-based
  structure at runtime. The class keyword is just cleaner syntax.
*/

// Proof: the prototype chain is identical
console.log(typeof Person);                        // "function" ← still a function!
console.log(eman.__proto__ === Person.prototype);  // true
console.log(Object.getPrototypeOf(eman) === Person.prototype); // true

// Expected Output:
// function
// true
// true

/*
  DIAGRAM: What a class creates under the hood
  
  Person.prototype
  ┌──────────────────────────┐
  │ greet: function          │  ← defined once, shared by all instances
  │ isAdult: function        │
  │ constructor: Person      │
  └──────────┬───────────────┘
             │ [[Prototype]] link
       ┌─────┴──────┐
       │            │
  ┌────▼──────┐  ┌──▼────────┐
  │ name:Eman │  │ name: Ali │   ← own properties
  │ age: 21   │  │ age: 17   │
  └───────────┘  └───────────┘
   eman (inst.)   ali (inst.)
*/


// =============================================================================
// SECTION 4: INHERITANCE WITH extends
// =============================================================================

/*
  INHERITANCE = one class gets all the properties and methods of another class.
  
  The class that is inherited FROM is called:  Parent / Base / Super class
  The class that inherits is called:           Child / Derived / Sub class
  
  Use the `extends` keyword to create a child class.
  
  SYNTAX:
    class Child extends Parent {
        constructor(...) { ... }
        // additional methods
    }
  
  The child class automatically gets access to all of the parent's methods
  through the prototype chain.
*/

// --- Example 4.1: Basic inheritance with extends ---

class Animal {
    constructor(name, sound) {
        this.name  = name;    // own property
        this.sound = sound;   // own property
    }

    speak() {
        // method on Animal.prototype
        return `${this.name} says: ${this.sound}!`;
    }

    breathe() {
        return `${this.name} is breathing.`;
    }
}

// Dog EXTENDS Animal — inherits all of Animal's methods
class Dog extends Animal {
    constructor(name, breed) {
        // super() MUST be called FIRST inside a child constructor (see Section 5)
        super(name, "Woof");  // calls Animal's constructor with name and "Woof"
        this.breed = breed;   // Dog's own extra property
    }

    // Dog-specific method — only Dog instances have this
    fetch(item) {
        return `${this.name} fetches the ${item}!`;
    }
}

const tommy = new Dog("Tommy", "Labrador");

console.log(tommy.speak());         // Tommy says: Woof!  ← from Animal.prototype
console.log(tommy.breathe());       // Tommy is breathing. ← from Animal.prototype
console.log(tommy.fetch("ball"));   // Tommy fetches the ball! ← from Dog.prototype
console.log(tommy.name);            // Tommy  ← own property
console.log(tommy.breed);           // Labrador ← own property

// Expected Output:
// Tommy says: Woof!
// Tommy is breathing.
// Tommy fetches the ball!
// Tommy
// Labrador

/*
  DIAGRAM: Prototype chain with extends
  
  tommy (instance)
  ┌──────────────┐
  │ name: Tommy  │
  │ breed:Labrad │
  └──────┬───────┘
         │ __proto__
         ▼
  Dog.prototype
  ┌──────────────────┐
  │ fetch: function  │
  │ constructor: Dog │
  └──────┬───────────┘
         │ __proto__
         ▼
  Animal.prototype
  ┌──────────────────────┐
  │ speak: function      │
  │ breathe: function    │
  │ constructor: Animal  │
  └──────┬───────────────┘
         │ __proto__
         ▼
  Object.prototype
  ┌──────────────────────┐
  │ toString, valueOf... │
  └──────┬───────────────┘
         │ __proto__
         ▼
        null
*/


// =============================================================================
// SECTION 5: super() — CALLING THE PARENT
// =============================================================================

/*
  `super` has TWO uses inside a child class:
  
  ① super()          → calls the PARENT'S constructor (use in constructor)
  ② super.method()   → calls a specific PARENT method (use in methods)
  
  RULES for super() in a constructor:
    - You MUST call super() before using `this` in a child constructor.
    - If you forget, JavaScript throws: ReferenceError: Must call super
      constructor in derived class before accessing 'this'
    - super() passes arguments UP to the parent constructor.
*/

// --- Example 5.1: super() in constructor ---

class Shape {
    constructor(color, filled) {
        this.color  = color;   // set on the child instance via super()
        this.filled = filled;
    }

    describe() {
        const fillText = this.filled ? "filled" : "not filled";
        return `A ${fillText} ${this.color} shape.`;
    }
}

class Circle extends Shape {
    constructor(color, filled, radius) {
        super(color, filled);   // ← MUST be first; sets this.color & this.filled
        this.radius = radius;   // ← only AFTER super() can we use `this`
    }

    area() {
        return +(Math.PI * this.radius ** 2).toFixed(2); // rounded to 2 decimal places
    }
}

class Rectangle extends Shape {
    constructor(color, filled, width, height) {
        super(color, filled);   // inherits color & filled from Shape
        this.width  = width;
        this.height = height;
    }

    area() {
        return this.width * this.height;
    }
}

const c = new Circle("red", true, 7);
const r = new Rectangle("blue", false, 5, 10);

console.log(c.describe());  // A filled red shape.      ← from Shape.prototype
console.log(c.area());      // 153.94                   ← from Circle.prototype
console.log(r.describe());  // A not filled blue shape. ← from Shape.prototype
console.log(r.area());      // 50                       ← from Rectangle.prototype

// Expected Output:
// A filled red shape.
// 153.94
// A not filled blue shape.
// 50


// --- Example 5.2: super.method() — calling a parent method from child ---

class Vehicle {
    constructor(brand) {
        this.brand = brand;
    }

    info() {
        return `Brand: ${this.brand}`;
    }
}

class ElectricCar extends Vehicle {
    constructor(brand, range) {
        super(brand);
        this.range = range;
    }

    info() {
        // Use super.info() to get the parent's result, then add our own details
        const parentInfo = super.info();          // "Brand: Tesla"
        return `${parentInfo} | Range: ${this.range} km`; // extend it
    }
}

const tesla = new ElectricCar("Tesla", 550);
console.log(tesla.info()); // Brand: Tesla | Range: 550 km

// Expected Output:
// Brand: Tesla | Range: 550 km


// =============================================================================
// SECTION 6: STATIC METHODS
// =============================================================================

/*
  STATIC methods belong to the CLASS ITSELF — not to any instance.
  
  You call them ON the class, not on an object created from it.
  
  Use cases:
    → Utility / helper functions related to the class concept
    → Factory methods that create instances in special ways
    → Counters or shared data across all instances
  
  SYNTAX:
    static methodName() { ... }
  
  Call as: ClassName.methodName()   ✅
  NOT as:  instance.methodName()    ❌ (undefined)
*/

// --- Example 6.1: Static utility method ---

class MathHelper {
    // No constructor needed — this class is just a utility container

    static add(a, b) {
        return a + b;
    }

    static multiply(a, b) {
        return a * b;
    }

    static clamp(value, min, max) {
        // Clamps a value between min and max — common utility
        return Math.min(Math.max(value, min), max);
    }
}

console.log(MathHelper.add(5, 3));           // 8
console.log(MathHelper.multiply(4, 7));      // 28
console.log(MathHelper.clamp(150, 0, 100));  // 100 ← clamped to max

// Expected Output:
// 8
// 28
// 100


// --- Example 6.2: Static factory method ---

class User {
    constructor(name, role) {
        this.name = name;
        this.role = role;
    }

    // Static factory: creates a User with a default role
    static createAdmin(name) {
        return new User(name, "admin");  // calls the regular constructor
    }

    static createGuest() {
        return new User("Guest", "guest");
    }

    toString() {
        return `${this.name} [${this.role}]`;
    }
}

const admin = User.createAdmin("Eman");   // shortcut to make an admin
const guest = User.createGuest();

console.log(admin.toString()); // Eman [admin]
console.log(guest.toString()); // Guest [guest]

// Static methods are NOT available on instances:
// console.log(admin.createAdmin("X")); // TypeError: admin.createAdmin is not a function

// Expected Output:
// Eman [admin]
// Guest [guest]


// =============================================================================
// SECTION 7: QUICK REVISION NOTES
// =============================================================================

/*
  ┌────────────────────┬────────────────────────────────────────────────────┐
  │ Concept            │ Key Point                                          │
  ├────────────────────┼────────────────────────────────────────────────────┤
  │ class              │ Blueprint / template for creating objects          │
  │ constructor()      │ Runs automatically on `new`; sets own properties   │
  │ instance method    │ Defined in class body; goes on prototype (shared)  │
  │ extends            │ Makes child class inherit from parent class        │
  │ super()            │ Calls parent constructor; MUST come before `this`  │
  │ super.method()     │ Calls a specific parent method from child          │
  │ static method      │ Belongs to the CLASS, not instances; utility use   │
  │ syntactic sugar    │ `class` compiles to constructor fn + prototype     │
  │ typeof Person      │ "function" — classes ARE functions under the hood  │
  │ Prototype chain    │ Child.prototype.__proto__ === Parent.prototype      │
  └────────────────────┴────────────────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 8: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Forgetting super() before `this` in a child constructor
*/
// class Cat extends Animal {
//     constructor(name) {
//         this.indoor = true;  // ← ReferenceError: Must call super constructor first
//         super(name, "Meow");
//     }
// }
// ✅ Fix: Always call super() as the VERY FIRST line in child constructor.

/*
  ❌ MISTAKE 2: Thinking class methods are on the instance (they're on prototype)
*/
// console.log(eman.hasOwnProperty("greet")); // false — it's on Person.prototype
// This matters for performance: methods are defined ONCE and shared, not copied.

/*
  ❌ MISTAKE 3: Trying to call a static method on an instance
*/
// const u = new User("X", "admin");
// u.createAdmin("Y");  // ❌ TypeError
// User.createAdmin("Y"); // ✅ correct

/*
  ❌ MISTAKE 4: Putting a comma between methods (class body ≠ object literal)
*/
// class Wrong {
//     methodA() { },   // ← SyntaxError: no commas between class methods
//     methodB() { }
// }
// ✅ Fix: No commas. Class body uses only method definitions.

/*
  ❌ MISTAKE 5: Thinking classes are hoisted like functions
*/
// const p = new Person("X", 1); // ← ReferenceError if Person class is defined BELOW
// class Person { ... }
// Unlike function declarations, classes are NOT hoisted. Define before use.


// =============================================================================
// SECTION 9: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is a JavaScript class?
  A:  A class is a syntactic sugar template introduced in ES6 for creating
      objects. Under the hood it still uses constructor functions and prototype
      chains — the class syntax just makes the code cleaner and more readable.

  Q2. What is the constructor method?
  A:  A special method inside a class that is automatically called when a new
      instance is created with `new`. It initialises the instance's own
      properties. A class can have only one constructor.

  Q3. Are class methods stored on each instance?
  A:  No. Methods defined in the class body are placed on ClassName.prototype
      and shared by all instances. Only properties set with `this.x = ...`
      inside the constructor are own (per-instance) properties.

  Q4. What does `extends` do?
  A:  It sets up prototype-chain inheritance so the child class gets access to
      all methods of the parent class. It also makes Child.prototype.__proto__
      equal to Parent.prototype.

  Q5. What is super() and when must you use it?
  A:  super() calls the parent class's constructor. It must be called inside a
      child constructor BEFORE any reference to `this`. Omitting it causes a
      ReferenceError.

  Q6. What is super.method() used for?
  A:  It calls a specific method from the parent class inside a child class
      method. Useful when you want to extend (not fully replace) the parent
      method's behaviour.

  Q7. What are static methods?
  A:  Methods defined with the `static` keyword that belong to the class itself,
      not to instances. Called as ClassName.method(). Common for utility
      functions and factory patterns.

  Q8. Are JavaScript classes hoisted?
  A:  No. Unlike function declarations, class declarations are NOT hoisted.
      You must define the class before using it, or you get a ReferenceError.

  Q9. What is the difference between a class and an object literal?
  A:  An object literal creates a single object. A class is a reusable blueprint
      that can create many objects with the same structure and shared methods.

  Q10. Prove that class is syntactic sugar over prototypes.
  A:   typeof Person === "function" → classes are still functions.
       eman.__proto__ === Person.prototype → same prototype linkage as
       constructor functions. The class keyword translates directly into
       the older prototype-based pattern at runtime.
*/


// =============================================================================
// SECTION 10: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Basic):
  Create a class `BankAccount` with:
    - constructor(owner, balance)
    - method deposit(amount)  → adds to balance, logs new balance
    - method withdraw(amount) → subtracts if funds sufficient, else logs error
    - method getBalance()     → returns current balance
  Create two accounts and perform deposits and withdrawals.

  ✏️ EXERCISE 2 (Inheritance):
  Create a parent class `Employee(name, salary)` with a method paySummary().
  Create a child class `Manager(name, salary, teamSize)` that:
    - Uses super() to inherit name & salary
    - Adds a bonus() method returning salary * 0.2
    - Overrides paySummary() to include bonus info using super.paySummary()
  Instantiate a Manager and call both methods.

  ✏️ EXERCISE 3 (Static Methods):
  Create a class `TemperatureConverter` with ONLY static methods:
    - static celsiusToFahrenheit(c)
    - static fahrenheitToCelsius(f)
    - static celsiusToKelvin(c)
  Call all three directly on the class (no instances needed).

  ✏️ EXERCISE 4 (Debug):
  Find ALL bugs in this code:

    class Animal {
        constructor(name) { this.name = name; }
        speak() { return `${this.name} speaks`; }
    }
    class Cat extends Animal {
        constructor(name, indoor) {
            this.indoor = indoor;   // Bug 1
            super(name);
        }
        speak() {
            return super.speak() + " and meows",  // Bug 2
        }
    }

  ✏️ EXERCISE 5 (Challenge):
  Build a 3-level class hierarchy:
    LivingThing → Plant → FloweringPlant
  Each level should add a constructor property and one method.
  The FloweringPlant class should override a parent method using super.method().
  Verify the prototype chain with Object.getPrototypeOf() at each level.
*/

// =============================================================================
// END OF FILE: 45-classes.js
// Next File Suggestion: 46-getters-setters.js — get/set in classes and objects
// =============================================================================
