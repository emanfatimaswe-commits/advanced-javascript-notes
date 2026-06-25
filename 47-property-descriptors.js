// =============================================================================
// FILE: 47-property-descriptors.js
// TOPIC: Object Property Descriptors
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 47)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT ARE PROPERTY DESCRIPTORS? (Simple Explanation)
// =============================================================================

/*
  When you write:  const obj = { name: "Eman" }
  You think you're just storing a value. But JavaScript actually stores
  FOUR pieces of information for every property:
  
  ┌──────────────────────────────────────────────────────────────────┐
  │  PROPERTY DESCRIPTOR — the hidden metadata of every property     │
  │                                                                  │
  │  {                                                               │
  │    value:        "Eman",   ← the actual stored value            │
  │    writable:     true,     ← can the value be changed?          │
  │    enumerable:   true,     ← does it show in loops / Object.keys│
  │    configurable: true,     ← can the descriptor itself change?  │
  │  }                                                               │
  └──────────────────────────────────────────────────────────────────┘
  
  Normally all three flags are true for properties you create.
  But built-in properties like Math.PI have them set to false —
  that is why Math.PI = 99 silently fails (or throws in strict mode).
  
  Property descriptors give you FINE-GRAINED CONTROL over how properties
  behave. This is the mechanism that powers immutability, hidden properties,
  and non-configurable constants in JavaScript.
*/

// =============================================================================
// SECTION 2: Object.getOwnPropertyDescriptor() — READING THE METADATA
// =============================================================================

/*
  SYNTAX:
    Object.getOwnPropertyDescriptor(object, "propertyName")
  
  Returns the descriptor object for that property — or undefined if the
  property doesn't exist.
*/

// --- Example 2.1: Inspecting a regular property ---

const user = {
    name: "Eman",
    city: "Karachi",
    age:  21
};

const nameDescriptor = Object.getOwnPropertyDescriptor(user, "name");
console.log(nameDescriptor);
// Expected Output:
// {
//   value: 'Eman',
//   writable: true,        ← you CAN change user.name
//   enumerable: true,      ← shows up in for...in, Object.keys()
//   configurable: true     ← you CAN delete or redefine this property
// }


// --- Example 2.2: Inspecting Math.PI — the classic example ---

const piDescriptor = Object.getOwnPropertyDescriptor(Math, "PI");
console.log(piDescriptor);
// Expected Output:
// {
//   value: 3.141592653589793,
//   writable: false,       ← you CANNOT change Math.PI
//   enumerable: false,     ← does NOT show in for...in loops on Math
//   configurable: false    ← you CANNOT delete or redefine Math.PI
// }

// Proof that Math.PI is truly immutable:
Math.PI = 99;                       // silently fails in non-strict mode
console.log(Math.PI);               // still 3.141592653589793
// Expected Output: 3.141592653589793

// Get ALL descriptors at once:
const allDescriptors = Object.getOwnPropertyDescriptors(user); // note the plural
console.log(Object.keys(allDescriptors)); // [ 'name', 'city', 'age' ]
// Expected Output: [ 'name', 'city', 'age' ]


// =============================================================================
// SECTION 3: Object.defineProperty() — WRITING THE METADATA
// =============================================================================

/*
  SYNTAX:
    Object.defineProperty(object, "propertyName", descriptorObject)
  
  - Adds a new property OR modifies an existing one with exact control
    over writable, enumerable, and configurable flags.
  - Returns the modified object.
  
  IMPORTANT DEFAULTS when defining a NEW property with defineProperty:
    writable:     false   ← these three default to FALSE (opposite of
    enumerable:   false      regular assignment, where they default to TRUE)
    configurable: false
*/

// --- Example 3.1: Creating a read-only property ---

const config = {};

Object.defineProperty(config, "MAX_RETRIES", {
    value:        3,
    writable:     false,   // ← cannot be reassigned
    enumerable:   true,
    configurable: false    // ← cannot be deleted or redefined
});

console.log(config.MAX_RETRIES);  // 3

config.MAX_RETRIES = 10;          // silently fails (strict: TypeError)
console.log(config.MAX_RETRIES);  // still 3

// Expected Output:
// 3
// 3


// =============================================================================
// SECTION 4: writable — CONTROLLING REASSIGNMENT
// =============================================================================

/*
  writable: true  → the property value CAN be changed with assignment (=)
  writable: false → assignment is silently ignored (or throws in strict mode)
  
  This is how Math.PI and other constants are protected.
*/

// --- Example 4.1: writable: false in action ---

const settings = { theme: "dark" };

Object.defineProperty(settings, "VERSION", {
    value:    "1.0.0",
    writable: false,        // lock the version in
    enumerable:   true,
    configurable: false
});

console.log(settings.VERSION);  // 1.0.0
settings.VERSION = "9.9.9";     // silently fails
console.log(settings.VERSION);  // 1.0.0 — unchanged

// Expected Output:
// 1.0.0
// 1.0.0


// =============================================================================
// SECTION 5: enumerable — CONTROLLING VISIBILITY IN LOOPS
// =============================================================================

/*
  enumerable: true  → property appears in for...in loops, Object.keys(),
                       JSON.stringify(), Object.assign() etc.
  enumerable: false → property is HIDDEN from all iteration methods.
                      It still EXISTS and is accessible by name, but
                      does not show up in loops or Object.keys().
  
  Use case: internal/private metadata that consumers of your object
  should not see or accidentally iterate over.
*/

// --- Example 5.1: Non-enumerable property ---

const product = {
    name:  "Laptop",
    price: 85000
};

// Add a hidden internal property
Object.defineProperty(product, "_internalCode", {
    value:        "LP-2024-KHI",
    writable:     true,
    enumerable:   false,    // ← hidden from loops
    configurable: true
});

// Direct access still works:
console.log(product._internalCode);  // LP-2024-KHI  ✅

// But it does NOT appear in iteration:
console.log(Object.keys(product));   // [ 'name', 'price' ] ← _internalCode missing
console.log(JSON.stringify(product));// {"name":"Laptop","price":85000} ← also missing

for (const key in product) {
    console.log(key);               // name, price  — _internalCode is not listed
}

// Expected Output:
// LP-2024-KHI
// [ 'name', 'price' ]
// {"name":"Laptop","price":85000}
// name
// price


// =============================================================================
// SECTION 6: configurable — CONTROLLING THE DESCRIPTOR ITSELF
// =============================================================================

/*
  configurable: true  → the descriptor CAN be changed later with defineProperty
                         the property CAN be deleted with `delete`
  configurable: false → the descriptor is LOCKED — no further changes allowed
                         the property CANNOT be deleted
                         (you can still change `value` if writable is still true)
  
  Once you set configurable: false, you CANNOT set it back to true.
  It is a one-way door.
*/

// --- Example 6.1: configurable: false locks the descriptor ---

const api = {};

Object.defineProperty(api, "BASE_URL", {
    value:        "https://api.example.com",
    writable:     false,
    enumerable:   true,
    configurable: false   // ← lock the whole descriptor
});

// Trying to delete:
delete api.BASE_URL;          // silently fails
console.log(api.BASE_URL);    // still there → https://api.example.com

// Trying to redefine:
// Object.defineProperty(api, "BASE_URL", { value: "http://hacked.com" });
// ← TypeError: Cannot redefine property: BASE_URL

// Expected Output:
// https://api.example.com


// =============================================================================
// SECTION 7: PRACTICAL — BUILDING YOUR OWN Math.PI-STYLE CONSTANT
// =============================================================================

/*
  Now we fully understand WHY Math.PI can't be changed.
  Let's recreate that exact behaviour for our own constant.
*/

const MathConstants = {};

Object.defineProperty(MathConstants, "PI", {
    value:        3.141592653589793,
    writable:     false,    // cannot reassign
    enumerable:   false,    // hidden from loops (like the real Math.PI)
    configurable: false     // cannot delete or redefine
});

Object.defineProperty(MathConstants, "E", {
    value:        2.718281828459045,
    writable:     false,
    enumerable:   false,
    configurable: false
});

console.log(MathConstants.PI);          // 3.141592653589793
console.log(MathConstants.E);           // 2.718281828459045
console.log(Object.keys(MathConstants));// [] ← both hidden (non-enumerable)

MathConstants.PI = 99;                  // silently fails
console.log(MathConstants.PI);          // still 3.141592653589793

// Expected Output:
// 3.141592653589793
// 2.718281828459045
// []
// 3.141592653589793


// =============================================================================
// SECTION 8: QUICK REVISION NOTES
// =============================================================================

/*
  ┌──────────────────────────────┬──────────────────────────────────────────┐
  │ Concept                      │ Key Point                                │
  ├──────────────────────────────┼──────────────────────────────────────────┤
  │ Property Descriptor          │ Metadata object: value, writable,        │
  │                              │ enumerable, configurable                 │
  │ getOwnPropertyDescriptor()   │ Read descriptor for one property         │
  │ getOwnPropertyDescriptors()  │ Read descriptors for ALL properties      │
  │ defineProperty()             │ Add/modify property with exact flags     │
  │ writable: false              │ Prevents value reassignment              │
  │ enumerable: false            │ Hides from for..in, Object.keys, JSON    │
  │ configurable: false          │ Locks descriptor; prevents delete        │
  │ Default (normal assignment)  │ All three flags default to true          │
  │ Default (defineProperty)     │ All three flags default to FALSE         │
  │ Math.PI                      │ writable:false, enumerable:false,        │
  │                              │ configurable:false — the gold standard   │
  └──────────────────────────────┴──────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 9: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Expecting silent failure to throw an error
*/
// config.MAX_RETRIES = 99; // In non-strict: silently does nothing
// Use 'use strict' at the top of your file to catch these as TypeErrors.

/*
  ❌ MISTAKE 2: Forgetting defineProperty defaults are FALSE
*/
// Object.defineProperty(obj, "x", { value: 5 });
// obj.x = 10;            // fails silently — writable defaults to false
// Object.keys(obj);      // [] — enumerable defaults to false
// ✅ Always explicitly set all three flags with defineProperty.

/*
  ❌ MISTAKE 3: Confusing configurable with writable
  - writable:     controls if VALUE can change
  - configurable: controls if DESCRIPTOR can change
  You can have writable:true, configurable:false — value can change,
  but you can't redefine or delete the property.
*/

/*
  ❌ MISTAKE 4: Thinking non-enumerable means inaccessible
*/
// Object.defineProperty(obj, "secret", { value: 42, enumerable: false });
// obj.secret   // 42 — still fully accessible by name ✅
// Object.keys(obj) // won't include "secret" — just hidden from iteration

/*
  ❌ MISTAKE 5: Trying to undo configurable: false
*/
// Once set to false, configurable cannot be set back to true.
// Object.defineProperty(obj, "x", { configurable: false });
// Object.defineProperty(obj, "x", { configurable: true }); // TypeError ❌


// =============================================================================
// SECTION 10: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is a property descriptor in JavaScript?
  A:  A descriptor is the metadata object behind every property. It contains
      the value plus three boolean flags: writable, enumerable, configurable.

  Q2. Why can't you modify Math.PI?
  A:  Math.PI has writable: false, enumerable: false, and configurable: false
      in its descriptor. Assignment is silently ignored (or throws in strict mode).

  Q3. What is the difference between writable and configurable?
  A:  writable controls whether the value can be changed via assignment.
      configurable controls whether the descriptor itself can be changed,
      and whether the property can be deleted.

  Q4. What do writable/enumerable/configurable default to with Object.defineProperty()?
  A:  All three default to FALSE — the opposite of regular property assignment,
      where all three default to true.

  Q5. What does enumerable: false do?
  A:  Hides the property from for...in loops, Object.keys(), JSON.stringify(),
      and Object.assign(). The property still exists and is readable by name.

  Q6. What is the difference between getOwnPropertyDescriptor and
      getOwnPropertyDescriptors?
  A:  getOwnPropertyDescriptor (singular) returns the descriptor for ONE named
      property. getOwnPropertyDescriptors (plural) returns descriptors for ALL
      own properties of the object.

  Q7. Can you undo configurable: false?
  A:  No. Once set to false it is a one-way door. You cannot set it back to
      true, and you cannot delete or redefine the property.

  Q8. How would you create a constant property on an object?
  A:  Use Object.defineProperty with writable: false and configurable: false.
      This replicates what const does for variables, but at the property level.

  Q9. Does non-enumerable mean the property cannot be accessed?
  A:  No. Non-enumerable means the property is hidden from iteration methods.
      You can still read and write it directly by name (subject to writable).

  Q10. What is a practical use case for enumerable: false?
  A:   Attaching internal metadata or helper methods to an object that you
       don't want to appear in JSON output, loops, or Object.keys() — keeping
       the object's "public surface" clean.
*/


// =============================================================================
// SECTION 11: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Basic):
  Use Object.getOwnPropertyDescriptor() to inspect the descriptor of
  the "length" property on an array: [1, 2, 3].
  Log the result. What are the values of writable, enumerable, configurable?
  Explain why "length" has those values.

  ✏️ EXERCISE 2 (defineProperty):
  Create an empty object `appConfig`.
  Use Object.defineProperty to add three properties:
    - API_KEY:    "abc-123",  non-writable, non-configurable, enumerable
    - VERSION:    "2.0",      non-writable, non-configurable, enumerable
    - _internal:  "secret",   non-writable, non-enumerable, non-configurable
  Verify with Object.keys() that _internal is hidden.
  Try to change API_KEY and confirm it doesn't change.

  ✏️ EXERCISE 3 (Intermediate):
  Create an object `circle` with a regular property radius: 5.
  Use Object.defineProperty to add a non-enumerable property "area"
  that stores the computed area (Math.PI * r^2).
  Show that JSON.stringify(circle) only shows radius, not area,
  but circle.area is still accessible.

  ✏️ EXERCISE 4 (Debug):
  What is wrong here, and what will happen?
    const obj = {};
    Object.defineProperty(obj, "id", { value: 1 });
    obj.id = 2;
    console.log(obj.id);
  What would you add to defineProperty to allow changes later?

  ✏️ EXERCISE 5 (Challenge):
  Use Object.defineProperty to add a method `toString` on a custom object
  that is non-enumerable (so it doesn't appear in Object.keys() or for..in)
  but is callable. Test that it works like a normal method while remaining
  invisible to iteration. This is exactly how built-in methods like
  Array.prototype.map behave.
*/

// =============================================================================
// END OF FILE: 47-property-descriptors.js
// Next File Suggestion: 48-getters-setters.js — get/set syntax and encapsulation
// =============================================================================
