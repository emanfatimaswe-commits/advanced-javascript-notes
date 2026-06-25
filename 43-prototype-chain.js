// =============================================================================
// FILE: 43-prototype-chain.js
// TOPIC: Prototype Chain in JavaScript
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 43)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT IS A PROTOTYPE? (Simple Explanation)
// =============================================================================

/*
  Think of a PROTOTYPE like a family recipe book.
  
  If you (an object) don't know how to cook a dish, you check your parents'
  recipe book (prototype). If they don't have it either, you check your
  grandparents' (prototype's prototype), and so on.
  
  In JavaScript, EVERY object has a hidden link to another object called
  its PROTOTYPE. When you try to access a property or method that doesn't
  exist on the object itself, JavaScript automatically goes UP the chain
  to look for it.
  
  This chain of prototypes is called the PROTOTYPE CHAIN.
  
  The chain always ends at: null
  (null means "no more prototypes to check — property doesn't exist")
*/

// =============================================================================
// SECTION 2: __proto__ (The Hidden Link)
// =============================================================================

/*
  __proto__ is the actual property on every object that points to its
  prototype. It is the "hidden link" in the prototype chain.
  
  NOTE: __proto__ is considered "legacy". The modern way is Object.getPrototypeOf()
  But __proto__ is still widely used and appears in interviews.
*/

// --- Example 2.1: Seeing __proto__ in action ---

const myObj = {
    name: "Eman",
    city: "Karachi"
};

// myObj itself has: name, city
// myObj.__proto__ points to Object.prototype (the top-level blueprint)

console.log(myObj.name);           // "Eman"       -> found directly on myObj
console.log(myObj.hasOwnProperty); // [Function]   -> NOT on myObj, found on Object.prototype via __proto__

// Let's inspect __proto__
console.log(myObj.__proto__);      // {} → Object.prototype (has toString, hasOwnProperty etc.)
console.log(myObj.__proto__ === Object.prototype); // true

// Expected Output:
// Eman
// [Function: hasOwnProperty]
// [Object: null prototype] {}
// true


// --- Example 2.2: Manually setting __proto__ ---

const animal = {
    eats: true,
    breathes: true
};

const dog = {
    barks: true,
    __proto__: animal   // dog's prototype is now animal
};

console.log(dog.barks);    // true  → found on dog itself
console.log(dog.eats);     // true  → NOT on dog, found on animal (via __proto__)
console.log(dog.breathes); // true  → found on animal

// Expected Output:
// true
// true
// true

/*
  DIAGRAM: What happened above?
  
  dog object              animal object         null
  ┌──────────────┐        ┌──────────────┐
  │ barks: true  │──────▶ │ eats: true   │──────▶ null
  │ __proto__    │        │ breathes:true│
  └──────────────┘        └──────────────┘
  
  When you access dog.eats:
  Step 1: Check dog     → not found
  Step 2: Check animal  → FOUND 
*/


// =============================================================================
// SECTION 3: Object.getPrototypeOf() — The Modern Way
// =============================================================================

/*
  Object.getPrototypeOf(obj) returns the prototype of the given object.
  It is the preferred, standard, non-deprecated way to access the prototype.
  
  Syntax:  Object.getPrototypeOf(obj)
  Returns: The prototype object (or null if no prototype)
*/

const cat = {
    meows: true,
    __proto__: animal  // cat's prototype is animal (from Section 2)
};

// Modern way to check prototype:
console.log(Object.getPrototypeOf(cat));          // { eats: true, breathes: true }
console.log(Object.getPrototypeOf(cat) === animal); // true

// Compare __proto__ vs Object.getPrototypeOf:
console.log(cat.__proto__ === Object.getPrototypeOf(cat)); // true -> they give the same result

// Expected Output:
// { eats: true, breathes: true }
// true
// true


// =============================================================================
// SECTION 4: CONSTRUCTOR FUNCTIONS
// =============================================================================

/*
  A CONSTRUCTOR FUNCTION is a regular function used as a blueprint to
  create multiple objects of the same "type".
  
  Naming Convention: Starts with a CAPITAL letter (e.g., Person, Car, Animal)
  
  You call it with the `new` keyword.
  
  When you use `new`, JavaScript does 4 things automatically:
    1. Creates a brand new empty object {}
    2. Sets the prototype of the new object to ConstructorFunction.prototype
    3. Runs the constructor function with `this` pointing to the new object
    4. Returns the new object (unless you return something else explicitly)
*/

// --- Example 4.1: Basic Constructor Function ---

function Person(name, age) {
    // `this` refers to the new object being created
    this.name = name;   // assigns name property to the new object
    this.age = age;     // assigns age property to the new object
}

// Add a method to Person's PROTOTYPE (shared by ALL Person instances)
Person.prototype.greet = function() {
    // This method is NOT inside the constructor — it's on the prototype
    // This is memory-efficient: all Person objects SHARE this one function
    return `Hi! I'm ${this.name} and I'm ${this.age} years old.`;
};

Person.prototype.isAdult = function() {
    return this.age >= 18;
};

// Creating instances using `new`
const eman = new Person("Eman", 21);     // new object with name="Eman", age=21
const ali  = new Person("Ali", 17);      // new object with name="Ali", age=17

console.log(eman.name);         // "Eman"   -> own property
console.log(eman.greet());      // "Hi! I'm Eman and I'm 21 years old."  -> from prototype
console.log(ali.isAdult());     // false    -> from prototype
console.log(eman.isAdult());    // true     -> from prototype

// Expected Output:
// Eman
// Hi! I'm Eman and I'm 21 years old.
// false
// true

/*
  DIAGRAM: Constructor Function & Prototype
  
  Person.prototype
  ┌───────────────────────────┐
  │ greet: function           │
  │ isAdult: function         │
  │ constructor: Person       │
  └──────────┬────────────────┘
             │ (shared prototype link)
       ┌─────┴──────┐
       │            │
  ┌────▼──────┐  ┌──▼────────┐
  │ name:Eman │  │ name:Ali  │
  │ age: 21   │  │ age: 17   │
  └───────────┘  └───────────┘
   eman object    ali object
*/


// =============================================================================
// SECTION 5: HOW INHERITANCE LOOKUP WORKS (Step by Step)
// =============================================================================

/*
  JavaScript follows these steps when you access obj.someProperty:
  
  Step 1: Check the object itself                  -> obj.someProperty
  Step 2: Check obj.__proto__ (its prototype)      -> prototype.someProperty
  Step 3: Check prototype's __proto__              -> keep going up
  Step 4: Eventually reach Object.prototype        -> top of chain
  Step 5: If still not found, check null           -> return undefined
*/

// --- Example 5.1: Multi-level Prototype Chain ---

function Animal(name) {
    this.name = name;       // own property
}

Animal.prototype.breathe = function() {
    return `${this.name} is breathing.`;
};

function Dog(name, breed) {
    Animal.call(this, name); // call Animal constructor to set this.name
    this.breed = breed;      // own property of Dog
}

// Set Dog's prototype to inherit from Animal
Dog.prototype = Object.create(Animal.prototype);
// Object.create(Animal.prototype) → creates a new object whose __proto__ = Animal.prototype
// This is the standard way to set up inheritance without calling Animal()

// Fix the constructor reference (it gets overwritten by Object.create)
Dog.prototype.constructor = Dog;

// Add Dog-specific method
Dog.prototype.bark = function() {
    return `${this.name} says: Woof!`;
};

const tommy = new Dog("Tommy", "Labrador");

// Lookup chain in action:
console.log(tommy.name);       // "Tommy"    -> own property (set by Animal.call)
console.log(tommy.breed);      // "Labrador" -> own property
console.log(tommy.bark());     // "Tommy says: Woof!" -> Dog.prototype
console.log(tommy.breathe());  // "Tommy is breathing." -> Animal.prototype
console.log(tommy.toString()); // "[object Object]"   -> Object.prototype

// Expected Output:
// Tommy
// Labrador
// Tommy says: Woof!
// Tommy is breathing.
// [object Object]

/*
  DIAGRAM: Full Prototype Chain for tommy
  
  tommy (instance)
  ┌──────────────┐
  │ name: Tommy  │
  │ breed:Labrad │
  └──────┬───────┘
         │ __proto__
         ▼
  Dog.prototype
  ┌──────────────────┐
  │ bark: function   │
  │ constructor: Dog │
  └──────┬───────────┘
         │ __proto__
         ▼
  Animal.prototype
  ┌──────────────────────┐
  │ breathe: function    │
  │ constructor: Animal  │
  └──────┬───────────────┘
         │ __proto__
         ▼
  Object.prototype
  ┌──────────────────────────┐
  │ toString: function       │
  │ hasOwnProperty: function │
  │ valueOf: function ...    │
  └──────┬───────────────────┘
         │ __proto__
         ▼
        null  <- end of chain
*/


// =============================================================================
// SECTION 6: hasOwnProperty() — Check if Property is Own vs Inherited
// =============================================================================

/*
  hasOwnProperty(propName) returns true ONLY if the property is directly
  on the object itself — NOT inherited through the prototype chain.
*/

console.log(tommy.hasOwnProperty("name"));    // true  -> own property
console.log(tommy.hasOwnProperty("breed"));   // true  -> own property
console.log(tommy.hasOwnProperty("bark"));    // false -> inherited from Dog.prototype
console.log(tommy.hasOwnProperty("breathe")); // false -> inherited from Animal.prototype

// Expected Output:
// true
// true
// false
// false


// =============================================================================
// SECTION 7: PROTOTYPE OF BUILT-IN TYPES
// =============================================================================

// Arrays, Functions, and Strings also have prototypes!

const arr = [1, 2, 3];
console.log(Object.getPrototypeOf(arr) === Array.prototype);    // true
// That's why arr.map(), arr.filter(), arr.push() all work — they're on Array.prototype

const fn = function() {};
console.log(Object.getPrototypeOf(fn) === Function.prototype);  // true
// That's why fn.call(), fn.apply(), fn.bind() work — they're on Function.prototype

// Expected Output:
// true
// true


// =============================================================================
// SECTION 8: COMMON MISTAKES
// =============================================================================

/*
   MISTAKE 1: Forgetting `new` keyword
*/
// const p = Person("Eman", 21);  // <- Without new, `this` is global/undefined (strict mode error)
// Always use `new` with constructor functions.

/*
  MISTAKE 2: Adding methods inside constructor (memory waste)
*/
function BadPerson(name) {
    this.name = name;
    this.greet = function() {   // ← This creates a NEW function for EVERY instance
        return `Hi ${this.name}`;
    };
    // Each BadPerson object gets its own copy of greet — very wasteful!
}
// Correct: Put methods on prototype — shared by ALL instances.

/*
 MISTAKE 3: Overwriting prototype without fixing constructor
*/
// Dog.prototype = Object.create(Animal.prototype);
// After this, Dog.prototype.constructor is now Animal — WRONG!
// Fix: Dog.prototype.constructor = Dog;  <- Always do this!

/*
   MISTAKE 4: Confusing prototype vs __proto__
  - Person.prototype  -> the prototype object assigned to instances
  - eman.__proto__    -> the actual hidden link on an instance (points to Person.prototype)
  - Person.__proto__  -> Person function's own prototype (Function.prototype)
*/


// =============================================================================
// SECTION 9: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is the prototype chain in JavaScript?
  A: It is the chain of linked objects through which JavaScript looks up
     properties and methods. Each object has a __proto__ pointing to its
     prototype, and so on, until null is reached.

  Q2. What is the difference between __proto__ and prototype?
  A: - `prototype` is a property on CONSTRUCTOR FUNCTIONS (e.g., Person.prototype)
     - `__proto__` is a property on INSTANCES pointing to the constructor's prototype
     - eman.__proto__ === Person.prototype -> TRUE

  Q3. What does `new` keyword do?
  A: 1) Creates empty object {}
     2) Links __proto__ to ConstructorFn.prototype
     3) Runs constructor with `this` = new object
     4) Returns the object

  Q4. How do you check if a property belongs to the object or its prototype?
  A: Use hasOwnProperty():  obj.hasOwnProperty("prop")
     Returns true only for own properties.

  Q5. What is Object.create() and when do you use it?
  A: Object.create(proto) creates a new object with proto as its __proto__.
     Used to set up prototype-based inheritance cleanly.

  Q6. What does Object.getPrototypeOf() return?
  A: Returns the prototype (internal [[Prototype]]) of a given object.
     The modern alternative to __proto__.

  Q7. Where does the prototype chain end?
  A: It ends at null. Object.prototype.__proto__ === null.

  Q8. Why are methods added to prototype instead of inside constructor?
  A: For memory efficiency. If added inside the constructor, every instance
     gets its own copy of the function. On the prototype, ALL instances share
     ONE function.
*/


// =============================================================================
// SECTION 10: PRACTICE EXERCISES
// =============================================================================

/*
   EXERCISE 1 (Basic):
  Create a constructor function `Vehicle(brand, speed)`.
  Add a method `describe()` on Vehicle.prototype.
  Create two instances and call describe() on each.

   EXERCISE 2 (Intermediate):
  Create `ElectricCar` that inherits from `Vehicle`.
  Add a property `batteryLevel` and a method `charge()` to ElectricCar.
  Verify the prototype chain using Object.getPrototypeOf().

   EXERCISE 3 (Advanced):
  Without using class syntax, create a 3-level prototype chain:
  LivingThing -> Mammal -> Human
  Each level should add its own method.
  Create a Human instance and call methods from all 3 levels.
  Verify with hasOwnProperty() which properties are own vs inherited.

   EXERCISE 4 (Debug):
  The following code has a bug — find and fix it:

  function Student(name) {
    this.name = name;
  }
  function GradStudent(name, thesis) {
    Student.call(this, name);
    this.thesis = thesis;
  }
  GradStudent.prototype = Object.create(Student.prototype);
  // Bug: what's missing after the line above?

  EXERCISE 5 (Reflection):
  console.log(typeof Function.prototype);  // what does this output and why?
  console.log(Function.prototype.__proto__ === Object.prototype); // true or false?
  Explain your answers.
*/

// =============================================================================
// END OF FILE: 43-prototype-chain.js
// Next File Suggestion: 44-classes.js (ES6 Class syntax — syntactic sugar over prototypes)
// =============================================================================
