// =============================================================================
// FILE: 51-v8-array-internals.js
// TOPIC: V8 Engine and Array Internals — How JavaScript Really Runs
// COURSE: Chai aur Code — Advanced JavaScript (Lecture 51)
// SUBMISSION: advanced-javascript-notes (Annotated Exercises)
// AUTHOR: Eman Fatima
// =============================================================================

// =============================================================================
// SECTION 1: WHAT IS THE V8 ENGINE? (Simple Explanation)
// =============================================================================

/*
  JavaScript is a HIGH-LEVEL language — humans write it, machines can't run it.
  The V8 ENGINE is the program that translates and runs your JavaScript code.
  
  Built by Google, V8 powers:
    → Chrome browser
    → Node.js (which is why you can run JS on a server)
    → Deno, Electron, and many other runtimes
  
  V8 is extremely fast because it does something clever: it does NOT just
  interpret your code line by line. It COMPILES frequently-run code into
  optimised machine code using a system called JIT (Just-In-Time compilation).
  
  ┌────────────────────────────────────────────────────────────────┐
  │  Your JavaScript  →  V8 Parser  →  AST  →  Ignition          │
  │  (source code)       (reads)      (tree)   (interpreter)     │
  │                                              ↓                │
  │                                      TurboFan (optimizer)    │
  │                                      ↓                        │
  │                                   Machine Code (fast!) ✅     │
  └────────────────────────────────────────────────────────────────┘
  
  The key to V8's speed: it ASSUMES your code is consistent.
  When your code IS consistent (same types, same shapes), V8 optimises hard.
  When your code is INCONSISTENT (mixed types, holes), V8 de-optimises.
  
  This lecture is about arrays — and how their internal representation
  directly affects whether V8 can optimise your code or not.
*/

// =============================================================================
// SECTION 2: HOW V8 STORES ARRAYS INTERNALLY
// =============================================================================

/*
  V8 does not store all arrays the same way.
  It classifies arrays into different ELEMENT KINDS based on what they contain.
  
  The element kind determines:
    → How much memory is used per element
    → Whether elements are stored contiguously (like a C array)
    → How fast operations like iteration and indexing are
  
  ELEMENT KIND HIERARCHY (from most optimised to least):
  
  ┌─────────────────────────────────────────────────────────────────┐
  │  MOST OPTIMISED                                                 │
  │                                                                 │
  │  SMI_ELEMENTS          → only small integers (Smi = Small Int) │
  │       ↓  (downgrade when doubles are added)                    │
  │  DOUBLE_ELEMENTS       → integers + floating point numbers     │
  │       ↓  (downgrade when non-numbers are added)                │
  │  ELEMENTS              → any mix: numbers, strings, objects    │
  │                                                                 │
  │  Each of the above also has a PACKED and HOLEY variant:        │
  │                                                                 │
  │  PACKED_SMI_ELEMENTS   → dense, all small ints    (fastest)   │
  │  HOLEY_SMI_ELEMENTS    → sparse, all small ints               │
  │  PACKED_DOUBLE_ELEMENTS→ dense, all doubles                    │
  │  HOLEY_DOUBLE_ELEMENTS → sparse, all doubles                  │
  │  PACKED_ELEMENTS       → dense, mixed types                    │
  │  HOLEY_ELEMENTS        → sparse, mixed types      (slowest)   │
  │                                                                 │
  │  LEAST OPTIMISED                                                │
  └─────────────────────────────────────────────────────────────────┘
  
  KEY RULE: Transitions only go DOWNWARD. Once an array is downgraded,
  it NEVER upgrades back, even if you remove the problematic elements.
  
  This is the single most important thing to understand about V8 arrays.
*/

// =============================================================================
// SECTION 3: PACKED ARRAYS — DENSE AND FAST
// =============================================================================

/*
  A PACKED array is one where every index from 0 to length-1 has a value.
  No gaps. No undefined holes. Elements stored contiguously in memory.
  
  V8 can iterate packed arrays extremely fast because it knows:
    → Exactly how many elements there are
    → Exactly where each element is in memory
    → No prototype chain lookup is needed for missing indexes
*/

// --- Example 3.1: Packed SMI array (fastest possible) ---

const packedSmi = [1, 2, 3, 4, 5];
// Element kind: PACKED_SMI_ELEMENTS
// V8 knows: 5 elements, all small integers, no gaps
// Memory: tightly packed integers in contiguous slots
// ✅ Fastest array type — V8 applies full optimisation

console.log(packedSmi[2]);         // 3   — instant lookup
console.log(packedSmi.length);     // 5


// --- Example 3.2: Packed double array ---

const packedDouble = [1.1, 2.2, 3.3, 4.4];
// Element kind: PACKED_DOUBLE_ELEMENTS
// V8 must use 64-bit float storage (more memory than SMI)
// but still tightly packed and fast

console.log(packedDouble[0]);      // 1.1


// --- Example 3.3: What makes an array NOT packed ---

const mixedPacked = [1, 2, "hello"];
// Element kind: PACKED_ELEMENTS  (downgraded — no longer pure SMI or double)
// Still packed (no holes) — but V8 must use a flexible tagged pointer per element
// Slower than SMI/double but still faster than holey

console.log(mixedPacked.length);   // 3

// Expected Output:
// 3
// 5
// 1.1
// 3


// =============================================================================
// SECTION 4: HOLEY ARRAYS — SPARSE AND SLOW
// =============================================================================

/*
  A HOLEY array has GAPS — indexes with no assigned value.
  
  Why are holes slow?
  
  When V8 accesses a holey array index, it must check:
    Step 1: Is there a value at this index on the array?  → no
    Step 2: Check the array's prototype  → no
    Step 3: Check Array.prototype  → no
    Step 4: Check Object.prototype  → no
    Step 5: Return undefined
  
  That is 4 extra prototype chain lookups for EVERY hole access.
  In a tight loop over a large array, this cost adds up massively.
  
  PACKED arrays skip all of this — they know every index has a value.
*/

// --- Example 4.1: Creating a holey array ---

const holey = [1, 2, , , 5];
//                  ↑  ↑  these two commas create HOLES at index 2 and 3
// Element kind: HOLEY_SMI_ELEMENTS

console.log(holey[2]);    // undefined — but NOT because the value is undefined
                           // it's because index 2 is a HOLE (no entry at all)
console.log(holey.length);// 5 — V8 counts from 0 to last defined index

// Expected Output:
// undefined
// 5


// --- Example 4.2: Pre-allocating with new Array() creates holes ---

const preallocated = new Array(5);
// Element kind: HOLEY_SMI_ELEMENTS  (immediately holey — 5 holes, no values)
// ❌ Every slot is a hole — slowest start for an array

console.log(preallocated);         // [ <5 empty items> ]
console.log(preallocated[0]);      // undefined (hole)

// ✅ Better alternative: start empty and push
const betterArray = [];
betterArray.push(1);
betterArray.push(2);
betterArray.push(3);
// This stays PACKED throughout — V8 can optimise it properly

// Expected Output:
// [ <5 empty items> ]
// undefined


// --- Example 4.3: Reading beyond length creates a hole ---

const arr = [1, 2, 3];
console.log(arr[10]);  // undefined — index 10 is beyond the array, acts like a hole
// arr itself is still PACKED (no permanent hole created by just reading)
// But if you WRITE: arr[10] = 99 — now you have holes at 3,4,5,6,7,8,9 ❌

// Expected Output:
// undefined


// =============================================================================
// SECTION 5: SMI ARRAYS — SMALL INTEGER OPTIMISATION
// =============================================================================

/*
  SMI stands for "Small Integer" — a special internal representation V8 uses
  for integers that fit in 31 bits (roughly -1 billion to +1 billion).
  
  Smi values are stored DIRECTLY in the pointer slot — they don't need a
  separate heap allocation. This makes them dramatically faster to work with.
  
  PACKED_SMI_ELEMENTS is the absolute fastest array type in V8.
  
  SMI range: -1,073,741,824 to 1,073,741,823 (on 32-bit)
             On 64-bit systems: larger range
*/

// --- Example 5.1: SMI array stays SMI until disturbed ---

const smiArr = [10, 20, 30, 40, 50];
// PACKED_SMI_ELEMENTS ✅

smiArr.push(60);               // still PACKED_SMI ✅
console.log(smiArr);           // [10, 20, 30, 40, 50, 60]

smiArr.push(3.14);             // 🔽 DOWNGRADE to PACKED_DOUBLE_ELEMENTS
// V8 converts all elements to 64-bit doubles to accommodate 3.14
// The integers (10, 20...) are now stored as doubles too — more memory used

smiArr.push("hello");          // 🔽 DOWNGRADE to PACKED_ELEMENTS
// Now every element must be a tagged pointer — maximum flexibility, minimum speed

// IMPORTANT: There is NO WAY to upgrade back to PACKED_SMI or PACKED_DOUBLE
// even if you remove 3.14 and "hello". The downgrade is PERMANENT.

console.log(smiArr);

// Expected Output:
// [10, 20, 30, 40, 50, 60]
// [10, 20, 30, 40, 50, 60, 3.14, 'hello']


// =============================================================================
// SECTION 6: DOUBLE ARRAYS
// =============================================================================

/*
  DOUBLE arrays hold floating-point numbers (doubles).
  V8 uses UNBOXED doubles — the 64-bit IEEE 754 value is stored directly
  in the array memory, with no extra heap object wrapping.
  
  This is faster than ELEMENTS (which use tagged pointers) but slower
  than SMI (which stores values directly without even a float conversion).
*/

// --- Example 6.1: Double array ---

const temps = [36.6, 37.1, 38.2, 36.9];
// PACKED_DOUBLE_ELEMENTS — all floats, all present, no holes

temps.push(37.5);   // stays PACKED_DOUBLE ✅
console.log(temps); // [36.6, 37.1, 38.2, 36.9, 37.5]

// Adding an integer to a double array does NOT downgrade it:
temps.push(37);     // 37 is stored as 37.0 (a double) — still PACKED_DOUBLE ✅
console.log(temps); // [36.6, 37.1, 38.2, 36.9, 37.5, 37]

// Adding a string DOES downgrade:
// temps.push("hot"); // 🔽 PACKED_ELEMENTS

// Expected Output:
// [36.6, 37.1, 38.2, 36.9, 37.5]
// [36.6, 37.1, 38.2, 36.9, 37.5, 37]


// =============================================================================
// SECTION 7: MIXED / GENERIC ELEMENTS ARRAYS
// =============================================================================

/*
  Once an array contains mixed types (numbers + strings + objects + booleans),
  V8 classifies it as ELEMENTS (generic elements).
  
  In this mode:
    → Each element is a "tagged pointer" — a reference to a heap object
    → V8 cannot apply number-specific fast paths
    → Operations are slower — V8 must handle every type at every step
    → No unboxed storage — everything goes through heap allocation
*/

// --- Example 7.1: Mixed array (least optimised) ---

const mixed = [1, "two", true, null, { name: "Eman" }, [3, 4]];
// PACKED_ELEMENTS — maximum flexibility, minimum performance

// This is fine for small, rarely-iterated data
// ❌ Avoid this in HOT LOOPS (code that runs millions of times)

console.log(mixed[0]);    // 1
console.log(mixed[4]);    // { name: 'Eman' }

// Expected Output:
// 1
// { name: 'Eman' }


// =============================================================================
// SECTION 8: OPTIMISATION DOWNGRADES — THE ONE-WAY STREET
// =============================================================================

/*
  DIAGRAM: The Downgrade Lattice (once you go down, you never come back)
  
  PACKED_SMI_ELEMENTS        ← fastest, most restricted
       │
       │ add a double
       ▼
  PACKED_DOUBLE_ELEMENTS
       │
       │ add a non-number
       ▼
  PACKED_ELEMENTS
       │
       │ create a hole
       ▼
  HOLEY_ELEMENTS             ← slowest, most flexible
  
  There are also:
  HOLEY_SMI_ELEMENTS    (all ints but with holes)
  HOLEY_DOUBLE_ELEMENTS (all doubles but with holes)
  
  These are the holey equivalents that form a parallel track above HOLEY_ELEMENTS.
  
  THE RULE: V8 only moves DOWN this lattice. NEVER up.
*/

// --- Example 8.1: Step-by-step downgrade demonstration ---

function showDowngrade() {
    let arr = [1, 2, 3];         // PACKED_SMI
    console.log("Start:", arr);

    arr.push(1.5);               // 🔽 → PACKED_DOUBLE
    console.log("After push(1.5):", arr);

    arr.push("text");            // 🔽 → PACKED_ELEMENTS
    console.log("After push('text'):", arr);

    arr[10] = 99;                // 🔽 → HOLEY_ELEMENTS (creates holes at 6–9)
    console.log("After arr[10]=99:", arr);

    // Attempting to "clean up":
    arr.splice(3, 1);            // remove "text" — still HOLEY_ELEMENTS ❌
    // Removing the offending element does NOT upgrade the kind
    console.log("After removing 'text':", arr);
}

showDowngrade();

// Expected Output:
// Start: [ 1, 2, 3 ]
// After push(1.5): [ 1, 2, 1.5 ]        (wait — push(1.5) to [1,2,3])
// After push('text'): [ 1, 2, 3, 1.5, 'text' ]
// After arr[10]=99: [ 1, 2, 3, 1.5, 'text', <5 empty items>, 99 ]
// After removing 'text': [ 1, 2, 3, 1.5, <5 empty items>, 99 ]


// =============================================================================
// SECTION 9: PERFORMANCE BEST PRACTICES
// =============================================================================

/*
  Based on how V8 internally classifies arrays, here are the concrete rules
  for writing fast, engine-friendly array code:
*/

// ✅ PRACTICE 1: Initialise arrays with their final type in mind

const scores = [95, 87, 92, 88, 100];   // PACKED_SMI — stay consistent ✅
// Don't later push strings or objects into scores

// ✅ PRACTICE 2: Avoid holes — never create sparse arrays in hot paths

// ❌ Slow
// const sparse = new Array(1000);
// sparse[500] = "data"; // holes from 0–499 and 501–999

// ✅ Fast
const dense = [];
for (let i = 0; i < 1000; i++) {
    dense.push(i);    // always PACKED, always sequential
}

// ✅ PRACTICE 3: Keep arrays homogeneous (one type per array)

// ❌ Triggers multiple downgrades
const badArr = [1, 2, 3];
badArr.push(3.14);      // downgrade
badArr.push("hello");   // downgrade again

// ✅ If you need mixed data, use objects instead of arrays
const record = { count: 3, avg: 3.14, label: "hello" };

// ✅ PRACTICE 4: Avoid reading past the end of an array
// arr[arr.length + 1] — creates a hole if you then write to it

// ✅ PRACTICE 5: Use Array.from() or spread instead of new Array(n)

// ❌ Creates holey array
// const h = new Array(5);

// ✅ Immediately dense
const filled = Array.from({ length: 5 }, (_, i) => i + 1); // [1,2,3,4,5]
console.log(filled); // [1, 2, 3, 4, 5]

// ✅ PRACTICE 6: Don't delete elements with `delete`

const nums = [10, 20, 30, 40];
delete nums[1];              // ❌ creates a hole at index 1 → HOLEY_ELEMENTS
// nums is now [10, empty, 30, 40]

// ✅ Use splice instead — maintains density
const nums2 = [10, 20, 30, 40];
nums2.splice(1, 1);          // removes index 1, shifts others → stays PACKED
console.log(nums2);          // [10, 30, 40]

// Expected Output:
// [1, 2, 3, 4, 5]
// [10, 30, 40]


// =============================================================================
// SECTION 10: QUICK REVISION NOTES
// =============================================================================

/*
  ┌────────────────────────────┬────────────────────────────────────────────┐
  │ Concept                    │ Key Point                                  │
  ├────────────────────────────┼────────────────────────────────────────────┤
  │ V8 engine                  │ Google's JS engine; powers Chrome + Node   │
  │ JIT compilation            │ Hot code compiled to machine code          │
  │ Element kinds              │ V8's internal array classification system  │
  │ PACKED array               │ Dense — no holes; fastest iteration        │
  │ HOLEY array                │ Has gaps; needs prototype chain lookup     │
  │ SMI (Small Integer)        │ Integers stored directly — fastest         │
  │ DOUBLE elements            │ Floats; unboxed 64-bit; fast               │
  │ ELEMENTS (generic)         │ Mixed types; tagged pointers; slowest      │
  │ Downgrade direction        │ One-way: SMI → DOUBLE → ELEMENTS → HOLEY  │
  │ new Array(n)               │ Creates holey array — avoid in hot paths   │
  │ delete arr[i]              │ Creates a hole — use splice instead        │
  │ Best practice              │ Keep arrays dense, homogeneous, typed      │
  └────────────────────────────┴────────────────────────────────────────────┘
*/


// =============================================================================
// SECTION 11: COMMON MISTAKES
// =============================================================================

/*
  ❌ MISTAKE 1: Using new Array(n) expecting it to be fast
*/
// const arr = new Array(1000); // creates 1000 holes immediately
// ✅ const arr = []; and then push values in a loop

/*
  ❌ MISTAKE 2: Mixing types in performance-critical arrays
*/
// const ids = [1, 2, 3]; ids.push("N/A"); // downgrade — keep type consistent
// ✅ Use a sentinel value of the same type: ids.push(-1) for invalid

/*
  ❌ MISTAKE 3: Using delete to remove array elements
*/
// delete arr[2]; // creates hole → HOLEY downgrade
// ✅ arr.splice(2, 1) — removes element and shifts, stays PACKED

/*
  ❌ MISTAKE 4: Assigning to an index far beyond current length
*/
// const arr = [1, 2, 3]; arr[100] = 99; // holes at 3–99 → HOLEY
// ✅ Always push sequentially or pre-fill with Array.from

/*
  ❌ MISTAKE 5: Expecting that cleaning up restores the element kind
*/
// arr.push("oops"); // downgraded to ELEMENTS
// arr.pop();        // "oops" removed — but still ELEMENTS, NOT upgraded
// Downgrades are permanent — be careful from the start


// =============================================================================
// SECTION 12: INTERVIEW QUESTIONS & ANSWERS
// =============================================================================

/*
  Q1. What is the V8 engine?
  A:  V8 is Google's open-source JavaScript engine used in Chrome and Node.js.
      It compiles JavaScript to machine code using JIT compilation and applies
      aggressive optimisations to frequently-run code paths.

  Q2. What are element kinds in V8?
  A:  V8 classifies arrays into element kinds based on their contents.
      The main kinds are PACKED_SMI_ELEMENTS, PACKED_DOUBLE_ELEMENTS,
      PACKED_ELEMENTS, and their HOLEY counterparts. The kind determines
      storage format, memory usage, and iteration speed.

  Q3. What is the difference between a packed and a holey array?
  A:  A packed array has values at every index from 0 to length-1. A holey
      array has gaps. Packed arrays are faster because V8 knows every index
      has a value and skips prototype chain lookups. Holey arrays require
      prototype chain checks for every hole access.

  Q4. What is an SMI in V8?
  A:  SMI stands for Small Integer. V8 stores SMI values directly in the
      pointer slot without heap allocation, making them the fastest numeric
      type. PACKED_SMI_ELEMENTS is the best possible array classification.

  Q5. What happens when you push a float into an SMI array?
  A:  The array is downgraded from PACKED_SMI_ELEMENTS to PACKED_DOUBLE_ELEMENTS.
      All existing integers are converted to 64-bit doubles. This increases
      memory usage and slightly reduces performance.

  Q6. Are V8 array element kind downgrades reversible?
  A:  No. Downgrades are one-way. Once an array's element kind is downgraded
      (e.g., from SMI to ELEMENTS), removing the offending elements does not
      upgrade it back. The kind is permanently lowered.

  Q7. Why is new Array(n) bad for performance?
  A:  new Array(n) creates a holey array immediately — n holes with no values.
      Every access is a prototype chain lookup until all holes are filled.
      Use [] + push, or Array.from({ length: n }, fn), instead.

  Q8. Why should you use splice instead of delete to remove array elements?
  A:  delete arr[i] leaves a hole at that index, downgrading to a holey
      element kind. splice(i, 1) removes the element and shifts the rest,
      keeping the array dense and packed.

  Q9. How does JIT compilation relate to array element kinds?
  A:  V8's TurboFan optimiser generates specialised machine code based on the
      element kind. SMI and double arrays get highly optimised numeric code
      paths. When a type assumption is violated (e.g., a string enters an
      SMI array), V8 may de-optimise and fall back to slower generic code.

  Q10. What is a practical rule for writing V8-friendly array code?
  A:   Keep arrays homogeneous (one type), dense (no holes), and initialised
       sequentially. Avoid new Array(n), delete, assigning to out-of-range
       indexes, and mixing numbers with strings or objects in the same array
       that appears in a hot loop.
*/


// =============================================================================
// SECTION 13: PRACTICE EXERCISES
// =============================================================================

/*
  ✏️ EXERCISE 1 (Identify):
  For each of the following, identify the starting element kind and describe
  what happens at each step:
  
  a)  const a = [1, 2, 3];
      a.push(4.5);
      a.push("five");
  
  b)  const b = new Array(3);
      b[0] = 1; b[1] = 2; b[2] = 3;
  
  c)  const c = [1.0, 2.0, 3.0];
      c.push(4);
      delete c[1];

  ✏️ EXERCISE 2 (Rewrite for Performance):
  Rewrite this code to be V8-friendly:
  
    const results = new Array(100);
    for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
            results[i] = i;
        }
        // odd indexes left empty
    }
  
  What element kind does the original use? What does your version use?

  ✏️ EXERCISE 3 (Benchmark Thinking):
  You have a loop that runs 1,000,000 times summing array values.
  Compare these two approaches conceptually — which is faster and why?
  
    // Approach A:
    const nums = [1, 2, 3, 4, 5];
    nums.push("total");
    let sum = 0;
    for (let i = 0; i < nums.length - 1; i++) sum += nums[i];
  
    // Approach B:
    const nums2 = [1, 2, 3, 4, 5];
    let sum2 = 0;
    for (let i = 0; i < nums2.length; i++) sum2 += nums2[i];

  ✏️ EXERCISE 4 (Safe Removal):
  Write a function removeAt(arr, index) that removes an element at a given
  index WITHOUT creating holes. Use splice. Verify the result is still dense.

  ✏️ EXERCISE 5 (Challenge):
  Write a function createDenseMatrix(rows, cols, fillValue) that creates
  a 2D array (array of arrays) where:
    - Every row is a packed array
    - Every cell is initialised to fillValue
    - No holes exist anywhere
  Make sure the element kind stays consistent based on the type of fillValue.
  Test with fillValue = 0 (SMI) and fillValue = 0.0 (double).
*/

// =============================================================================
// END OF FILE: 51-v8-array-internals.js
// This is the final file in the advanced-javascript-notes series (Lectures 36–51)
// See README.md for the full repository overview and learning outcomes.
// =============================================================================
